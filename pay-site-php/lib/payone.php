<?php
// PayOne SmartRoute: Redirect Payment, Inquiry and Refund (B2B).
// Credentials come from info-client.txt (or PAYONE_* env vars), never from this file.

const CURRENCY = '682'; // SAR
const SUCCESS = '00000';

function payone(?string $key = null) {
  static $p = null;
  if ($p === null) {
    $root = dirname(__DIR__);
    $file = null;
    foreach (["$root/info-client.txt", dirname($root) . '/info-client.txt'] as $f) if (is_file($f)) { $file = $f; break; }
    $lines = $file ? array_values(array_filter(array_map('trim', preg_split('/\r?\n/', file_get_contents($file))), 'strlen')) : [];
    $after = function ($label) use ($lines) {
      foreach ($lines as $i => $l) if (str_starts_with($l, $label)) return $lines[$i + 1] ?? null;
      return null;
    };
    $p = [
      'merchantId' => getenv('PAYONE_MERCHANT_ID') ?: $after('Merchant ID'),
      'token' => getenv('PAYONE_TOKEN') ?: $after('Authentication Token'),
      'urlPay' => getenv('PAYONE_URL_PAY') ?: $after('SR URL (Payment)'),
      'urlB2b' => getenv('PAYONE_URL_B2B') ?: $after('SR URL (Inquiry)'),
    ];
    if (in_array(null, $p, true) || in_array('', $p, true)) throw new RuntimeException('PayOne credentials missing: add info-client.txt or PAYONE_* env vars');
    $p['environment'] = preg_match('/-test\./', $p['urlPay']) ? 'staging' : 'production';
  }
  return $key === null ? $p : $p[$key];
}

// --- hashing -------------------------------------------------------------
// Form encoding as the browser does it (space as "+", "*" left as is).
function form_encode(string $v): string { return str_replace('%2A', '*', urlencode($v)); }

// Request: token + values sorted by parameter name; PaymentDescription goes in form-encoded.
function payone_request_hash(array $params): string {
  unset($params['SecureHash']);
  ksort($params, SORT_STRING);
  $s = payone('token');
  foreach ($params as $k => $v) $s .= $k === 'PaymentDescription' ? form_encode((string)$v) : $v;
  return hash('sha256', $s);
}

// Response: same formula over Response.* fields, literal "null" values left out,
// description/refund-status fields form-encoded. The plain variant is kept as a fallback.
function payone_verify(array $params): array {
  $received = strtolower($params['Response.SecureHash'] ?? '');
  if ($received === '') return ['ok' => false, 'variant' => null];
  $keys = array_filter(array_keys($params), fn($k) => $k !== 'Response.SecureHash' && $params[$k] !== 'null');
  sort($keys, SORT_STRING);
  $encoded = $plain = payone('token');
  foreach ($keys as $k) {
    $encoded .= preg_match('/(Description|RefundStatus)$/', $k) ? form_encode($params[$k]) : $params[$k];
    $plain .= $params[$k];
  }
  foreach (['urlEncodedDescriptions' => $encoded, 'plain' => $plain] as $variant => $s) {
    if (hash_equals(hash('sha256', $s), $received)) return ['ok' => true, 'variant' => $variant];
  }
  return ['ok' => false, 'variant' => null];
}

// 15-digit numeric ID, unique per request (PayOne rejects a reused TransactionID).
function new_transaction_id(): string { return now_ms() . random_int(10, 99); }

// --- Redirect Payment ----------------------------------------------------
// Returns the form the customer's browser posts to PayOne's hosted payment page.
function payone_redirect_form(string $transactionId, int $amount, string $description, string $lang, string $returnUrl): array {
  $params = [
    'MessageID' => '1',
    'TransactionID' => $transactionId,
    'MerchantID' => payone('merchantId'),
    'Amount' => (string)$amount,
    'CurrencyISOCode' => CURRENCY,
    'PaymentDescription' => $description,
    'Language' => $lang === 'ar' ? 'Ar' : 'En',
    'Channel' => '0',
    'Quantity' => '1',
    'Version' => '1.0',
    'ResponseBackURL' => $returnUrl,
  ];
  $params['SecureHash'] = payone_request_hash($params);
  return ['action' => payone('urlPay'), 'fields' => $params];
}

// --- B2B (Inquiry, Refund) -----------------------------------------------
function payone_b2b(array $params): array {
  $params['SecureHash'] = payone_request_hash($params);
  $body = http_build_query($params);
  if (function_exists('curl_init')) {
    $ch = curl_init(payone('urlB2b'));
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']]);
    $text = curl_exec($ch);
    if ($text === false) throw new RuntimeException(curl_error($ch));
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  } else {
    $text = @file_get_contents(payone('urlB2b'), false, stream_context_create(['http' => ['method' => 'POST', 'timeout' => 30,
      'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $body, 'ignore_errors' => true]]));
    if ($text === false) throw new RuntimeException('PayOne did not answer');
    $status = preg_match('/\s(\d{3})\s/', $http_response_header[0] ?? '', $m) ? (int)$m[1] : 0;
  }
  $parsed = last_values(parse_form(trim($text)));
  return ['sent' => $params, 'httpStatus' => $status, 'parsed' => $parsed, 'hash' => payone_verify($parsed)];
}

// Inquiry: Response.MessageStatus is the inquiry itself, Response.StatusCode the original payment.
function payone_inquiry(string $originalTransactionId): array {
  return payone_b2b(['MessageID' => '2', 'MerchantID' => payone('merchantId'), 'OriginalTransactionID' => $originalTransactionId,
    'Version' => '1.0', 'IncludeRefundIds' => 'Yes']);
}

function payone_refund(string $originalTransactionId, int $amount): array {
  return payone_b2b(['MessageID' => '4', 'TransactionID' => new_transaction_id(), 'MerchantID' => payone('merchantId'),
    'OriginalTransactionID' => $originalTransactionId, 'Amount' => (string)$amount, 'CurrencyISOCode' => CURRENCY, 'Version' => '1.0']);
}

// Fields of a payment response worth keeping on the order (raw response is kept too).
function payone_summarize(array $p): array {
  $v = fn($k) => isset($p[$k]) && $p[$k] !== 'null' ? $p[$k] : '';
  return [
    'statusCode' => $v('Response.StatusCode'),
    'description' => $v('Response.StatusDescription') ?: $v('Response.GatewayStatusDescription'),
    'gatewayStatus' => $v('Response.GatewayStatusDescription'),
    'amount' => $v('Response.Amount'),
    'card' => $v('Response.CardNumber'),
    'cardHolder' => $v('Response.CardHolderName'),
    'rrn' => $v('Response.RRN'),
    'approvalCode' => $v('Response.ApprovalCode'),
    'gatewayName' => $v('Response.GatewayName'),
    'merchantId' => $v('Response.MerchantID'),
  ];
}

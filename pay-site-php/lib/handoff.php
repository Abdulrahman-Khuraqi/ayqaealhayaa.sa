<?php
// Orders arriving from the website (ayqaealhayaa.sa): the website's server prices the cart and signs it
// with the shared handoffSecret (HMAC-SHA256 over the base64url JSON). Anything unsigned, changed or
// expired is refused, so the amount the customer pays is always the one the website calculated.

const MAX_TOTAL = 100000000; // 1,000,000 SAR in halalas

function verify_handoff(array $form, ?string $secret): array {
  $payload = (string)($form['payload'] ?? '');
  $signature = (string)($form['signature'] ?? '');
  if ($payload === '' || !preg_match('/^[a-f0-9]{64}$/', $signature) || !$secret) return ['error' => 'invalid'];
  if (!hash_equals(hash_hmac('sha256', $payload, $secret), $signature)) return ['error' => 'invalid'];

  $data = json_decode((string)base64_decode(strtr($payload, '-_', '+/')), true);
  if (!is_array($data) || ($data['v'] ?? null) !== 1 || !preg_match('/^WEB-[A-F0-9]{12}$/', (string)($data['ref'] ?? ''))
    || ($data['currency'] ?? null) !== 'SAR') return ['error' => 'invalid'];
  if (!(now_ms() < ($data['exp'] ?? 0))) return ['error' => 'expired'];

  $items = is_array($data['items'] ?? null) ? $data['items'] : [];
  $ok = count($items) > 0 && count($items) <= 30;
  $total = 0;
  foreach ($items as $i) {
    $ok = $ok && is_int($i['id'] ?? null) && is_string($i['name'] ?? null) && mb_strlen($i['name']) <= 180
      && is_int($i['qty'] ?? null) && $i['qty'] >= 1 && $i['qty'] <= 20 && is_int($i['price'] ?? null) && $i['price'] > 0;
    if ($ok) $total += $i['price'] * $i['qty'];
  }
  if (!$ok || $total !== ($data['total'] ?? null) || $total > MAX_TOTAL) return ['error' => 'invalid'];

  return [
    'ref' => $data['ref'],
    'lang' => ($data['lang'] ?? '') === 'en' ? 'en' : 'ar',
    'total' => $total,
    'items' => array_map(fn($i) => (object)['id' => $i['id'], 'name' => (object)['ar' => $i['name'], 'en' => $i['name']],
      'price' => $i['price'], 'qty' => $i['qty']], $items),
  ];
}

<?php
// Order payment cycle on top of PayOne: attempts, the return from the payment page,
// Inquiry for interrupted ("broken") payments, Refunds, and the order's payment status.

// An attempt nobody returned from is checked by Inquiry after AUTO_FIRST, then every AUTO_EVERY,
// and marked expired after AUTO_MAX checks that did not settle it.
const AUTO_FIRST = 3 * 60000;
const AUTO_EVERY = 5 * 60000;
const AUTO_MAX = 4;
// Inquiry answer for a transaction PayOne never received (customer left before submitting the card).
const NOT_FOUND = '00023';
// Payment status codes that mean "not finished yet", not declined: 10009 = Request received.
const IN_PROGRESS = ['10009'];
// PayOne's card page session lasts 10 minutes; after that a not-found transaction can no longer be paid.
const SESSION_LIMIT = 12 * 60000;

function never_submitted(?stdClass $attempt): bool {
  if (!$attempt || !$attempt->inquiries) return false;
  return (end($attempt->inquiries)->statusCode ?? '') === NOT_FOUND;
}

function is_paid(stdClass $order): bool { return in_array($order->paymentStatus, ['paid', 'partially_refunded', 'refunded'], true); }

function recompute(stdClass $order): void {
  if (!empty($order->paymentOverride)) { $order->paymentStatus = $order->paymentOverride->status; return; }
  $statuses = array_map(fn($a) => $a->status, $order->attempts);
  if (in_array('paid', $statuses, true)) {
    $order->paymentStatus = $order->refunded >= $order->total ? 'refunded' : ($order->refunded > 0 ? 'partially_refunded' : 'paid');
  } elseif (in_array('pending', $statuses, true)) $order->paymentStatus = 'pending';
  elseif ($statuses) $order->paymentStatus = end($statuses);
  else $order->paymentStatus = 'unpaid';
}

function start_attempt(stdClass $order): stdClass {
  $attempt = (object)[
    'transactionId' => new_transaction_id(),
    'amount' => $order->total,
    'createdAt' => now(),
    'status' => 'pending',
    'returnReceived' => false,
    'resolvedBy' => null,
    'inquiries' => [],
  ];
  $order->attempts[] = $attempt;
  add_event($order, 'customer', "Payment started (transaction {$attempt->transactionId}, " . sar($attempt->amount) . ' SAR)');
  recompute($order);
  save();
  return $attempt;
}

// Apply a payment result that came from the return page or from an Inquiry.
function apply_result(stdClass $order, stdClass $attempt, array $raw, string $source, string $by): void {
  $s = payone_summarize($raw);
  $before = $attempt->status;
  $attempt->statusCode = $s['statusCode'];
  $attempt->description = $s['description'];
  $attempt->gatewayStatus = $s['gatewayStatus'];
  foreach (['card', 'cardHolder', 'rrn', 'approvalCode', 'gatewayName'] as $k) $attempt->$k = $s[$k] ?: ($attempt->$k ?? '');
  $attempt->lastResponse = (object)$raw;
  $attempt->updatedAt = now();

  $amountOk = $s['amount'] === '' || $s['amount'] === (string)$attempt->amount;
  $merchantOk = $s['merchantId'] === '' || $s['merchantId'] === payone('merchantId');
  if ($s['statusCode'] === SUCCESS && $amountOk && $merchantOk) {
    $attempt->status = 'paid';
    if (empty($order->paidAt)) $order->paidAt = now();
  } elseif ($s['statusCode'] === SUCCESS) {
    // Approved, but not for this order's amount/merchant: never mark it paid automatically.
    $attempt->status = 'failed';
    $attempt->description = 'Needs review: approved response does not match the order (' . ($amountOk ? 'merchant' : 'amount') . ')';
  } elseif (in_array($s['statusCode'], IN_PROGRESS, true) && $attempt->status === 'pending') {
    // PayOne has the request but no final answer yet (customer still on the card page, or left it):
    // stay pending; Inquiry runs again and the attempt expires if it never settles.
    add_event($order, $by, trim("Payment still in progress at PayOne: {$s['statusCode']} " . ($attempt->description ?? '')),
      ['transactionId' => $attempt->transactionId]);
    recompute($order);
    save();
    return;
  } elseif ($attempt->status !== 'paid') {
    $attempt->status = 'failed';
  }
  if ($before === 'pending' || $before !== $attempt->status) $attempt->resolvedBy = $source;
  $what = $attempt->status === 'paid' ? 'Payment approved' : 'Payment declined';
  add_event($order, $by, trim("$what via " . ($source === 'return' ? 'return to site' : 'Inquiry') . ": {$s['statusCode']} " . ($attempt->description ?? '')),
    ['transactionId' => $attempt->transactionId]);
  recompute($order);
  save();
}

// Browser came back from PayOne's payment page to ResponseBackURL.
function handle_return(array $params): ?stdClass {
  [$order, $attempt] = order_by_transaction((string)($params['Response.TransactionID'] ?? ''));
  if (!$order) return null;
  $hash = payone_verify($params);
  $attempt->returnReceived = true;
  $attempt->returnHashOk = $hash['ok'];
  $attempt->returnedAt = now();
  if ($hash['ok']) {
    apply_result($order, $attempt, $params, 'return', 'payone');
  } else {
    // Unsigned or tampered return: don't trust it, ask PayOne directly.
    add_event($order, 'system', 'Return received with an invalid signature; confirming with Inquiry', ['transactionId' => $attempt->transactionId]);
    save();
    run_inquiry($order, $attempt, 'system');
  }
  return $order;
}

// Inquiry (B2B) for one attempt.
function run_inquiry(stdClass $order, stdClass $attempt, string $by): array {
  try {
    $r = payone_inquiry($attempt->transactionId);
  } catch (Throwable $e) {
    $attempt->inquiries[] = (object)['at' => now(), 'by' => $by, 'error' => $e->getMessage()];
    $attempt->lastInquiryAt = now();
    add_event($order, $by, 'Inquiry could not reach PayOne: ' . $e->getMessage(), ['transactionId' => $attempt->transactionId]);
    save();
    return ['ok' => false, 'error' => $e->getMessage()];
  }
  $p = $r['parsed'];
  $entry = (object)[
    'at' => now(), 'by' => $by, 'httpStatus' => $r['httpStatus'], 'hashOk' => $r['hash']['ok'],
    'messageStatus' => $p['Response.MessageStatus'] ?? '', 'statusCode' => $p['Response.StatusCode'] ?? '',
    'description' => ($p['Response.StatusDescription'] ?? '') ?: ($p['Response.GatewayStatusDescription'] ?? ''), 'raw' => (object)$p,
  ];
  $attempt->inquiries[] = $entry;
  $attempt->lastInquiryAt = $entry->at;
  $found = $entry->messageStatus === SUCCESS && $entry->statusCode !== '';
  if ($found && $r['hash']['ok']) {
    apply_result($order, $attempt, $p, 'inquiry', $by);
  } else {
    $why = $found ? 'response signature invalid, result not applied'
      : trim(($entry->statusCode ?: ($entry->messageStatus ?: 'no status')) . ' ' . $entry->description);
    add_event($order, $by, "Inquiry: $why", ['transactionId' => $attempt->transactionId]);
    // PayOne has no record and its card session is over: the customer never submitted the payment.
    if (!$found && $entry->statusCode === NOT_FOUND && now_ms() - ms($attempt->createdAt) > SESSION_LIMIT) {
      $attempt->status = 'expired';
      $attempt->resolvedBy = 'inquiry';
      add_event($order, 'system', 'Payment not completed: PayOne has no such transaction after its session ended, marked expired',
        ['transactionId' => $attempt->transactionId]);
      recompute($order);
    }
    save();
  }
  return ['ok' => $found && $r['hash']['ok'], 'entry' => $entry];
}

function latest_pending(stdClass $order): ?stdClass {
  foreach (array_reverse($order->attempts) as $a) if ($a->status === 'pending') return $a;
  return null;
}
function paid_attempt(stdClass $order): ?stdClass {
  foreach ($order->attempts as $a) if ($a->status === 'paid') return $a;
  return null;
}

// Before a new attempt, settle any pending one so a customer who already paid isn't charged twice.
function settle_pending(stdClass $order, string $by): bool {
  foreach ($order->attempts as $a) if ($a->status === 'pending') run_inquiry($order, $a, $by);
  return paid_attempt($order) !== null;
}

function do_refund(stdClass $order, int $amount, string $by): array {
  $paid = paid_attempt($order);
  if (!$paid) return ['ok' => false, 'error' => 'This order has no approved payment to refund.'];
  $remaining = $order->total - $order->refunded;
  if (!($amount > 0) || $amount > $remaining) return ['ok' => false, 'error' => 'Refund amount must be between 0.01 and ' . sar($remaining) . ' SAR.'];
  try { $r = payone_refund($paid->transactionId, $amount); } catch (Throwable $e) { return ['ok' => false, 'error' => 'PayOne not reachable: ' . $e->getMessage()]; }
  $p = $r['parsed'];
  $ok = ($p['Response.StatusCode'] ?? '') === SUCCESS;
  $row = (object)[
    'at' => now(), 'by' => $by, 'transactionId' => ($p['Response.TransactionID'] ?? '') ?: $r['sent']['TransactionID'],
    'originalTransactionId' => $paid->transactionId, 'amount' => $amount, 'ok' => $ok,
    'statusCode' => $p['Response.StatusCode'] ?? '', 'description' => ($p['Response.StatusDescription'] ?? '') ?: ($p['Response.RefundStatus'] ?? ''),
    'hashOk' => $r['hash']['ok'], 'raw' => (object)$p,
  ];
  $order->refunds[] = $row;
  if ($ok) $order->refunded += $amount;
  add_event($order, $by, 'Refund ' . ($ok ? 'succeeded' : 'failed') . ': ' . sar($amount) . " SAR ({$row->statusCode} {$row->description})",
    ['transactionId' => $row->transactionId]);
  recompute($order);
  save();
  return $ok ? ['ok' => true, 'row' => $row] : ['ok' => false, 'error' => "PayOne: {$row->statusCode} {$row->description}", 'row' => $row];
}

// Settle interrupted payments (Inquiry). Run by cron.php, and after requests at most once a minute.
function reconcile(): void {
  $now = now_ms();
  foreach (all_orders() as $order) {
    foreach ($order->attempts as $a) {
      if ($a->status !== 'pending') continue;
      $age = $now - ms($a->createdAt);
      $auto = count(array_filter($a->inquiries, fn($i) => $i->by === 'auto'));
      $last = !empty($a->lastInquiryAt) ? $now - ms($a->lastInquiryAt) : PHP_INT_MAX;
      if ($auto >= AUTO_MAX) {
        $a->status = 'expired';
        $a->resolvedBy = 'timeout';
        add_event($order, 'system', 'Payment not completed: no result after automatic inquiries, marked expired', ['transactionId' => $a->transactionId]);
        recompute($order);
        save();
      } elseif ($age >= AUTO_FIRST && $last >= AUTO_EVERY) {
        run_inquiry($order, $a, 'auto');
      }
    }
  }
}

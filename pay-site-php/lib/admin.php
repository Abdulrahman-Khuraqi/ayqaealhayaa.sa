<?php
// Merchant admin: orders, payment attempts, Inquiry, Refund, order/payment status, certification report.

const SESSION_HOURS = 12;
const PAY_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'expired', 'partially_refunded', 'refunded'];
const ORDER_STATUSES = ['new', 'processing', 'shipped', 'completed', 'cancelled'];
const MANUAL_PAY = ['unpaid', 'paid', 'failed', 'expired', 'refunded'];
const BY_LABEL = ['customer' => 'Customer', 'payone' => 'PayOne', 'system' => 'System', 'auto' => 'Auto-inquiry', 'admin' => 'Admin'];

function plabel(string $s): string { return t('en', "pay_$s"); }
function olabel(string $s): string { return t('en', "st_$s"); }

// --- auth (signed cookie) ------------------------------------------------
function sign_admin(string $v): string { return hash_hmac('sha256', $v, cfg('sessionSecret')); }
function same($a, $b): bool { return hash_equals(hash('sha256', (string)$a), hash('sha256', (string)$b)); }
function logged_in(): bool {
  [$exp, $sig] = array_pad(explode('.', (string)($_COOKIE['adm'] ?? ''), 2), 2, '');
  return $exp !== '' && (int)$exp > now_ms() && same($sig, sign_admin("admin.$exp"));
}

// Failed sign-ins per IP, kept in data/ so the limit holds across requests.
function login_failures(?array $set = null): array {
  $file = data_dir() . '/login-failures.json';
  if ($set !== null) { file_put_contents($file, json_encode($set)); return $set; }
  $all = is_file($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
  return array_filter($all, fn($f) => $f['until'] > now_ms());
}

// --- helpers -------------------------------------------------------------
function back(stdClass $order, string $kind, string $msg): void {
  redirect('/admin/orders/' . rawurlencode($order->id) . "?$kind=" . rawurlencode($msg));
}
function admin_page(string $title, string $body, string $tab): string {
  return admin_layout($title, $body, $tab, ['ok' => q('ok'), 'err' => q('err')]);
}
function yes($ok): string { return $ok ? '<span class="ok-text">✓ valid</span>' : '<span class="bad-text">✗ invalid</span>'; }
function options(array $list, string $cur, callable $label): string {
  $out = '';
  foreach ($list as $v) $out .= "<option value=\"$v\"" . ($v === $cur ? ' selected' : '') . '>' . esc($label($v)) . '</option>';
  return $out;
}

function stats(array $orders): array {
  $paid = array_filter($orders, 'is_paid');
  return [
    'revenue' => array_sum(array_map(fn($o) => $o->total - $o->refunded, $paid)),
    'paid' => count($paid),
    'pending' => count(array_filter($orders, fn($o) => in_array($o->paymentStatus, ['pending', 'unpaid'], true))),
    'failed' => count(array_filter($orders, fn($o) => in_array($o->paymentStatus, ['failed', 'expired'], true))),
    'refunded' => array_sum(array_map(fn($o) => $o->refunded, $orders)),
  ];
}

// --- pages ---------------------------------------------------------------
function login_page(string $error = ''): string {
  return admin_layout('Sign in', '
    <section class="card pay-card">
      <h1>Merchant admin</h1>
      <p class="lead">Sign in to manage orders and PayOne payments.</p>
      <form method="post" action="/admin/login">
        <label class="field"><span>Username</span><input type="text" name="user" autocomplete="username" required></label>
        <label class="field"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>
        <button class="btn-primary" type="submit">Sign in</button>
      </form>
    </section>', '', ['err' => $error], false);
}

function filter_orders(string $pay, string $st, string $q = ''): array {
  return array_values(array_filter(all_orders(), function ($o) use ($pay, $st, $q) {
    if (($pay !== '' && $o->paymentStatus !== $pay) || ($st !== '' && $o->status !== $st)) return false;
    if ($q === '') return true;
    $hay = [$o->id, $o->customer->name ?? '', $o->customer->phone ?? '', $o->customer->email ?? ''];
    foreach ($o->attempts as $a) $hay[] = $a->transactionId;
    foreach ($o->refunds as $r) $hay[] = $r->transactionId;
    foreach ($hay as $v) if (str_contains(mb_strtolower((string)$v), $q)) return true;
    return false;
  }));
}

function dashboard(): string {
  $q = mb_strtolower(trim(q('q')));
  $pay = q('pay');
  $st = q('st');
  $s = stats(all_orders());
  $rows = array_reverse(filter_orders($pay, $st, $q));
  $n = count($rows);
  ob_start(); ?>
    <div class="dash">
      <div class="stats">
        <div class="stat"><span>Collected (net)</span><strong><?= money($s['revenue']) ?></strong><em><?= $s['paid'] ?> paid order<?= $s['paid'] === 1 ? '' : 's' ?></em></div>
        <div class="stat"><span>Awaiting / confirming</span><strong><?= $s['pending'] ?></strong><em>unpaid or pending</em></div>
        <div class="stat"><span>Declined / expired</span><strong><?= $s['failed'] ?></strong><em>no money taken</em></div>
        <div class="stat"><span>Refunded</span><strong><?= money($s['refunded']) ?></strong><em>via PayOne Refund</em></div>
      </div>
      <section class="card">
        <form class="filters" method="get" action="/admin">
          <label class="field compact"><span>Search</span><input type="text" name="q" value="<?= esc($q) ?>" placeholder="Order no, name, email, transaction ID"></label>
          <label class="field compact"><span>Payment</span><select name="pay"><option value="">All</option><?= options(PAY_STATUSES, $pay, 'plabel') ?></select></label>
          <label class="field compact"><span>Order status</span><select name="st"><option value="">All</option><?= options(ORDER_STATUSES, $st, 'olabel') ?></select></label>
          <button class="btn-ghost" type="submit">Filter</button>
        </form>
        <div class="list-head"><span><?= $n ?> order<?= $n === 1 ? '' : 's' ?></span><a href="/admin/export.csv?<?= esc(http_build_query(['q' => $q, 'pay' => $pay, 'st' => $st])) ?>">Export CSV</a></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th class="num">Total</th><th>Payment</th><th>Order status</th><th>Last transaction</th></tr></thead>
          <tbody><?php foreach ($rows as $o): $last = $o->attempts ? end($o->attempts) : null; ?><tr class="row-link">
              <td><a class="strong-link" href="/admin/orders/<?= esc($o->id) ?>"><?= esc($o->id) ?></a></td>
              <td><?= esc(when($o->createdAt)) ?></td>
              <td><?= esc($o->customer->name) ?><br><span class="muted small mono"><?= esc(($o->customer->email ?? '') ?: ($o->customer->phone ?? '')) ?></span></td>
              <td class="num"><?= money($o->total) ?><?= $o->refunded ? '<br><span class="muted small">−' . money($o->refunded) . '</span>' : '' ?></td>
              <td><?= pay_badge($o->paymentStatus, plabel($o->paymentStatus)) ?></td>
              <td><?= order_badge($o->status, olabel($o->status)) ?></td>
              <td class="mono small"><?= esc($last->transactionId ?? '—') ?><?= !empty($last->statusCode) ? '<br><span class="muted">' . esc($last->statusCode) . '</span>' : '' ?></td>
            </tr><?php endforeach;
            if (!$rows): ?><tr><td colspan="7" class="muted">No orders yet. Place one from the store to see it here.</td></tr><?php endif ?></tbody>
        </table></div>
      </section>
    </div>
<?php return admin_page('Orders', ob_get_clean(), 'orders');
}

function attempt_rows(stdClass $order): string {
  ob_start();
  foreach ($order->attempts as $i => $a): ?>
    <tr>
      <td class="mono"><?= esc($a->transactionId) ?><br><span class="muted small">#<?= $i + 1 ?> · <?= esc(when($a->createdAt)) ?></span></td>
      <td class="num"><?= money($a->amount) ?></td>
      <td><?= pay_badge($a->status, plabel($a->status)) ?></td>
      <td class="wrap-cell"><b class="mono"><?= esc(($a->statusCode ?? '') ?: '—') ?></b> <?= esc(($a->description ?? '') ?: ($a->status === 'pending' ? 'Waiting for the customer / PayOne' : '')) ?></td>
      <td class="small"><?= !empty($a->card) ? '<span class="mono">' . esc($a->card) . '</span><br>' : '' ?><?= !empty($a->rrn) ? 'RRN <span class="mono">' . esc($a->rrn) . '</span><br>' : '' ?><?= !empty($a->approvalCode) ? 'Auth <span class="mono">' . esc($a->approvalCode) . '</span>' : '' ?></td>
      <td class="small"><?= $a->returnReceived ? 'Return ' . yes($a->returnHashOk ?? false) : '<span class="muted">No return</span>' ?><br><?= !empty($a->resolvedBy) ? 'Settled by <b>' . esc($a->resolvedBy) . '</b>' : '' ?></td>
      <td><form method="post" action="/admin/orders/<?= esc($order->id) ?>/inquiry"><input type="hidden" name="tid" value="<?= esc($a->transactionId) ?>">
        <button class="btn-small" type="submit" data-busy="Asking PayOne…">Inquiry</button></form></td>
    </tr>
    <?php if ($a->inquiries || !empty($a->lastResponse)): ?><tr class="sub-row"><td colspan="7"><details><summary>Inquiries (<?= count($a->inquiries) ?>) and raw PayOne data</summary>
      <?php if ($a->inquiries): ?><table class="inner"><thead><tr><th>When</th><th>By</th><th>Message status</th><th>Payment status</th><th>Description</th><th>Signature</th></tr></thead><tbody>
        <?php foreach ($a->inquiries as $q): $err = $q->error ?? ''; ?><tr><td><?= esc(when($q->at)) ?></td><td><?= esc(BY_LABEL[$q->by] ?? $q->by) ?></td><td class="mono"><?= esc($err ? 'error' : ($q->messageStatus ?? '')) ?></td>
          <td class="mono"><?= esc($q->statusCode ?? '') ?></td><td class="wrap-cell"><?= esc($err ?: ($q->description ?? '')) ?></td><td><?= $err ? '' : yes($q->hashOk ?? false) ?></td></tr><?php endforeach ?>
      </tbody></table><?php endif ?>
      <?php if (!empty($a->lastResponse)): ?><pre class="log"><?= esc(pretty($a->lastResponse)) ?></pre><?php endif ?>
    </details></td></tr><?php endif;
  endforeach;
  return ob_get_clean();
}

function order_detail(stdClass $order): string {
  $paid = paid_attempt($order);
  $remaining = $order->total - $order->refunded;
  $pending = latest_pending($order);
  $c = $order->customer;
  $override = $order->paymentOverride ?? null;
  $attempts = attempt_rows($order);
  ob_start(); ?>
    <p class="back"><a href="/admin">← All orders</a></p>
    <div class="detail-head">
      <h1><?= esc($order->id) ?></h1>
      <?= pay_badge($order->paymentStatus, plabel($order->paymentStatus)) ?> <?= order_badge($order->status, olabel($order->status)) ?>
      <?= $override ? '<span class="tag">payment status set manually</span>' : '' ?>
      <a class="small-link push" href="/order/<?= esc($order->token) ?>" target="_blank" rel="noopener">Customer's order page ↗</a>
    </div>
    <div class="detail-grid">
      <div class="col">
        <section class="card">
          <h2>Customer & order</h2>
          <dl class="summary compact details">
            <div><dt>Name</dt><dd><?= esc($c->name) ?></dd></div>
            <?php if (!empty($c->phone)): ?><div><dt>Mobile</dt><dd class="mono"><?= esc($c->phone) ?></dd></div><?php endif ?>
            <div><dt>Email</dt><dd><?= esc(($c->email ?? '') ?: '—') ?></dd></div>
            <?php if (!empty($c->city) || !empty($c->address)): ?><div><dt>City / address</dt><dd><?= esc(implode(' — ', array_filter([$c->city ?? '', $c->address ?? '']))) ?></dd></div><?php endif ?>
            <?php if (!empty($order->source->ref)): ?><div><dt>From website cart</dt><dd class="mono"><?= esc($order->source->ref) ?></dd></div><?php endif ?>
            <?php if (($order->source->site ?? '') === 'direct'): ?><div><dt>Came from</dt><dd>Pay page (customer typed the amount)</dd></div><?php endif ?>
            <?php if (!empty($order->purposes)): ?><div><dt>Payment for</dt><dd><?= esc(implode(', ', array_map('purpose_label', $order->purposes))) ?></dd></div><?php endif ?>
            <?php if (!empty($c->notes)): ?><div><dt>Notes</dt><dd><?= esc($c->notes) ?></dd></div><?php endif ?>
            <div><dt>Placed</dt><dd><?= esc(when($order->createdAt)) ?> (<?= $order->lang === 'ar' ? 'Arabic' : 'English' ?>)</dd></div>
            <?php if (!empty($order->paidAt)): ?><div><dt>Paid</dt><dd><?= esc(when($order->paidAt)) ?></dd></div><?php endif ?>
          </dl>
          <h3 class="sub">Items</h3>
          <div class="table-wrap"><table>
            <thead><tr><th>Item</th><th class="num">Price</th><th class="num">Qty</th><th class="num">Subtotal</th></tr></thead>
            <tbody><?php foreach ($order->items as $i): ?><tr><td><?= esc($i->name->en) ?><br><span class="muted small"><?= esc($i->name->ar) ?></span></td><td class="num"><?= money($i->price) ?></td><td class="num"><?= $i->qty ?></td><td class="num"><?= money($i->price * $i->qty) ?></td></tr><?php endforeach ?>
              <tr class="total-tr"><td colspan="3">Total</td><td class="num"><?= money($order->total) ?></td></tr>
              <?php if ($order->refunded): ?><tr><td colspan="3">Refunded</td><td class="num">−<?= money($order->refunded) ?></td></tr><?php endif ?>
            </tbody>
          </table></div>
        </section>

        <section class="card">
          <h2>Payment attempts <span class="muted small">(Redirect Payment)</span></h2>
          <div class="table-wrap"><table>
            <thead><tr><th>Transaction ID</th><th class="num">Amount</th><th>Status</th><th>PayOne response</th><th>Card / reference</th><th>Source</th><th></th></tr></thead>
            <tbody><?= $attempts ?: '<tr><td colspan="7" class="muted">The customer has not started a payment.</td></tr>' ?></tbody>
          </table></div>
        </section>

        <?php if ($order->refunds): ?><section class="card">
          <h2>Refunds</h2>
          <div class="table-wrap"><table>
            <thead><tr><th>Refund transaction</th><th>When</th><th class="num">Amount</th><th>Result</th><th>Signature</th></tr></thead>
            <tbody><?php foreach ($order->refunds as $r): ?><tr><td class="mono"><?= esc($r->transactionId) ?><br><span class="muted small">of <?= esc($r->originalTransactionId) ?></span></td>
              <td><?= esc(when($r->at)) ?></td><td class="num"><?= money($r->amount) ?></td>
              <td><?= $r->ok ? '<span class="badge badge-paid">Success</span>' : '<span class="badge badge-declined">Failed</span>' ?> <span class="mono small"><?= esc($r->statusCode) ?></span> <?= esc($r->description) ?></td>
              <td><?= yes($r->hashOk) ?></td></tr><?php endforeach ?></tbody>
          </table></div>
        </section><?php endif ?>

        <section class="card">
          <h2>Timeline</h2>
          <ol class="timeline"><?php foreach (array_reverse($order->events) as $e): ?><li class="by-<?= esc($e->by) ?>">
            <span class="when"><?= esc(when($e->at)) ?></span><span class="who"><?= esc(BY_LABEL[$e->by] ?? $e->by) ?></span><span class="what"><?= esc($e->text) ?></span></li><?php endforeach ?></ol>
        </section>
      </div>

      <div class="col side">
        <section class="card">
          <h2>Payment</h2>
          <dl class="summary compact">
            <div><dt>Total</dt><dd><?= money($order->total) ?></dd></div>
            <div><dt>Refunded</dt><dd><?= money($order->refunded) ?></dd></div>
            <div><dt>Approved transaction</dt><dd class="mono"><?= esc($paid->transactionId ?? '—') ?></dd></div>
          </dl>
          <?php if ($pending): ?><form method="post" action="/admin/orders/<?= esc($order->id) ?>/inquiry" class="stack">
              <input type="hidden" name="tid" value="<?= esc($pending->transactionId) ?>">
              <p class="muted small">Payment <?= esc($pending->transactionId) ?> has no result yet (customer left or the return was interrupted). Ask PayOne for its status:</p>
              <button class="btn-primary" type="submit" data-busy="Asking PayOne…">Run Inquiry</button></form><?php endif ?>
          <?php if ($paid && $remaining > 0): ?><form method="post" action="/admin/orders/<?= esc($order->id) ?>/refund" class="stack" data-confirm="Send this refund to PayOne? The money goes back to the customer's card.">
              <label class="field compact"><span>Refund amount (SAR) — up to <?= sar($remaining) ?></span>
                <input type="text" name="amount" inputmode="decimal" value="<?= sar($remaining) ?>" dir="ltr" required></label>
              <button class="btn-stop" type="submit" data-busy="Refunding…">Refund</button></form><?php endif ?>
          <?php if (!$paid && !$pending): ?><p class="muted small">Nothing to refund: no approved payment.</p><?php endif ?>
        </section>

        <section class="card">
          <h2>Order status</h2>
          <form method="post" action="/admin/orders/<?= esc($order->id) ?>/status" class="stack">
            <label class="field compact"><span>Status</span><select name="status"><?= options(ORDER_STATUSES, $order->status, 'olabel') ?></select></label>
            <label class="field compact"><span>Note (optional)</span><input type="text" name="note" maxlength="200"></label>
            <button class="btn-ghost" type="submit">Save order status</button>
          </form>
          <p class="muted small">The customer sees this on their order page (processing, shipped, completed…).</p>
        </section>

        <section class="card">
          <h2>Payment status</h2>
          <form method="post" action="/admin/orders/<?= esc($order->id) ?>/payment-status" class="stack">
            <label class="field compact"><span>Set to</span><select name="status">
              <option value="auto"<?= $override ? '' : ' selected' ?>>Automatic (from PayOne)</option>
              <?php foreach (MANUAL_PAY as $v): ?><option value="<?= $v ?>"<?= ($override->status ?? '') === $v ? ' selected' : '' ?>><?= esc(plabel($v)) ?> (manual)</option><?php endforeach ?>
            </select></label>
            <label class="field compact"><span>Reason (required for manual)</span><input type="text" name="note" maxlength="200" placeholder="e.g. paid by bank transfer"></label>
            <button class="btn-ghost" type="submit">Save payment status</button>
          </form>
          <p class="muted small">Automatic follows PayOne (return, Inquiry, Refund). A manual status does not move money.</p>
        </section>

        <section class="card">
          <h2>Internal note</h2>
          <form method="post" action="/admin/orders/<?= esc($order->id) ?>/note" class="stack">
            <label class="field compact"><span>Note (not shown to customer)</span><textarea name="note" rows="2" maxlength="500" required></textarea></label>
            <button class="btn-ghost" type="submit">Add note</button>
          </form>
        </section>
      </div>
    </div>
<?php return admin_page($order->id, ob_get_clean(), 'orders');
}

// The three scenarios PayOne checks during certification, plus refunds.
function certification(): string {
  $rows = [];
  foreach (all_orders() as $o) foreach ($o->attempts as $a) $rows[] = ['o' => $o, 'a' => $a];
  $latest = function (callable $match) use ($rows) {
    $list = array_values(array_filter($rows, $match));
    usort($list, fn($x, $y) => ms($y['a']->updatedAt ?? $y['a']->createdAt) <=> ms($x['a']->updatedAt ?? $x['a']->createdAt));
    return $list[0] ?? null;
  };
  $success = $latest(fn($r) => $r['a']->status === 'paid' && ($r['a']->resolvedBy ?? '') === 'return' && !empty($r['a']->returnHashOk));
  // Broken = the return never arrived and Inquiry gave the final answer (approved or declined).
  $broken = $latest(fn($r) => !$r['a']->returnReceived && ($r['a']->resolvedBy ?? '') === 'inquiry' && in_array($r['a']->status, ['paid', 'failed'], true));
  $failed = $latest(fn($r) => $r['a']->status === 'failed' && ($r['a']->resolvedBy ?? '') === 'return');
  $refunds = [];
  foreach (all_orders() as $o) foreach ($o->refunds as $r) if ($r->ok) $refunds[] = ['o' => $o, 'r' => $r];

  $tx = fn($r) => $r ? '<dl class="summary compact">
      <div><dt>Order</dt><dd><a class="strong-link" href="/admin/orders/' . esc($r['o']->id) . '">' . esc($r['o']->id) . '</a></dd></div>
      <div><dt>Transaction ID</dt><dd class="mono">' . esc($r['a']->transactionId) . '</dd></div>
      <div><dt>PayOne result</dt><dd><span class="mono">' . esc(($r['a']->statusCode ?? '') ?: '—') . '</span> ' . esc($r['a']->description ?? '') . '</dd></div>
      <div><dt>Amount</dt><dd>' . money($r['a']->amount) . '</dd></div>
      <div><dt>When</dt><dd>' . esc(when($r['a']->updatedAt ?? $r['a']->createdAt)) . '</dd></div>
    </dl>' : '';
  $card = fn($n, $title, $done, $what, $how, $result) => '
    <section class="card scenario ' . ($done ? 'is-done' : 'is-todo') . '">
      <div class="scenario-head"><span class="scenario-n">' . $n . '</span><h2>' . $title . '</h2>
        <span class="badge ' . ($done ? 'badge-paid' : 'badge-pending') . '">' . ($done ? '✓ Done' : 'Not yet') . '</span></div>
      <p>' . $what . '</p>
      <details' . ($done ? '' : ' open') . '><summary>How to run it as a customer</summary><ol class="steps">' . implode('', array_map(fn($s) => "<li>$s</li>", $how)) . '</ol></details>
      ' . $result . '
    </section>';

  $report = [];
  if ($success) $report[] = ['Successful transaction', $success['a']->transactionId, "{$success['a']->statusCode} Approved"];
  if ($broken) $report[] = ['Broken transaction (Inquiry)', $broken['a']->transactionId, "{$broken['a']->statusCode} " . ($broken['a']->status === 'paid' ? 'Approved' : 'Declined') . ' – settled by Inquiry'];
  if ($failed) $report[] = ['Failed transaction', $failed['a']->transactionId, "{$failed['a']->statusCode} {$failed['a']->description}"];
  foreach ($refunds as ['o' => $o, 'r' => $r]) $report[] = ['Refund (' . ($r->amount === $o->total ? 'full' : 'partial') . ')', $r->transactionId, "{$r->statusCode} Success"];

  ob_start(); ?>
    <div class="dash">
      <section class="card">
        <h1>PayOne certification</h1>
        <p class="lead">PayOne asked for the full customer payment cycle and three scenarios: a successful, a broken (interrupted, settled with Inquiry) and a failed transaction.
        Each card below turns green when the store has recorded that scenario. Test cards: <span class="mono">5123 4567 8901 2346</span> or <span class="mono">4111 1111 1111 1111</span>, CVV <span class="mono">100</span>, expiry <span class="mono">01/31</span>.</p>
      </section>
      <?= $card(1, 'Successful transaction', (bool)$success,
        'The customer pays, PayOne approves, and the customer is returned to the store with a signed result.',
        ['Open the <a href="' . esc(store_url()) . '" target="_blank" rel="noopener">website</a>, add a product or a priced service, open the cart and press <b>إتمام الطلب والدفع</b> — you arrive on this pay site. (Or use the amount form on this site\'s front page.)',
          'Enter name and email and press <b>Pay now</b>; PayOne\'s payment page opens.',
          'Enter a test card, complete 3-D Secure successfully.',
          'You are returned to the store\'s <b>Payment successful</b> page; the order shows <b>Paid</b> here.'], $tx($success)) ?>
      <?= $card(2, 'Broken transaction → Inquiry', (bool)$broken,
        'The payment is interrupted so the store never receives the return. The store then asks PayOne for the status (Inquiry) and settles the order.',
        ['Start a payment as above, and on PayOne\'s page enter the card and complete 3-D Secure — but close the browser tab before it returns to the store (or close it on the card page).',
          'The order stays <b>Pending</b>. Then either: open the customer\'s order link again (the page runs Inquiry), press <b>Run Inquiry</b> on the order in this admin, or wait — the store runs Inquiry automatically after 3 minutes.',
          'The order becomes <b>Paid</b> or <b>Declined</b> from the Inquiry answer, recorded as "Settled by inquiry".'], $tx($broken)) ?>
      <?= $card(3, 'Failed transaction', (bool)$failed,
        'The payment is declined (for example 3-D Secure fails); the customer sees why and can try again. No money is taken.',
        ['Start a payment as above.',
          'On the 3-D Secure step choose the failure / cancel option (or enter wrong details).',
          'You are returned to the store\'s <b>Payment not completed</b> page with the reason and a <b>Try again</b> button; the order shows <b>Declined</b> here.'], $tx($failed)) ?>
      <section class="card">
        <h2>Refunds <span class="badge <?= $refunds ? 'badge-paid' : 'badge-muted' ?>"><?= count($refunds) ?></span></h2>
        <p class="muted">Open a paid order and use <b>Refund</b> (full or partial). Each refund is a PayOne Refund message.</p>
      </section>
      <section class="card">
        <h2>Summary for PayOne</h2>
        <p class="muted small">Merchant ID <?= esc(payone('merchantId')) ?> · <?= esc(payone('environment')) ?></p>
        <div class="table-wrap"><table>
          <thead><tr><th>Test</th><th>Transaction ID</th><th>Result</th></tr></thead>
          <tbody><?php foreach ($report as $r): ?><tr><td><?= esc($r[0]) ?></td><td class="mono"><?= esc($r[1]) ?></td><td><?= esc($r[2]) ?></td></tr><?php endforeach;
            if (!$report): ?><tr><td colspan="3" class="muted">Nothing recorded yet.</td></tr><?php endif ?></tbody>
        </table></div>
      </section>
    </div>
<?php return admin_page('Certification', ob_get_clean(), 'certification');
}

function integration(array $lookup = []): string {
  ob_start(); ?>
    <div class="dash">
      <section class="card">
        <h1>PayOne SmartRoute integration</h1>
        <dl class="summary compact details">
          <div><dt>Environment</dt><dd><?= esc(payone('environment')) ?></dd></div>
          <div><dt>Merchant ID</dt><dd class="mono"><?= esc(payone('merchantId')) ?></dd></div>
          <div><dt>Redirect Payment URL</dt><dd class="mono"><?= esc(payone('urlPay')) ?></dd></div>
          <div><dt>Inquiry / Refund URL (B2B)</dt><dd class="mono"><?= esc(payone('urlB2b')) ?></dd></div>
          <div><dt>Return URL (ResponseBackURL)</dt><dd class="mono"><?= esc(cfg('publicUrl')) ?>/payment/return</dd></div>
          <div><dt>Currency</dt><dd>SAR (682), amounts sent in halalas</dd></div>
          <div><dt>SmartRoute dashboard</dt><dd><a class="strong-link" href="https://smartroute-test.payone.io/SmartRouteAdminWeb/pages/#/sign-in" target="_blank" rel="noopener">Open ↗</a></dd></div>
        </dl>
        <h3 class="sub">Implemented messages</h3>
        <ol class="steps">
          <li><strong>Redirect Payment</strong> (MessageID 1): the checkout posts a signed form to PayOne's hosted page; the result returns to the Return URL and its SecureHash is verified before the order changes.</li>
          <li><strong>Inquiry</strong> (MessageID 2, B2B): on demand from this admin, when the customer reopens a pending order, when a return arrives unsigned, before a retry, and automatically for payments left pending (after 3 min, every 5 min, then expired).</li>
          <li><strong>Refund</strong> (MessageID 4, B2B): full or partial, from the order page; the order becomes Partially refunded / Refunded.</li>
        </ol>
      </section>
      <section class="card">
        <h2>Look up any transaction (Inquiry)</h2>
        <form method="get" action="/admin/integration" class="inline-form">
          <label class="field compact"><span>Transaction ID</span><input type="text" name="tid" value="<?= esc($lookup['tid'] ?? '') ?>" inputmode="numeric" dir="ltr" required></label>
          <button class="btn-ghost" type="submit" data-busy="Asking PayOne…">Run Inquiry</button>
        </form>
        <?php if (!empty($lookup['result'])): ?><p>Signature: <?= yes($lookup['result']['hash']['ok']) ?> · HTTP <?= esc($lookup['result']['httpStatus']) ?></p><pre class="log"><?= esc(pretty($lookup['result']['parsed'])) ?></pre><?php endif ?>
        <?php if (!empty($lookup['error'])): ?><div class="alert alert-error"><?= esc($lookup['error']) ?></div><?php endif ?>
      </section>
    </div>
<?php return admin_page('Integration', ob_get_clean(), 'integration');
}

function orders_csv(array $orders): string {
  $cell = fn($v) => '"' . str_replace('"', '""', (string)($v ?? '')) . '"';
  $lines = [implode(',', array_map($cell, ['Order', 'Created', 'Name', 'Email', 'Total SAR', 'Refunded SAR', 'Payment status', 'Order status', 'Approved transaction', 'RRN', 'Card']))];
  foreach ($orders as $o) {
    $p = paid_attempt($o);
    $lines[] = implode(',', array_map($cell, [$o->id, $o->createdAt, $o->customer->name, $o->customer->email ?? '', sar($o->total), sar($o->refunded),
      $o->paymentStatus, $o->status, $p->transactionId ?? '', $p->rrn ?? '', $p->card ?? '']));
  }
  return "\xEF\xBB\xBF" . implode("\r\n", $lines);
}

// --- routes (each match ends the request) ----------------------------------
function admin_route(): void {
  $r = req();
  $method = $r->method;
  $p = $r->path;
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';

  if ($p === '/admin/login' && $method === 'GET') send(login_page());
  if ($p === '/admin/login' && $method === 'POST') {
    $failures = login_failures();
    $fail = $failures[$ip] ?? null;
    if ($fail && $fail['n'] >= 8) send(login_page('Too many attempts. Try again in 15 minutes.'), 429);
    if (same(f('user'), cfg('adminUser')) && same(f('password'), cfg('adminPassword'))) {
      unset($failures[$ip]);
      login_failures($failures);
      $exp = now_ms() + SESSION_HOURS * 3600000;
      set_cookie('adm', "$exp." . sign_admin("admin.$exp"), SESSION_HOURS * 3600, 'Strict');
      redirect('/admin');
    }
    $failures[$ip] = ['n' => ($fail['n'] ?? 0) + 1, 'until' => now_ms() + 15 * 60000];
    login_failures($failures);
    send(login_page('Wrong username or password.'), 401);
  }
  if (!logged_in()) redirect('/admin/login');
  if ($p === '/admin/logout' && $method === 'POST') {
    set_cookie('adm', '', 0, 'Strict');
    redirect('/admin/login');
  }

  if ($method === 'GET' && ($p === '/admin' || $p === '/admin/')) send(dashboard());
  if ($method === 'GET' && $p === '/admin/certification') send(certification());
  if ($method === 'GET' && $p === '/admin/integration') {
    $tid = trim(q('tid'));
    if ($tid === '') send(integration());
    if (!preg_match('/^\d{6,20}$/', $tid)) send(integration(['tid' => $tid, 'error' => 'Transaction IDs are numbers.']));
    try { send(integration(['tid' => $tid, 'result' => payone_inquiry($tid)])); } catch (Throwable $e) {
      send(integration(['tid' => $tid, 'error' => 'PayOne not reachable: ' . $e->getMessage()]));
    }
  }
  if ($method === 'GET' && $p === '/admin/export.csv') {
    send_file(orders_csv(filter_orders(q('pay'), q('st'))), 'text/csv; charset=utf-8', 'orders-' . gmdate('Y-m-d') . '.csv');
  }

  if (!preg_match('#^/admin/orders/(AYQ-\d+)(?:/(inquiry|refund|status|payment-status|note))?$#', $p, $m)) return;
  $order = order_by_id($m[1]);
  if (!$order) return;
  $action = $m[2] ?? '';
  if ($method === 'GET' && $action === '') send(order_detail($order));
  if ($method !== 'POST' || $action === '') return;

  if ($action === 'inquiry') {
    $attempt = null;
    foreach ($order->attempts as $a) if ($a->transactionId === f('tid')) $attempt = $a;
    if (!$attempt) back($order, 'err', 'Unknown transaction.');
    $res = run_inquiry($order, $attempt, 'admin');
    if (isset($res['error'])) back($order, 'err', "Inquiry failed: {$res['error']}");
    $e = $res['entry'];
    back($order, $res['ok'] ? 'ok' : 'err', $res['ok']
      ? "Inquiry: {$attempt->transactionId} is " . ($attempt->status === 'paid' ? 'APPROVED' : 'DECLINED') . " ({$e->statusCode} {$e->description})"
      : 'Inquiry: ' . ($e->messageStatus ?: 'no status') . " {$e->description}");
  }
  if ($action === 'refund') {
    $amount = (int)round((float)str_replace(',', '', f('amount')) * 100);
    $res = do_refund($order, $amount, 'admin');
    back($order, $res['ok'] ? 'ok' : 'err', $res['ok'] ? 'Refunded ' . sar($amount) . " SAR (transaction {$res['row']->transactionId})." : $res['error']);
  }
  if ($action === 'status') {
    $status = f('status');
    if (!in_array($status, ORDER_STATUSES, true)) back($order, 'err', 'Unknown status.');
    $note = mb_substr(trim(f('note')), 0, 200);
    if ($status !== $order->status) {
      $order->status = $status;
      add_event($order, 'admin', 'Order status set to ' . olabel($status) . ($note !== '' ? " — $note" : ''));
      save();
    }
    back($order, 'ok', 'Order status: ' . olabel($order->status) . '.');
  }
  if ($action === 'payment-status') {
    $status = f('status');
    $note = mb_substr(trim(f('note')), 0, 200);
    if ($status === 'auto') {
      if (!empty($order->paymentOverride)) {
        unset($order->paymentOverride);
        add_event($order, 'admin', 'Payment status back to automatic (PayOne)');
      }
    } elseif (in_array($status, MANUAL_PAY, true)) {
      if ($note === '') back($order, 'err', 'Write the reason for a manual payment status.');
      $order->paymentOverride = (object)['status' => $status, 'note' => $note, 'at' => now()];
      add_event($order, 'admin', 'Payment status set manually to ' . plabel($status) . " — $note");
    } else back($order, 'err', 'Unknown status.');
    recompute($order);
    save();
    back($order, 'ok', 'Payment status: ' . plabel($order->paymentStatus) . '.');
  }
  if ($action === 'note') {
    $note = mb_substr(trim(f('note')), 0, 500);
    if ($note !== '') { add_event($order, 'admin', "Note: $note"); save(); }
    back($order, 'ok', 'Note added.');
  }
}

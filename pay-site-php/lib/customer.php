<?php
// Customer pages of pay.ayqaealhayaa.sa. The cart is built on the website (ayqaealhayaa.sa), which posts a
// signed order here: /checkout -> customer details -> PayOne payment page -> result / order tracking.

const CUSTOMER_INQUIRY_EVERY = 30000; // an open order page asks PayOne at most this often while a payment is pending
const PAYABLE = ['unpaid', 'failed', 'expired', 'pending'];

// Back to the website; after a payment the website empties the customer's cart (?paid=).
function back_to_store(?stdClass $order): string {
  return $order && is_paid($order) ? store_url() . '/?paid=' . rawurlencode($order->id) : store_url();
}

function field(string $L, string $name, string $key, array $o = []): string {
  $error = $o['error'] ?? '';
  return '<label class="field' . ($error ? ' has-error' : '') . '"><span>' . esc(t($L, $key)) . '</span>
    <input type="' . ($o['type'] ?? 'text') . '" name="' . $name . '" value="' . esc($o['value'] ?? '') . '" ' . ($o['attrs'] ?? '') . '>
    ' . ($error ? '<em class="field-error">' . esc($error) . '</em>' : '') . '</label>';
}

function amount_limits(): array { $a = cfg('amount') ?? []; return [$a['min'] ?? 1, $a['max'] ?? 20000]; }
function fmt_limit($n): string { return number_format($n); }

// Amount typed by the customer -> halalas. Accepts Arabic digits, "," thousands and "٫" decimals.
function parse_amount(string $raw): ?int {
  $s = str_replace(['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٫'], ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'], trim($raw));
  $s = preg_replace('/[,،\s]/u', '', $s);
  if (!preg_match('/^\d+(\.\d{1,2})?$/', $s)) return null;
  return (int)round((float)$s * 100);
}

function valid_email(string $e): bool { return (bool)preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $e); }

// --- pages ---------------------------------------------------------------
// Front page: the customer enters the amount and their details.
function direct_page(array $values = [], array $errors = []): string {
  $L = req()->lang;
  [$min, $max] = amount_limits();
  ob_start(); ?>
    <section class="card pay-card pay-direct">
      <h1><?= esc(t($L, 'direct_title')) ?></h1>
      <p class="lead"><?= esc(t($L, 'direct_lead')) ?></p>
      <form method="post" action="/" novalidate>
        <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <label class="field<?= !empty($errors['amount']) ? ' has-error' : '' ?>"><span><?= esc(t($L, 'amount_label')) ?></span>
          <div class="amount-input"><span class="currency"><?= esc(t($L, 'sar')) ?></span>
            <input type="text" name="amount" inputmode="decimal" autocomplete="off" placeholder="0" dir="ltr" value="<?= esc($values['amount'] ?? '') ?>" required></div>
          <small class="hint"><?= esc(fill(t($L, 'amount_range'), ['min' => fmt_limit($min), 'max' => fmt_limit($max)])) ?></small>
          <?php if (!empty($errors['amount'])): ?><em class="field-error"><?= esc($errors['amount']) ?></em><?php endif ?></label>
        <?= field($L, 'name', 'name', ['value' => $values['name'] ?? '', 'error' => $errors['name'] ?? '', 'attrs' => 'autocomplete="name" maxlength="80" required']) ?>
        <?= field($L, 'email', 'email', ['type' => 'email', 'value' => $values['email'] ?? '', 'error' => $errors['email'] ?? '', 'attrs' => 'autocomplete="email" maxlength="120" dir="ltr" required']) ?>
        <button class="btn-primary" type="submit" data-busy="<?= esc(t($L, 'redirecting_title')) ?>…"><?= LOCK ?> <?= esc(t($L, 'continue_pay')) ?></button>
        <p class="fine"><?= PAYMENT_LOGOS ?><br><?= esc(t($L, 'direct_card_note')) ?></p>
      </form>
    </section>
    <p class="aside-note"><?= esc(t($L, 'from_store_title')) ?> <a class="small-link" href="<?= esc(store_url()) ?>"><?= esc(t($L, 'from_store_text')) ?></a></p>
<?php return layout(t($L, 'direct_title'), ob_get_clean());
}

function handoff_error(string $kind): string {
  $L = req()->lang;
  ob_start(); ?>
    <section class="card result result-fail">
      <div class="result-icon"><?= ICONS['fail'] ?></div>
      <h1><?= esc(t($L, 'handoff_title')) ?></h1>
      <p class="lead"><?= esc(t($L, $kind === 'expired' ? 'handoff_expired' : 'handoff_invalid')) ?></p>
      <div class="result-actions"><a class="btn-primary" href="<?= esc(store_url()) ?>"><?= esc(t($L, 'back_store')) ?></a></div>
    </section>
<?php return layout(t($L, 'handoff_title'), ob_get_clean(), 0, false);
}

function item_name(stdClass $item, string $L): string { return $item->name->$L ?? $item->name->ar; }

// Step 2: who is paying. Only what the merchant needs; PayOne itself asks for no customer data.
// The signed order travels with the form, so nothing is stored until the customer presses Pay.
function details_page(array $order, array $values = [], array $errors = []): string {
  $L = req()->lang;
  ob_start(); ?>
<?= stepper($L, 2) ?>

    <div class="checkout">
      <section class="card">
        <h1><?= esc(t($L, 'details_title')) ?></h1>
        <p class="lead"><?= esc(t($L, 'details_lead')) ?></p>
        <form method="post" action="/checkout/details" novalidate>
          <input type="hidden" name="payload" value="<?= esc(f('payload')) ?>">
          <input type="hidden" name="signature" value="<?= esc(f('signature')) ?>">
          <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <?= field($L, 'name', 'name', ['value' => $values['name'] ?? '', 'error' => $errors['name'] ?? '', 'attrs' => 'autocomplete="name" maxlength="80" required']) ?>
          <?= field($L, 'email', 'email', ['type' => 'email', 'value' => $values['email'] ?? '', 'error' => $errors['email'] ?? '', 'attrs' => 'autocomplete="email" maxlength="120" dir="ltr" required']) ?>
          <fieldset class="pay-method">
            <legend><?= esc(t($L, 'pay_with')) ?></legend>
            <label class="method selected"><input type="radio" name="method" value="card" checked>
              <span><b><?= esc(t($L, 'pay_methods')) ?></b><small>PayOne</small></span><?= PAYMENT_LOGOS ?></label>
          </fieldset>
          <p class="fine start"><?= LOCK ?> <?= esc(t($L, 'pay_secure_note')) ?></p>
          <button class="btn-primary" type="submit" data-busy="<?= esc(t($L, 'redirecting_title')) ?>…"><?= LOCK ?> <?= esc(t($L, 'pay_now')) ?> · <?= money($order['total'], $L) ?></button>
          <p class="fine"><?= esc(t($L, 'agree')) ?></p>
          <p class="fine"><a class="small-link" href="<?= esc(store_url()) ?>"><?= esc(t($L, 'edit_cart')) ?></a></p>
        </form>
      </section>
      <aside class="card order-box">
        <div class="box-head"><h2><?= esc(t($L, 'order_summary')) ?></h2></div>
        <ul class="mini-lines"><?php foreach ($order['items'] as $i): ?><li>
          <span><?= esc(item_name($i, $L)) ?><small>× <?= $i->qty ?> · <?= money($i->price, $L) ?></small></span>
          <b><?= money($i->price * $i->qty, $L) ?></b></li><?php endforeach ?></ul>
        <div class="total-row"><span><?= esc(t($L, 'total')) ?></span><b><?= money($order['total'], $L) ?></b></div>
      </aside>
    </div>
<?php return layout(t($L, 'details_title'), ob_get_clean(), 0, false);
}

function redirect_page(stdClass $order, stdClass $attempt): string {
  $L = req()->lang;
  $form = payone_redirect_form($attempt->transactionId, $attempt->amount, "Order {$order->id}", $order->lang ?: $L, cfg('publicUrl') . '/payment/return');
  ob_start(); ?>
<?= stepper($L, 3) ?>

    <section class="card result result-wait">
      <div class="spinner" aria-hidden="true"></div>
      <h1><?= esc(t($L, 'redirecting_title')) ?></h1>
      <p class="lead"><?= esc(t($L, 'redirecting_text')) ?></p>
      <dl class="summary compact">
        <div><dt><?= esc(t($L, 'order_no')) ?></dt><dd><?= esc($order->id) ?></dd></div>
        <div><dt><?= esc(t($L, 'amount')) ?></dt><dd><?= money($attempt->amount, $L) ?></dd></div>
      </dl>
      <form method="post" action="<?= esc($form['action']) ?>" data-autosubmit>
        <?php foreach ($form['fields'] as $k => $v): ?><input type="hidden" name="<?= esc($k) ?>" value="<?= esc($v) ?>"><?php endforeach ?>

        <button class="btn-primary" type="submit"><?= LOCK ?> <?= esc(t($L, 'continue_to_payment')) ?></button>
      </form>
    </section>
<?php return layout(t($L, 'redirecting_title'), ob_get_clean());
}

// What the customer sees for each payment state.
function state_of(stdClass $order): array {
  if ($order->status === 'cancelled') return ['key' => 'cancelled', 'icon' => 'fail', 'tone' => 'fail'];
  $s = $order->paymentStatus;
  if ($s === 'paid') return ['key' => 'paid', 'icon' => 'ok', 'tone' => 'ok'];
  if ($s === 'refunded' || $s === 'partially_refunded') return ['key' => $s, 'icon' => 'ok', 'tone' => 'info'];
  // PayOne has no record of the pending payment yet: the customer left before paying, so offer to pay.
  if ($s === 'pending' && never_submitted(latest_pending($order))) return ['key' => 'expired', 'icon' => 'wait', 'tone' => 'wait'];
  if ($s === 'pending') return ['key' => 'pending', 'icon' => 'wait', 'tone' => 'wait'];
  if ($s === 'failed') return ['key' => 'failed', 'icon' => 'fail', 'tone' => 'fail'];
  if ($s === 'expired') return ['key' => 'expired', 'icon' => 'wait', 'tone' => 'wait'];
  return ['key' => 'unpaid', 'icon' => 'wait', 'tone' => 'wait'];
}

function progress_list(string $L, stdClass $order): string {
  $at = array_search($order->status, ['new', 'processing', 'shipped', 'completed'], true);
  $at = $at === false ? -1 : $at;
  $paid = is_paid($order);
  $stages = [['stage_placed', true], ['stage_paid', $paid], ['stage_processing', $paid && $at >= 1],
    ['stage_shipped', $paid && $at >= 2], ['stage_completed', $paid && $at >= 3]];
  $out = '<ol class="progress">';
  foreach ($stages as [$k, $done]) $out .= '<li class="' . ($done ? 'done' : '') . '"><b></b><span>' . esc(t($L, $k)) . '</span></li>';
  return $out . '</ol>';
}

function order_page(stdClass $order): string {
  $L = req()->lang;
  // Interrupted payment: the customer came back without PayOne's return, so ask PayOne (Inquiry).
  $pending = latest_pending($order);
  if ($pending) {
    $age = now_ms() - ms($pending->createdAt);
    $since = !empty($pending->lastInquiryAt) ? now_ms() - ms($pending->lastInquiryAt) : PHP_INT_MAX;
    if ($age > 15000 && $since > CUSTOMER_INQUIRY_EVERY) run_inquiry($order, $pending, 'customer');
  }
  $st = state_of($order);
  $last = $order->attempts ? end($order->attempts) : null;
  $paidAttempt = paid_attempt($order);
  $shown = $paidAttempt ?: $last;
  $canPay = in_array($order->paymentStatus, PAYABLE, true) && $order->status !== 'cancelled';
  $shownPay = $st['key'] === 'expired' ? 'expired' : $order->paymentStatus;
  $done = $st['tone'] === 'ok' || $st['tone'] === 'info';

  $rows = [
    ['order_no', esc($order->id)],
    ['date', '<span dir="ltr">' . esc(when($order->createdAt)) . '</span>'],
    ['amount', money($order->total, $L)],
    ['payment_status', pay_badge($shownPay, t($L, "pay_$shownPay"))],
    ['order_status', order_badge($order->status, t($L, "st_{$order->status}"))],
  ];
  if ($order->refunded) $rows[] = ['refunded_amount', money($order->refunded, $L)];
  if (!empty($shown->card)) $rows[] = ['card', '<span dir="ltr">' . esc($shown->card) . '</span>'];
  if (!empty($paidAttempt->rrn)) $rows[] = ['rrn', '<span class="mono">' . esc($paidAttempt->rrn) . '</span>'];
  if (!empty($paidAttempt->approvalCode)) $rows[] = ['approval', '<span class="mono">' . esc($paidAttempt->approvalCode) . '</span>'];
  if ($shown) $rows[] = ['transaction', '<span class="mono">' . esc($shown->transactionId) . '</span>'];

  ob_start(); ?>
<?= stepper($L, $done ? 5 : 3) ?>

    <section class="card result result-<?= $st['tone'] ?>">
      <?= $st['key'] === 'pending' ? '<div class="spinner" aria-hidden="true"></div>' : '<div class="result-icon">' . ICONS[$st['icon']] . '</div>' ?>

      <h1><?= esc(t($L, "{$st['key']}_title")) ?></h1>
      <p class="lead"><?= esc(t($L, "{$st['key']}_text")) ?></p>
      <?php if ($st['key'] === 'failed' && $last): ?><div class="reason"><span class="reason-label"><?= esc(t($L, 'reason')) ?></span>
        <p><?= esc(($last->description ?? '') ?: '—') ?></p><small dir="ltr">Code <?= esc(($last->statusCode ?? '') ?: '—') ?></small></div><?php endif ?>

      <?= is_paid($order) ? progress_list($L, $order) : '' ?>

      <dl class="summary"><?php foreach ($rows as [$k, $v]): ?><div><dt><?= esc(t($L, $k)) ?></dt><dd><?= $v ?></dd></div><?php endforeach ?></dl>
      <div class="receipt-items">
        <h3><?= esc(t($L, 'items')) ?></h3>
        <ul class="mini-lines"><?php foreach ($order->items as $i): ?><li><span><?= esc(item_name($i, $L)) ?><small>× <?= $i->qty ?></small></span><b><?= money($i->price * $i->qty, $L) ?></b></li><?php endforeach ?></ul>
        <p class="muted small"><?= esc(t($L, 'customer')) ?>: <?= esc($order->customer->name) ?><?php if (!empty($order->customer->email)): ?> · <span dir="ltr"><?= esc($order->customer->email) ?></span><?php endif ?></p>
      </div>
      <div class="result-actions"><?php
        if ($st['key'] === 'pending'): ?><form method="post" action="/order/<?= $order->token ?>/check"><button class="btn-primary" type="submit" data-busy="<?= esc(t($L, 'checking')) ?>"><?= esc(t($L, 'check_status')) ?></button></form><?php endif;
        if ($canPay): ?><form method="post" action="/order/<?= $order->token ?>/pay"><button class="<?= $st['key'] === 'pending' ? 'btn-ghost' : 'btn-primary' ?>" type="submit" data-busy="<?= esc(t($L, 'redirecting_title')) ?>…"><?= LOCK ?> <?= esc(t($L, $st['key'] === 'failed' || $st['key'] === 'pending' ? 'try_again' : 'pay_order')) ?> · <?= money($order->total, $L) ?></button></form><?php endif;
        if ($done): ?><button class="btn-ghost" type="button" data-print><?= esc(t($L, 'print')) ?></button><?php endif ?><a class="btn-ghost" href="<?= esc(back_to_store($order)) ?>"><?= esc(t($L, 'back_store')) ?></a><?php
        if ($st['tone'] === 'fail'): ?><a class="link-plain" href="https://wa.me/<?= esc(cfg('whatsapp')) ?>" target="_blank" rel="noopener"><?= esc(t($L, 'contact_whatsapp')) ?></a><?php endif ?></div>
      <p class="fine"><?= esc(t($L, 'keep_link')) ?></p>
    </section>
<?php return layout(t($L, "{$st['key']}_title"), ob_get_clean(), $st['key'] === 'pending' ? 10 : 0);
}

function track_page(array $values = [], string $error = ''): string {
  $L = req()->lang;
  ob_start(); ?>
    <section class="card pay-card">
      <h1><?= esc(t($L, 'track_title')) ?></h1>
      <p class="lead"><?= esc(t($L, 'track_lead')) ?></p>
      <?php if ($error): ?><div class="alert" role="alert"><?= esc($error) ?></div><?php endif ?>

      <form method="post" action="/track">
        <?= field($L, 'order', 'order_no', ['value' => $values['order'] ?? '', 'attrs' => 'placeholder="' . esc(t($L, 'order_no_ph')) . '" dir="ltr" maxlength="20" required']) ?>
        <?= field($L, 'email', 'email', ['type' => 'email', 'value' => $values['email'] ?? '', 'attrs' => 'dir="ltr" maxlength="120" required']) ?>
        <button class="btn-primary" type="submit"><?= esc(t($L, 'track_btn')) ?></button>
      </form>
    </section>
<?php return layout(t($L, 'track_title'), ob_get_clean());
}

function not_found_page(): string {
  $L = req()->lang;
  return layout('404', '<section class="card result"><h1>404</h1><p class="lead">' . ($L === 'ar' ? 'الصفحة غير موجودة.' : 'Page not found.') . '</p>
    <a class="btn-primary narrow" href="' . esc(store_url()) . '">' . esc(t($L, 'back_store')) . '</a></section>');
}

// Name and email from a form, with the errors to show.
function customer_fields(string $L): array {
  $v = ['name' => mb_substr(trim(f('name')), 0, 80), 'email' => mb_substr(trim(f('email')), 0, 120)];
  $errors = [];
  if (mb_strlen($v['name']) < 3) $errors['name'] = t($L, 'err_name');
  if (!valid_email($v['email'])) $errors['email'] = t($L, 'err_email');
  return [$v, $errors];
}

// --- routes (each match ends the request) ----------------------------------
function customer_route(): void {
  $r = req();
  $method = $r->method;
  $p = $r->path;
  $L = $r->lang;

  if ($method === 'GET' && $p === '/') send(direct_page());

  // Direct payment: the customer types the amount themselves (no website cart).
  if ($method === 'POST' && $p === '/') {
    if (f('website') !== '') redirect(store_url()); // honeypot
    [$min, $max] = amount_limits();
    $halalas = parse_amount(f('amount'));
    [$v, $errors] = customer_fields($L);
    $v['amount'] = f('amount');
    if ($halalas === null) $errors['amount'] = t($L, 'err_amount');
    elseif ($halalas < $min * 100 || $halalas > $max * 100) $errors['amount'] = fill(t($L, 'err_amount_range'), ['min' => fmt_limit($min), 'max' => fmt_limit($max)]);
    if ($errors) send(direct_page($v, $errors), 422);

    $name = (object)['ar' => t('ar', 'direct_item'), 'en' => t('en', 'direct_item')];
    $created = create_order(['name' => $v['name'], 'email' => $v['email']], [(object)['id' => 0, 'name' => $name, 'price' => $halalas, 'qty' => 1]],
      $halalas, $L, ['site' => 'direct']);
    $attempt = start_attempt($created);
    redirect("/pay/{$created->token}/{$attempt->transactionId}");
  }

  // Step 1 -> 2: the website posts the signed cart here.
  if ($method === 'POST' && ($p === '/checkout' || $p === '/checkout/details')) {
    $order = verify_handoff($r->form, cfg('handoffSecret'));
    if (isset($order['error'])) send(handoff_error($order['error']), $order['error'] === 'expired' ? 410 : 400);
    // The same cart posted again (refresh, Back): continue the order already made from it.
    $existing = order_by_handoff($order['ref']);
    if ($existing) redirect("/order/{$existing->token}");
    if ($p === '/checkout') send(details_page($order));

    if (f('website') !== '') redirect(store_url()); // honeypot
    [$v, $errors] = customer_fields($L);
    if ($errors) send(details_page($order, $v, $errors), 422);

    $created = create_order($v, $order['items'], $order['total'], $order['lang'], ['site' => store_url(), 'ref' => $order['ref']]);
    $attempt = start_attempt($created);
    redirect("/pay/{$created->token}/{$attempt->transactionId}");
  }

  if ($method === 'GET' && preg_match('#^/pay/([a-f0-9]{32})/(\d{10,20})$#', $p, $m)) {
    $order = order_by_token($m[1]);
    $attempt = null;
    if ($order) foreach ($order->attempts as $a) if ($a->transactionId === $m[2]) $attempt = $a;
    if (!$attempt) return;
    // Only the first visit posts to PayOne; coming back here (browser Back) shows the order instead.
    if ($attempt->status !== 'pending' || !empty($attempt->redirectedAt)) redirect("/order/{$order->token}");
    $attempt->redirectedAt = now();
    add_event($order, 'customer', 'Sent to PayOne payment page', ['transactionId' => $attempt->transactionId]);
    save();
    send(redirect_page($order, $attempt));
  }

  if ($p === '/payment/return' && ($method === 'POST' || $method === 'GET')) {
    $order = handle_return(array_merge($r->query, $r->form));
    if (!$order) send(not_found_page(), 400);
    redirect("/order/{$order->token}");
  }

  if (preg_match('#^/order/([a-f0-9]{32})(/pay|/check)?$#', $p, $m)) {
    $order = order_by_token($m[1]);
    if (!$order) return;
    $action = $m[2] ?? '';
    if ($method === 'GET' && $action === '') send(order_page($order));
    if ($method === 'POST' && $action === '/check') {
      $pending = latest_pending($order);
      if ($pending) run_inquiry($order, $pending, 'customer');
      redirect("/order/{$order->token}");
    }
    if ($method === 'POST' && $action === '/pay') {
      if ($order->status === 'cancelled' || !in_array($order->paymentStatus, PAYABLE, true)) redirect("/order/{$order->token}");
      if (settle_pending($order, 'customer')) redirect("/order/{$order->token}");
      $attempt = start_attempt($order);
      redirect("/pay/{$order->token}/{$attempt->transactionId}");
    }
  }

  if ($p === '/track' && $method === 'GET') send(track_page());
  if ($p === '/track' && $method === 'POST') {
    $id = strtoupper(trim(f('order')));
    $order = order_by_id(str_starts_with($id, 'AYQ-') ? $id : "AYQ-$id");
    $email = strtolower(trim(f('email')));
    if ($order && $email !== '' && strtolower($order->customer->email ?? '') === $email) redirect("/order/{$order->token}");
    send(track_page($r->form, t($L, 'track_not_found')), 404);
  }
}

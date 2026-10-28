<?php
// Shared HTML: page layouts and small components.

const LOCK = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const ICONS = [
  'ok' => '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  'fail' => '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  'wait' => '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
];
const PAYMENT_LOGOS = '<span class="pay-logos" aria-hidden="true"><b class="pl-mada">mada</b><b class="pl-visa">VISA</b><b class="pl-mc"><i></i><i></i></b></span>';

// Payment status -> badge colour class.
const PAY_TONE = ['paid' => 'paid', 'partially_refunded' => 'refund', 'refunded' => 'refund', 'pending' => 'pending', 'unpaid' => 'muted', 'failed' => 'declined', 'expired' => 'declined'];
const ORDER_TONE = ['new' => 'muted', 'processing' => 'pending', 'shipped' => 'info', 'completed' => 'paid', 'cancelled' => 'declined'];
function pay_badge(string $status, string $label): string { return '<span class="badge badge-' . (PAY_TONE[$status] ?? 'muted') . '">' . esc($label) . '</span>'; }
function order_badge(string $status, string $label): string { return '<span class="badge badge-' . (ORDER_TONE[$status] ?? 'muted') . '">' . esc($label) . '</span>'; }

function head_tags(): string {
  return '<link rel="icon" type="image/png" href="/public/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Changa:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/public/style.css?v=3">
<link rel="stylesheet" href="/public/store.css?v=4">
<script src="/public/app.js?v=3" defer></script>';
}

// Customer layout (Arabic RTL by default, English LTR).
// langSwitch is off on pages rendered from a POST (they can't be reloaded with ?lang=).
function layout(string $title, string $body, int $refresh = 0, bool $langSwitch = true): string {
  $lang = req()->lang;
  $other = $lang === 'ar' ? 'en' : 'ar';
  $store = cfg('storeName')[$lang];
  ob_start(); ?>
<!doctype html>
<html lang="<?= $lang ?>" dir="<?= $lang === 'ar' ? 'rtl' : 'ltr' ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<?php if ($refresh): ?><meta http-equiv="refresh" content="<?= $refresh ?>">
<?php endif ?>
<title><?= esc($title) ?> | <?= esc($store) ?></title>
<?= head_tags() ?>

</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">
      <img class="brand-mark" src="/public/logo.png" width="40" height="40" alt="">
      <span class="brand-text"><strong>إيقاع الحياة</strong><small>Ayqaa Alhayah</small></span>
    </a>
    <nav class="head-links">
      <a class="back-link" href="<?= esc(store_url()) ?>"><?= esc(t($lang, 'back_store')) ?></a>
      <a class="back-link" href="/track"><?= esc(t($lang, 'nav_track')) ?></a>
      <?php if ($langSwitch): ?><a class="back-link" href="?lang=<?= $other ?>" lang="<?= $other ?>"><?= esc(t($lang, 'other_lang')) ?></a><?php endif ?>

    </nav>
  </div>
</header>
<main class="wrap main">
<?= $body ?>

</main>
<footer class="site-footer">
  <div class="wrap">
    <span>&copy; <?= date('Y') ?> <?= esc($store) ?> · <a href="<?= esc(store_url()) ?>"><?= esc(t($lang, 'back_site')) ?></a></span>
    <span class="secure-note"><?= LOCK ?> <?= esc(t($lang, 'secure')) ?> <?= PAYMENT_LOGOS ?></span>
  </div>
</footer>
</body>
</html>
<?php return ob_get_clean();
}

// Checkout progress: 1 cart, 2 details, 3 payment, 4 confirmation.
function stepper(string $lang, int $current): string {
  $out = '<ol class="stepper">';
  foreach (['step_cart', 'step_details', 'step_payment', 'step_confirm'] as $i => $k) {
    $n = $i + 1;
    $cls = $n < $current ? 'done' : ($n === $current ? 'current' : '');
    $out .= "<li class=\"$cls\"" . ($n === $current ? ' aria-current="step"' : '') . '><b>' . ($n < $current ? '✓' : $n) . '</b><span>' . esc(t($lang, $k)) . '</span></li>';
  }
  return $out . '</ol>';
}

// Admin layout (English).
function admin_layout(string $title, string $body, string $tab = '', array $flash = [], bool $loggedIn = true): string {
  $tabs = [['orders', '/admin', 'Orders'], ['certification', '/admin/certification', 'Certification'], ['integration', '/admin/integration', 'Integration']];
  ob_start(); ?>
<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title><?= esc($title) ?> | Ayqaa Alhayah admin</title>
<?= head_tags() ?>

</head>
<body class="is-admin">
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/admin">
      <img class="brand-mark" src="/public/logo.png" width="40" height="40" alt="">
      <span class="brand-text"><strong>إيقاع الحياة</strong><small>PayOne payments · <?= esc(payone('environment')) ?></small></span>
    </a>
    <nav class="head-links">
      <a class="back-link" href="<?= esc(cfg('storeUrl') ?: '/') ?>" target="_blank" rel="noopener">Open website ↗</a>
      <?php if ($loggedIn): ?><form method="post" action="/admin/logout"><button class="link-btn" type="submit">Log out</button></form><?php endif ?>

    </nav>
  </div>
</header>
<main class="wrap main">
<?php if ($loggedIn): ?><nav class="tabs"><?php foreach ($tabs as [$k, $href, $label]): ?><a href="<?= $href ?>"<?= $k === $tab ? ' aria-current="page"' : '' ?>><?= $label ?></a><?php endforeach ?></nav><?php endif ?>

<?php if (!empty($flash['ok'])): ?><div class="alert alert-ok" role="status"><?= esc($flash['ok']) ?></div><?php endif ?>
<?php if (!empty($flash['err'])): ?><div class="alert alert-error" role="alert"><?= esc($flash['err']) ?></div><?php endif ?>
<?= $body ?>

</main>
<footer class="site-footer"><div class="wrap"><span>Ayqaa Alhayah · merchant admin</span><span class="secure-note"><?= LOCK ?> PayOne SmartRoute</span></div></footer>
</body>
</html>
<?php return ob_get_clean();
}

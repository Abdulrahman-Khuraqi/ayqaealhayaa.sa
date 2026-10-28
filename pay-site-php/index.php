<?php
// pay.ayqaealhayaa.sa: PayOne SmartRoute payment pages for orders coming from the website, plus the merchant admin.
// Every request comes here (.htaccess); files under /public/ are served directly.
// Local run: php -S localhost:3000 index.php  ->  http://localhost:3000 and /admin
// Settings: config.json. PayOne credentials: info-client.txt. Orders: data/orders.json.

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (PHP_SAPI === 'cli-server' && str_starts_with($path, '/public/') && is_file(__DIR__ . $path)) return false;

foreach (['util', 'store', 'payone', 'payments', 'handoff', 'views', 'customer', 'admin'] as $lib) require __DIR__ . "/lib/$lib.php";

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; " .
  "font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'");

set_exception_handler(function (Throwable $e) {
  error_log((string)$e);
  if (!headers_sent()) { http_response_code(500); header('Content-Type: text/plain; charset=utf-8'); }
  echo 'Something went wrong. Please try again.';
});

// Settle interrupted payments after the response has gone out, at most once a minute
// (cron.php does the same on a schedule where the host offers cron jobs).
register_shutdown_function(function () {
  $stamp = data_dir() . '/reconcile.stamp';
  if (!function_exists('fastcgi_finish_request') || (is_file($stamp) && time() - filemtime($stamp) < 60)) return;
  @touch($stamp);
  fastcgi_finish_request();
  reconcile();
});

$r = req();
$r->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$r->path = $path;
$r->query = last_values(parse_form($_SERVER['QUERY_STRING'] ?? ''));

// Language: ?lang= switches and is remembered in a cookie.
$asked = q('lang');
if (in_array($asked, LANGS, true)) set_cookie('lang', $asked, 31536000);
$r->lang = in_array($asked, LANGS, true) ? $asked : (in_array($_COOKIE['lang'] ?? '', LANGS, true) ? $_COOKIE['lang'] : 'ar');

if ($r->method === 'POST') {
  // PayOne posts the payment result and the website posts the signed cart from their own origins
  // (both are verified by signature); every other form must come from this site.
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($path !== '/payment/return' && $path !== '/checkout' && $origin !== '' && $origin !== 'null') {
    $o = parse_url($origin);
    if ((($o['host'] ?? '') . (isset($o['port']) ? ':' . $o['port'] : '')) !== ($_SERVER['HTTP_HOST'] ?? '')) send('Forbidden', 403);
  }
  $body = (string)file_get_contents('php://input', false, null, 0, 100000);
  $r->formAll = parse_form($body);
  $r->form = last_values($r->formAll);
}

if ($path === '/admin' || str_starts_with($path, '/admin/')) admin_route();
else customer_route();

send(not_found_page(), 404);

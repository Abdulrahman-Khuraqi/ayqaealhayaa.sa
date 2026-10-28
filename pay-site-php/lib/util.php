<?php
// Settings, request helpers, formatting and text shared by the customer pages and the admin.

function cfg(?string $key = null) {
  static $config = null;
  if ($config === null) {
    $config = json_decode(file_get_contents(dirname(__DIR__) . '/config.json'), true) ?: [];
    $url = getenv('PUBLIC_URL') ?: ($config['publicUrl'] ?? '');
    if (!$url) {
      $https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
      $url = ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    }
    $config['publicUrl'] = rtrim($url, '/');
  }
  return $key === null ? $config : ($config[$key] ?? null);
}

function data_dir(): string { return dirname(__DIR__) . '/data'; }

// Like the browser's URLSearchParams: keeps dots in names. PHP's own $_POST turns
// "Response.StatusCode" (PayOne's field names) into "Response_StatusCode", so it is not used.
function parse_form(string $s): array {
  $all = [];
  foreach (explode('&', $s) as $pair) {
    if ($pair === '') continue;
    $kv = explode('=', $pair, 2);
    $all[urldecode($kv[0])][] = urldecode($kv[1] ?? '');
  }
  return $all;
}
function last_values(array $all): array { return array_map(fn($v) => end($v), $all); }

// The current request, filled in by index.php.
function req(): stdClass {
  static $r = null;
  return $r ??= (object)['method' => 'GET', 'path' => '/', 'lang' => 'ar', 'query' => [], 'form' => [], 'formAll' => []];
}
function q(string $key): string { return (string)(req()->query[$key] ?? ''); }
function f(string $key): string { return (string)(req()->form[$key] ?? ''); }

// --- responses (each one ends the request) --------------------------------
function send(string $html, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: text/html; charset=utf-8');
  header('Cache-Control: no-store');
  echo $html;
  exit;
}
function redirect(string $location, int $code = 303): void {
  http_response_code($code);
  header('Location: ' . $location);
  header('Cache-Control: no-store');
  exit;
}
function send_file(string $body, string $type, string $filename): void {
  header("Content-Type: $type");
  header("Content-Disposition: attachment; filename=\"$filename\"");
  header('Cache-Control: no-store');
  echo $body;
  exit;
}
function set_cookie(string $name, string $value, ?int $maxAge = null, string $sameSite = 'Lax'): void {
  setcookie($name, $value, [
    'expires' => $maxAge === null ? 0 : ($maxAge > 0 ? time() + $maxAge : 1),
    'path' => '/', 'samesite' => $sameSite, 'httponly' => true,
    'secure' => str_starts_with(cfg('publicUrl'), 'https:'),
  ]);
}

// --- time: ISO strings in UTC, as stored in data/orders.json ---------------
function now_ms(): int { return (int)floor(microtime(true) * 1000); }
function now(): string {
  $ms = now_ms();
  return gmdate('Y-m-d\TH:i:s', intdiv($ms, 1000)) . sprintf('.%03dZ', $ms % 1000);
}
function ms(?string $iso): int { return $iso ? (int)(new DateTimeImmutable($iso))->format('Uv') : 0; }
function when(?string $iso): string {
  return $iso ? (new DateTimeImmutable($iso))->setTimezone(new DateTimeZone('Asia/Riyadh'))->format('d M Y, H:i') : '';
}

// --- text and formatting ---------------------------------------------------
function t(string $lang, string $key): string {
  static $strings = null;
  $strings ??= json_decode(file_get_contents(__DIR__ . '/strings.json'), true);
  return $strings[$lang][$key] ?? $strings['ar'][$key] ?? $key;
}
const LANGS = ['ar', 'en'];

function esc($s): string { return htmlspecialchars((string)($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function sar(int $halalas): string { return number_format($halalas / 100, 2, '.', ''); }
function money(int $halalas, string $lang = 'en'): string { return number_format($halalas / 100, 2) . ' ' . t($lang, 'sar'); }
function fill(string $s, array $vars): string { return preg_replace_callback('/\{(\w+)\}/', fn($m) => $vars[$m[1]] ?? '', $s); }
function store_url(): string { return cfg('storeUrl') ?: cfg('mainSite'); }
function pretty($v): string { return json_encode($v, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }

// "What is this payment for?" labels, kept for orders placed while the direct form still asked it.
function purpose_label(string $id): string {
  $labels = ['brand' => 'Logo & identity', 'social' => 'Social media', 'campaign' => 'Ads & campaigns', 'store' => 'Online stores',
    'study' => 'Feasibility study', 'trademark' => 'Trademark', 'screens' => 'Display screens', 'other' => 'Other'];
  return $labels[$id] ?? $id;
}

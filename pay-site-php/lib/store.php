<?php
// Orders, kept in data/orders.json. The first use in a request takes an exclusive lock that is held
// until the request ends, so two requests never overwrite each other's changes.

function db(): stdClass {
  static $db = null;
  if ($db === null) {
    $dir = data_dir();
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    $GLOBALS['__orders_lock'] = fopen("$dir/orders.lock", 'c');
    flock($GLOBALS['__orders_lock'], LOCK_EX);
    $file = "$dir/orders.json";
    $db = is_file($file) ? json_decode(file_get_contents($file)) : null;
    if (!$db) $db = (object)['seq' => 10000, 'orders' => []];
  }
  return $db;
}

function save(): void {
  $file = data_dir() . '/orders.json';
  $tmp = "$file.tmp";
  file_put_contents($tmp, json_encode(db(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  rename($tmp, $file);
}

// Payment status of an order: unpaid -> pending -> paid | failed | expired; paid -> partially_refunded | refunded.
// Order status (fulfilment): new -> processing -> shipped -> completed, or cancelled.
function create_order(array $customer, array $items, int $total, string $lang, array $source): stdClass {
  $db = db();
  $db->seq += 1;
  $order = (object)[
    'id' => "AYQ-{$db->seq}",
    'token' => bin2hex(random_bytes(16)), // the customer's private link to the order
    'createdAt' => now(),
    'lang' => $lang,
    'source' => (object)$source, // { site, ref }: the website cart this order came from, or { site: 'direct' }
    'purposes' => [],
    'customer' => (object)$customer,
    'items' => $items,
    'total' => $total, // halalas
    'paymentStatus' => 'unpaid',
    'status' => 'new',
    'refunded' => 0,
    'attempts' => [],
    'refunds' => [],
    'events' => [],
  ];
  add_event($order, 'customer', isset($source['ref']) ? "Order placed from the website (cart {$source['ref']})"
    : (($source['site'] ?? '') === 'direct' ? 'Order placed on the pay page (amount entered by the customer)' : 'Order placed'));
  $db->orders[] = $order;
  save();
  return $order;
}

function add_event(stdClass $order, string $by, string $text, ?array $extra = null): void {
  $e = (object)['at' => now(), 'by' => $by, 'text' => $text];
  if ($extra) $e->extra = (object)$extra;
  $order->events[] = $e;
}

function all_orders(): array { return db()->orders; }
function find_order(callable $match): ?stdClass {
  foreach (db()->orders as $o) if ($match($o)) return $o;
  return null;
}
function order_by_id(string $id): ?stdClass { return find_order(fn($o) => $o->id === $id); }
function order_by_token(string $token): ?stdClass { return find_order(fn($o) => $o->token === $token); }
function order_by_handoff(string $ref): ?stdClass { return find_order(fn($o) => ($o->source->ref ?? null) === $ref); }
function order_by_transaction(string $transactionId): array {
  foreach (db()->orders as $o) foreach ($o->attempts as $a) if ($a->transactionId === $transactionId) return [$o, $a];
  return [null, null];
}

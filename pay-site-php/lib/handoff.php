<?php
// Orders arriving from the website (ayqaealhayaa.sa): the cart page posts its cart here as JSON in the
// "cart" field. It is not signed, so the merchant checks the items against the amount paid in the admin;
// customers can already pay any amount from the front page, so the cart only describes what they bought.

const MAX_TOTAL = 100000000; // 1,000,000 SAR in halalas

function clean_text($value, int $max): string {
  return is_string($value) ? mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value)), 0, $max) : '';
}

function read_cart(array $form): array {
  $data = json_decode((string)($form['cart'] ?? ''), true);
  if (!is_array($data) || ($data['v'] ?? null) !== 1 || !preg_match('/^WEB-[A-F0-9]{12}$/', (string)($data['ref'] ?? ''))
    || ($data['currency'] ?? null) !== 'SAR') return ['error' => 'invalid'];

  $items = is_array($data['items'] ?? null) ? $data['items'] : [];
  $ok = count($items) > 0 && count($items) <= 30;
  $total = 0;
  foreach ($items as $i) {
    $ok = $ok && is_int($i['id'] ?? null) && is_string($i['name'] ?? null) && $i['name'] !== '' && mb_strlen($i['name']) <= 180
      && is_int($i['qty'] ?? null) && $i['qty'] >= 1 && $i['qty'] <= 20 && is_int($i['price'] ?? null) && $i['price'] > 0;
    if ($ok) $total += $i['price'] * $i['qty'];
  }
  if (!$ok || $total !== ($data['total'] ?? null) || $total > MAX_TOTAL) return ['error' => 'invalid'];

  // Delivery details typed on the website's cart page (all optional here; name and email are asked again).
  $c = is_array($data['customer'] ?? null) ? $data['customer'] : [];
  $customer = array_filter([
    'name' => clean_text($c['name'] ?? '', 80), 'email' => clean_text($c['email'] ?? '', 120),
    'phone' => clean_text($c['phone'] ?? '', 20), 'city' => clean_text($c['city'] ?? '', 60),
    'address' => clean_text($c['address'] ?? '', 200), 'notes' => clean_text($c['notes'] ?? '', 500),
  ], fn($v) => $v !== '');

  return [
    'ref' => $data['ref'],
    'lang' => ($data['lang'] ?? '') === 'en' ? 'en' : 'ar',
    'total' => $total,
    'customer' => $customer,
    'items' => array_map(fn($i) => (object)['id' => $i['id'], 'name' => (object)['ar' => $i['name'], 'en' => $i['name']],
      'price' => $i['price'], 'qty' => $i['qty']], $items),
  ];
}

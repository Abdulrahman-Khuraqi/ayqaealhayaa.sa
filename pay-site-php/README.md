# pay.ayqaealhayaa.sa – PayOne SmartRoute payment site (PHP)

The payment pages for orders coming from the website **ayqaealhayaa.sa**, plus the merchant admin.
Plain PHP 8.0+, no Composer packages and no database: orders are saved in `data/orders.json`.
Same pages, admin and PayOne flow as the earlier Node version (`../payone-test`).

## Upload to the server

1. Upload everything in this folder to the web root of `pay.ayqaealhayaa.sa` (Apache or LiteSpeed; `.htaccess` sends every
   request to `index.php` and blocks `config.json`, `info-client.txt`, `lib/` and `data/`).
2. Copy `config.example.json` to `config.json` and `info-client.example.txt` to `info-client.txt` (PayOne details), then edit `config.json`:
   - `publicUrl` → `https://pay.ayqaealhayaa.sa`
   - `storeUrl` and `mainSite` → `https://ayqaealhayaa.sa`
   - change `adminPassword` and `sessionSecret` (any long random text)
3. The `data/` folder must be writable by PHP.
4. Optional but recommended: a cron job every 5 minutes, `php /path/to/cron.php`, to settle payments left pending.
   On PHP-FPM hosts this also happens after normal requests (at most once a minute).
5. PHP extensions used: curl (or allow_url_fopen), mbstring, json.

Local run: `php -S localhost:3000 index.php` → http://localhost:3000 and http://localhost:3000/admin

## Files

- `index.php` – entry point, request handling and routing
- `lib/customer.php` – pay page, website-cart checkout, PayOne redirect, return, order and tracking pages
- `lib/admin.php` – orders, Inquiry, Refund, order/payment status, certification and integration pages
- `lib/payone.php` – PayOne messages and SecureHash (credentials from `info-client.txt` or `PAYONE_*` env vars)
- `lib/payments.php` – payment attempts, return handling, Inquiry, refunds, automatic settling
- `lib/handoff.php` – reads the cart the website posts to `/checkout` (a `cart` field with JSON: `v`, `ref`, `currency`, `items[{id,name,qty,price}]` in halalas, `total`, optional `customer`)
- `lib/store.php` – orders in `data/orders.json` (locked per request)
- `lib/views.php`, `lib/strings.json` – page layouts and Arabic/English text

Test cards (staging): `5123 4567 8901 2346` or `4111 1111 1111 1111`, CVV `100`, expiry `01/31`.

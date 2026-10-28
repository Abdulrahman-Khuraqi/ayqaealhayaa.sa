<?php
// Settles payments left pending (customer closed the tab before PayOne sent them back) with Inquiry.
// Hosting cron job, every minute or every 5 minutes:  php /path/to/pay-site-php/cron.php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
foreach (['util', 'store', 'payone', 'payments'] as $lib) require __DIR__ . "/lib/$lib.php";
reconcile();

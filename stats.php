<?php
require_once __DIR__ . '/stats-common.php';
header('Content-Type: application/json');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: POST'); exit('{"error":"POST required"}'); }
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') { http_response_code(403); exit('{"error":"Forbidden"}'); }
try {
    $raw = file_get_contents('php://input', false, null, 0, 8193);
    if (strlen($raw) > 8192) throw new InvalidArgumentException('Request too large');
    $input = json_decode($raw, true);
    if (!is_array($input)) throw new InvalidArgumentException('Invalid JSON');
    stats_store(function (&$store) use ($input) { stats_record($store, $input, $_SERVER['REMOTE_ADDR'] ?? '', time()); });
    echo '{"ok":true}';
} catch (InvalidArgumentException $e) {
    http_response_code(400); echo '{"error":"Invalid stats request"}';
} catch (Throwable $e) {
    http_response_code(503); echo '{"error":"Stats temporarily unavailable"}';
}

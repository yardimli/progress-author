<?php
require_once __DIR__ . '/../stats-common.php';
function check($value, $message) { if (!$value) throw new RuntimeException($message); }
$store = ['sessions' => [], 'geo' => []];
$visitor = '11111111-1111-4111-8111-111111111111';
$id = '22222222-2222-4222-8222-222222222222';
$start = strtotime('2026-09-17 23:59:00 UTC');
$input = ['visitorId' => $visitor, 'sessionId' => $id, 'startedAt' => $start, 'days' => ['2026-09-17' => 40, '2026-09-18' => 20]];
stats_record($store, $input, '127.0.0.1', $start + 100);
stats_record($store, $input, '127.0.0.1', $start + 101);
$input['days']['2026-09-17'] = 10;
stats_record($store, $input, '127.0.0.1', $start + 102);
check(array_sum($store['sessions'][$id]['days']) === 60.0, 'Duplicates and older heartbeats must not change totals');
$input['sessionId'] = '33333333-3333-4333-8333-333333333333';
$input['startedAt'] = $start + 120;
$input['days'] = ['2026-09-18' => 29];
stats_record($store, $input, '127.0.0.1', $start + 160);
$filtered = stats_report($store['sessions'], true);
check($filtered['2026-09-17']['visits'] === 1 && $filtered['2026-09-18']['visits'] === 0, 'Visits belong to start day; short visits are filtered');
check($filtered['2026-09-18']['seconds'] === 20.0, 'Overnight gameplay belongs to the next day');
$all = stats_report($store['sessions'], false);
check($all['2026-09-18']['visits'] === 1 && $all['2026-09-18']['returning'] === 1, 'Recognize returning browsers');
check($all['2026-09-18']['seconds'] === 49.0, 'Unfiltered gameplay totals');
check(strpos(json_encode($store), '127.0.0.1') === false && !isset($store['sessions'][$id]['ip']), 'Never store IP');
$input['days'] = ['2026-99-99' => 30];
try { stats_record($store, $input, '', $start + 160); throw new RuntimeException('Invalid date accepted'); }
catch (InvalidArgumentException $expected) {}
echo "Stats aggregation, idempotency, returning visitors, filtering, midnight and privacy checks passed.\n";

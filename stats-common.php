<?php
require_once __DIR__ . '/stats-config.php';

// A separate lock covers readers and atomic replacements of the JSON file.
function stats_store(callable $callback, bool $write = true) {
    if (!is_dir(STATS_DATA_DIR) && !@mkdir(STATS_DATA_DIR, 0700, true) && !is_dir(STATS_DATA_DIR)) {
        throw new RuntimeException('Stats storage unavailable');
    }
    $lock = fopen(STATS_DATA_DIR . '/stats.lock', 'c');
    if (!$lock || !flock($lock, $write ? LOCK_EX : LOCK_SH)) throw new RuntimeException('Stats lock unavailable');
    try {
        $path = STATS_DATA_DIR . '/stats.json';
        $data = is_file($path) ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : ['version' => 1, 'sessions' => [], 'geo' => []];
        $result = $callback($data);
        if ($write) {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $temp = tempnam(STATS_DATA_DIR, 'stats-');
            try {
                if (file_put_contents($temp, $json) !== strlen($json) || !rename($temp, $path)) throw new RuntimeException('Stats write failed');
                @chmod($path, 0600);
            } finally { if (is_file($temp)) unlink($temp); }
        }
        return $result;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}

function stats_location(array &$budget, string $ip): array {
    $unknown = ['country' => 'Unknown', 'city' => 'Unknown'];
    // Only REMOTE_ADDR is trusted. Private/local addresses never leave the server.
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return $unknown;
    $now = time();
    if (($budget['blockedUntil'] ?? 0) > $now) return $unknown;
    if (($budget['window'] ?? 0) + 60 <= $now) $budget = ['window' => $now, 'count' => 0];
    if (($budget['count'] ?? 0) >= 40) return $unknown;
    $budget['count'] = ($budget['count'] ?? 0) + 1;
    // Exclude the API's query field, which would contain the IP address.
    $url = 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=status,country,city';
    $context = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true, 'follow_location' => 0]]);
    $body = @file_get_contents($url, false, $context, 0, 4096);
    $remaining = null; $ttl = 60;
    foreach ($http_response_header ?? [] as $header) {
        if (stripos($header, 'X-Rl:') === 0) $remaining = (int) trim(substr($header, 5));
        if (stripos($header, 'X-Ttl:') === 0) $ttl = max(1, (int) trim(substr($header, 6)));
        if (preg_match('/^HTTP\/\S+ 429/', $header)) $remaining = 0;
    }
    if ($remaining === 0) $budget['blockedUntil'] = $now + $ttl;
    $geo = $body ? json_decode($body, true) : null;
    if (!is_array($geo) || ($geo['status'] ?? '') !== 'success') return $unknown;
    return ['country' => substr((string) ($geo['country'] ?? 'Unknown'), 0, 120), 'city' => substr((string) ($geo['city'] ?? 'Unknown'), 0, 120)];
}

function stats_record(array &$store, array $input, string $ip, int $now): void {
    foreach (['visitorId', 'sessionId'] as $key) {
        if (!is_string($input[$key] ?? null) || !preg_match('/^[a-f0-9-]{36}$/D', $input[$key])) throw new InvalidArgumentException('Invalid identity');
    }
    $days = $input['days'] ?? null;
    if (!is_array($days) || count($days) > 31) throw new InvalidArgumentException('Invalid durations');
    foreach ($days as $day => $seconds) {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $day, new DateTimeZone('UTC'));
        if (!$date || $date->format('Y-m-d') !== $day || $date->getTimestamp() > $now || $date->getTimestamp() < $now - 32 * 86400 || !is_numeric($seconds) || !is_finite((float) $seconds) || $seconds < 0 || $seconds > 86400) {
            throw new InvalidArgumentException('Invalid durations');
        }
    }
    $id = $input['sessionId'];
    if (!isset($store['sessions'][$id])) {
        $start = filter_var($input['startedAt'] ?? null, FILTER_VALIDATE_INT);
        if ($start === false || $start > $now + 60 || $start < $now - 31 * 86400) throw new InvalidArgumentException('Invalid start time');
        $store['sessions'][$id] = [
            'visitorId' => $input['visitorId'], 'startedAt' => min($start, $now), 'lastSeen' => $now,
            'location' => stats_location($store['geo'], $ip), 'days' => []
        ];
    }
    $session =& $store['sessions'][$id];
    if ($session['visitorId'] !== $input['visitorId']) throw new InvalidArgumentException('Session mismatch');
    foreach ($days as $day => $seconds) {
        $dayStart = strtotime($day . ' UTC');
        $possible = max(0, min($now, $dayStart + 86400) - max($dayStart, $session['startedAt']));
        // Cumulative totals make retries, beacon duplicates and reordered requests harmless.
        $session['days'][$day] = max($session['days'][$day] ?? 0, min(round((float) $seconds, 2), $possible));
    }
    $session['lastSeen'] = $now;
}

function stats_report(array $sessions, bool $hideShort): array {
    uasort($sessions, fn($a, $b) => $a['startedAt'] <=> $b['startedAt']);
    $seen = []; $dates = [];
    foreach ($sessions as $id => $session) {
        $returning = isset($seen[$session['visitorId']]);
        $seen[$session['visitorId']] = true;
        $total = array_sum($session['days']);
        if ($hideShort && $total < 30) continue;
        $startDate = gmdate('Y-m-d', $session['startedAt']);
        $sessionDates = array_unique(array_merge([$startDate], array_keys($session['days'])));
        foreach ($sessionDates as $date) {
            if (!isset($dates[$date])) $dates[$date] = ['visits' => 0, 'returning' => 0, 'seconds' => 0, 'sessions' => []];
            $startsToday = $date === $startDate;
            if ($startsToday) { $dates[$date]['visits']++; $dates[$date]['returning'] += (int) $returning; }
            $seconds = $session['days'][$date] ?? 0;
            $dates[$date]['seconds'] += $seconds;
            $dates[$date]['sessions'][] = $session + ['id' => $id, 'returning' => $returning, 'continued' => !$startsToday, 'seconds' => $seconds, 'total' => $total];
        }
    }
    krsort($dates);
    return $dates;
}

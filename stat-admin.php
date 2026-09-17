<?php
require_once __DIR__ . '/stats-common.php';
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
ini_set('session.use_strict_mode', '1');
session_name('author_stats_admin');
session_set_cookie_params(['httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Strict']);
session_start();
if (isset($_SESSION['lastActive']) && time() - $_SESSION['lastActive'] > 1800) {
    unset($_SESSION['authenticated'], $_SESSION['lastActive']);
}
$_SESSION['csrf'] ??= bin2hex(random_bytes(24));
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(403); $error = 'This form expired. Please try again.';
    } elseif (isset($_POST['logout'])) {
        $_SESSION = []; session_regenerate_id(true);
        header('Location: stat-admin.php'); exit;
    } else {
        try {
            $allowed = stats_store(function (&$data) {
                $attempts = $data['loginAttempts'] ?? ['since' => time(), 'count' => 0];
                if (time() - $attempts['since'] >= 900) $attempts = ['since' => time(), 'count' => 0];
                $allowed = $attempts['count'] < 20;
                if ($allowed) $attempts['count']++;
                $data['loginAttempts'] = $attempts;
                return $allowed;
            });
            $passwordOK = $allowed && password_verify((string) ($_POST['password'] ?? ''), STATS_ADMIN_PASSWORD_HASH);
            if ($passwordOK && hash_equals(STATS_ADMIN_USER, (string) ($_POST['username'] ?? ''))) {
                session_regenerate_id(true);
                $_SESSION['authenticated'] = true;
                // Refresh before redirecting, or the next request can expire this new login.
                $_SESSION['lastActive'] = time();
                $_SESSION['csrf'] = bin2hex(random_bytes(24));
                stats_store(function (&$data) { unset($data['loginAttempts']); });
                header('Location: stat-admin.php'); exit;
            }
            $error = $allowed ? 'Incorrect username or password.' : 'Too many login attempts. Try again in 15 minutes.';
        } catch (Throwable $e) { $error = 'Stats storage is unavailable. Check the configured directory permissions.'; }
    }
}
$authenticated = !empty($_SESSION['authenticated']);
$hideShort = ($_GET['short'] ?? '1') !== '0';
$reports = [];
if ($authenticated) {
    $_SESSION['lastActive'] = time();
    try { $reports = stats_store(fn(&$data) => stats_report($data['sessions'], $hideShort), false); }
    catch (Throwable $e) { $error = 'Unable to read stats. Check the configured storage directory.'; }
}
function h($text): string { return htmlspecialchars((string) $text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function duration($seconds): string {
    $seconds = (int) round($seconds);
    return sprintf('%dh %02dm %02ds', intdiv($seconds, 3600), intdiv($seconds % 3600, 60), $seconds % 60);
}
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Author’s Journey · Stats</title>
<link rel="icon" href="img/ui/favicon.svg" type="image/svg+xml">
<style>
:root{color-scheme:light dark;--paper:#f2e5be;--panel:#fcf4da;--ink:#302b24;--muted:#6d5b40;--line:#b39a6a;--accent:#355d47}
@media(prefers-color-scheme:dark){:root{--paper:#202c29;--panel:#293832;--ink:#eee2c8;--muted:#c0b394;--line:#657363;--accent:#9bc7aa}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Georgia,serif}main{max-width:1200px;margin:auto;padding:32px 20px}header,.toolbar,.totals{display:flex;gap:20px;justify-content:space-between;align-items:center;flex-wrap:wrap}h1{margin:0;font-size:30px}h2{font-size:22px}p{color:var(--muted)}button,input,select{font:inherit;padding:9px 12px;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--ink)}button{cursor:pointer}button:hover{outline:1px solid var(--accent)}label{display:block;margin-bottom:8px}.login{max-width:420px;margin:70px auto;background:var(--panel);border:1px solid var(--line);padding:28px}.login input{width:100%;margin-bottom:18px}.login button{width:100%}.notice{border-left:4px solid #b66e50;padding:14px}.totals{margin:24px 0;justify-content:flex-start}.total{padding:18px 24px;background:var(--panel);border:1px solid var(--line);flex:1;min-width:180px}.total strong{display:block;font:26px/1.4 Georgia,serif;color:var(--accent)}section.day{margin:28px 0;border-top:2px solid var(--line)}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;font:14px/1.5 system-ui,sans-serif}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--muted)}.returning{color:var(--accent);font-weight:600}code{font-size:12px}summary{cursor:pointer;padding:12px 0}.toolbar{justify-content:flex-start;margin-top:24px}.toolbar label{margin:0}small{color:var(--muted)}a{color:var(--accent)}
</style></head><body><main>
<header><div><small>AUTHOR’S JOURNEY</small><h1>Gameplay journal</h1></div>
<?php if ($authenticated): ?><form method="post"><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><button name="logout" value="1">Log out</button></form><?php endif ?></header>
<?php if ($error): ?><p class="notice" role="alert"><?= h($error) ?></p><?php endif ?>
<?php if (!$authenticated): ?>
<form method="post" class="login"><h2>Admin login</h2><input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><label for="username">Username</label><input id="username" name="username" autocomplete="username" required maxlength="100"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="200"><button>Open stats</button></form>
<?php else: ?>
<p>Active gameplay only: paused dialogs and background tabs are excluded. All dates and times are UTC. Visits resume across reloads and end after 30 minutes away.</p>
<form method="get" class="toolbar"><label for="short">Short visits</label><select id="short" name="short"><option value="1" <?= $hideShort ? 'selected' : '' ?>>Hide gameplay under 30 seconds</option><option value="0" <?= !$hideShort ? 'selected' : '' ?>>Show every visit</option></select><button>Apply filter / Refresh</button></form>
<?php $visits = array_sum(array_column($reports, 'visits')); $seconds = array_sum(array_column($reports, 'seconds')); $returning = array_sum(array_column($reports, 'returning')); ?>
<div class="totals"><div class="total">Visits<strong><?= h($visits) ?></strong></div><div class="total">Total gameplay<strong><?= h(duration($seconds)) ?></strong></div><div class="total">Returning visits<strong><?= h($returning) ?></strong></div></div>
<p><small>Totals follow the short-visit filter. Returning means this browser ID has an earlier visit, including visits hidden by the filter. Clearing browser storage creates a new identity. Overnight gameplay is counted on the day it occurs; the visit is counted on its start date.</small></p>
<?php if (!$reports): ?><p>No visits match this filter yet.</p><?php endif ?>
<?php foreach ($reports as $date => $report): ?>
<section class="day"><h2><?= h($date) ?></h2><p><?= h($report['visits']) ?> visits · <?= h($report['returning']) ?> returning visits · <?= h(duration($report['seconds'])) ?> gameplay</p>
<details open><summary>Sessions</summary><div class="scroll"><table><thead><tr><th>Started (UTC)</th><th>Player</th><th>Visitor</th><th>Country / city</th><th>Gameplay this day</th><th>Whole session</th><th>Last seen (UTC)</th></tr></thead><tbody>
<?php foreach (array_reverse($report['sessions']) as $session): ?>
<tr><td title="Session <?= h($session['id']) ?>"><?= h(gmdate('m-d H:i:s', $session['startedAt'])) ?><?= $session['continued'] ? ' (continued)' : '' ?></td><td class="<?= $session['returning'] ? 'returning' : '' ?>"><?= $session['returning'] ? 'Returning' : 'New' ?></td><td><code title="<?= h($session['visitorId']) ?>"><?= h(substr($session['visitorId'], 0, 8)) ?></code></td><td><?= h($session['location']['country']) ?> / <?= h($session['location']['city']) ?></td><td><?= h(duration($session['seconds'])) ?></td><td><?= h(duration($session['total'])) ?></td><td><?= h(gmdate('m-d H:i:s', $session['lastSeen'])) ?></td></tr>
<?php endforeach ?></tbody></table></div></details></section>
<?php endforeach ?>
<?php endif ?>
</main></body></html>

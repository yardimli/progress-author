# Gameplay statistics

`index.html` loads `js/stats.js`. It sends an initial visit and a cumulative heartbeat to `stats.php` every 15 seconds, plus a best-effort beacon when hidden or closed. Failed requests do not affect gameplay; the next heartbeat retries the cumulative totals. An abrupt crash can lose the last 15 seconds.

A random browser ID lives in localStorage and identifies returning browsers. Each tab has a JavaScript-generated visit ID, with visit data also in localStorage and a sessionStorage pointer to resume after reload. A visit expires after 30 minutes away, or 30 days maximum. Closing a tab and opening another starts a new visit. This is browser-based recognition, not a count of distinct people. Multiple actively playing tabs count separately.

Gameplay counts the game's unpaused, visible simulation time, in real seconds before acceleration. It excludes introduction screens, dialogs, retirement and background tabs. UTC daily buckets split overnight play correctly. Reports count visits on their start day and gameplay on its actual day. The default filter excludes entire sessions with less than 30 seconds of gameplay, including their contribution to totals.

## Storage and deployment

Requires PHP 8.1+ with sessions and outbound HTTP streams (`allow_url_fopen`) for optional geolocation. No database or scheduled job is needed. Serve the game through PHP-capable hosting; a static-only server cannot collect stats.

Set `AUTHOR_STATS_DIR` in the server environment, or edit `STATS_DATA_DIR` in `stats-config.php`, to a durable, PHP-writable absolute directory **outside the document root**. The default is an installation-specific directory in the OS temp folder; it works for local testing but can be cleaned by the OS. The directory is created automatically. It contains `stats.json` and `stats.lock`. Back up `stats.json`; concurrent access uses file locking and atomic replacement. This small implementation rewrites one JSON file per heartbeat and is intended for modest traffic.

Open `stat-admin.php` to sign in. Edit `STATS_ADMIN_USER` and `STATS_ADMIN_PASSWORD_HASH` in `stats-config.php`. These are PHP settings and are never rendered into HTML. Generate a new hash using `php -r "echo password_hash('YOUR-NEW-PASSWORD', PASSWORD_DEFAULT);"` (use shell-safe quoting). The initial generated password is supplied in the task response. Use HTTPS when deployed. Login expires after 30 minutes of inactivity; unsuccessful logins are limited to 20 per 15 minutes globally without recording an IP.

## Location and privacy

Only `REMOTE_ADDR` is used, in memory, for the server-side request to `http://ip-api.com/json/{address}?fields=status,country,city`. The location provider receives the IP. This application stores neither IP addresses nor IP hashes, user agents, or game saves. Web-server access logs are separate from this feature. Proxy headers are deliberately not trusted; deployments behind a proxy must configure their web server's trusted real-IP handling.

Private/local IPs, timeouts and rate limits produce `Unknown` location. Lookup happens once per new visit. A global budget of 40 lookups per minute and the provider's `X-Rl`/`X-Ttl` headers limit calls. The free endpoint uses HTTP and permits non-commercial use; see [ip-api documentation](https://ip-api.com/docs/api:json) for its limits and commercial/HTTPS options.

Stats are anonymous client-reported analytics, not tamper-proof accounting. Duplicate and reordered heartbeats use maximum cumulative values, and daily totals are bounded by elapsed session time. Clearing localStorage resets returning-player recognition. The JSON is retained until you remove or archive it.

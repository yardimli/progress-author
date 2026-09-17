# Updates and browser caching

Deploy `.htaccess` together with the game. Apache must enable `mod_headers` and allow `FileInfo` overrides. The rules apply to files in this directory and its subdirectories:

- HTML and PHP responses use `Cache-Control: no-store`.
- CSS, JavaScript, JSON, and image/font assets use `Cache-Control: no-cache, must-revalidate`. Browsers must check with the server before reusing them; unchanged files can return a small 304 response.
- The script loader already adds a fresh timestamp on every page load. All game-data requests now also use a fresh timestamp and Fetch's `cache: 'no-store'`, independently of saved game versions.
- Existing stylesheet and theme URLs were bumped once to bypass copies cached before this policy. Future edits do not require manual version bumps when these headers are honored.

This does not clear localStorage or alter game saves. A currently open game keeps its loaded code until the player reloads. If an older HTML page was cached before these headers existed, it may need one hard refresh. If a CDN caches the site, purge existing cached responses once and configure it to honor origin headers and query strings.

Nginx, IIS, static hosts and PHP's built-in development server do not apply Apache `.htaccess` rules. Configure equivalent response headers there. HTML meta tags cannot replace server cache headers. Verify the deployed page, stylesheet, script and JSON responses in the browser's Network panel.

References: [Apache mod_headers](https://httpd.apache.org/docs/2.4/mod/mod_headers.html), [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).

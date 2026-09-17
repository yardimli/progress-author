const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

test('admin can log back in after inactivity expiry and PHP session loss', async t => {
    if (spawnSync('php', ['-v']).status !== 0) return t.skip('PHP is required for the HTTP integration test');
    const root = path.resolve(__dirname, '..');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'author-auth-test-'));
    const probe = net.createServer();
    await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    const server = spawn('php', ['-d', `session.save_path=${temp}`, '-S', `127.0.0.1:${port}`, '-t', root], {
        env: { ...process.env, AUTHOR_STATS_DIR: path.join(temp, 'data') }, stdio: 'ignore'
    });
    t.after(async () => {
        if (server.exitCode === null) {
            const stopped = new Promise(resolve => server.once('exit', resolve));
            server.kill(); await stopped;
        }
        fs.rmSync(temp, { recursive: true, force: true });
    });
    const url = `http://127.0.0.1:${port}/stat-admin.php`;
    let cookie = '';
    async function request(options = {}) {
        const response = await fetch(url, { ...options, redirect: 'manual', headers: { Cookie: cookie, ...options.headers } });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) cookie = setCookie.split(';')[0];
        return { status: response.status, html: await response.text() };
    }
    let page;
    for (let i = 0; i < 50; i++) {
        try { page = await request(); break; } catch { await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    assert.ok(page, 'PHP server started');
    const csrf = html => html.match(/name="csrf" value="([^"]+)"/)[1];
    async function login(html) {
        const response = await request({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ csrf: csrf(html), username: 'admin', password: 'e575581670a5a44be9e1804c' }) });
        assert.equal(response.status, 302);
        const dashboard = await request();
        assert.match(dashboard.html, /Total gameplay/);
        assert.doesNotMatch(dashboard.html, /Admin login/);
        return dashboard;
    }
    page = await login(page.html);
    // Simulate 30 minutes away without sleeping or touching real admin sessions.
    const sessionId = cookie.split('=')[1];
    const expired = spawnSync('php', ['-d', `session.save_path=${temp}`, '-r',
        'session_id($argv[1]); session_start(); $_SESSION["lastActive"] = time() - 1801; session_write_close();', sessionId]);
    assert.equal(expired.status, 0, expired.stderr.toString());
    page = await request();
    assert.match(page.html, /Admin login/);
    page = await login(page.html);
    assert.match((await request()).html, /Total gameplay/, 'renewed login survives subsequent requests');
    // Lost server session: stale forms fail safely and provide a fresh login form.
    fs.unlinkSync(path.join(temp, 'sess_' + cookie.split('=')[1]));
    page = await request({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrf: csrf(page.html), username: 'admin', password: 'e575581670a5a44be9e1804c' }) });
    assert.equal(page.status, 403);
    await login(page.html);
});

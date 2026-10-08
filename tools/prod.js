/*
  prod.js — run the site under the headers Netlify actually serves.

  Every other suite here is served by a plain static server with no headers, so
  the Content-Security-Policy in `_headers` had never once been exercised. A CSP
  that blocks something the app needs fails only in production, and only for the
  people who already trust the site enough to use it.

  This parses `_headers` the way Netlify does, applies the matching rules, and
  then drives the app in Chrome while recording every CSP violation, failed
  request and console error. It also exercises the service worker, which needs
  a secure context — 127.0.0.1 counts as one.
*/
const fs = require('fs');
const path = require('path');
const http = require('http');
const { ROOT, chromePath, CHROME_ARGS, PAGES } = require('./lib');

/* ---- Netlify `_headers`: a path line, then indented "Key: value" lines. ---- */
function parseHeaders(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: {} };
      rules.push(current);
    } else if (current) {
      const i = raw.indexOf(':');
      if (i === -1) { current.malformed = (current.malformed || []).concat(raw.trim()); continue; }
      current.headers[raw.slice(0, i).trim().toLowerCase()] = raw.slice(i + 1).trim();
    }
  }
  return rules;
}
function matches(pattern, urlPath) {
  if (pattern === '/*') return true;
  if (pattern.endsWith('/*')) return urlPath.startsWith(pattern.slice(0, -1));
  return urlPath === pattern;
}

function serveWithHeaders(rules) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.json': 'application/json',
    '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const rel = urlPath.replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' };
    for (const r of rules) if (matches(r.pattern, urlPath)) Object.assign(headers, r.headers);
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () =>
    resolve({ server, url: 'http://127.0.0.1:' + server.address().port + '/index.html' })));
}

let failures = 0;
const report = (name, bad, show = 8) => {
  if (bad.length) failures++;
  console.log('  ' + name.padEnd(44) + (bad.length ? 'FAIL (' + bad.length + ')' : 'ok'));
  bad.slice(0, show).forEach(x => console.log('      ' + x));
};

(async () => {
  const text = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
  const rules = parseHeaders(text);

  console.log('Header file');
  report('every _headers line parses', rules.flatMap(r => (r.malformed || []).map(l => r.pattern + ': "' + l + '"')));
  const csp = (rules.find(r => r.pattern === '/*') || { headers: {} }).headers['content-security-policy'];
  report('a Content-Security-Policy is set', csp ? [] : ['no CSP on /*']);

  const exe = chromePath();
  if (!exe) { console.log('\nChrome not found; skipping the served checks.'); process.exit(failures ? 1 : 0); }
  const puppeteer = require('puppeteer-core');
  const { server, url } = await serveWithHeaders(rules);
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: CHROME_ARGS });
  const page = await browser.newPage();

  const violations = [], failed = [], consoleErrors = [];
  await page.evaluateOnNewDocument(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => {
      window.__cspViolations.push(e.violatedDirective + ' blocked ' + (e.blockedURI || '(inline)'));
    });
  });
  page.on('requestfailed', r => {
    const u = r.url();
    if (u.startsWith('http://127.0.0.1')) failed.push(r.failure().errorText + ' ' + u.replace(/^http:\/\/127\.0\.0\.1:\d+/, ''));
  });
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 150)); });

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate("startAsLearner('explorer');");
  for (const name of PAGES) { await page.evaluate(`showPage(${JSON.stringify(name)})`); await new Promise(r => setTimeout(r, 60)); }
  await page.evaluate("openMission('nk1');");
  await new Promise(r => setTimeout(r, 400));

  console.log('\nServed under production headers');
  violations.push(...await page.evaluate(() => window.__cspViolations || []));
  report('no CSP violations', [...new Set(violations)]);
  report('no failed same-origin requests', [...new Set(failed)]);
  report('no console errors', [...new Set(consoleErrors)]);

  /* The service worker is the whole offline story; it needs the CSP to allow it. */
  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'no serviceWorker API';
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      await new Promise(r => setTimeout(r, 1200));
      return reg.active || reg.installing || reg.waiting ? 'registered' : 'no worker';
    } catch (e) { return 'FAILED: ' + e.message; }
  });
  report('service worker registers under the CSP', sw === 'registered' ? [] : [sw]);

  /* The manifest must be fetchable and point at icons that exist. */
  const man = await page.evaluate(async () => {
    try {
      const r = await fetch('manifest.webmanifest');
      if (!r.ok) return ['manifest returned ' + r.status];
      const m = await r.json();
      const bad = [];
      for (const i of m.icons || []) {
        const ir = await fetch(i.src, { method: 'GET' });
        if (!ir.ok) bad.push('icon missing: ' + i.src);
      }
      if (!m.start_url) bad.push('no start_url');
      if (!m.name) bad.push('no name');
      return bad;
    } catch (e) { return ['manifest fetch failed: ' + e.message]; }
  });
  report('manifest and its icons load', man);

  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} failed` : '\n0 failed');
  process.exit(failures ? 1 : 0);
})();

/*
  Shared helpers for the test suites.

  Two harnesses are used deliberately:
    • jsdom      — fast, no browser needed, good for "does every page render".
    • real Chrome — the only thing that catches layout bugs. Several bugs in this
      project (a stray </div> leaking content between lesson steps, text scaling
      that widened the page past the phone viewport) parsed perfectly and were
      invisible to jsdom. If a check is about size or position, it belongs in a
      real browser.
*/
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');

/* Script tags, in load order. Kept in sync with index.html by inlineHtml(). */
function scriptSrcs(html) {
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}

/* Build a single self-contained page so jsdom can run the app without a server. */
function inlineHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const src of scriptSrcs(html)) {
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) throw new Error('index.html references a missing script: ' + src);
    html = html.replace(`<script src="${src}"></script>`,
      '<script>' + fs.readFileSync(file, 'utf8') + '</script>');
  }
  return html;
}

/* A throwaway static server so the browser tools are one command to run. */
function serve(port = 0) {
  const types = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.json': 'application/json',
    '.webmanifest': 'application/manifest+json', '.txt': 'text/plain'
  };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () =>
      resolve({ server, url: 'http://127.0.0.1:' + server.address().port + '/index.html' }));
  });
}

/* Chrome, wherever this machine keeps it. */
function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/opt/google/chrome/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  return candidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
}

const CHROME_ARGS = [
  '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars',
  '--disable-background-networking', '--disable-component-update', '--no-first-run',
  '--disable-sync', '--disable-features=Translate,OptimizationHints,AutofillServerCommunication'
];

/* Every page the app can show, by its section id. */
const PAGES = ['home', 'path', 'learn', 'labs', 'library', 'skills', 'review', 'portfolio',
  'parent', 'summary', 'settings', 'feedback', 'coach', 'diagnostic', 'assessment', 'session'];

module.exports = { ROOT, inlineHtml, serve, chromePath, CHROME_ARGS, PAGES };

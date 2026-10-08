/*
  audit.js — the quality checks that are easy to regress and invisible in review.

  Each of these caught a real bug in this project:

  1. Asset completeness. The service worker lists what to cache for offline use.
     Add a script to index.html, forget sw.js, and the app silently stops working
     offline for everyone who already has it installed.
  2. Colour contrast, in both themes. Dark mode shipped with onboarding and the
     lesson stepper still on light backgrounds — pale text on pale panels.
  3. Form controls. A `.library-controls input` rule was stretching a checkbox
     to 116px, because the selector did not exclude checkboxes.
  4. Labels and duplicate ids, which break screen readers quietly.
  5. Register. Pages a child reads alone should not be written in the project's
     internal vocabulary ("corroborating evidence", "cross-context retrieval").

  Semi-transparent backgrounds over gradients are skipped in the contrast pass:
  the computed colour is not what is actually painted, and reporting those was
  pure noise.
*/
const fs = require('fs');
const path = require('path');
const { ROOT, serve, chromePath, CHROME_ARGS } = require('./lib');

const JARGON = /\b(corroborat\w+|cross-context|low-stakes|remediation|provenance|evidenced|retrieval|falsif\w+|counterbalanc\w+|psychometr\w+)\b/gi;
const LEARNER_PAGES = ['home', 'path', 'labs', 'library', 'review', 'portfolio'];

let failures = 0;
function report(name, bad, show = 6) {
  const ok = bad.length === 0;
  if (!ok) failures++;
  console.log('  ' + name.padEnd(42) + (ok ? 'ok' : 'FAIL (' + bad.length + ')'));
  bad.slice(0, show).forEach(x => console.log('      ' + x));
}

/* ---- 1. Static check: does the service worker cache everything the page loads? ---- */
function assetCheck() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const refs = [
    ...[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]),
    ...[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]).filter(h => !h.startsWith('http'))
  ];
  const missing = refs.filter(f => !sw.includes(f));
  report('service worker caches every asset', missing.map(f => f + ' is loaded by index.html but not in sw.js'));

  const onDisk = refs.filter(f => !fs.existsSync(path.join(ROOT, f)));
  report('every referenced file exists', onDisk);
}

(async () => {
  console.log('Static checks');
  assetCheck();

  const exe = chromePath();
  if (!exe) { console.log('\nChrome not found; skipping the rendered checks.'); process.exit(failures ? 1 : 0); }
  const puppeteer = require('puppeteer-core');
  const { server, url } = await serve();
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: CHROME_ARGS });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' });

  /* ---- 2. Contrast, both themes ---- */
  console.log('\nContrast (WCAG AA large-text floor, 3.0:1)');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(`startAsLearner('explorer'); state.prefs.theme=${JSON.stringify(theme)}; save(); applyPrefs();`);
    const bad = await page.evaluate((pages) => {
      const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const n = m[1].split(',').map(parseFloat); return (n.length > 3 && n[3] < 0.95) ? null : n.slice(0, 3); };
      /* Walk up for a painted background; bail out if anything on the way is
         translucent or has a background image, because the computed colour
         then is not what the eye sees. */
      const bgOf = el => {
        let e = el;
        while (e) {
          const cs = getComputedStyle(e);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
          const c = parse(cs.backgroundColor);
          if (c) return c;
          if (/rgba\(/.test(cs.backgroundColor) && !/, *0\)$/.test(cs.backgroundColor)) return null;
          e = e.parentElement;
        }
        return [255, 255, 255];
      };
      const out = [], seen = new Set();
      for (const name of pages) {
        showPage(name);
        for (const el of document.querySelectorAll('#mainContent *')) {
          if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
          const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
          if (txt.replace(/[^\p{L}\p{N}]/gu, '').length < 2) continue;   // skip emoji-only
          const cs = getComputedStyle(el);
          const fg = parse(cs.color); if (!fg) continue;
          const bg = bgOf(el); if (!bg) continue;
          const L1 = lum(fg), L2 = lum(bg);
          const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          if (ratio < 3.0) {
            const key = el.className + '|' + txt.slice(0, 18);
            if (seen.has(key)) continue; seen.add(key);
            out.push(name + ' · ' + ratio.toFixed(2) + ':1 · ' + el.tagName + '.' + (el.className || '').toString().slice(0, 28) + ' :: "' + txt.slice(0, 32) + '"');
          }
        }
      }
      return out;
    }, LEARNER_PAGES);
    report(theme + ' theme', bad);
  }

  /* ---- 3 & 4. Controls, labels, ids ---- */
  console.log('\nControls and labels');
  await page.evaluate("state.prefs.theme='light'; save(); applyPrefs();");
  const ctl = await page.evaluate((pages) => {
    const out = { stretched: [], unlabelled: [], dupes: [] };
    for (const name of pages.concat(['settings', 'learn'])) {
      showPage(name);
      const seen = {};
      for (const e of document.querySelectorAll('[id]')) {
        seen[e.id] = (seen[e.id] || 0) + 1;
        if (seen[e.id] === 2) out.dupes.push(name + ': #' + e.id);
      }
      for (const e of document.querySelectorAll('input,select,textarea')) {
        if (!e.offsetParent) continue;
        const r = e.getBoundingClientRect();
        if ((e.type === 'checkbox' || e.type === 'radio') && r.width > 40)
          out.stretched.push(name + ': ' + (e.id || e.type) + ' is ' + Math.round(r.width) + 'px wide');
        const labelled = e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label');
        if (!labelled) out.unlabelled.push(name + ': ' + (e.id || e.type));
      }
    }
    return out;
  }, LEARNER_PAGES);
  report('checkboxes are not stretched', ctl.stretched);
  report('every control has a label', ctl.unlabelled);
  report('no duplicate element ids', ctl.dupes);

  /* ---- 5. Register on pages a child reads alone ---- */
  console.log('\nLearner-facing language');
  const jargon = await page.evaluate((pages, src) => {
    const re = new RegExp(src, 'gi');
    const out = [];
    for (const name of pages) {
      showPage(name);
      const txt = document.getElementById(name + 'Body').innerText;
      const hits = [...new Set((txt.match(re) || []).map(x => x.toLowerCase()))];
      if (hits.length) out.push(name + ': ' + hits.join(', '));
    }
    return out;
  }, LEARNER_PAGES, JARGON.source);
  report('no internal vocabulary in learner view', jargon);

  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} failed` : '\n0 failed');
  process.exit(failures ? 1 : 0);
})();

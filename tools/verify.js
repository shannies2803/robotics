/*
  verify.js — structural audits that only a real browser can perform.

  1. Lesson-step containment. The explorer lesson is six steps, only one visible
     at a time. A single stray </div> in a template once closed the step wrapper
     early, so the tail of step 4 rendered on every step of every mission with
     deep content — about 1,200px of the wrong screen, permanently visible. The
     markup parsed fine, so nothing but measuring caught it. This check exists so
     that class of bug cannot come back quietly.
  2. Every mission opens and renders substantially.
  3. Tap targets are big enough for a child's finger.
*/
const { serve, chromePath, CHROME_ARGS } = require('./lib');

const MIN_TAP = 36;   // px; below this is hard for a 7-year-old to hit reliably

(async () => {
  const exe = chromePath();
  if (!exe) { console.log('Chrome not found. Set CHROME_PATH to run this suite.'); process.exit(0); }
  const puppeteer = require('puppeteer-core');
  const { server, url } = await serve();
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: CHROME_ARGS });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 140)); });
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate("startAsLearner('explorer');");
  let failures = 0;

  /* 1. Step containment across every explorer mission. */
  const ids = await page.evaluate(() => LESSONS.filter(m => m.level === 'explorer').map(m => m.id));
  const leaks = [];
  for (const id of ids) {
    const r = await page.evaluate((id) => {
      openMission(id);
      const shell = document.querySelector('.lesson-shell');
      if (!shell) return { id, bad: 'no shell' };
      const steps = [...shell.querySelectorAll('.explorer-step')];
      if (!steps.length) return null;
      const visible = steps.filter(s => getComputedStyle(s).display !== 'none').length;
      let leaked = 0, n = steps[steps.length - 1].nextElementSibling;
      while (n) { leaked += Math.round(n.getBoundingClientRect().height); n = n.nextElementSibling; }
      return { id, visible, leaked };
    }, id);
    if (r && (r.visible !== 1 || r.leaked > 0)) leaks.push(JSON.stringify(r));
  }
  console.log('  ' + `step containment (${ids.length} missions)`.padEnd(40) + (leaks.length ? 'FAIL' : 'ok'));
  leaks.slice(0, 5).forEach(x => console.log('      ' + x));
  if (leaks.length) failures++;

  /* 2. Every mission renders. */
  const thin = await page.evaluate(() => {
    const out = [];
    for (const m of LESSONS) {
      try { openMission(m.id); if (document.getElementById('lessonBody').innerHTML.length < 500) out.push(m.id); }
      catch (e) { out.push(m.id + ':THREW'); }
    }
    return out;
  });
  console.log('  ' + 'every mission renders'.padEnd(40) + (thin.length ? 'FAIL ' + thin.slice(0, 5).join(',') : 'ok'));
  if (thin.length) failures++;

  /* 3. Tap targets. */
  const small = await page.evaluate((MIN) => {
    const bad = [];
    for (const name of ['path', 'home', 'labs', 'library', 'review']) {
      showPage(name);
      for (const e of document.querySelectorAll('#mainContent button, #mainContent a')) {
        const r = e.getBoundingClientRect();
        if (r.height > 0 && r.height < MIN) bad.push(name + ': "' + (e.textContent || '').trim().slice(0, 24) + '" ' + Math.round(r.height) + 'px');
      }
    }
    return bad;
  }, MIN_TAP);
  console.log('  ' + `tap targets >= ${MIN_TAP}px`.padEnd(40) + (small.length ? 'FAIL' : 'ok'));
  small.slice(0, 6).forEach(x => console.log('      ' + x));
  if (small.length) failures++;

  console.log('  ' + 'runtime errors'.padEnd(40) + (errs.length ? 'FAIL ' + errs.length : 'ok'));
  errs.slice(0, 5).forEach(e => console.log('      ' + e));
  if (errs.length) failures++;

  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} failed` : '\n0 failed');
  process.exit(failures ? 1 : 0);
})();

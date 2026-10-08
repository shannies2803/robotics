/*
  shot.js — screenshots of the screens a child actually sees.

  Writes PNGs to tools/shots/ (git-ignored). Looking at these is the only way to
  judge whether the site is appealing as well as correct; every automated check
  in this folder can pass on a page that looks wrong.

  Usage: node shot.js            all shots
         node shot.js lesson     just the ones whose name contains "lesson"
*/
const fs = require('fs');
const path = require('path');
const { serve, chromePath, CHROME_ARGS } = require('./lib');

const OUT = path.join(__dirname, 'shots');

/* Each shot hides the toast, which otherwise covers content in a capture. */
const SHOTS = [
  { name: 'welcome-phone',  w: 390, h: 844, mobile: true, full: true, setup: '' },
  { name: 'path-phone',     w: 390, h: 900, mobile: true, setup: "startAsLearner('explorer'); showPage('path');" },
  { name: 'path-full',      w: 390, h: 844, mobile: true, full: true, setup: "startAsLearner('explorer'); showPage('path');" },
  { name: 'lesson-phone',   w: 390, h: 900, mobile: true, setup: "startAsLearner('explorer'); openMission('nk1');" },
  { name: 'lesson-full',    w: 390, h: 844, mobile: true, full: true, setup: "startAsLearner('explorer'); openMission('nk1');" },
  { name: 'library-phone',  w: 390, h: 900, mobile: true, setup: "startAsLearner('explorer'); showPage('library');" },
  { name: 'labs-phone',     w: 390, h: 900, mobile: true, setup: "startAsLearner('explorer'); showPage('labs');" },
  { name: 'reading-panel',  w: 390, h: 700, mobile: true, setup: "startAsLearner('explorer'); state.prefs.textSize='xlarge'; applyPrefs(); showPage('path'); toggleReadingPanel(true);" },
  { name: 'home-desktop',   w: 1200, h: 900, full: true, setup: "startAsLearner('explorer'); showPage('home');" },
  { name: 'summary-print',  w: 1200, h: 900, full: true, setup: "startAsLearner('explorer'); state.prefs.viewMode='adult'; save(); showPage('summary');" },
  { name: 'dark-path',      w: 390, h: 900, mobile: true, setup: "startAsLearner('explorer'); state.prefs.theme='dark'; save(); applyPrefs(); showPage('path');" },
  { name: 'dark-lesson',    w: 390, h: 900, mobile: true, setup: "startAsLearner('explorer'); state.prefs.theme='dark'; save(); applyPrefs(); openMission('nk1');" }
];

(async () => {
  const exe = chromePath();
  if (!exe) { console.log('Chrome not found. Set CHROME_PATH to run this suite.'); process.exit(0); }
  const puppeteer = require('puppeteer-core');
  const filter = process.argv[2];
  const jobs = filter ? SHOTS.filter(s => s.name.includes(filter)) : SHOTS;
  if (!jobs.length) { console.log('No shots match ' + filter); process.exit(0); }

  fs.mkdirSync(OUT, { recursive: true });
  const { server, url } = await serve();
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: CHROME_ARGS });
  const errs = [];

  /*
    One page, reused. Opening a fresh tab per shot exhausts the browser's
    resources part-way through a full run on a small machine.
  */
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(e.message));

  for (const job of jobs) {
    await page.setViewport({ width: job.w, height: job.h, isMobile: !!job.mobile, hasTouch: !!job.mobile });
    await page.goto(url, { waitUntil: 'networkidle0' });
    if (job.setup) await page.evaluate(job.setup);
    await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.classList.remove('show'); });
    await new Promise(r => setTimeout(r, 350));
    await page.screenshot({ path: path.join(OUT, job.name + '.png'), fullPage: !!job.full });
    console.log('  wrote shots/' + job.name + '.png');
  }
  await page.close();

  await browser.close();
  server.close();
  if (errs.length) { console.log('\npage errors:'); errs.forEach(e => console.log('  ' + e)); }
  console.log(errs.length ? `\n${errs.length} failed` : '\n0 failed');
})();

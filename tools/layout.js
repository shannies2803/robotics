/*
  layout.js — the page never scrolls sideways.

  Horizontal overflow is the bug this project kept shipping: a child on a phone
  gets a page that slides left and right under their thumb. It is invisible to
  jsdom and to a desktop browser window, so it is checked here in real Chrome at
  phone, tablet and desktop widths, at all three text sizes.

  Note on method: innerWidth is compared against the device width as well as
  scrollWidth, because a page can expand the layout viewport itself — an earlier
  zoom-based text scale did exactly that, and a scrollWidth-only check passed.
*/
const { serve, chromePath, CHROME_ARGS, PAGES } = require('./lib');

const SIZES = [
  [390, 844, 'phone 390'],
  [360, 800, 'phone 360'],
  [768, 1024, 'tablet 768'],
  [1200, 900, 'desktop 1200']
];
const TEXT = ['normal', 'large', 'xlarge'];

(async () => {
  const exe = chromePath();
  if (!exe) { console.log('Chrome not found. Set CHROME_PATH to run this suite.'); process.exit(0); }
  const puppeteer = require('puppeteer-core');
  const { server, url } = await serve();
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: CHROME_ARGS });
  let failures = 0;

  for (const [w, h, label] of SIZES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile: w < 700, hasTouch: w < 700 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate("startAsLearner('explorer');");
    for (const size of TEXT) {
      await page.evaluate(`state.prefs.textSize=${JSON.stringify(size)};save();applyPrefs();`);
      const bad = [];
      for (const name of PAGES) {
        await page.evaluate(`showPage(${JSON.stringify(name)})`);
        await new Promise(r => setTimeout(r, 90));
        const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        if (o.sw > o.iw + 1 || o.iw > w + 1) bad.push(`${name}(doc ${o.sw}/vp ${o.iw})`);
      }
      if (bad.length) failures++;
      console.log('  ' + `${label} · ${size}`.padEnd(28) + (bad.length ? 'OVERFLOW ' + bad.join(' ') : 'ok'));
    }
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} failed` : '\n0 failed');
  process.exit(failures ? 1 : 0);
})();

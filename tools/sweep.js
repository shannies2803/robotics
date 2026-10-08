/*
  sweep.js — every page renders, in every configuration the app supports.

  Runs in jsdom, so it needs no browser. This catches thrown exceptions and
  pages that come back empty; it cannot see layout. Use layout.js for that.
*/
const { JSDOM } = require('jsdom');
const { inlineHtml, PAGES } = require('./lib');

const dom = new JSDOM(inlineHtml(), { runScripts: 'dangerously', url: 'https://inventorlab.test/', pretendToBeVisual: true });
const w = dom.window;
const errs = [];
w.addEventListener('error', e => errs.push(e.error ? e.error.stack : e.message));
w.confirm = () => true;

let failures = 0;

function sweep(label) {
  const bad = [];
  for (const p of PAGES) {
    try {
      w.eval(`showPage(${JSON.stringify(p)})`);
      const el = w.document.getElementById(p + 'Body');
      if (!el || el.innerHTML.length < 200) bad.push(p + ' (empty)');
    } catch (e) { bad.push(p + ' THREW ' + e.message.slice(0, 60)); }
  }
  if (bad.length) failures++;
  console.log('  ' + label.padEnd(32) + (bad.length ? 'FAIL ' + bad.join(', ') : 'ok'));
}

console.log('Page rendering across configurations');
w.eval("startAsLearner('explorer')");               sweep('explorer / browser-only');
w.eval('state.prefs.viewMode="adult";save()');      sweep('explorer / grown-up view');
w.eval("startAsLearner('engineer')");               sweep('engineer / browser-only');
w.eval('toggleNoKitPath(false)');                   sweep('engineer / full path');
w.eval('addLearner("Test Learner","Explorer")');    sweep('three learners');
w.eval('state.prefs.textSize="xlarge";state.prefs.fontStyle="readable";state.prefs.motion="off";save()');
                                                    sweep('all reading settings on');
w.eval('state.equipment=["Web browser","Dash","micro:bit"];save()'); sweep('with hardware selected');

/* Every mission must open and render something substantial. */
const thin = w.eval(`(function(){
  const out=[];
  for(const m of LESSONS){
    try{ openMission(m.id); if(document.getElementById('lessonBody').innerHTML.length<500) out.push(m.id); }
    catch(e){ out.push(m.id+':THREW'); }
  }
  return out;
})()`);
console.log('\nMissions');
console.log('  ' + 'all missions render'.padEnd(32) + (thin.length ? 'FAIL ' + thin.slice(0, 6).join(', ') : `ok (${w.eval('LESSONS.length')} missions)`));
if (thin.length) failures++;

console.log('\nRuntime errors: ' + errs.length);
errs.slice(0, 5).forEach(e => console.log('  ' + e));
if (errs.length) failures++;

console.log(failures ? `\n${failures} failed` : '\n0 failed');
process.exit(failures ? 1 : 0);

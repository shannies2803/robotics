# InventorLab Academy — Public Beta RC9

No build step, no dependencies, no third-party requests. Drop the folder on Netlify.

---

## Live-site audit (8 Oct 2026)

Netlify is connected and the site is live at https://inventorlab.netlify.app.
Confirmed indirectly: the host answers, and what it answers with is this repo's
`robots.txt`. A non-existent Netlify subdomain returns 404 instead.

The audit found one real gap, and it was in the testing rather than the site.
Every suite here is served by a plain static server with no headers, so the
Content-Security-Policy in `_headers` had never been exercised even once. A CSP
that blocks something the app needs fails only in production, and only for the
people already using the site.

`tools/prod.js` now parses `_headers` the way Netlify does, serves under those
rules, and drives the app in Chrome while recording CSP violations, failed
requests, console errors, service-worker registration and the manifest. It
passes — no inline scripts or handlers anywhere, the worker registers under the
CSP, and every icon loads — but that is now a verified fact rather than an
assumption. It runs in CI.

Also checked: the outbound links a child depends on (Scratch, MakeCode,
Tinkercad, the Raspberry Pi editor) still resolve.

## Round 7 (RC8 → RC9) — on GitHub, and twenty improvements

The site now lives at github.com/shannies2803/robotics, with the test suites in
`tools/` and CI running them on every push.

**Dark mode.** Follows the device by default, with Light/Dark overrides beside the
other reading settings. Only the design tokens change; the stylesheet predates
theming and hardcodes white in about a hundred places, so the surfaces that must
flip are redirected to the tokens rather than rewritten.

**Contrast was measured, not eyeballed** — and the first pass was wrong. An audit
that skipped translucent backgrounds over gradients (which report a computed
colour that is not what is painted) found 82 further failures: the "best next
move" card, path rows, pills, the sampler, the lab promise. One of them failed
only because the learner-view rules use an id selector, so the dark override
silently lost on specificity. Both themes now pass at 3:1 throughout.

**Printing was broken everywhere except two pages.** The print stylesheet hid
every page and re-showed only `#chapter`, so a parent pressing Ctrl+P on the
Portfolio got a blank sheet. Any open page now prints, without the interface.

**An error boundary.** A thrown render left a child looking at a blank white
panel. Renders are wrapped: the screen says nothing is lost, offers a way back,
and folds the stack trace away for an adult. Verified by forcing a throw.

**Learner-facing language.** Labs, the library filters, Home, My Path, Review and
the Portfolio were written in the project's internal register — "low-stakes
evidence", "cross-context retrieval", "curated missions evidenced" — on pages a
child reads alone. Grown-up view keeps the precise wording. `audit.js` now fails
if that vocabulary reappears in learner view.

**Browse by interest.** Six chips over the existing 251 missions: make a game,
make something move, lights and sensors, apps and websites, no computer needed,
design and build. Every one returns a non-empty set.

**Smaller things that matter.** The site offers to install itself (it was always
installable and offline-capable; nothing ever said so). It remembers the page you
were on across a reload, reopening a mission only if unfinished work is saved
against it. It checks for a new version when the tab regains focus, not only on
load. `prefers-reduced-motion` is now respected automatically. Navigation is
hidden during onboarding, where none of it works. The mission word list folds
away, taking the first lesson screen from 2,844px to 2,662px.

**Two latent bugs.** A `.library-controls input` rule was stretching a checkbox to
116px. And a stray `}`, left when the zoom-based text scaling was replaced, sat in
the stylesheet where CSS error recovery hid it.

**`tools/audit.js`** makes this round's checks permanent: offline-asset
completeness, contrast in both themes, stretched controls, labels, duplicate ids,
and learner-facing language. CI also fails the build if site files change without
a `CACHE` bump in `sw.js`.

## Round 6 (RC7 → RC8) — the first round anyone actually looked at it

Chrome turned out to be installed in this environment after all. Every previous round was
verified by asserting against a headless DOM; this one was verified by rendering the real
page at four widths and three text sizes, and by reading screenshots. That found things no
amount of DOM assertion would have.

**A stray `</div>`, present since RC2, was leaking content onto every lesson step.**
`deepContentHTML` had one closing tag too many. Because `<details>` is not a `<div>`, the
browser's error recovery popped all the way out to the step wrapper and closed it — so the
tail of step 4 (challenge ladder, remember card, changed-context box, evidence note and a
second set of navigation buttons) rendered on *every* step of *every* explorer mission with
deep content, step 0 included. 1,226px of the wrong step, permanently visible. There is now
an automated containment check across all 107 explorer missions so this class of bug cannot
return silently.

**Text scaling was rebuilt.** The `zoom` approach from RC4 scaled layout as well as text, so
at "extra large" the usable width on a 390px phone fell to about 295px and the whole document
scrolled sideways — including the popovers, exactly the failure predicted but never seen.
Scaling now runs through a `--tscale` variable applied to 130 font sizes, so text grows and
reflows without touching layout width.

**Six genuine responsive bugs**, all the same root cause: CSS grid and flex items default to
`min-width:auto` and refuse to shrink below their widest unbreakable content. `.skill-group`,
`.skill-card-top`, `.strand-head`, `.concept-map`, `.freshness-row` and the summary tables
were each pushing the page sideways. **All 12 width × text-size combinations now measure
clean**, where 7 of 12 overflowed before.

**The phone screen gave a fifth of itself to navigation.** A 3-row sticky nav took 170px of
844px. Four columns in two rows, tighter padding, and non-sticky below 430px: now 134px, with
every destination still visible — hiding them behind a menu would just stop a child finding
them.

**The first lesson screen was four screens long.** The step that says "one job at a time"
opened with 554px of adult handoff instructions and a 135px autosave card before the child
reached the mission. The handoff is now collapsed for the learner and open in grown-up view,
the system diagram is collapsible, and the autosave card is one quiet line. Effective height
of step 0: **4,739px → 2,844px**.

**Focus rings only appear for keyboard users.** `showPage()` moves focus to the new heading
for screen readers, which with a plain `:focus` rule painted a large purple box around the
title on every ordinary mouse click. Verified with real mouse and keyboard events.

Also: the selected segmented-control option was white-on-pale-grey and is now solid accent;
the reading and learner popovers focus their heading rather than the first option, which had
made an unselected choice look selected.

## Round 5 (RC6 → RC7)

**The Engineer browser-only path goes from 8 missions to 16.** It was the last big gap: almost
entirely Python, and missing whole strands because they looked like they needed hardware. They
did not.

Tinkercad Circuits simulates the Arduino, the breadboard and the components — including burning
a part out when the wiring is wrong, which makes it a *better* first teacher than real hardware,
because destroying an LED costs nothing and proves the point. Tinkercad 3D is full browser CAD,
so designing and measuring a part needs no printer; only the final print does, and a library can
do that from the file.

Eight new hand-authored Studio missions (`nokit_engineer.js`), each with learning target,
success criteria, worked reasoning, symptom troubleshooter and concept check:

| | Mission | Tool | Teaches |
|---|---|---|---|
| nke5 | Breadboard Without a Board | Tinkercad Circuits | What the current-limiting resistor actually does — by removing it |
| nke6 | Read an Analog Sensor | Tinkercad Circuits | Measuring a sensor's real range instead of assuming 0–1023 |
| nke7 | Debounce a Button | Tinkercad Circuits | One press is not one event; measure before fixing |
| nke8 | Design a Part That Actually Fits | Tinkercad 3D | Tolerance follows from measurement confidence |
| nke9 | Structure Your Data | Python | A structure decides which mistakes are possible |
| nke10 | Make It Fail Safely | Python | Failing loudly is fine; failing quietly is dangerous |
| nke11 | Two Algorithms, Measured | Python | Benchmark, and count what the fast option requires |
| nke12 | Ship a Page Someone Can Use | Web | Keyboard, width, silent user test, labels |

Strand coverage on that path went from 7 to 11, now including Embedded Systems, Design &
Fabrication, Human-System Interfaces and Reliability.

**Gating checked in all four ownership combinations.** A learner who owns an Arduino sees
*equipment ready* and is pointed at the real board; a browser-only learner sees *free — runs in
the on-screen simulator*. Owning an Arduino does not wrongly mark the CAD mission ready, and
vice versa.

Totals: **251 missions, 55 hand-authored Studio**. All 251 mission pages render clean.

## Round 4 (RC5 → RC6)

**The practice bank now has actual tasks.** This was the biggest thing still wrong with the
build. 196 of the 243 missions were template-generated, and their briefs described a task
instead of setting one: *"Solve a new problem that requires sequencing, then explain your
approach."* There is no problem in that sentence. It works with an adult in the room to invent
one, and it is a dead end for a child alone — which is the entire audience of the
browser-only path.

`challenge_briefs.js` supplies a concrete, self-directable challenge for every one of them:
21 briefs keyed by concept, plus 15 keyed by concept keyword so *Coordinates*, *Radio*,
*Tolerance* and *CSS* get a fitting task rather than a generic prediction one. Each has real
numbers and a real thing to do — *"Make your project repeat the same action exactly five times.
Build it the long way first, run it and count. Then rebuild it with a loop and prove both
versions behave identically."* Matching is deterministic, so a mission's task never changes
between visits. All 196 resolve; verified by opening all 243 mission pages.

They are labelled **generated for this concept** wherever they appear, and the Studio badge now
reads *Practice • generated challenge*. Studio missions are untouched.

**Copy corrected in two places.** Home and the library previously told learners the practice
bank needed an adult to invent the challenge. That is no longer true, so both now say what is
actually different: practice missions have a real task but not the hand-written storyboard,
worked reasoning or troubleshooter, so they count for breadth rather than depth.

**Long missions are honestly paced.** 58 missions are listed at over 55 minutes, one at 180 —
not a sitting for a primary learner. Those now show how many sittings they really are, with a
note that stopping on purpose is not giving up and that drafts save automatically. The estimate
itself is left alone rather than quietly rewritten.

## Round 3 (RC4 → RC5)

**More than two learners.** The build shipped with exactly two hardcoded profiles, `faye` and
`philip`, baked into a `const`. There is now a roster in state: add, rename, remove, up to
twelve, each with their own path, evidence and reviews. Settings gained a learner manager, and
the top-bar chip opens a picker once there are more than two rather than blind-cycling through
everyone. `FAMILY` is kept as a compatibility view over the roster, so the two archetypes stay
the seed without being the ceiling.

**A backup bug that would have lost data.** `mergeState` looped over `['faye','philip']`, so
restoring a backup containing a third learner silently discarded them. It now takes the union
of both sides. Verified by round-tripping a four-learner backup.

**Restore no longer destroys silently.** Importing overwrote everything with no warning, so a
parent restoring onto a device that already had progress lost it without being asked. It now
reports what is in the backup and what is on the device, asks for confirmation, and refuses a
file from a newer schema it cannot read.

**Something actually asks you to back up.** The export button existed from day one, but nothing
ever prompted it — and everything lives in one browser's local storage with no account behind
it, so the realistic failure was always a cleared browser rather than a missing feature. A
notice appears once there are five or more rated attempts and no backup, or ten since the last
one, and backs off for two weeks when dismissed. Exports are now dated and carry a readable
header.

**The learner can browse missions.** The library was adult and Engineer-only. It is now open to
everyone, with learner-facing copy, and a *Only what I can start now* filter. A browser-only
learner sees 28 startable Studio missions — against effectively one in RC2.

**Mission covers.** Each card gets a generated cover: hue derived from the concept strand so
related missions look related, with the Studio star and a completion tick. Deterministic, no
image files, caches offline for free.

## Round 2 (RC3 → RC4)

**20 new hand-authored missions in total, and a browser-only curriculum that now covers
physical computing.** MakeCode ships a full micro:bit simulator — clickable A/B buttons, a
shake control, a light slider, a thermometer, and a second board that appears the moment you
use radio blocks. So six new missions (`nokit_microbit.js`) teach input/output, sensors and
conditionals, variables on a device, thresholds, data variation and radio communication with
no hardware whatsoever. Missions carrying `simulator: true` report *free — runs in the
on-screen simulator* rather than an equipment gap.

The browser-only Explorer path is now **19 missions**, and it is sequenced so each idea is met
in Scratch first and then again on a device — which is exactly the transfer evidence the
product already cares about. Engineer path: 8.

**Works offline, and installs.** `sw.js` plus a web manifest and generated icons. Navigations
are network-first so a stale `index.html` can never pin an old version to a device; scripts,
styles and icons are cache-first, so a mission opens instantly with no connection. An
offline notice explains what still works (everything except the buttons that open Scratch and
MakeCode), and a newer deploy prompts to reload rather than silently swapping underneath.

**Focus and screen-reader fixes.** Changing page only swapped a CSS class, leaving a keyboard
user focused on a nav button with no signal anything had happened. Focus now moves to the new
heading, the change is announced in a live region, and nav carries `aria-current`. Explorer
steps do the same, announcing "Step 3 of 6".

**Read-aloud a struggling reader can use.** It previously read the entire step including every
button label, with no way to stop it. It now reads only the instructional text, and the same
button stops it mid-sentence.

**Reading controls reachable by the learner.** The text-size, letter-style and motion controls
shipped in RC3 sat in Settings — which is adult-only, so a child who set the site up alone
could not get at them. They are now behind an **Aa** button in the top bar, on every page.

**Review page that teaches.** "Nothing due right now 🎉" congratulated the learner for an empty
list and explained nothing. It now distinguishes the three reasons a queue is empty, names the
next review and its date, and says why reviewing early is not extra credit.

**Answer keys out of the page source.** The correct index and explanation were in the markup as
`data-correct` / `data-explain`. They are now held in memory and looked up on click.

---

## Round 1 (RC2 → RC3)

1. **Repaired `<head>`.** A stray escape on line 6 ended `<head>` early, printing a literal
   `\n` at the top of every page and pushing `<title>`, the robots meta and the **stylesheet
   link** into `<body>` — the cause of the unstyled flash on load. Same bug in `robots.txt`
   made its `Disallow` line inert.
2. **No more blank white page.** `loadState()` touched `localStorage` unguarded at start-up, so
   opening from a downloaded file, a private window, or a browser with site data blocked killed
   the app silently. Storage now falls back to memory behind an honest banner.
3. **Free software is not hardware you own.** Scratch, App Inventor and Python run in a browser
   but the planner demanded a checkbox for each, so a new learner saw 14 of 15 missions flagged
   "equipment gap".
4. **Launch links.** Missions said "open Scratch" and never linked to it.
5. **A browser-only path**, switchable, and chosen automatically for a learner starting alone.
6. **A way in for the learner** — onboarding was parent-only and gated behind a parent checkbox.
7. **Reading controls that work** — the old toggle set one `font-size` on body while the
   stylesheet used `px` throughout.
8. **Getting unstuck without an adult** — the help panel used to end at "I still need a grown-up".
9. **A learning target on every mission** — only 27 of 223 had one; the rest are now derived and
   labelled *auto-generated*.
10. **A printable one-page summary** for a parent evening or a folder.

Plus 14 hand-authored missions, because the 196 "extended" missions are template-generated:
their briefs read *"Solve a new problem that requires sequencing"* with no problem given. They
work when an adult supplies the task and are unusable for a child alone. Also a design pass —
journey-style path, Inventor badges derived only from recorded evidence, and a celebration that
fires when real evidence lands.

---

## Worth knowing

- **CSP changed:** `connect-src` moved from `'none'` to `'self'`, because a service worker's
  own `fetch` is subject to the CSP served with it. Still same-origin only.
- **Bump `CACHE` in `sw.js` on every deploy.** It is `inventorlab-rc8-1` now. Forgetting this is
  the one way to ship an update users do not receive.
- `robots.txt` and the robots meta still say `noindex` — right for a beta, remove both when you
  want it findable.
- Learner keys are still `faye` / `philip` internally, so exactly two profiles exist. A class
  would need that generalised.
- Some template-bank missions run to 180 minutes, which is long for primary.
- **Untested visually.** Chrome could not be downloaded in the environment these changes were
  made in, so every page was verified by rendering and asserting in a headless DOM, not by
  eye. Logic, wiring and content are tested; the CSS is hand-reviewed only.

# InventorLab Academy

A site where primary-school children learn robotics, coding and engineering by
building things, testing them and explaining what happened — rather than
clicking through lessons. No account, no sign-in, no data leaves the device.

**Live at https://inventorlab.netlify.app** *(update this once Netlify is connected)*

It works with a robot kit, and it works just as well without one. A child with
nothing but a browser has a complete path of their own: Scratch, paper, and
simulators for the micro:bit, Arduino and 3D printing, so sensors, circuits and
CAD are not locked behind hardware the family may not own.

| | |
| --- | --- |
| Missions | 251 total — **55 hand-written Studio missions**, 196 practice missions |
| Browser-only paths | Explorer 19 missions · Engineer 16 missions |
| Tracks | Explorer (new to coding) · Engineer (has coded before) |
| Learners per device | Up to 12, each with their own path and evidence |

## How the learning works

The core loop is **Predict → Test → Notice → Explain**, and the site is built so
that a child can run it without an adult sitting next to them:

- **Every mission states what it is for.** A learning target, a ready condition,
  and three success criteria the learner ticks off from evidence they can show.
- **Mastery is evidence, not completion.** Recording "I can do this on my own"
  requires the process to be finished, the concept check passed, no adult help
  with the thinking, and at most one hint. *Transfer* additionally needs the
  idea used in a new context and explained.
- **Getting unstuck does not mean getting the answer.** The help button gives one
  concrete action for the exact step, then a ladder, then a worked example — and
  only then suggests asking a grown-up. Help with setup and safety is recorded
  separately from help with the thinking, because only one of those affects what
  the evidence means.
- **Spaced review.** A check is scheduled days after the mission that taught it,
  and it is deliberately not available early.
- **Badges come from recorded evidence only** — never from clicks or time spent.

## Who each part is for

| Audience | Where |
| --- | --- |
| The child | Home, My Path, Learn, Labs, Missions, Review, Portfolio |
| Parent or teacher | Grown-up view → Session, Parent, Summary, Settings |
| Printing for a parent evening | **Summary** → *Print or save as PDF* |

The **Aa** button in the top bar holds text size, an easier-to-read letter style,
a calm mode that stops all motion, and light/dark colours (following the device
by default). It is in the top bar rather than in
Settings on purpose: Settings is adult-only, so a child who set the site up
alone could not otherwise reach it.

## Deploying

Netlify is connected to this repository. Every push to `main` publishes
automatically. `netlify.toml` holds the settings — no build command, publish the
repository root.

**On every deploy, bump `CACHE` at the top of `sw.js`** (currently
`inventorlab-rc9-1`). The service worker serves the app offline, so without a
bump everyone who already has the site installed keeps the old version. CI now
fails the build if you forget.

## Editing

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies,
and no network calls at runtime beyond the links that open Scratch or MakeCode.
Edit the files and push.

| File | Holds |
| --- | --- |
| `index.html` | Page shell and script order |
| `app.js` | The whole application |
| `style.css` | All styling |
| `data.js` | The 223 original missions |
| `nokit_missions.js` · `nokit_microbit.js` · `nokit_engineer.js` | Hand-written missions for learners with no kit |
| `challenge_briefs.js` | Concrete tasks for the template-generated practice missions |
| `studio_blueprints.js` · `deep_content.js` | Learning targets, worked reasoning, troubleshooters |
| `toolkit.js` | Which platforms are browser-only, and where to open each one |
| `sw.js` · `manifest.webmanifest` | Offline support and installability |
| `_headers` | Security headers, including the CSP the site is tested against |

Two conventions worth keeping:

- **Text sizing goes through `--tscale`**, never `zoom`. `zoom` scales layout as
  well as text, which pushed the page wider than a phone screen.
- **Grid and flex children need `min-width: 0`.** The default is `auto`, which
  refuses to shrink below the widest unbreakable content and silently makes the
  whole page scroll sideways.

## Checks

`tools/` holds the test suites. They are not part of the site and are not needed
to deploy it.

```bash
cd tools
npm install            # jsdom; puppeteer-core is optional but needed for the browser suites

node sweep.js          # every page renders, in every configuration (jsdom, no browser)
node layout.js         # no sideways scrolling, 4 widths × 3 text sizes (real Chrome)
node verify.js         # lesson-step containment, mission rendering, tap targets (real Chrome)
node audit.js          # contrast in both themes, labels, offline assets, language (real Chrome)
node shot.js           # screenshots into tools/shots/ (real Chrome)
```

Every suite should finish with `0 failed`. They also run in GitHub Actions on
every push, along with a guard that fails the build if site files changed but
the `CACHE` name in `sw.js` did not — the one deploy mistake that silently
leaves installed copies on the old version.

The browser suites look for Chrome in the usual places; set `CHROME_PATH` if it
lives somewhere else. They skip cleanly rather than failing when Chrome is
absent, so `sweep.js` alone still works anywhere Node runs.

**Why two harnesses.** `sweep.js` uses jsdom and is fast, but it cannot see
layout. Two of the worst bugs this site has had — a stray `</div>` that leaked
one lesson step's content onto every other step, and a text-scaling approach
that made the page scroll sideways on a phone — both parsed perfectly and were
invisible until something measured the rendered page. If a check is about size
or position, it belongs in `layout.js` or `verify.js`.

And none of them can tell you whether the site looks appealing to a seven-year-old.
That is what `shot.js` is for: look at the pictures.

## Status

Public beta. `robots.txt` and the robots meta both say `noindex` — deliberate
while it is being tested; remove both when it should be findable.

`CHANGES.md` records what changed in each round and why.

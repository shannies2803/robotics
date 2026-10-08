/*
  toolkit.js — what a learner can actually open, and what they can do with no kit at all.

  Three separate ideas, deliberately kept apart:
    1. SOFTWARE      free things that open in a browser. Nothing to buy, nothing to own.
    2. LAUNCH        the real place to click, plus the first thing to do when it opens.
    3. NO_KIT_PATHS  a complete, ordered Studio path for a learner whose only equipment
                     is a browser — so "no robot yet" never means "one mission then stop".
*/

/* Platforms that need only a browser. These must never be reported as an "equipment gap". */
window.INVENTORLAB_SOFTWARE = ['Scratch', 'MIT App Inventor', 'Python', 'Web browser'];

/* Hardware that ships with a browser-based simulator good enough for real reasoning work. */
window.INVENTORLAB_SIMULATED = {
  'micro:bit': 'MakeCode has a micro:bit simulator built in. You can write, run and debug the whole program on screen; only the final "does it survive the real world" test needs the board.',
  'Arduino': 'Tinkercad Circuits simulates the board, the breadboard and the components. Wiring mistakes show up on screen instead of as a burnt part.',
  '3D Printing': 'Tinkercad lets you design and measure the part in the browser. Only the printing step needs a printer — a library or makerspace can print the file.'
};

window.INVENTORLAB_LAUNCH = {
  'Scratch': {
    url: 'https://scratch.mit.edu/projects/editor/',
    label: 'Open Scratch',
    free: 'Free. No account needed to build — you only need one to save online.',
    first: 'Drag a "when green flag clicked" block into the code area first. Nothing runs without a starting event.'
  },
  'micro:bit': {
    url: 'https://makecode.microbit.org/',
    label: 'Open MakeCode',
    free: 'Free. Works without a micro:bit thanks to the on-screen simulator.',
    first: 'Watch the simulator on the left. Test there first, then download to the board if you have one.'
  },
  'MIT App Inventor': {
    url: 'https://appinventor.mit.edu/',
    label: 'Open App Inventor',
    free: 'Free. Needs a Google account, plus a phone or the built-in emulator to test.',
    first: 'Build the screen in Designer first, then switch to Blocks. Name every component before you code it.'
  },
  'Python': {
    url: 'https://editor.raspberrypi.org/',
    label: 'Open the Raspberry Pi code editor',
    free: 'Free, runs in the browser, no install. (Thonny is a good offline alternative.)',
    first: 'Run one line — print("hi") — before writing anything longer. Read the first error, not the last.'
  },
  'HTML/CSS/JavaScript': {
    url: 'https://editor.raspberrypi.org/',
    label: 'Open the Raspberry Pi code editor',
    free: 'Free, runs in the browser, no install.',
    first: 'Get one visible heading on the page before adding styles or scripts.'
  },
  'Arduino': {
    url: 'https://www.tinkercad.com/circuits',
    label: 'Open Tinkercad Circuits',
    free: 'Free simulator. Test the circuit on screen before touching real wires.',
    first: 'Build and run the circuit in the simulator first. A short circuit there costs nothing.'
  },
  '3D Printing': {
    url: 'https://www.tinkercad.com/',
    label: 'Open Tinkercad',
    free: 'Free browser CAD. Designing and measuring needs no printer.',
    first: 'Measure the real object and write the numbers down before you start the model.'
  },
  'SPIKE Prime': {
    url: 'https://spike.legoeducation.com/',
    label: 'Open SPIKE app',
    free: 'Free software. The hub and motors are the part you have to own.',
    first: 'Note which port each motor and sensor is plugged into, then match the code to it.'
  },
  'LEGO WeDo': {
    url: 'https://education.lego.com/en-us/downloads/',
    label: 'Get the WeDo software',
    free: 'Free software download. The hub, motor and sensor are the part you have to own.',
    first: 'Check the hub is powered and connected before blaming the code.'
  },
  'Dash': {
    url: 'https://www.makewonder.com/apps/',
    label: 'Get the Wonder / Blockly app',
    free: 'Free apps. Dash itself is the part you have to own.',
    first: 'Put Dash on the same start marker facing the same way before every test.'
  }
};

/*
  Browser-only Studio paths.
  Ordered by concept, not by tool: instructions -> sequence -> pattern -> debugging ->
  events -> loops -> conditionals -> variables -> transfer.
  ★ marks a hand-authored Studio mission; the rest come from the practice bank.
*/
window.INVENTORLAB_NO_KIT_PATHS = {
  Explorer: [
    'ct2',        // ★ Human Robot — precise instructions
    'ctdeep01',   // Sequence Detective
    'ctdeep03',   // Pattern Hunter
    'ctdeep05',   // Bug Detective
    'v4-2-0',     // Scratch: Sequencing Lab
    'v4-2-1',     // Scratch: Events Lab
    's1',         // ★ Catch Me If You Can
    'v4-2-2',     // Scratch: Loops Lab
    'v4-2-3',     // Scratch: Conditionals Lab
    'v4-2-4',     // Scratch: Variables Lab
    's2',         // ★ Scratch Scorekeeper
    'v4-2-6',     // Scratch: Debugging Lab
    'ctdeep08'    // Computational Thinking Boss — transfer
  ],
  Engineer: [
    'e8',         // ★ Robot Simulator (Scratch)
    'v4-6-0',     // Python: Sequencing Lab
    'v4-6-2',     // Python: Loops Lab
    'v4-6-3',     // Python: Conditionals Lab
    'v4-6-4',     // Python: Variables Lab
    'e4',         // ★ Blocks → Python
    'v4-6-5',     // Python: Functions Lab
    'v4-6-6',     // Python: Debugging Lab
    'pydeep09',   // Analyse Sensor Data
    'e10',        // ★ Build a Mission Website
    'i1'          // ★ Inventor Capstone: Smart Room
  ]
};

/*
  nokit_missions.js — hand-authored missions for learners with no robot kit.

  Why this file exists: the practice bank (196 of the original 223 missions) is
  template-generated. Its briefs read "Solve a new problem that requires sequencing" —
  which only works if an adult invents the problem. A child working alone gets nothing
  to do. These missions give the actual task, the actual numbers, and the actual thing
  to look at, so the browser-only path can be walked without a teacher standing over it.

  Each mission ships the full Studio package: learning target, success criteria,
  worked reasoning, a symptom-based troubleshooter, a picture storyboard and a
  concept check. That is what earns the ★ Studio badge.
*/
(function () {
  const L = window.INVENTORLAB_LESSONS = window.INVENTORLAB_LESSONS || [];
  const DEEP = window.INVENTORLAB_DEEP = window.INVENTORLAB_DEEP || {};
  const BP = window.INVENTORLAB_STUDIO_BLUEPRINTS = window.INVENTORLAB_STUDIO_BLUEPRINTS || {};
  const VIS = window.INVENTORLAB_EXTRA_VISUALS = {};
  const CHK = window.INVENTORLAB_EXTRA_CHECKS = {};
  const SKILLS = window.INVENTORLAB_EXTRA_SKILLS = {};
  const PRE = window.INVENTORLAB_EXTRA_PREREQS = {};

  function add(m, bp, deep, vis, chk, skills, pre) {
    L.push(m); BP[m.id] = bp; DEEP[m.id] = deep;
    if (vis) VIS[m.id] = vis;
    if (chk) CHK[m.id] = chk;
    SKILLS[m.id] = skills; PRE[m.id] = pre;
  }

  /* ========================= EXPLORER — browser only ========================= */

  add(
    { id:'nk1', level:'explorer', icon:'🐱', title:'Cat Takes Four Steps', tool:'Scratch',
      concept:'Sequencing + prediction', mins:15, quality:'studio',
      goal:'Move the Scratch cat onto a target using exactly four blocks, and know where it will stop before you press anything',
      setup:'Open Scratch and start a new project. Click the sprite button (bottom right) and add the Apple. Drag the apple to the right-hand side of the stage. Leave the cat where it is.',
      challenge:'Using only “move ___ steps” and “turn ___ degrees” blocks — exactly four of them, no more — make the cat finish touching the apple. Before you click anything, put a finger on the screen where you think the cat will stop.',
      predict:'Put a finger on the stage where the cat will stop. Say out loud how many steps you think it needs altogether.',
      hints:[
        'The stage is 480 steps wide, and the cat starts in the middle. So the middle to the right edge is about 240 steps.',
        'Click a single “move 10 steps” block on its own and watch. Now you know what one block does — the rest is counting.',
        'If the cat goes too far, change only the number inside a move block. Do not add a fifth block and do not touch the turns.'
      ],
      check:'Drag the apple somewhere completely different. Before you change any block, say which number you are going to change and why.',
      extend:'Do the same job in three blocks instead of four.',
      coach:'Do not tell them 240. Ask “how far did one block move it?” and let them do the multiplying. If they add a fifth block, point at the rule, not the answer.' },
    { strand:'Computational Foundations',
      objective:'I can predict where a sequence of movement blocks will finish before I run it.',
      ready:'Scratch is open with a cat and an apple on the stage.',
      success:[
        'I said where the cat would stop before the first run, and I can say how close I was.',
        'The cat finishes touching the apple using exactly four blocks.',
        'I can say what one “move 10 steps” block does on its own.'
      ],
      evidence:'The learner points at the finishing spot before running, then explains the gap between the guess and the result.',
      stretch:'Predict the finish for a four-block sequence you have never run, and be within one block-length.',
      adult:'The prediction is the lesson. A cat that lands on the apple by luck has taught nobody anything.' },
    { why:'A computer follows movement blocks one at a time, in order, and each one changes where the cat is. If you know what one block does, you can work out what four will do — without running them.',
      worked:[
        'Click one “move 10 steps” block on its own. Watch how far the cat shifts. That is your unit.',
        'Work out roughly how many of those units fit between the cat and the apple.',
        'Build four blocks that add up to about that much, then predict the finish before you click.'
      ],
      debug:[
        ['The cat shoots off the edge','A move number is far bigger than the gap to the apple.','Click one move block on its own and count how far it actually travels.'],
        ['The cat barely moves','The numbers inside the blocks are too small for the distance.','Add up the four numbers. Compare that total with the width of the stage.'],
        ['The cat moves sideways or upwards','A turn block changed the direction before the move ran.','Take the turns out, get the distance right first, then put one turn back.'],
        ['Nothing happens when I click the green flag','The blocks are not joined to a “when green flag clicked” block.','Drag the stack onto a green flag block, then click the flag again.']
      ],
      ladder:['Foundation: get the cat to the apple at all.','Secure: predict the finish before running.','Transfer: predict a finish for a sequence you have not run.'],
      real:'Delivery robots and warehouse robots work out their route before they move, because reversing out of a wrong turn costs time.',
      remember:'One block does one thing. Four blocks do four things, in order.' },
    [['🐱','Cat in the middle'],['🍎','Apple on the right'],['🤔','Guess the finish'],['▶️','Run four blocks'],['📏','How close were you?']],
    { q:'You click one “move 10 steps” block and the cat shifts a little. Why is that worth doing before building the whole sequence?',
      opts:['It tells you what one block is worth, so you can work out four','It makes the cat faster','It saves the project'],
      ans:0,
      explain:'Knowing the size of one step turns guessing into working it out.' },
    ['Sequencing','Prediction','Measurement','Testing'],
    []
  );

  add(
    { id:'nk2', level:'explorer', icon:'🔁', title:'Spot the Repeat', tool:'No hardware',
      concept:'Pattern recognition', mins:12, quality:'studio',
      goal:'Find the part that repeats inside a long list of instructions, and write the list the short way',
      setup:'Get a piece of paper and a pencil. That is everything you need.',
      challenge:'Copy this dance down your paper, one action per line: CLAP, STAMP, SPIN, CLAP, STAMP, SPIN, CLAP, STAMP, SPIN, BOW. Draw one circle around the part that repeats. Write down how many times it repeats. Then write the whole dance again in two short lines, using the word REPEAT.',
      predict:'Before you circle anything, say out loud how many *different* actions you think are really in this dance.',
      hints:[
        'Read the list out loud. Your voice will usually find the repeat before your eyes do.',
        'The circle should go around a group of actions, not just one.',
        'BOW happens once, at the end. Does it belong inside the circle or outside it?'
      ],
      check:'Here is a different dance: HOP, HOP, CLAP, HOP, HOP, CLAP, WAVE. Circle the repeat and write the short version.',
      extend:'Invent a dance where the repeating part has another repeat hiding inside it.',
      coach:'Do not point at the repeat. Ask them to read it aloud and stop you when something sounds familiar.' },
    { strand:'Computational Foundations',
      objective:'I can find the repeating part of a list of instructions and write it the short way.',
      ready:'Paper and pencil, and the ten-line dance copied out.',
      success:[
        'My circle goes around a group of actions, not a single one.',
        'I wrote the number of repeats, and the short version means exactly the same dance.',
        'I can say why BOW is outside the circle.'
      ],
      evidence:'The short version, read aloud, produces the same ten actions as the long one.',
      stretch:'Write a dance whose repeating part contains its own repeat, and explain both.',
      adult:'Resist naming the pattern. The finding is the skill; the writing down is just recording it.' },
    { why:'Before a computer can shorten anything with a loop, a person has to notice that something repeats. Spotting the repeating group is the thinking part. The loop is just how you write it down.',
      worked:[
        'Read the list out loud and listen for the moment it starts sounding familiar.',
        'Mark where the familiar bit begins and where it ends — that group is the repeating unit.',
        'Count how many times the whole group appears, then check whether anything is left over at the start or end.'
      ],
      debug:[
        ['My circle only has one action in it','A single action repeating is possible, but here the familiar bit was longer.','Read from the top again and stop at the first word you have already said.'],
        ['I circled the whole list','The leftover action at the end is not part of the repeat.','Check whether the last action appears in every group or only once.'],
        ['My short version misses an action','The count of repeats or the leftover is wrong.','Read your short version out loud and tally the actions. It must come to ten.']
      ],
      ladder:['Foundation: notice that something repeats.','Secure: mark exactly where the repeat starts and ends.','Transfer: find a repeat in a list you have never seen.'],
      real:'Music is written this way. A repeat sign saves copying out the same eight bars four times.',
      remember:'Find the repeating group first. Write the loop second.' },
    [['📝','Copy the dance'],['👂','Read it aloud'],['⭕','Circle the repeat'],['🔢','Count the repeats'],['✂️','Write the short version']],
    { q:'What should you find before you write a loop?',
      opts:['The group of actions that repeats','The longest word','How many lines there are altogether'],
      ans:0,
      explain:'A loop is only a way of writing down a repeat you have already found.' },
    ['Pattern recognition','Sequencing','Prediction'],
    ['Sequencing']
  );

  add(
    { id:'nk3', level:'explorer', icon:'💃', title:'Dance on Repeat', tool:'Scratch',
      concept:'Loops', mins:18, quality:'studio',
      goal:'Replace a long stack of repeated blocks with a loop, and prove the two versions do exactly the same thing',
      setup:'Open Scratch and start a new project. Keep the cat. You will build the long version first, so leave yourself plenty of room in the code area.',
      challenge:'Build this the long way first: “turn 90 degrees”, “say Hi for 0.5 seconds”, and repeat that pair four times — eight blocks in total. Run it and count the spins. Now build a second version underneath using one “repeat” block, so it does the same thing with three blocks. Run both. They must look identical.',
      predict:'Before you run the loop version, say out loud how many times the cat will say Hi.',
      hints:[
        'Build the long one first, even though it feels slow. You cannot shorten something you have not seen in full.',
        'The repeat block is in the orange Control section. Drag your repeating pair *inside* it.',
        'If your loop does too many or too few, check the number in the repeat block against how many pairs you had.'
      ],
      check:'Change the long version to five spins. Now change the loop version to match — without adding a single block.',
      extend:'Make one loop that turns a different amount each time round. What has to change?',
      coach:'Do not let them skip the long version. Seeing eight blocks collapse into three is where loops stop being a shortcut and start being an idea.' },
    { strand:'Computational Foundations',
      objective:'I can turn a repeated group of blocks into a loop and show that both versions behave the same.',
      ready:'Scratch is open and the long eight-block version has been built and run at least once.',
      success:[
        'I built the long version first and counted what it did.',
        'My loop version does exactly the same thing with fewer blocks.',
        'I can point at which blocks belong inside the loop and say why the others stay outside.'
      ],
      evidence:'Both stacks are run one after the other and produce the same visible behaviour.',
      stretch:'Change the number of repeats in both versions and predict each result before running.',
      adult:'“Fewer blocks” is not the point. Ask what would have to change if the dance needed fifty spins.' },
    { why:'A loop does not just make code shorter. It makes the repeating part changeable in one place. Change one number and all fifty repeats change with it.',
      worked:[
        'Build the repeated version in full and run it, so you know what “correct” looks like.',
        'Circle the pair of blocks that keeps coming back — that pair goes inside the loop.',
        'Set the repeat number to the number of times the pair appeared, then run both versions and compare.'
      ],
      debug:[
        ['The loop version spins too many times','The repeat number does not match the number of pairs in the long version.','Count the pairs in the long stack, then compare with the number in the repeat block.'],
        ['Only one block is repeating','One of the pair was left outside the loop.','Look inside the repeat block. Both blocks of the pair should be sitting in there.'],
        ['The loop runs instantly with nothing visible','There is no wait or say duration inside the loop.','Add the “say Hi for 0.5 seconds” block back inside so each round is visible.'],
        ['Both stacks run at the same time and clash','Both are attached to the same green flag event.','Run them one at a time by clicking each stack directly.']
      ],
      ladder:['Foundation: get a repeat block to run.','Secure: show the loop and the long version match.','Transfer: change the repeat count and predict the result first.'],
      real:'Every animation, every scoreboard and every robot patrol route is a loop. Nobody writes the same instruction fifty times.',
      remember:'Build it long. Circle the repeat. Put exactly that inside the loop.' },
    [['🧱','Build the long way'],['▶️','Run and count'],['⭕','Circle the repeating pair'],['🔁','Put it in a repeat'],['⚖️','Prove they match']],
    { q:'Why build the long version before using a loop?',
      opts:['So you can see exactly which part repeats, and check the loop matches','Because loops only work after eight blocks','So the project saves properly'],
      ans:0,
      explain:'The long version is the evidence you compare the loop against.' },
    ['Loops','Pattern recognition','Sequencing','Testing'],
    ['Sequencing','Pattern recognition']
  );

  add(
    { id:'nk4', level:'explorer', icon:'❓', title:'The Rule That Only Sometimes Fires', tool:'Scratch',
      concept:'Conditionals', mins:20, quality:'studio',
      goal:'Make something happen only when a condition is true, and show it staying quiet when the condition is false',
      setup:'Open Scratch and start a new project. Keep the cat. You will need the orange Control blocks and the light-blue Sensing blocks.',
      challenge:'Make the cat glide slowly across the stage. Add a rule so that it says “Edge!” *only* when it is touching the edge. Then prove your rule works both ways: show it saying Edge at the edge, and show it staying silent in the middle.',
      predict:'Before you run it, say out loud the rule in this shape: “IF ___ THEN ___.”',
      hints:[
        'The condition lives in the light-blue “touching ___ ?” block. It goes into the diamond-shaped hole in the “if” block.',
        'A rule can only be checked when the program is actually looking. Put the “if” inside a “forever” loop so it keeps checking.',
        'To prove it stays quiet, drag the cat to the middle by hand and watch. Nothing should happen.'
      ],
      check:'Change the rule so the cat says “Middle!” when it is NOT touching the edge. Predict what you will see before you run it.',
      extend:'Add a second, different rule with its own condition. Make sure the two rules never fire at the same moment.',
      coach:'Ask what the program is actually asking. Most children can name the action long before they can name the question.' },
    { strand:'Sensing & Control',
      objective:'I can write a rule that fires only when its condition is true, and show it staying quiet when the condition is false.',
      ready:'Scratch is open and the cat moves across the stage on its own.',
      success:[
        'I can say my rule out loud in the shape “IF ___ THEN ___”.',
        'The cat says Edge when it touches the edge.',
        'I showed the cat staying silent in the middle — the rule does not fire when it should not.'
      ],
      evidence:'Both halves are demonstrated: the rule firing, and the rule correctly not firing.',
      stretch:'Write a rule whose condition is false most of the time, and explain how you know it is still working.',
      adult:'A rule that always fires is not a rule. The silent half is the half worth asking about.' },
    { why:'A conditional is a question the program keeps asking. The answer decides what happens next. Naming the question is harder — and more important — than naming the action.',
      worked:[
        'Say the rule out loud first: IF touching edge THEN say Edge.',
        'Find the light-blue block that asks that question, and drop it into the diamond hole in the if block.',
        'Put the whole if inside a forever loop, so the question gets asked over and over instead of once.'
      ],
      debug:[
        ['The cat says Edge all the time','The condition is missing, or the say block is outside the if.','Check that the say block sits inside the if, not underneath it.'],
        ['The cat never says Edge','The question is only being asked once, before the cat reaches the edge.','Wrap the if in a forever loop so it keeps checking while the cat moves.'],
        ['It says Edge in the middle of the stage','The wrong condition is in the diamond hole.','Read the condition out loud. Does it match the rule you said at the start?'],
        ['It flickers on and off at the edge','The cat is bouncing in and out of touching the edge.','That is real behaviour, not a bug. Watch carefully and describe what the cat is doing.']
      ],
      ladder:['Foundation: get a rule to fire at all.','Secure: show it firing and not firing.','Transfer: flip the condition and predict the new behaviour.'],
      real:'Automatic doors, low-battery warnings and self-checkout scales are all rules that spend most of their time not firing.',
      remember:'IF is the question. THEN is the answer. Both halves have to be checked.' },
    [['🐱','Cat glides'],['❓','IF touching edge'],['💬','THEN say Edge'],['🤫','Middle: stays quiet'],['🔄','Flip the rule']],
    { q:'Your rule fires every single time, everywhere on the stage. What is most likely wrong?',
      opts:['The action is not actually inside the if block','The cat is too fast','The stage is too small'],
      ans:0,
      explain:'If the action sits under the if rather than inside it, the condition never controls anything.' },
    ['Conditionals','Sensors','Input / output','Testing'],
    ['Sequencing','Events']
  );

  add(
    { id:'nk5', level:'explorer', icon:'🐞', title:'Find the Broken Block', tool:'Scratch',
      concept:'Debugging', mins:20, quality:'studio',
      goal:'Find out why a program misbehaves by testing one thing at a time instead of changing everything',
      setup:'Open Scratch and start a new project. You are going to build a program that is deliberately wrong, then fix it properly.',
      challenge:'Build exactly this, mistakes included: “when green flag clicked”, “set score to 0”, “forever”, and inside the forever put “change score by 1” and “if touching edge then say Caught”. Run it. The score explodes into the thousands. Do not start deleting blocks. Instead: run it again and watch only the score. Write down what you see. Then change ONE thing, run again, and write down whether it helped.',
      predict:'Before your first fix, write down which single block you think is causing the runaway score, and why.',
      hints:[
        'A forever loop runs many times every second. What is inside it happens that often too.',
        'Ask what should make the score change. Should it be “all the time”, or “when something happens”?',
        'Change one block. Run. Write it down. Only then change another.'
      ],
      check:'Make the score go up only when the cat touches the edge. Then break it again on purpose in a different way, and predict what will happen before you run it.',
      extend:'Write down the shortest set of steps someone else could follow to find the same bug.',
      coach:'When they want to delete everything, ask “what did the last change actually tell us?” Random fixing is the thing being trained out.' },
    { strand:'Measurement & Debugging',
      objective:'I can find a bug by changing one thing at a time and recording what each change tells me.',
      ready:'The deliberately broken program is built and has been run once.',
      success:[
        'I wrote down what actually happened before I changed anything.',
        'I changed one thing at a time and wrote down the result of each change.',
        'I can say which change fixed it and why that block was the problem.'
      ],
      evidence:'A written trail of at least two tests showing what was changed and what happened.',
      stretch:'Break it a second way and predict the symptom before running.',
      adult:'The trail matters more than the fix. A child who guesses right has not debugged anything.' },
    { why:'Debugging is not fixing. It is finding out. If you change five things and it starts working, you still do not know what was wrong — and it will happen again.',
      worked:[
        'Run it and describe the wrong behaviour out loud, precisely. "Score goes up fast" is better than "it is broken".',
        'Decide which single block you suspect, and say why before touching it.',
        'Change only that block, run again, and write down whether the behaviour changed.'
      ],
      debug:[
        ['I changed lots of things and now it works','You no longer know what was wrong, so you cannot avoid it next time.','Undo back to the broken version and change one thing at a time.'],
        ['The score still runs away','The change did not affect how often the score block runs.','Ask how many times per second the forever loop runs its contents.'],
        ['Nothing happens at all now','A block got detached while editing.','Check that every block is still joined to the green flag stack.'],
        ['It works sometimes','Something depends on where the cat happens to be.','Start the cat from the same spot every run so the test is fair.']
      ],
      ladder:['Foundation: describe the wrong behaviour precisely.','Secure: change one thing and record the result.','Transfer: predict the symptom of a bug before running it.'],
      real:'Professional engineers keep a record of every test. "It works now" is not an acceptable answer on a real system.',
      remember:'Describe it. Suspect one thing. Change one thing. Write down what happened.' },
    [['🐛','Build it broken'],['👀','Watch the score'],['✍️','Write what you saw'],['🔧','Change ONE thing'],['✅','Record the result']],
    { q:'The program is misbehaving. What is the strongest first move?',
      opts:['Run it again and describe exactly what happens','Delete the blocks and start over','Change three blocks at once to save time'],
      ans:0,
      explain:'You cannot find a cause until you can describe the effect precisely.' },
    ['Debugging','Testing','Prediction','Iteration'],
    ['Sequencing','Prediction']
  );

  add(
    { id:'nk6', level:'explorer', icon:'⚖️', title:'Make It Fair', tool:'No hardware',
      concept:'Fair testing + measurement', mins:15, quality:'studio',
      goal:'Run a test where only one thing changes, so the result actually means something',
      setup:'You need two sheets of paper the same size, and a clear floor space. No screen needed for this one.',
      challenge:'Make two paper aeroplanes from identical sheets, but fold the wings differently on the second one. Now test which flies further. Before you throw anything, write down three things you will keep exactly the same every throw. Throw each plane three times, and write down every distance — including the bad throws.',
      predict:'Write down which plane you think will win, and what the deciding difference is.',
      hints:[
        'Same throwing spot, same person throwing, same amount of push. Those are the sorts of things to keep the same.',
        'Three throws each, not one. One throw tells you about one throw.',
        'Write down the bad throws too. Leaving them out is how you get a wrong answer that looks right.'
      ],
      check:'Someone says “the blue one is better, I threw it once and it went further.” Write down one sentence explaining why that is not enough evidence.',
      extend:'Run the test again but change a different single thing, and predict whether the winner will change.',
      coach:'If a throw goes badly, resist the urge to re-throw it. Ask why the temptation to delete it is dangerous.' },
    { strand:'Measurement & Debugging',
      objective:'I can set up a test where only one thing changes, and use all the results rather than my favourite one.',
      ready:'Two same-sized sheets of paper and a clear space to throw in.',
      success:[
        'I wrote down three things I kept the same before I started throwing.',
        'I did three throws each and recorded every one, including bad throws.',
        'I can say what my results do and do not prove.'
      ],
      evidence:'Six recorded distances and a written statement of what was held constant.',
      stretch:'Explain what result would have made you change your mind.',
      adult:'Ask what they would say to someone who got the opposite result. Certainty from six throws is the thing to soften.' },
    { why:'If two things change at once, a result cannot tell you which one caused it. And one trial cannot tell you whether a result is typical or a fluke.',
      worked:[
        'List what must stay the same before deciding what to change.',
        'Change exactly one thing — here, the wing fold.',
        'Repeat each version at least three times and keep every number, including the disappointing ones.'
      ],
      debug:[
        ['One plane always wins by miles','Something other than the wings may also be different — paper, weight, throw.','Check your list of things kept the same. Is the throw really identical?'],
        ['The results are all over the place','Human throwing varies. That is normal and worth measuring.','Do three more throws each and look at whether one version is usually ahead.'],
        ['One throw was terrible so I ignored it','Removing results you dislike is how tests lie.','Put it back in and describe what happened on that throw instead.']
      ],
      ladder:['Foundation: change one thing.','Secure: repeat and record everything.','Transfer: judge whether someone else\u2019s test was fair.'],
      real:'Medicines, car brakes and crash helmets are all tested this way, many times over, with the bad results kept in.',
      remember:'Change one thing. Repeat it. Keep every result.' },
    [['📄','Two same sheets'],['✂️','Change ONE thing'],['📝','List what stays same'],['🎯','Three throws each'],['📊','Keep every result']],
    { q:'Why throw each plane three times instead of once?',
      opts:['To see whether a result is typical or just a fluke','To make the test take longer','Because the first throw never counts'],
      ans:0,
      explain:'Repeating shows you how much the result wobbles on its own.' },
    ['Testing','Measurement','Data','Prediction'],
    ['Prediction']
  );

  add(
    { id:'nk7', level:'explorer', icon:'🧭', title:'Two Ways to Win', tool:'Scratch',
      concept:'Algorithms + comparison', mins:22, quality:'studio',
      goal:'Solve the same problem two different ways and judge which method is better, with a reason',
      setup:'Open Scratch and start a new project. Click the Pen extension (bottom-left button) so you can draw with the cat.',
      challenge:'Make the cat draw a square, twice, using two different methods. Method A: write out all eight moves and turns one by one. Method B: use a repeat block. Both squares must look the same. Then write down which method you would rather use if the shape had a hundred sides — and why.',
      predict:'Before you build Method B, say how many blocks you think it will need.',
      hints:[
        'A square turns 90 degrees at each corner, four times.',
        'Use “pen down” before you start moving, or nothing will be drawn.',
        'Both methods must produce the same square. If they do not, the comparison means nothing.'
      ],
      check:'Change both versions to draw a triangle. Which one was quicker to change, and why?',
      extend:'Find a third method that neither of your first two used.',
      coach:'Push past “B has fewer blocks”. Ask which one they could change fastest, and which one is easier to read six months later.' },
    { strand:'Algorithms & Decomposition',
      objective:'I can solve one problem two ways and give a reason for preferring one.',
      ready:'Scratch is open with the Pen extension added.',
      success:[
        'Both methods draw the same square.',
        'I can describe how the two methods differ, not just which is shorter.',
        'I gave a reason for my preference that is not only about the number of blocks.'
      ],
      evidence:'Two working versions plus a written comparison naming a reason.',
      stretch:'Argue for the method you did not choose. What would make it the better one?',
      adult:'“Fewer blocks” is the easy answer. Ease of changing is the better one, and worth steering toward.' },
    { why:'Most problems have more than one correct solution. Being able to compare them — on how easy they are to change, read and trust — is what turns coding into engineering.',
      worked:[
        'Get one method fully working before starting the second.',
        'Build the second method and check both outputs are genuinely identical.',
        'Pick a criterion to judge by — how easy to change, how easy to read — and then decide.'
      ],
      debug:[
        ['Nothing is drawn','The pen is not down.','Add a "pen down" block at the start of each method.'],
        ['The square does not close','The turn angle or the number of sides is off.','Count the corners. A square needs four turns of 90 degrees.'],
        ['The two squares are different sizes','The move numbers do not match between methods.','Compare the move value in each version — they must be the same.'],
        ['Both drawings are on top of each other','The pen was never cleared between runs.','Add "erase all" at the start, or move the cat before the second method.']
      ],
      ladder:['Foundation: one working square.','Secure: two methods, same result.','Transfer: judge which fits a new situation better.'],
      real:'Engineering teams routinely build two prototypes and choose between them using agreed criteria rather than taste.',
      remember:'Working is not the same as best. Say what "better" means before choosing.' },
    [['🖊️','Pen down'],['🅰️','Eight blocks'],['🅱️','One repeat'],['⚖️','Same square?'],['🤔','Which would you change?']],
    { q:'Both methods draw the same square. What should you do next?',
      opts:['Compare them on something like how easy they are to change','Pick the first one and never look back','Assume they are identical in every way'],
      ans:0,
      explain:'Two correct solutions can still differ in ways that matter later.' },
    ['Algorithms','Loops','Decomposition','Optimisation','Testing'],
    ['Loops','Sequencing']
  );

  add(
    { id:'nk8', level:'explorer', icon:'⚡', title:'Build a Reaction Game', tool:'Scratch',
      concept:'Events + variables + conditionals', mins:30, quality:'studio',
      goal:'Combine three ideas you already know into one working game, and test each part separately',
      setup:'Open Scratch and start a new project. You will need one sprite to click on. Give yourself about half an hour.',
      challenge:'Build a game where a sprite appears in a random place, and the player clicks it. Each hit adds one to the score. The game stops after ten hits. Build it in three separate pieces and test each one on its own before joining them: (1) the sprite moves to a random spot, (2) clicking it adds one to the score, (3) the game ends at ten.',
      predict:'Before you start, say which of the three pieces you think will be the hardest, and why.',
      hints:[
        'Test piece one alone. Does the sprite really land somewhere different each time?',
        'The score is a variable. Set it to 0 when the green flag is clicked, or it will carry over from the last game.',
        '“Stop all” is in the orange Control blocks. It goes inside a rule that checks the score.'
      ],
      check:'Change the game to end at twenty hits instead of ten. How many things did you have to change?',
      extend:'Add a timer, so the game also ends if the player is too slow.',
      coach:'If they build all three at once and it fails, do not debug it for them. Ask them to disconnect two pieces and test the third alone.' },
    { strand:'Systems Integration',
      objective:'I can build a small system out of separate tested pieces instead of one big untested lump.',
      ready:'Scratch is open with one clickable sprite on the stage.',
      success:[
        'I tested each of the three pieces on its own before joining them.',
        'The finished game keeps score correctly and stops at ten.',
        'When something went wrong, I could say which piece it was in.'
      ],
      evidence:'The learner can point at each piece and say how they knew it worked before joining.',
      stretch:'Add a fourth piece without breaking the three that already work.',
      adult:'The temptation is to build it all and then debug. Testing pieces separately is the habit being built here.' },
    { why:'Big programs fail in confusing ways. If you have already proved each part works alone, a failure after joining them points straight at how they connect.',
      worked:[
        'Build the random-position piece alone and run it ten times. Does it really move around?',
        'Build the scoring piece alone. Click and watch the number change.',
        'Join them, then add the ending rule last, so any new failure has an obvious cause.'
      ],
      debug:[
        ['The score keeps going up from the last game','The score is never reset when the game starts.','Add "set score to 0" under the green flag block.'],
        ['The sprite appears in the same place each time','The random block is missing or has fixed numbers.','Check the "pick random" blocks are inside the go-to block.'],
        ['The game never ends','The rule checking the score is not being checked repeatedly.','Put the if inside a forever loop so the score gets checked continuously.'],
        ['Clicking does nothing','The script is attached to the wrong sprite, or to the wrong event.','Check which sprite is selected, and that the event is "when this sprite clicked".']
      ],
      ladder:['Foundation: one piece working alone.','Secure: three pieces joined and working.','Transfer: add a piece without breaking the rest.'],
      real:'Aircraft, phones and games consoles are all built as subsystems that are tested separately long before anything is joined together.',
      remember:'Prove each piece alone. Then join. Then the failure tells you something.' },
    [['🎯','Random spot'],['🖱️','Click to score'],['🔢','Score goes up'],['🛑','Stop at ten'],['🧩','Join the pieces']],
    { q:'You joined three pieces and it broke. What is the strongest move?',
      opts:['Disconnect two pieces and test the third alone','Rewrite the whole game','Add another feature and hope'],
      ans:0,
      explain:'Isolating a subsystem tells you where the fault actually lives.' },
    ['Decomposition','Variables','Events','Conditionals','Testing','Debugging'],
    ['Variables','Events','Conditionals']
  );

  add(
    { id:'nk9', level:'explorer', icon:'🌉', title:'Same Idea, New Place', tool:'No hardware',
      concept:'Transfer', mins:15, quality:'studio',
      goal:'Show that an idea you learned in Scratch also explains things that have nothing to do with Scratch',
      setup:'Paper and pencil. You will also need to think back over the missions you have already done.',
      challenge:'Pick one idea you have used: loops, conditionals, or variables. Now find it in three places that are not Scratch — around your home, at school, or in a game you play. For each one, write what repeats, what the rule is, or what is being remembered. Then find one thing that *looks* like your idea but actually is not, and explain the difference.',
      predict:'Before you start looking, say which of the three you think will be hardest to find in real life.',
      hints:[
        'Loops: anything that happens over and over. Traffic lights. Washing machine cycles.',
        'Conditionals: anything with a rule. "If it rains, take a coat."',
        'The non-example is the hard part, and it is the one that proves you understand.'
      ],
      check:'Explain your idea to someone who has never used Scratch, without using the word Scratch or the name of any block.',
      extend:'Find an example where two of your three ideas are working together.',
      coach:'The non-example is where the real thinking happens. Do not let it be skipped because it is harder.' },
    { strand:'Systems Integration',
      objective:'I can recognise an idea I learned in one place when it turns up somewhere completely different.',
      ready:'At least three earlier missions completed, so there is something to transfer.',
      success:[
        'I found three real examples that are not on a computer.',
        'I found one thing that looks like my idea but is not, and I can say why.',
        'I explained the idea without using any block names.'
      ],
      evidence:'Three examples plus one non-example, explained in the learner\u2019s own words.',
      stretch:'Teach the idea to someone else and see whether they can find their own example.',
      adult:'If they can only explain it using block names, the idea is still attached to Scratch rather than owned.' },
    { why:'You have really learned something when you can spot it somewhere it was never taught. Until then, you have learned where the block lives, not what the idea means.',
      worked:[
        'Say the idea in one sentence without mentioning any software.',
        'Look for that sentence out in the world, three separate times.',
        'Find something that nearly fits but does not, and say exactly where it stops fitting.'
      ],
      debug:[
        ['All my examples are computers','The idea is still tied to screens.','Look at something mechanical or something a person does by habit.'],
        ['I cannot think of a non-example','Non-examples are hard on purpose.','Take one of your examples and change one detail until it stops being your idea.'],
        ['I keep using block names','The idea has not separated from the tool yet.','Explain it to someone who has never opened Scratch, out loud.']
      ],
      ladder:['Foundation: one example away from the screen.','Secure: three examples in your own words.','Transfer: a non-example with the difference explained.'],
      real:'This is exactly what an exam or an interview is testing: not whether you remember the lesson, but whether you can use the idea somewhere new.',
      remember:'If you can only explain it with block names, it is not yours yet.' },
    [['💡','Pick one idea'],['🏠','Find it at home'],['🎮','Find it in a game'],['🏫','Find it at school'],['🚫','Find what it is NOT']],
    { q:'What is the strongest sign you really understand an idea?',
      opts:['You can use it somewhere it was never taught','You can repeat the lesson exactly','You finished the mission quickly'],
      ans:0,
      explain:'Repeating is memory. Using it somewhere new is understanding.' },
    ['Transfer','Pattern recognition','Prediction'],
    ['Prediction','Testing']
  );

  add(
    { id:'nk10', level:'explorer', icon:'🏆', title:'Explorer Boss: Your Own Game', tool:'Scratch',
      concept:'Integration + design', mins:35, quality:'studio',
      goal:'Design and build a small game of your own that uses at least three ideas from this path, and explain every choice',
      setup:'Open Scratch and start a new project. Before you touch a block, write down on paper what your game is and how someone wins it.',
      challenge:'Build a game nobody has told you how to build. It must use at least three of: sequencing, loops, conditionals, variables, events. Write down your plan first, build it in pieces, and test each piece. At the end, be ready to point at any part of your code and say why it is there.',
      predict:'Before building, write down which part you expect to go wrong first.',
      hints:[
        'Small and finished beats big and broken. One screen, one rule, one score is plenty.',
        'Build the piece you are least sure about first, while you still have energy for it.',
        'If you get stuck, go back to the mission that taught that idea and look at how you did it there.'
      ],
      check:'Give the game to someone else without explaining it. Watch where they get confused, and change one thing because of what you saw.',
      extend:'Add one thing your game does not need but you want anyway — and be honest about whether it made the game better.',
      coach:'Resist suggesting features. Ask them to point at a block and explain why it is there; the ones they cannot explain are the ones to talk about.' },
    { strand:'Systems Integration',
      objective:'I can design, build and explain a working project of my own using ideas from across the path.',
      ready:'A written plan exists on paper before any block is dragged.',
      success:[
        'My game uses at least three different ideas from this path, and I can name them.',
        'I can point at any part of my code and say why it is there.',
        'I watched someone else play it and changed something because of what I saw.'
      ],
      evidence:'A working game, a written plan, and one change made in response to watching a real player.',
      stretch:'Rebuild one part a completely different way and say which version you prefer, with a reason.',
      adult:'This is the mission where you find out what actually stuck. Silence in front of your own code is the signal worth noticing.' },
    { why:'Everything so far has been a task someone else set. This is the first one where the problem is yours, which means the decisions — and the mistakes — are yours too.',
      worked:[
        'Write the plan on paper, including how the player wins, before opening any blocks.',
        'Build the riskiest piece first and test it alone.',
        'Join the pieces one at a time, testing after each join rather than at the end.'
      ],
      debug:[
        ['It is too big and nothing works','Too many pieces were joined before any were tested.','Disconnect everything except one piece and get that working alone.'],
        ['I cannot explain part of my code','It was probably copied rather than reasoned out.','Delete that part and rebuild it from what you understand.'],
        ['The player did not understand the game','The rules are clear to you because you built it.','Watch them again without speaking, and note exactly where they hesitate.'],
        ['I ran out of time','The plan was bigger than the session.','Cut a feature rather than leaving everything half finished.']
      ],
      ladder:['Foundation: something of your own that runs.','Secure: three ideas used and explained.','Transfer: changed because of a real player.'],
      real:'Every game studio playtests with people who were not in the room while it was made, for exactly this reason.',
      remember:'Plan on paper. Build the risky bit first. Watch a real player.' },
    [['📝','Plan on paper'],['🧩','Build risky bit first'],['🔗','Join one at a time'],['👀','Watch a real player'],['🔧','Change one thing']],
    { q:'You finish your game and a friend plays it without instructions. They get stuck immediately. What is the most useful response?',
      opts:['Watch where they hesitated and change that part','Explain the rules to them and move on','Assume they were not paying attention'],
      ans:0,
      explain:'Their confusion is evidence about your design, not about them.' },
    ['Decomposition','Iteration','Testing','Transfer','Debugging','Algorithms'],
    ['Decomposition','Testing','Variables']
  );

  /* ========================= ENGINEER — browser only ========================= */

  add(
    { id:'nke1', level:'engineer', icon:'🐍', title:'Say It Exactly', tool:'Python',
      concept:'Syntax + reading errors', mins:25, quality:'studio',
      goal:'Write your first Python program and learn to read an error message instead of guessing at it',
      setup:'Open the browser Python editor. Run one line — print("hello") — and confirm you see output before writing anything longer.',
      challenge:'Write a program that asks for a name and prints a greeting using it. Then deliberately break it four ways, one at a time: remove a quote mark, remove a bracket, misspell print, and indent a line that should not be indented. For each one, run it and copy down the exact error message and the line number it names. Fix it, then break the next.',
      predict:'Before running each broken version, write down what you think Python will complain about.',
      hints:[
        'Read the LAST line of the error first. That is the error type. The line number is usually near the top.',
        'Python points at where it noticed the problem, which is sometimes one line after where you caused it.',
        'Four error types, four different messages. Collect them like specimens.'
      ],
      check:'Someone shows you an error you have not seen. Describe the first three things you would look at, in order.',
      extend:'Cause an error that Python reports on the wrong line, and explain why the line number is misleading.',
      coach:'Do not translate the error message. Ask them to read it aloud and say which word they do not understand.' },
    { strand:'Software Engineering',
      objective:'I can read a Python error message and use it to locate the actual fault.',
      ready:'A one-line Python program has already run successfully in the browser editor.',
      success:[
        'I recorded four different error messages with their exact wording and line numbers.',
        'For each, I can say what the message was actually telling me.',
        'I can describe a case where the reported line number was not where the mistake was.'
      ],
      evidence:'Four recorded error messages, each matched to the mistake that caused it.',
      stretch:'Predict the exact error type before running a deliberately broken program.',
      adult:'Reading the error is the single highest-return habit in text-based programming. It is worth spending the whole session on.' },
    { why:'Beginners treat error messages as noise and start changing things. The message almost always names the problem type and gets you within a line or two of the cause.',
      worked:[
        'Run one trivial line first, so you know the environment itself works.',
        'Break exactly one thing and run. Record the message verbatim.',
        'Match the message wording to the mistake, so the next time you see it you already know the family.'
      ],
      debug:[
        ['The error points at a line that looks fine','Python reports where it noticed the problem, not always where it started.','Look at the line above the reported one, especially for unclosed brackets or quotes.'],
        ['I get IndentationError and the line looks aligned','Tabs and spaces can be mixed invisibly.','Delete the leading whitespace on that line and retype it with spaces.'],
        ['Nothing runs at all','The file has an error before the first statement.','Comment out everything, then uncomment one line at a time.'],
        ['The error changed after my fix','You fixed one problem and revealed the next.','That is progress. Record the new message and continue.']
      ],
      ladder:['Foundation: get one line to run.','Secure: match four error types to their causes.','Transfer: predict the error before running.'],
      real:'Stack traces in production systems work exactly like this, just longer. The reading habit is identical.',
      remember:'Error type is at the end. Line number is near the top. Look one line above.' },
    null, null,
    ['Sequencing','Debugging','Testing','Prediction'],
    []
  );

  add(
    { id:'nke2', level:'engineer', icon:'🔁', title:'Loop With a Reason', tool:'Python',
      concept:'Loops + off-by-one', mins:30, quality:'studio',
      goal:'Write loops that run exactly the intended number of times, and prove it rather than assume it',
      setup:'Open the browser Python editor with a blank file.',
      challenge:'Write a loop that prints the numbers 1 to 10 inclusive. Before running it, write down exactly what you expect the first and last lines of output to be. Then write three more loops: one that prints 0 to 9, one that prints 1 to 10 counting in twos, and one that prints 10 down to 1. For each, predict the first and last line before running, and record whether you were right.',
      predict:'For each loop, write the predicted first and last output line before pressing run.',
      hints:[
        'range(1, 10) does not include 10. Prove that to yourself with a short test rather than taking my word for it.',
        'Count the lines of output, not just the first and last. A loop can start and end right and still run the wrong number of times.',
        'Counting down needs a third argument in range. Work out what it must be from what you know about the first two.'
      ],
      check:'Write a loop that runs exactly seven times, and state how you verified the count rather than assuming it.',
      extend:'Write a loop whose count depends on a value entered by the user, and test it at the boundary values.',
      coach:'Off-by-one errors are the most common bug in programming. Ask for the count, not just the first and last value.' },
    { strand:'Computational Foundations',
      objective:'I can write a loop that runs exactly the intended number of times and verify the count.',
      ready:'The Python editor runs a simple program successfully.',
      success:[
        'I predicted first line, last line and total count before each run.',
        'All four loops produce exactly the output I intended.',
        'I can explain why range stops one short, using a test I ran myself.'
      ],
      evidence:'Four loops with written predictions and recorded actual counts.',
      stretch:'Write a loop with an off-by-one bug on purpose and describe the symptom before running it.',
      adult:'Ask for the number of iterations. Learners who can name the endpoints often still cannot name the count.' },
    { why:'Loop boundaries are where most real bugs live. The endpoints look obvious and are routinely wrong by exactly one.',
      worked:[
        'State the intended count out loud before writing any code.',
        'Write the loop, then predict first line, last line and total.',
        'Run it and count the actual output lines against your prediction.'
      ],
      debug:[
        ['The last number is missing','range stops before its second argument.','Print range(1,10) as a list and look at what is actually in it.'],
        ['One extra line at the start','The starting value is lower than intended.','Check the first argument of range against your intended first value.'],
        ['Counting down produces nothing','The step is still positive while the start is above the stop.','Work out what sign the step must have to move from 10 towards 1.'],
        ['The count is right but values are wrong','The step size does not match the intended spacing.','Write the intended sequence on paper and compare it term by term.']
      ],
      ladder:['Foundation: a loop that runs.','Secure: predicted endpoints and count all correct.','Transfer: reason about boundaries in a loop you did not write.'],
      real:'Off-by-one errors have caused real outages, overdrafts and failed sensor readings. This is not a beginner-only problem.',
      remember:'Endpoints are not enough. Say the count.' },
    null, null,
    ['Loops','Prediction','Testing','Debugging'],
    ['Sequencing']
  );

  add(
    { id:'nke3', level:'engineer', icon:'⚖️', title:'Decide With Data', tool:'Python',
      concept:'Conditionals + thresholds', mins:35, quality:'studio',
      goal:'Write a decision rule and test it at the boundary, where rules actually fail',
      setup:'Open the browser Python editor. You will need a list of numbers to work with — type one in by hand rather than generating it.',
      challenge:'Write a program that classifies a temperature reading as COLD, OK or HOT using two thresholds you choose. Then test it deliberately at the boundaries: exactly on each threshold, one below, and one above. Record what your rule does at each of those six points. Fix any boundary you are not happy with, and say what rule you applied to decide.',
      predict:'Before testing, write down what your rule should do at exactly the threshold value, and why.',
      hints:[
        'The interesting values are not 5 and 40. They are exactly on your threshold, and the values either side of it.',
        'Decide whether your threshold is "greater than" or "greater than or equal to" before you test, then check the code agrees with your decision.',
        'If two branches could both be true, the order of your if/elif decides the answer. Test that on purpose.'
      ],
      check:'Change one threshold by a single degree and predict which of your six test values change classification, before running.',
      extend:'Add a reading that is clearly a sensor fault (say, -300) and decide what your rule should do with it.',
      coach:'Ask what happens exactly on the line. Most learners never test the boundary, which is the only place the rule is ambiguous.' },
    { strand:'Sensing & Control',
      objective:'I can write a threshold rule and verify its behaviour at the boundary values.',
      ready:'A working Python editor and a chosen pair of thresholds.',
      success:[
        'I tested exactly on each threshold, and one value either side.',
        'I can state whether each threshold is inclusive or exclusive, and show that the code matches.',
        'I made a deliberate decision about at least one boundary and can justify it.'
      ],
      evidence:'Six recorded boundary test results plus a stated rule for the ambiguous cases.',
      stretch:'Describe how noisy readings near a threshold would affect your rule, and what you would do about it.',
      adult:'A rule tested only in the middle of each range has not been tested. The boundary is the whole point.' },
    { why:'Rules are unambiguous in the middle of a range and ambiguous at the edges. Real sensor data spends a lot of time near the edges.',
      worked:[
        'Choose thresholds and write down, in words, what should happen exactly on each one.',
        'Test on, just below and just above each threshold.',
        'Where behaviour surprises you, change the comparison operator deliberately rather than by trial and error.'
      ],
      debug:[
        ['A value on the threshold goes to the wrong category','The comparison is exclusive where you intended inclusive, or vice versa.','Write down which you intended, then check the operator in the code.'],
        ['Everything comes out as one category','A branch is catching more than intended, probably an ordering problem.','Test one value from each intended category and see which branch catches it.'],
        ['The rule works for integers but not decimals','Boundaries behave differently when values are not whole numbers.','Test 20.0, 20.1 and 19.9 rather than only 20.'],
        ['A nonsense reading is classified normally','There is no validity check before the rule runs.','Decide what counts as a plausible reading and reject the rest explicitly.']
      ],
      ladder:['Foundation: a rule that classifies.','Secure: boundaries tested and justified.','Transfer: reason about noise near a threshold.'],
      real:'Thermostats, fire alarms and battery-management systems all live or die on boundary behaviour.',
      remember:'The middle of a range proves nothing. Test on the line.' },
    null, null,
    ['Conditionals','Sensors','Testing','Data','Measurement'],
    ['Conditionals','Testing']
  );

  add(
    { id:'nke4', level:'engineer', icon:'📐', title:'Calibrate a Simulated Sensor', tool:'Python',
      concept:'Measurement + calibration', mins:45, quality:'studio',
      goal:'Find a systematic error in a stream of readings and correct it with evidence, not with a guess',
      setup:'Open the browser Python editor. You will generate your own readings, so no hardware is needed.',
      challenge:'Write a function that returns a fake sensor reading: the true value, plus a fixed bias you choose, plus a small random wobble. Hand the function to yourself as if you did not know the bias. Now take twenty readings of a known true value, work out the average, estimate the bias from that, apply one correction, and take twenty more readings to check. Report the mean error before and after — and state clearly what your correction did not fix.',
      predict:'Before collecting data, write down how many readings you think you need before the average is trustworthy, and why.',
      hints:[
        'Systematic bias shifts every reading the same way. Random wobble does not. The average separates them.',
        'Twenty readings, one correction, twenty more. Not one reading and a tweak.',
        'Your correction cannot remove the random wobble. Say so explicitly in your report.'
      ],
      check:'Change the hidden bias to a different value without looking at it, and repeat the whole procedure. Does your method still work?',
      extend:'Add a bias that changes slowly over time and describe how your method would have to change.',
      coach:'Watch for a single correction derived from one or two readings. The number of trials before the decision is the thing to press on.' },
    { strand:'Measurement & Data',
      objective:'I can separate systematic error from random variation and correct only the part that is correctable.',
      ready:'A reading function exists and has been run at least once.',
      success:[
        'I collected at least twenty readings before making any correction.',
        'I reported mean error before and after using the same procedure both times.',
        'I stated explicitly what the correction did not and could not fix.'
      ],
      evidence:'Before and after mean error from matched twenty-reading runs, plus a stated limitation.',
      stretch:'Repeat with a different hidden bias and show the method transfers without retuning by hand.',
      adult:'The limitation sentence is the mark of real measurement literacy. A learner who claims the error is gone has missed it.' },
    { why:'Every real sensor is wrong in two different ways at once. One is fixable by calibration and one is not, and telling them apart is the whole skill.',
      worked:[
        'Collect a batch of readings at a known true value without changing anything.',
        'Average them. The gap between that average and the true value is your bias estimate.',
        'Apply one correction, repeat the identical procedure, and compare the two mean errors.'
      ],
      debug:[
        ['The corrected readings are now wrong the other way','The correction was larger than the measured bias.','Recompute the bias from the mean rather than from a single reading.'],
        ['The error did not improve at all','The correction may have been applied in the wrong direction.','Check the sign: is the reading above or below the true value on average?'],
        ['Results change every time I run it','That is the random component, which calibration cannot remove.','Increase the number of readings and look at whether the mean steadies.'],
        ['I cannot tell if it improved','The before and after runs used different conditions.','Use an identical number of readings and the same true value for both.']
      ],
      ladder:['Foundation: collect repeated readings.','Secure: one evidence-based correction with before/after evidence.','Transfer: the method works on a bias you did not set.'],
      real:'Scales, thermometers and satellite instruments are all calibrated this way, on a schedule, because bias drifts.',
      remember:'Average finds the bias. Nothing finds the wobble. Say which you fixed.' },
    null, null,
    ['Measurement','Calibration','Data','Testing','Iteration'],
    ['Measurement','Testing']
  );

  /* Rebuild the browser-only paths around missions that actually contain a task. */
  window.INVENTORLAB_NO_KIT_PATHS = {
    Explorer: ['ct2','nk1','nk2','nk3','s1','nk4','s2','nk5','nk6','nk7','nk8','nk9','nk10'],
    Engineer: ['e8','nke1','nke2','nke3','e4','nke4','e10','i1']
  };
})();

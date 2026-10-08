/*
  nokit_microbit.js — physical computing with no physical anything.

  MakeCode ships a full micro:bit simulator: clickable A and B buttons, a shake control,
  a light-level slider, a thermometer, and a second board that appears the moment you use
  radio blocks. That means inputs, sensors, thresholds, communication and data collection
  are all reachable by a learner who owns nothing but a browser — which is most of the
  concepts the hardware path was gatekeeping.

  These missions carry simulator:true, so the planner treats them as available when a
  browser is selected, while still pointing at the real board as the final step.
*/
(function () {
  const L = window.INVENTORLAB_LESSONS = window.INVENTORLAB_LESSONS || [];
  const DEEP = window.INVENTORLAB_DEEP = window.INVENTORLAB_DEEP || {};
  const BP = window.INVENTORLAB_STUDIO_BLUEPRINTS = window.INVENTORLAB_STUDIO_BLUEPRINTS || {};
  const VIS = window.INVENTORLAB_EXTRA_VISUALS = window.INVENTORLAB_EXTRA_VISUALS || {};
  const CHK = window.INVENTORLAB_EXTRA_CHECKS = window.INVENTORLAB_EXTRA_CHECKS || {};
  const SK = window.INVENTORLAB_EXTRA_SKILLS = window.INVENTORLAB_EXTRA_SKILLS || {};
  const PRE = window.INVENTORLAB_EXTRA_PREREQS = window.INVENTORLAB_EXTRA_PREREQS || {};

  function add(m, bp, deep, vis, chk, skills, pre) {
    m.tool = 'micro:bit'; m.level = 'explorer'; m.quality = 'studio'; m.simulator = true;
    L.push(m); BP[m.id] = bp; DEEP[m.id] = deep; VIS[m.id] = vis; CHK[m.id] = chk;
    SK[m.id] = skills; PRE[m.id] = pre;
  }

  add(
    { id:'nkm1', icon:'🔘', title:'Buttons and Faces', concept:'Input → output', mins:15,
      goal:'Make a simulated micro:bit react differently to two different button presses.',
      setup:'Open MakeCode and start a new project. You will work entirely with the simulator on the left — you do not need a real micro:bit for any of this.',
      challenge:'Make the simulated board show a happy face when button A is pressed, and a sad face when button B is pressed. Click A and B in the simulator to test. Then predict, before you try it, what happens when you press A and B at the same time — and find out whether you were right.',
      predict:'Before you click anything, say what you think will show on the screen when you press A. Then say what you think A+B together will do.',
      hints:[
        'The “on button A pressed” block is in the Input section. The face blocks are in Basic.',
        'Each button needs its own separate “on button pressed” block. They are two different events.',
        'The simulator has an A+B button too. MakeCode treats that as a third, separate event.'
      ],
      check:'Add a third rule so that A+B shows something different again. Say what the board is being told to notice, and what it is being told to do.',
      extend:'Make one of the buttons show a short message instead of a face.',
      coach:'Ask which part is the input and which part is the output. Most learners describe the output first and need prompting to name the input at all.' },
    { strand:'Sensing & Control',
      objective:'I can make a device respond differently to two different inputs, and name which part is the input and which is the output.',
      ready:'MakeCode is open with the simulator visible and a blank project.',
      success:[
        'Button A and button B produce different things on the screen.',
        'I predicted what A+B would do before I tried it.',
        'I can point at the input and the output in my own code.'
      ],
      evidence:'The learner presses each button in the simulator and names input and output for each.',
      stretch:'Predict the behaviour of a rule you have written but not yet run.',
      adult:'“What information went in, and what did the board do about it?” is the whole question here.' },
    { why:'Everything interactive works the same way: something comes in, the program decides, something goes out. Buttons and a screen are the simplest possible version of that.',
      worked:[
        'Place one “on button A pressed” block and put a face inside it. Test in the simulator.',
        'Add a second, separate block for button B with a different face. Test again.',
        'Predict A+B, then test. Notice it is a third event, not a mixture of the first two.'
      ],
      debug:[
        ['Nothing happens when I click a button','The face block may be sitting outside the button block.','Check the face block is nested inside the “on button pressed” block, not floating beside it.'],
        ['Both buttons do the same thing','Both blocks may be set to the same button.','Look at the dropdown on each block. One should say A and one should say B.'],
        ['The face stays on the screen forever','Nothing has told it to clear.','That is normal. Add “clear screen” if you want it to disappear.'],
        ['A+B does nothing','There is no rule for that event yet.','Add a third block and set its dropdown to A+B.']
      ],
      ladder:['Foundation: one button does something.','Secure: two buttons do different things.','Transfer: predict a third event before running it.'],
      real:'Every doorbell, lift button and game controller is this exact pattern, just with more buttons.',
      remember:'Input is what the board notices. Output is what the board does about it.' },
    [['🔘','Press A'],['🙂','Happy face'],['🔘','Press B'],['🙁','Sad face'],['🤔','What does A+B do?']],
    { q:'In this mission, which part is the input?',
      opts:['The button press','The face on the screen','The colour of the blocks'],
      ans:0,
      explain:'Input is information going in. The face is the output the program produces in response.' },
    ['Input / output','Events','Prediction','Testing'],
    ['Prediction']
  );

  add(
    { id:'nkm2', icon:'🌙', title:'The Nightlight Rule', concept:'Sensors + conditionals', mins:20,
      goal:'Make a simulated board switch a light on by itself when the room gets dark, and stay off when it does not.',
      setup:'Open MakeCode and start a new project. Find the light-level slider on the simulator — it appears once you use a light-sensing block, and lets you make the pretend room brighter or darker.',
      challenge:'Build a nightlight. Inside a “forever” loop, use “if light level < 50 then show a full square, else clear screen”. Drag the simulator’s light slider slowly from bright down to dark and watch exactly when the square appears. Then prove it works both ways: show it lighting up in the dark, and show it staying off in the light.',
      predict:'Before you move the slider, say out loud what the rule is, in the shape “IF ___ THEN ___”. Then say roughly where on the slider you think the light will switch on.',
      hints:[
        '“light level” is in the Input section. It gives a number, not a decision — your program decides what the number means.',
        'The rule must be inside a “forever” loop, or the board will only check once and then stop looking.',
        'Move the slider slowly. The exact moment it flips is the interesting part.'
      ],
      check:'Change 50 to 20. Before you move the slider, predict whether the light will now come on sooner or later as the room darkens.',
      extend:'Make it show three different brightness levels instead of just on and off.',
      coach:'Press on the difference between the reading and the decision. “The sensor knows it is dark” is the misconception to catch here.' },
    { strand:'Sensing & Control',
      objective:'I can use a sensor reading in a rule, and show the rule both firing and not firing.',
      ready:'MakeCode is open and the light-level slider is visible on the simulator.',
      success:[
        'I can say my rule in the shape “IF ___ THEN ___”.',
        'The light comes on in the dark and stays off in the light — I showed both.',
        'I can say what the sensor gives the program, and what the program decides.'
      ],
      evidence:'Both halves demonstrated on the slider, plus a sentence separating reading from decision.',
      stretch:'Predict the switching point for a threshold you have not tried yet.',
      adult:'The sensor measures. The program decides. Keeping those separate is the idea that makes every later sensor project make sense.' },
    { why:'A sensor does not understand anything. It hands over a number. Every bit of meaning — dark, too hot, too close — is a decision your program makes about that number.',
      worked:[
        'Show the raw light level on the screen first, with no rule at all, and watch the number change as you move the slider.',
        'Now add the rule, using a number you picked from watching those readings.',
        'Test above and below your threshold, so you have seen the rule fire and stay quiet.'
      ],
      debug:[
        ['The light is always on','The threshold may be higher than every reading the slider produces.','Show the raw light level on screen and see what range of numbers you actually get.'],
        ['Nothing ever happens','The rule may only be running once instead of continuously.','Check the if block is inside a forever loop.'],
        ['It flickers on and off near the switching point','Readings wobble around the threshold. This is real behaviour.','Watch carefully and describe it. This is exactly why real systems need a gap between on and off.'],
        ['The screen stays blank in the dark','There may be no “else” branch, or the clear is in the wrong place.','Check which branch has the square and which has the clear screen.']
      ],
      ladder:['Foundation: a rule that fires.','Secure: fires in the dark, quiet in the light.','Transfer: predict a new threshold\u2019s behaviour.'],
      real:'Street lights, phone screens and car headlights all do this, and all of them have to deal with the flicker problem you just saw.',
      remember:'The sensor gives a number. Your rule decides what the number means.' },
    [['☀️','Bright room'],['🔢','Read the number'],['❓','IF below 50'],['🌙','THEN light on'],['🎚️','Test both ways']],
    { q:'Your rule uses “light level < 50”. What does the light sensor actually give the program?',
      opts:['A number','A decision about whether it is dark','A finished program'],
      ans:0,
      explain:'The sensor measures. Deciding that the number means “dark” is your program\u2019s job.' },
    ['Sensors','Conditionals','Input / output','Measurement','Testing'],
    ['Conditionals','Input / output']
  );

  add(
    { id:'nkm3', icon:'🔢', title:'Counting Machine', concept:'Variables on a device', mins:20,
      goal:'Make a simulated board remember a number that goes up, and reset it properly for a new count.',
      setup:'Open MakeCode and start a new project. You will need the Variables section — click “Make a Variable” and call it count.',
      challenge:'Build a tally counter. Pressing A adds one to count and shows it on the screen. Pressing B resets count back to 0 and shows it. Test it by pressing A five times, then B, then A twice. Write down what the screen showed at each stage and check it matches what you expected.',
      predict:'Before testing, write down the exact sequence of numbers you expect to see for: A, A, A, A, A, B, A, A.',
      hints:[
        '“change count by 1” adds to what is already there. “set count to 0” replaces it.',
        'Showing the number is a separate step from changing it. Both belong inside the button block.',
        'If the number never appears, check whether you are showing the variable or showing a fixed number.'
      ],
      check:'Add a rule so that the board shows a special icon when count reaches 10. Predict what happens if you press A past 10.',
      extend:'Make B subtract one instead of resetting. What is different about how you have to think now?',
      coach:'Ask what the variable means right now, and which button is allowed to change it. Naming the meaning is harder than naming the number.' },
    { strand:'Interactive Software',
      objective:'I can use a variable to remember a changing value on a device, and reset it correctly.',
      ready:'MakeCode is open and a variable called count has been created.',
      success:[
        'I wrote down the expected sequence of numbers before testing.',
        'A adds one and B resets to zero, and the screen matches what I expected.',
        'I can explain the difference between “change by 1” and “set to 0”.'
      ],
      evidence:'A written predicted sequence matched against what the simulator actually showed.',
      stretch:'Predict the behaviour of a counter that both adds and subtracts.',
      adult:'Reset is the part that gets skipped. A counter that cannot start again has not really been finished.' },
    { why:'A variable is the device remembering something between events. Without it, every button press would start from nothing and a score, a tally or a timer would be impossible.',
      worked:[
        'Create the variable and decide out loud what it means before writing any code.',
        'Make A change it and show it, so you can see the memory working.',
        'Add the reset last, and test the whole sequence rather than one press at a time.'
      ],
      debug:[
        ['The number never changes','“set” may be being used where “change” was needed.','Check whether the block says set count to 1 or change count by 1.'],
        ['The screen shows the same number always','A fixed number may be being shown instead of the variable.','Drag the count variable itself into the show number block.'],
        ['Reset does nothing','The reset block may be attached to the wrong event.','Check that block sits inside “on button B pressed”.'],
        ['The count jumps by two','Two change blocks may be stacked, or two events may be firing.','Look for a duplicate change block inside the same button rule.']
      ],
      ladder:['Foundation: the number goes up.','Secure: it resets correctly for a new count.','Transfer: reason about a counter that also goes down.'],
      real:'Every scoreboard, step counter and ticket queue is exactly this: a remembered number with rules about what may change it.',
      remember:'“Change by” adds to what is there. “Set to” throws it away and starts again.' },
    [['🆕','Make a variable'],['🔘','A adds one'],['🖥️','Show the number'],['🔄','B resets to zero'],['✅','Check the sequence']],
    { q:'What is the difference between “change count by 1” and “set count to 1”?',
      opts:['Change adds to what is already there; set replaces it','They do the same thing','Set is faster'],
      ans:0,
      explain:'Confusing these two is the most common variable bug there is.' },
    ['Variables','State','Events','Prediction','Testing'],
    ['Variables','Events']
  );

  add(
    { id:'nkm4', icon:'📏', title:'Where Is the Line?', concept:'Measurement + thresholds', mins:25,
      goal:'Find the exact value where a rule flips, and test just either side of it.',
      setup:'Open MakeCode with your nightlight project from earlier, or rebuild a simple “if light level < 50” rule. You need the light slider on the simulator.',
      challenge:'Your rule flips somewhere. Find exactly where. Show the raw light level on the screen, then move the slider one small step at a time until the behaviour changes. Write down the last reading before it flipped and the first reading after. Then set the threshold to three different values and, for each one, predict the flip point before testing it.',
      predict:'Before testing each threshold, write down the reading at which you expect the behaviour to change.',
      hints:[
        'Show the number on screen at the same time as the rule runs, so you can see the reading and the behaviour together.',
        'Move the slider in tiny steps near the flip. Big jumps will skip straight over the interesting part.',
        'The flip point should match your threshold number. If it does not, that is worth investigating, not ignoring.'
      ],
      check:'Someone sets a threshold of 200 in a room that never reads above 150. Predict what their nightlight will do, and explain why.',
      extend:'Make the light turn on at one value and off at a different, lower value. Why might a real designer want that gap?',
      coach:'Steer away from “it works”. The question is where it stops working, and whether that matches the number in the code.' },
    { strand:'Measurement & Data',
      objective:'I can find the value at which a threshold rule changes behaviour, and check it matches the number in my code.',
      ready:'A working threshold rule and the raw reading visible on the simulator screen.',
      success:[
        'I recorded the last reading before the flip and the first reading after it.',
        'I predicted the flip point for three different thresholds before testing each.',
        'I can say whether the flip point matched the number in my code.'
      ],
      evidence:'Recorded readings either side of the flip, for more than one threshold.',
      stretch:'Explain what a gap between the on-value and the off-value would fix.',
      adult:'Testing in the middle of a range proves nothing. The boundary is where every threshold system actually fails.' },
    { why:'A rule is obvious in the middle of a range and ambiguous at the edge. Real sensor readings spend a lot of time sitting right at the edge, wobbling.',
      worked:[
        'Display the raw reading alongside the behaviour, so you can see both at once.',
        'Approach the flip point slowly from one side and record the last reading before it changes.',
        'Change the threshold and predict the new flip point before touching the slider.'
      ],
      debug:[
        ['The flip point does not match my number','The comparison may be the other way round, or reading a different sensor.','Read your condition out loud and check it against what you intended.'],
        ['I cannot find a flip point at all','The threshold may be outside the range the slider can produce.','Note the highest and lowest readings you can reach, then pick a threshold inside that range.'],
        ['The behaviour flickers around the flip','Readings vary slightly even when nothing moves.','That is the real problem this mission is teaching. Describe it before trying to fix it.'],
        ['The number on screen updates too slowly to read','The display is competing with the rule for time.','Slow the loop down slightly, or show the number less often.']
      ],
      ladder:['Foundation: find one flip point.','Secure: predict flip points for new thresholds.','Transfer: explain why a gap between on and off helps.'],
      real:'Thermostats use exactly this trick — a gap between switch-on and switch-off — to stop a boiler firing every few seconds.',
      remember:'The middle of a range proves nothing. Test right on the line.' },
    [['🖥️','Show the reading'],['🎚️','Move slowly'],['⚡','Spot the flip'],['✍️','Record both sides'],['🔁','Try a new threshold']],
    { q:'Why test right at the threshold instead of at the extremes?',
      opts:['The boundary is the only place the rule is ambiguous','Extremes are hard to reach','The middle is more accurate'],
      ans:0,
      explain:'Everything obvious happens away from the line. The line is where the design decision lives.' },
    ['Measurement','Sensors','Conditionals','Data','Testing'],
    ['Measurement','Conditionals']
  );

  add(
    { id:'nkm6', icon:'📊', title:'Ten Readings', concept:'Data + variation', mins:25,
      goal:'Take the same measurement ten times, notice it does not stay still, and say something honest about it.',
      setup:'Open MakeCode and start a new project. You will read the light level repeatedly without touching the slider.',
      challenge:'Make the board show the light level once every second, and write down ten readings without moving the slider at all. They will not all be the same. Write down the highest, the lowest, and roughly the middle. Then write one sentence saying what you can honestly claim about the light level, and one sentence saying what you cannot.',
      predict:'Before you start, write down whether you expect all ten readings to be identical, and why.',
      hints:[
        'Use “forever” with a one-second pause, and show the number each time round.',
        'Do not touch the slider. Every change you see is the measurement wobbling, not the room changing.',
        'The honest claim is usually “about X” with a range, not a single exact number.'
      ],
      check:'Someone takes one reading and says the light level is exactly 42. Write one sentence explaining what is wrong with that claim.',
      extend:'Use “plot bar graph” instead of a number, and describe what the graph shows that the number did not.',
      coach:'The valuable sentence is the second one — what they cannot claim. Most learners will want to skip it.' },
    { strand:'Measurement & Data',
      objective:'I can repeat a measurement, describe how much it varies, and state a claim no stronger than my evidence.',
      ready:'A program that shows the light level repeatedly, running in the simulator.',
      success:[
        'I recorded ten readings without changing anything.',
        'I wrote down the highest, the lowest and roughly the middle.',
        'I wrote one thing I can claim and one thing I cannot.'
      ],
      evidence:'Ten recorded readings plus a claim and a stated limitation.',
      stretch:'Predict how much the readings would vary if you took a hundred instead of ten.',
      adult:'“What can you not say from this?” is the question that separates data handling from number collecting.' },
    { why:'Measurements wobble even when nothing changes. If you take one reading and treat it as the truth, you will eventually be confidently wrong.',
      worked:[
        'Collect readings without changing anything, so the only variation you see is the measurement itself.',
        'Summarise with a range and a middle rather than a single number.',
        'Write the claim, then write the limitation, then check the claim is not stronger than the evidence.'
      ],
      debug:[
        ['All ten readings are identical','The simulator may be holding perfectly steady.','Try the temperature reading instead, or change the room brightness very slightly and watch again.'],
        ['The numbers change far too fast to write down','There is no pause in the loop.','Add a one-second pause inside the forever loop.'],
        ['I want to ignore the odd one out','Removing readings you dislike is how measurements start lying.','Keep it in and describe it. An outlier is information.'],
        ['My claim uses one exact number','A single number hides the variation you just measured.','Rewrite it as “about X, between Y and Z”.']
      ],
      ladder:['Foundation: collect repeated readings.','Secure: summarise with a range.','Transfer: judge someone else\u2019s claim against their evidence.'],
      real:'Weather stations, medical monitors and air-quality sensors all report ranges, because a single reading is never the whole story.',
      remember:'One reading is an anecdote. Ten readings is a measurement.' },
    [['⏱️','One per second'],['📝','Write ten down'],['📈','Highest and lowest'],['🎯','What can you claim?'],['🚫','What can you not?']],
    { q:'Ten readings of an unchanged light level are all slightly different. What does that mean?',
      opts:['Measurements always vary a little, so claims need a range','The sensor is broken','Nine of the readings are wrong'],
      ans:0,
      explain:'Variation is normal. Pretending it is not is what produces overconfident claims.' },
    ['Data','Measurement','Testing','Prediction'],
    ['Measurement','Testing']
  );

  add(
    { id:'nkm5', icon:'📻', title:'Send a Secret', concept:'Communication + events', mins:25,
      goal:'Send a message between two simulated boards and make the receiver react differently to different messages.',
      setup:'Open MakeCode and start a new project. As soon as you use a radio block, the simulator shows a second board — that is the one receiving. You do not need two real micro:bits.',
      challenge:'Set the radio group to 1. Make button A send the number 1 and button B send the number 2. Then add “on radio received” so the receiving board shows a happy face for 1 and a sad face for 2. Press A and B and watch the second board react. Then predict what happens if you change one board to a different radio group.',
      predict:'Before testing, say what the receiving board should do when you press A, and what it should do for B.',
      hints:[
        'Both boards must be on the same radio group, or the message goes nowhere.',
        'Sending and receiving are two separate events. One board is doing both jobs here, which is normal.',
        'Inside “on radio received” you get the number that arrived. Your rule decides what it means.'
      ],
      check:'Add a third message and make the receiver respond differently again. What did you have to change on both sides?',
      extend:'Make the receiver send something back to confirm it got the message.',
      coach:'Ask what the number actually means. The board only sends 1 and 2; “happy” and “sad” are meanings the programs agreed on.' },
    { strand:'Communication Systems',
      objective:'I can send a message between devices and make the receiver respond differently to different messages.',
      ready:'MakeCode is open with radio blocks in use and the second simulator board visible.',
      success:[
        'Pressing A and B produces two different reactions on the receiving board.',
        'I can say why both boards must be on the same radio group.',
        'I can explain that the meaning of the number is agreed by the programs, not carried in the message.'
      ],
      evidence:'Both messages demonstrated on the simulator with different receiver behaviour.',
      stretch:'Predict what a receiver on the wrong group will do, then show it.',
      adult:'The idea worth landing: a message carries a number, and both sides have to already agree what it means.' },
    { why:'Machines that talk to each other send bare data. The meaning lives in an agreement between the two programs, not in the message itself.',
      worked:[
        'Set the radio group first, before anything else, on both sending and receiving code.',
        'Send one message and get the receiver reacting at all, before adding a second.',
        'Add the second message and check the receiver can tell the two apart.'
      ],
      debug:[
        ['The second board never reacts','The radio groups may not match, or there is no receive block.','Check the group number is set, and that an “on radio received” block exists.'],
        ['Both messages do the same thing','The receiver may not be checking which number arrived.','Add a rule inside the receive block that tests the received number.'],
        ['Messages arrive twice','Two send blocks may be firing from one press.','Look for a duplicate send block inside the button rule.'],
        ['Nothing happens at all','The radio group may never have been set.','Add “radio set group 1” inside an “on start” block.']
      ],
      ladder:['Foundation: one message arrives.','Secure: two messages, two different reactions.','Transfer: predict what a mismatched group does.'],
      real:'Wi-Fi, car key fobs and contactless cards all work this way: a number plus a prior agreement about what it means.',
      remember:'The radio carries a number. The meaning is something both programs already agreed.' },
    [['📡','Set the group'],['🔘','A sends 1'],['🔘','B sends 2'],['📻','Second board hears'],['🙂','Different reactions']],
    { q:'Your board sends the number 1 and the other shows a happy face. Where does the meaning “happy” come from?',
      opts:['From an agreement written into both programs','It travels inside the radio message','From the radio group number'],
      ans:0,
      explain:'The radio only carries a number. Both sides have to already agree what that number stands for.' },
    ['Events','Input / output','State','Testing','Debugging'],
    ['Events','Input / output']
  );

  /* Scratch first, then the same ideas on a device: that jump is the transfer evidence. */
  window.INVENTORLAB_NO_KIT_PATHS = window.INVENTORLAB_NO_KIT_PATHS || {};
  window.INVENTORLAB_NO_KIT_PATHS.Explorer = [
    'ct2',   // precise instructions, unplugged
    'nk1',   // Scratch — sequencing
    'nk2',   // paper — pattern recognition
    'nk3',   // Scratch — loops
    's1',    // Scratch — events
    'nk4',   // Scratch — conditionals
    's2',    // Scratch — variables
    'nkm1',  // micro:bit sim — input/output
    'nkm2',  // micro:bit sim — sensors + conditionals
    'nkm3',  // micro:bit sim — variables on a device
    'nk5',   // Scratch — debugging
    'nkm4',  // micro:bit sim — thresholds
    'nk6',   // paper — fair testing
    'nkm6',  // micro:bit sim — data and variation
    'nkm5',  // micro:bit sim — communication
    'nk7',   // Scratch — comparing algorithms
    'nk8',   // Scratch — integration
    'nk9',   // unplugged — transfer
    'nk10'   // Scratch — capstone
  ];
})();

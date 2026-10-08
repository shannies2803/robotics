/*
  nokit_engineer.js — closing the Engineer gap.

  The browser-only Engineer path was 8 missions against Explorer's 19, and it was almost
  entirely Python. Two whole strands were gated behind hardware that a simulator handles
  perfectly well:

    • Tinkercad Circuits simulates the Arduino, the breadboard and the components, including
      burning parts out when the wiring is wrong. That is embedded systems, for free, with
      the added benefit that a short circuit costs nothing.
    • Tinkercad 3D is full browser CAD. Designing and measuring a part needs no printer;
      only the final print does, and a library or makerspace can do that from the file.

  These eight bring the Engineer path to 16 and add Embedded Systems, Design & Fabrication,
  Software Engineering depth, Reliability and Human-System Interfaces.
*/
(function () {
  const L = window.INVENTORLAB_LESSONS = window.INVENTORLAB_LESSONS || [];
  const DEEP = window.INVENTORLAB_DEEP = window.INVENTORLAB_DEEP || {};
  const BP = window.INVENTORLAB_STUDIO_BLUEPRINTS = window.INVENTORLAB_STUDIO_BLUEPRINTS || {};
  const CHK = window.INVENTORLAB_EXTRA_CHECKS = window.INVENTORLAB_EXTRA_CHECKS || {};
  const SK = window.INVENTORLAB_EXTRA_SKILLS = window.INVENTORLAB_EXTRA_SKILLS || {};
  const PRE = window.INVENTORLAB_EXTRA_PREREQS = window.INVENTORLAB_EXTRA_PREREQS || {};

  function add(m, bp, deep, chk, skills, pre) {
    m.level = 'engineer'; m.quality = 'studio';
    L.push(m); BP[m.id] = bp; DEEP[m.id] = deep; CHK[m.id] = chk;
    SK[m.id] = skills; PRE[m.id] = pre;
  }

  /* ---------- Embedded systems, simulated ---------- */

  add(
    { id:'nke5', icon:'💡', title:'Breadboard Without a Board', tool:'Arduino', simulator:true,
      concept:'Circuits + current', mins:40,
      goal:'Build a working LED circuit in a simulator and find out, safely, what the resistor is actually for.',
      setup:'Open Tinkercad Circuits and start a new circuit. Drag in an Arduino Uno, a breadboard, an LED and a 220-ohm resistor. Everything here is simulated, so a mistake costs nothing.',
      challenge:'Wire an LED to pin 13 through the resistor and make it blink once a second. Get that working first. Then — deliberately — rebuild the same circuit with the resistor removed, run the simulation, and record exactly what Tinkercad reports. Put the resistor back and try two other values (say 1k and 10k), recording the brightness each time.',
      predict:'Before running the resistor-free version, write down what you think will happen and why.',
      hints:[
        'The long leg of the LED is the anode and goes to the positive side. If nothing lights, try it the other way round first.',
        'Tinkercad tells you when a component burns out. That message is the result, not a failure — write it down.',
        'Brightness changes are easier to judge if you only change the resistor and leave everything else alone.'
      ],
      check:'Someone says "the resistor makes the LED dimmer". Write one sentence saying what is right and what is wrong about that.',
      extend:'Add a second LED on a different pin and make the two alternate.',
      coach:'The burnout is the lesson. Do not warn them off it — in a simulator, destroying a part is the cheapest teaching there is.' },
    { strand:'Embedded Systems',
      objective:'I can build a basic LED circuit and explain what the current-limiting resistor does, from evidence I produced.',
      ready:'Tinkercad Circuits is open with an Arduino, breadboard, LED and resistor placed.',
      success:[
        'The LED blinks on a one-second cycle with the resistor in place.',
        'I recorded exactly what the simulator reported with the resistor removed.',
        'I tested at least three resistor values and can describe the effect of each.'
      ],
      evidence:'Recorded simulator output for the resistor-free run, plus brightness observations at three values.',
      stretch:'Predict the brightness at a value you have not tried, then test it.',
      adult:'Ask what the resistor protects and from what. "It makes it dimmer" is a symptom, not the function.' },
    { why:'The resistor is not a dimmer switch. Without it the LED draws far more current than it is built for, and the part fails. Dimness is a side effect of the thing that is actually keeping it alive.',
      worked:[
        'Get the safe circuit working first so you know what correct looks like.',
        'Remove the resistor and run it, recording the simulator’s exact report rather than paraphrasing.',
        'Change only the resistor value across several runs and compare brightness against the same baseline.'
      ],
      debug:[
        ['The LED never lights','It may be reversed, or the circuit may not be complete.','Check the long leg goes toward positive, and trace the loop back to ground.'],
        ['Tinkercad reports a burnt component','That is the expected result without a current limit.','Record the exact message, then put the resistor back and confirm it recovers.'],
        ['The LED is on constantly rather than blinking','The code may not be driving the pin, or the pin number is wrong.','Check the pin in the code matches the pin the LED is wired to.'],
        ['Brightness looks the same at every value','The values chosen may be too close together.','Try values that differ by a factor of ten, not by a little.']
      ],
      ladder:['Foundation: a working blink.','Secure: evidence of what the resistor prevents.','Transfer: predict behaviour at an untested value.'],
      real:'Every LED in every device you own has one of these. It is the most common component in consumer electronics for exactly this reason.',
      remember:'The resistor limits current. Dimmer is the side effect, not the job.' },
    { q:'Why does an LED need a resistor in series with it?',
      opts:['To limit the current so the LED is not destroyed','To make the light a nicer colour','To slow the blinking down'],
      ans:0,
      explain:'Without a current limit the LED draws more than it can survive. Reduced brightness is a side effect.' },
    ['Input / output','Measurement','Prediction','Testing'],
    []
  );

  add(
    { id:'nke6', icon:'🎛️', title:'Read an Analog Sensor', tool:'Arduino', simulator:true,
      concept:'Analog input + mapping', mins:45,
      goal:'Turn a meaningless raw sensor number into a value that means something, and know the range you are working in.',
      setup:'Open Tinkercad Circuits with an Arduino Uno. Add a potentiometer (or a photoresistor with a 10k resistor) wired to analog pin A0. Open the Serial Monitor before you start — you will be reading numbers, not watching lights.',
      challenge:'Print the raw analogRead value to the Serial Monitor continuously. Turn the dial slowly from one end to the other and record the actual minimum and maximum you observe — do not assume it is 0 and 1023. Then convert that raw range into something meaningful: a percentage, or an angle in degrees. Verify your conversion at three points: both ends and the middle.',
      predict:'Before reading anything, write down what range of numbers you expect analogRead to return.',
      hints:[
        'analogRead on an Uno gives 0 to 1023 in theory. What you actually get at the ends is worth measuring rather than assuming.',
        'map() will do the conversion, but work out one value by hand first so you can tell if map is doing what you think.',
        'Check the middle, not just the ends. A conversion can be right at both extremes and wrong everywhere between.'
      ],
      check:'Your sensor only ever reads between 200 and 800 in practice. Explain what goes wrong if you map from 0–1023 anyway.',
      extend:'Add a second sensor and display both, clearly labelled, in the same Serial output.',
      coach:'Press on the difference between the raw number and the meaning. The sensor never knows it is measuring an angle.' },
    { strand:'Sensing & Control',
      objective:'I can measure a sensor’s real working range and convert raw readings into a meaningful unit I can verify.',
      ready:'A potentiometer or photoresistor is wired to A0 and the Serial Monitor is open.',
      success:[
        'I recorded the actual minimum and maximum, rather than assuming 0 and 1023.',
        'My conversion is verified at both ends and the middle.',
        'I can explain what the raw number is and where the meaning comes from.'
      ],
      evidence:'Recorded observed range plus three verified conversion points.',
      stretch:'Explain the error introduced by mapping from an assumed range instead of a measured one.',
      adult:'The middle check is the one that catches a wrong conversion. Ends alone can both be right by accident.' },
    { why:'An analog sensor hands over a number on an arbitrary scale. Turning that into degrees, percent or lux is a decision you make, and it is only as good as the range you measured.',
      worked:[
        'Print raw values and sweep the full physical range, noting the true extremes.',
        'Work out one conversion by hand so you have something to check the code against.',
        'Verify at three points, including the middle, before trusting the conversion anywhere.'
      ],
      debug:[
        ['Readings jump around when nothing is moving','Analog inputs are noisy; this is normal and worth measuring.','Take several readings and average them, then compare the spread.'],
        ['The value never reaches the ends of the range','The component may not physically travel the full sweep.','Record what it actually reaches and map from those numbers instead.'],
        ['The conversion is right at the ends but wrong in the middle','The mapping is probably inverted or the ranges are mismatched.','Check one middle value by hand and compare against what the code produces.'],
        ['The Serial Monitor shows nothing','Serial may not be started, or the baud rates may not match.','Check Serial.begin is present and the monitor is set to the same rate.']
      ],
      ladder:['Foundation: raw values appear.','Secure: a verified conversion into a real unit.','Transfer: reason about error from an assumed range.'],
      real:'Every thermometer, light meter and fuel gauge does this conversion, and every one of them is calibrated against a measured range.',
      remember:'The sensor gives a number. The unit is a decision you have to justify.' },
    { q:'Your sensor really only spans 200 to 800, but you map from 0 to 1023. What happens?',
      opts:['The converted values are compressed and never reach the true ends','Nothing, map corrects for it automatically','The sensor breaks'],
      ans:0,
      explain:'Mapping from a range wider than reality means your output never uses its full span, and every value in between is off.' },
    ['Sensors','Measurement','Data','Calibration','Testing'],
    ['Measurement']
  );

  add(
    { id:'nke7', icon:'🔘', title:'Debounce a Button', tool:'Arduino', simulator:true,
      concept:'Messy inputs + timing', mins:45,
      goal:'Discover that one button press is not one event, and fix it with evidence rather than guesswork.',
      setup:'Open Tinkercad Circuits with an Arduino Uno, a pushbutton and a 10k pull-down resistor. Open the Serial Monitor — you will be counting, not looking.',
      challenge:'Write code that counts button presses and prints the running total. Press it ten times, deliberately and slowly, and compare the count to ten. Then press it ten times quickly and compare again. Record both counts before changing anything. Now fix it so ten presses reliably means ten, and prove the fix with another ten-press test at both speeds.',
      predict:'Before testing, write down what count you expect after ten deliberate presses.',
      hints:[
        'A mechanical contact bounces open and closed for a few milliseconds. The processor is fast enough to see every bounce.',
        'Before adding a fix, decide what you are detecting: the state of the button, or the moment it changes.',
        'A fix that requires pressing slowly is not a fix. Test it fast too.'
      ],
      check:'Explain why a delay long enough to fix bouncing might be a bad idea in a program that has other work to do.',
      extend:'Make the fix work without blocking, so the rest of the program keeps running.',
      coach:'Let them discover the miscount before you name it. The gap between ten presses and fourteen counts is the whole motivation.' },
    { strand:'Embedded Systems',
      objective:'I can identify an input-reliability problem from measurements and verify that my fix actually holds.',
      ready:'A pushbutton circuit that prints a running count to Serial.',
      success:[
        'I recorded the faulty count at both slow and fast pressing, before fixing anything.',
        'Ten presses now reliably reports ten, at both speeds.',
        'I can explain what the processor was actually seeing.'
      ],
      evidence:'Before and after counts from the same ten-press procedure at two speeds.',
      stretch:'Explain the cost of a blocking fix in a program that also has to do other work.',
      adult:'Ask what a "press" actually is to the processor. It is not one thing — that is the whole insight.' },
    { why:'Physical switches do not close cleanly. The contacts bounce for a few milliseconds and a processor running millions of instructions a second sees every one of those bounces as a separate event.',
      worked:[
        'Measure the wrong behaviour first, at more than one pressing speed, so you know the size of the problem.',
        'Decide whether you care about the button’s state or the moment it changes — they need different code.',
        'Apply one fix and re-run the identical test rather than eyeballing it.'
      ],
      debug:[
        ['The count jumps by several per press','That is contact bounce, and it is the expected starting point.','Record the actual numbers before changing anything.'],
        ['The count never changes','The button may be wired wrong or the pull-down is missing.','Print the raw pin reading and watch it while pressing.'],
        ['The fix works slowly but fails when pressing fast','The fix is probably discarding real presses along with bounces.','Reduce the ignore window and re-test at both speeds.'],
        ['The program feels sluggish after the fix','A blocking delay stops everything else too.','Time the gap between changes instead of pausing the whole program.']
      ],
      ladder:['Foundation: reproduce the miscount.','Secure: reliable counts at both speeds.','Transfer: reason about blocking versus non-blocking fixes.'],
      real:'Every keyboard, lift button and game controller has this handled somewhere, usually in hardware and software both.',
      remember:'One press is not one event. Measure it before you fix it.' },
    { q:'Ten deliberate presses report fourteen. What is the most likely cause?',
      opts:['The contacts bounce, and the processor counts each bounce','The button is broken','The Serial Monitor duplicates lines'],
      ans:0,
      explain:'Mechanical contacts bounce for a few milliseconds, and a fast processor sees every transition.' },
    ['Input / output','Debugging','Measurement','Testing','Iteration'],
    ['Debugging','Measurement']
  );

  /* ---------- Design and fabrication, simulated ---------- */

  add(
    { id:'nke8', icon:'📐', title:'Design a Part That Actually Fits', tool:'3D Printing', simulator:true,
      concept:'CAD + tolerance', mins:50,
      goal:'Model a part to real measurements and understand why a perfect model still would not fit.',
      setup:'Open Tinkercad and start a new design. Find a real object to design around — a pencil, a phone, a cable. You need a ruler. Designing and measuring needs no printer.',
      challenge:'Measure your object in three dimensions and write the numbers down before you open any shape. Model a holder or clip for it, built exactly to those measurements. Then work out the problem: if you printed this at exactly the measured size, would it fit? Produce a second version with a deliberate clearance gap, and write down how much you added and why.',
      predict:'Before modelling, write down your three measurements and how confident you are in each to the nearest millimetre.',
      hints:[
        'Measure three times. If you get three different numbers, that spread is itself information about your tolerance.',
        'Tinkercad’s ruler tool lets you set exact dimensions rather than dragging by eye. Use it.',
        'A hole exactly the size of the object leaves no room for the object, the print, or your measuring error.'
      ],
      check:'Your measurement was 12mm and you modelled a 12mm hole. List three separate reasons it might still not fit.',
      extend:'Design it so the same part works for two objects of slightly different sizes.',
      coach:'Ask how confident they are in each measurement. Tolerance follows directly from that answer rather than from a rule of thumb.' },
    { strand:'Design & Fabrication',
      objective:'I can model a part to measured dimensions and justify the clearance I added.',
      ready:'A real object, a ruler, and three written measurements taken before any modelling.',
      success:[
        'I wrote my measurements down before opening a shape, and measured more than once.',
        'My model uses exact dimensions rather than dragged-by-eye shapes.',
        'I produced a version with clearance and can say how much I added and why.'
      ],
      evidence:'Written measurements with their spread, plus a stated clearance and the reasoning behind it.',
      stretch:'Explain how your clearance would change for a looser or tighter fit requirement.',
      adult:'"How sure are you of that number?" is the question that makes tolerance make sense.' },
    { why:'A model is exact and reality is not. Your ruler, your eyes, the printer and the material all introduce error, and the clearance you add is your estimate of all of it combined.',
      worked:[
        'Measure repeatedly and note the spread before modelling anything.',
        'Build to exact numbers using the dimension tools, not by dragging.',
        'Add clearance as a deliberate decision with a stated size, not as a fudge.'
      ],
      debug:[
        ['My three measurements disagree','That spread is real and useful information.','Use the largest as your base and let the spread inform your clearance.'],
        ['The model looks right but the numbers are odd','Shapes dragged by eye rarely land on exact values.','Select the shape and type the dimensions in directly.'],
        ['I do not know how much clearance to add','It follows from your measurement confidence, not from a rule.','Start from your measurement spread and add a little for the process.'],
        ['The part is enormous or tiny','Units may have been misread between millimetres and something else.','Check the dimension units in Tinkercad against your ruler.']
      ],
      ladder:['Foundation: a model built to numbers.','Secure: a justified clearance.','Transfer: adjust clearance for a different fit requirement.'],
      real:'Every manufactured part that has to meet another part carries a tolerance specification for exactly this reason.',
      remember:'The model is exact. Everything else is not. Clearance is your estimate of the difference.' },
    { q:'You measured 12mm and modelled a 12mm hole. Why might it still not fit?',
      opts:['Measurement error, print variation and zero clearance all work against you','Tinkercad rounds everything up','12mm is too small for any object'],
      ans:0,
      explain:'A model is exact; the ruler, the printer and the material are not. Clearance covers the difference.' },
    ['Measurement','Calibration','Decomposition','Prediction','Iteration'],
    ['Measurement']
  );

  /* ---------- Software engineering depth ---------- */

  add(
    { id:'nke9', icon:'🗂️', title:'Structure Your Data', tool:'Python', simulator:false,
      concept:'Data structures + justification', mins:45,
      goal:'Choose how to store information on purpose, and defend the choice against a real alternative.',
      setup:'Open the browser Python editor. You will be storing information about at least six things — students, robots, sensor stations, whatever suits you.',
      challenge:'Store your six items twice: once using parallel lists, and once using a list of dictionaries. Then write the same three operations against both versions — find one item by name, add a new item, and change one field of one item. Count the lines each version needs and note which one let you make a mistake more easily.',
      predict:'Before writing either version, say which you think will be easier for the "change one field" operation, and why.',
      hints:[
        'Parallel lists means names[2] and scores[2] refer to the same thing. What happens if you sort only one of them?',
        'Write the find operation first in both. It is the one that exposes the difference fastest.',
        'Count lines, but also count the places where you could get an index wrong.'
      ],
      check:'Someone stores the data as parallel lists and sorts one of them. Describe exactly what breaks and why nothing warns them.',
      extend:'Add a seventh field to every item in both versions. Which change was safer?',
      coach:'Push past "dictionaries are better". Ask what specifically goes wrong with parallel lists, and when they would still be reasonable.' },
    { strand:'Software Engineering',
      objective:'I can choose a data structure deliberately and justify it against a working alternative.',
      ready:'The Python editor is open and six items of data are decided on.',
      success:[
        'Both versions work and support all three operations.',
        'I can name a specific failure that parallel lists allow and dictionaries prevent.',
        'My preference has a reason beyond "it is shorter".'
      ],
      evidence:'Two working implementations plus a named, specific failure mode.',
      stretch:'Describe a situation where parallel lists would still be the reasonable choice.',
      adult:'The sorting question is the sharpest one here — silent corruption with no error message.' },
    { why:'How you store data decides which mistakes are possible. Parallel lists let the connection between related values break silently, and nothing tells you.',
      worked:[
        'Implement both fully rather than arguing about them in the abstract.',
        'Run the same three operations against each so the comparison is fair.',
        'Look for the mistakes each structure makes possible, not just the line count.'
      ],
      debug:[
        ['My parallel lists got out of order','That is the failure this mission is about.','Show exactly which item now has the wrong value, and note that nothing errored.'],
        ['Finding an item needs a loop in both versions','That is expected at this size.','Compare what happens to each version as the data grows instead.'],
        ['KeyError when reading a dictionary','A field name is missing or misspelled.','Print the whole dictionary and compare the key names character by character.'],
        ['Both versions look about the same length','Length is only one axis.','Compare how easy it is to make an undetected mistake in each.']
      ],
      ladder:['Foundation: both versions work.','Secure: a specific named failure mode.','Transfer: identify when the weaker option is still reasonable.'],
      real:'Most real data bugs are not crashes. They are values quietly attached to the wrong record.',
      remember:'A structure does not just store data. It decides which mistakes are possible.' },
    { q:'You store names and scores as two parallel lists, then sort only the scores. What happens?',
      opts:['Names and scores no longer match, and nothing warns you','Python raises an error','Both lists sort together automatically'],
      ans:0,
      explain:'Silent corruption is the danger: the program keeps running and every answer afterwards is wrong.' },
    ['Decomposition','Variables','State','Algorithms','Debugging'],
    ['Variables','Functions']
  );

  add(
    { id:'nke10', icon:'🛡️', title:'Make It Fail Safely', tool:'Python', simulator:false,
      concept:'Validation + reliability', mins:40,
      goal:'Make a program survive input it was not expecting, and decide deliberately what it should do.',
      setup:'Open the browser Python editor. Start from a small program that asks for a number and does something with it — reuse an earlier one if you have it.',
      challenge:'Attack your own program with six inputs: a normal value, an empty entry, text where a number is expected, a negative number, a huge number, and a decimal where you expected a whole one. Record what happens for each before changing anything. Then decide — and write down — what each one SHOULD do, and make it do that. Reject, correct, or accept: all three are valid, but the choice must be deliberate.',
      predict:'Before running your six inputs, write down which you think will crash it.',
      hints:[
        'Crashing is one possible behaviour. Silently accepting nonsense is usually worse, because nothing tells anyone.',
        'Decide the intended behaviour before writing the fix, or you will just suppress errors.',
        'A rejection should say what was wrong and what is acceptable, not just refuse.'
      ],
      check:'Your program now accepts a negative number where only positives make sense. Say whether that is a bug, and how you decided.',
      extend:'Add one more hostile input nobody would think of, and handle it too.',
      coach:'Watch for blanket try/except that swallows everything. That hides problems rather than handling them.' },
    { strand:'Software Engineering',
      objective:'I can predict how a program fails on unexpected input and choose deliberately how it should respond.',
      ready:'A small working program that takes an input.',
      success:[
        'I recorded the original behaviour for all six inputs before fixing anything.',
        'For each input I wrote down what it should do, then made it do that.',
        'My error messages say what was wrong and what would be acceptable.'
      ],
      evidence:'A six-row before-and-after table of input, original behaviour, intended behaviour and result.',
      stretch:'Identify a hostile input you did not think of at first, and explain how you found it.',
      adult:'A single try/except wrapped round everything is the thing to catch. It converts a visible failure into an invisible one.' },
    { why:'Programs meet input their author never imagined. The question is never whether that happens but whether the program fails loudly, fails quietly, or handles it — and quiet failure is the one that causes real damage.',
      worked:[
        'Record the existing behaviour for every hostile input before touching the code.',
        'Write the intended behaviour down as a decision, one line per input.',
        'Implement each decision separately so you can tell which handler did what.'
      ],
      debug:[
        ['One try/except now catches everything','You have hidden the problems rather than handled them.','Handle each expected failure separately and let genuine surprises surface.'],
        ['The program accepts nonsense without complaint','Silent acceptance is usually worse than a crash.','Decide what valid means and state it explicitly in the check.'],
        ['My error message just says "invalid"','That tells the user nothing actionable.','Say what was wrong and what would be accepted instead.'],
        ['It still crashes on an input I handled','The check may be running after the conversion that fails.','Validate before converting, not after.']
      ],
      ladder:['Foundation: observe the failures.','Secure: a deliberate decision per input.','Transfer: find a hostile input nobody suggested.'],
      real:'Most security problems and most data corruption start as input somebody assumed would never arrive.',
      remember:'Failing loudly is fine. Failing quietly is the dangerous one.' },
    { q:'Which failure mode is usually the most dangerous?',
      opts:['Accepting bad input silently and carrying on','Crashing with a clear error','Refusing the input and saying why'],
      ans:0,
      explain:'A crash is visible. Silent acceptance corrupts everything downstream with nobody knowing.' },
    ['Testing','Debugging','Conditionals','Prediction','Iteration'],
    ['Conditionals','Debugging']
  );

  add(
    { id:'nke11', icon:'⚡', title:'Two Algorithms, Measured', tool:'Python', simulator:false,
      concept:'Algorithms + measurement', mins:45,
      goal:'Compare two working solutions with a stopwatch instead of an opinion.',
      setup:'Open the browser Python editor. You will need Python’s time module and a way to generate lists of different sizes.',
      challenge:'Write two different ways to find whether a value exists in a sorted list: checking every item in turn, and halving the search range each time. Both must work — verify that first. Then time both on lists of 100, 1000 and 10000 items, running each several times. Record all nine measurements. Then answer: at what size does the difference start to matter, and is either one ever the better choice?',
      predict:'Before timing anything, write down which will win at 100 items and which at 10000, and by roughly how much.',
      hints:[
        'Verify correctness first. A fast wrong answer is worth nothing.',
        'Time each measurement more than once. Single timings on a shared machine are noisy.',
        'The interesting question is not which is faster but where the lines cross.'
      ],
      check:'Your fast version needs the list sorted first. Explain when that sorting cost changes which approach you should choose.',
      extend:'Plot or sketch your nine measurements and describe the shape of each curve.',
      coach:'The sorting prerequisite is the real insight. "Faster" is only true once you count everything the approach requires.' },
    { strand:'Algorithms & Decomposition',
      objective:'I can compare two correct algorithms with measurements and say when each is the better choice.',
      ready:'Both search functions written and verified correct on a small list.',
      success:[
        'Both versions return correct answers, checked before any timing.',
        'I have nine timings from three list sizes, each repeated.',
        'I can say where the difference starts to matter and name a case where the simpler one wins.'
      ],
      evidence:'Nine recorded timings plus a stated crossover point.',
      stretch:'Account for the cost of sorting in the comparison and say how it changes the answer.',
      adult:'"Which is faster" is incomplete. Faster including what setup, and at what size?' },
    { why:'Performance claims are testable. Two correct algorithms can differ enormously, but which one wins depends on size and on what each one requires before it can run at all.',
      worked:[
        'Prove both correct before measuring anything.',
        'Measure across several sizes, repeating each, because one timing is noise.',
        'Count the prerequisites too — an approach that needs sorted input is not free.'
      ],
      debug:[
        ['Both times come out as zero','The lists are too small to measure at this resolution.','Increase the sizes, or repeat the operation many times and divide.'],
        ['Timings vary a lot between runs','Shared machines are noisy; this is normal.','Repeat and take the best or the median, and say which you used.'],
        ['The halving version gives wrong answers','It almost certainly requires sorted input.','Verify on a sorted list, and note that requirement as part of its cost.'],
        ['The simple version wins at every size I tried','Your sizes may all be below the crossover.','Try a much larger list and look again.']
      ],
      ladder:['Foundation: both correct.','Secure: measured across sizes.','Transfer: account for prerequisites in the comparison.'],
      real:'Engineering teams benchmark before optimising, because intuition about performance is wrong remarkably often.',
      remember:'Measure, do not assume. And count what the fast option requires.' },
    { q:'Your halving search is far faster, but needs a sorted list. When does that matter?',
      opts:['When you only search once, the sorting may cost more than it saves','Never, sorting is always free','Only on lists under 100 items'],
      ans:0,
      explain:'A prerequisite is part of the cost. Sorting once to search once is often a net loss.' },
    ['Algorithms','Optimisation','Measurement','Data','Testing'],
    ['Algorithms','Measurement']
  );

  add(
    { id:'nke12', icon:'🌐', title:'Ship a Page Someone Can Actually Use', tool:'HTML/CSS/JavaScript', simulator:false,
      concept:'Accessibility + real testing', mins:55,
      goal:'Build a page that works for someone who is not you, on a device that is not yours.',
      setup:'Open the browser code editor. You are building one page with a purpose — a form, a tool, a summary of something. Decide what it is before you start.',
      challenge:'Build the page, then put it through four tests and record what each one revealed. One: use it with the keyboard only, no mouse at all. Two: check it at a narrow phone width and a wide one. Three: hand it to a real person and say nothing while they use it. Four: make every image and control understandable without seeing it — alt text and labels. Fix at least three things your tests exposed.',
      predict:'Before testing, write down which of the four you expect to fail worst.',
      hints:[
        'Keyboard only means Tab and Enter. If you cannot reach a control, nobody using a keyboard can.',
        'Watching someone in silence is unbearable and it is the most useful minute of the whole mission.',
        'A label is not decoration. It is how a screen reader knows what a field is for.'
      ],
      check:'Someone says their page is accessible because it looks fine. Explain what that claim misses.',
      extend:'Test it once more with your own stylesheet switched off entirely. Does the content still make sense in order?',
      coach:'Insist on silence during the user test. Every explanation given is a design flaw being papered over.' },
    { strand:'Human-System Interfaces',
      objective:'I can test a page for keyboard access, layout and comprehension, and fix what the tests reveal.',
      ready:'A page with a clear purpose, built and loading.',
      success:[
        'I completed all four tests and recorded what each revealed.',
        'I fixed at least three specific problems the tests exposed.',
        'I watched a real person use it without speaking.'
      ],
      evidence:'Four recorded test results and three specific fixes traced back to them.',
      stretch:'Explain what the unstyled test told you about the order of your content.',
      adult:'The silent observation is the hardest and most valuable part. Every hint given destroys the data.' },
    { why:'A page that works for its author has been tested by exactly one person, on one device, with full knowledge of how it is meant to work. That is the least representative test possible.',
      worked:[
        'Build the thing first, then test deliberately rather than admiring it.',
        'Run each of the four tests separately and write down what each revealed.',
        'Fix specific findings rather than making general improvements.'
      ],
      debug:[
        ['I cannot reach a control with Tab','It is probably not a real button or link.','Use proper button and input elements rather than styled divs.'],
        ['The layout breaks at narrow width','Something has a fixed width larger than the screen.','Look for fixed pixel widths and replace them with flexible ones.'],
        ['My tester kept asking questions','Every question is a finding.','Write each one down instead of answering, and see which part of the page caused it.'],
        ['Everything passed first time','The tests were probably too gentle.','Try the unstyled test, and test with someone who has never seen it.']
      ],
      ladder:['Foundation: the page works for you.','Secure: four tests run and three fixes made.','Transfer: judge someone else’s page against the same tests.'],
      real:'Accessibility is a legal requirement for public services in most countries, and these four tests are roughly where a professional audit starts.',
      remember:'It working for you is the least informative test there is.' },
    { q:'Why is keyboard-only testing worth doing even if the page looks fine?',
      opts:['Controls that are not real buttons cannot be reached at all','It makes the page load faster','It checks the colours'],
      ans:0,
      explain:'Styled divs look like buttons but are invisible to keyboard and screen-reader users.' },
    ['Testing','Iteration','Decomposition','Transfer','Debugging'],
    ['Testing','Decomposition']
  );

  /*
    Rebuilt Engineer path: 16 missions, sequenced so text-based fundamentals come before the
    embedded work that depends on them, and the capstone stays last.
  */
  window.INVENTORLAB_NO_KIT_PATHS = window.INVENTORLAB_NO_KIT_PATHS || {};
  window.INVENTORLAB_NO_KIT_PATHS.Engineer = [
    'e8',      // Scratch — model a robot before touching code
    'nke1',    // Python — syntax and reading errors
    'nke2',    // Python — loops and off-by-one
    'nke3',    // Python — conditionals at the boundary
    'e4',      // Python — blocks to text
    'nke9',    // Python — data structures, justified
    'nke10',   // Python — validation and failing safely
    'nke11',   // Python — two algorithms, measured
    'nke5',    // Tinkercad Circuits — circuits and current
    'nke6',    // Tinkercad Circuits — analog input and mapping
    'nke7',    // Tinkercad Circuits — messy inputs, debouncing
    'nke4',    // Python — calibrating a simulated sensor
    'nke8',    // Tinkercad 3D — CAD and tolerance
    'nke12',   // Web — accessibility and real user testing
    'e10',     // Web — build a mission website
    'i1'       // Capstone
  ];
})();

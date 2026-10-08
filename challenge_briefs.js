/*
  challenge_briefs.js — giving the practice bank an actual task.

  196 of the missions in this build were generated from a template. Their briefs read
  "Solve a new problem that requires sequencing, then explain your approach." There is no
  problem in that sentence. It works if an adult is standing there to invent one, and it is
  a dead end for a child working alone — which is the whole audience of the browser-only path.

  Rather than hand-write 196 missions, this supplies a concrete, self-directable challenge per
  *concept*, with real numbers and a real thing to do. Every brief is deliberately written to
  work in any tool, because the same 21 concepts recur across Scratch, micro:bit, Python,
  Dash, WeDo, SPIKE, Arduino and CAD. The mission still supplies the tool and the context;
  this supplies the task.

  Matching is deterministic: concept keywords are tried first (so "Coordinates" does not get
  the generic prediction brief), then the mission's primary skill. Anything shown from here is
  labelled in the UI as a generated challenge, so hand-authored Studio work stays honest.
*/
(function () {

  /* ---------- Keyed by the mission's primary skill. Covers every mission. ---------- */
  const bySkill = {
    'Sequencing': {
      task: 'Build something that does exactly four steps in a fixed order. Now swap the order of step 2 and step 3 and run it again. Write down what changed and what did not.',
      predict: 'Before you swap them, say what you think swapping steps 2 and 3 will change.',
      done: 'I can say which steps could be reordered safely and which could not, and why.'
    },
    'Loops': {
      task: 'Make your project repeat the same action exactly five times. Build it the long way first — five separate copies — run it and count. Then rebuild it using a loop and prove both versions behave identically.',
      predict: 'Before running the loop version, say how many times the action will happen.',
      done: 'Both versions do the same thing, and I can point at exactly which part goes inside the loop.'
    },
    'Conditionals': {
      task: 'Write a rule so that something happens ONLY when a condition is true. Then prove both halves: show it firing when the condition is true, and show it staying completely quiet when the condition is false.',
      predict: 'Say your rule out loud in the shape "IF ___ THEN ___" before you run it.',
      done: 'I showed the rule firing and not firing, and I can name the question the program keeps asking.'
    },
    'Variables': {
      task: 'Make your project remember a number that changes — a score, a count, a reading. It must start at a known value, change only when one specific thing happens, and reset properly for a second run. Write down the sequence of values you expect before you test.',
      predict: 'Write the exact sequence of values you expect to see, before you run anything.',
      done: 'The values matched my written prediction, and the reset works so a second run starts clean.'
    },
    'Events': {
      task: 'Make two different things start your project in two different ways. Test each one on its own. Then predict what happens if both are triggered at nearly the same moment, and find out.',
      predict: 'Say what each trigger should start, and what you think happens if both fire at once.',
      done: 'Each trigger works alone, and I can describe what happens when they overlap.'
    },
    'Functions': {
      task: 'Find a group of steps your project uses more than once. Pull it out into one named block or function, then call it from both places. Prove the behaviour is unchanged, then change the block once and show both places change together.',
      predict: 'Before you change the shared block, say what will happen in both places that use it.',
      done: 'One edit in one place changed the behaviour everywhere it is used, and nothing else broke.'
    },
    'Debugging': {
      task: 'Break your working project on purpose, in one specific way. Predict the symptom before you run it. Then treat it as a stranger\u2019s bug: change ONE thing at a time, and write down what each change told you until you find the cause.',
      predict: 'Write down the symptom you expect from the break you are about to make.',
      done: 'I have a written trail of at least two tests, and I can say which change proved the cause.'
    },
    'Testing': {
      task: 'Run your project five times in a row without changing anything, keeping the starting conditions identical each time. Write down all five results, including the ones that went wrong. Then say what your five results do and do not prove.',
      predict: 'Before you start, say whether you expect all five runs to come out the same.',
      done: 'I recorded all five runs including the bad ones, and I stated one thing my results cannot prove.'
    },
    'Measurement': {
      task: 'Measure the same thing five times without changing anything. Write every reading down. Report the highest, the lowest and roughly the middle \u2014 then write one sentence about what your numbers cannot tell you.',
      predict: 'Say whether you expect all five measurements to be identical, and why.',
      done: 'I have five recorded readings, a range, and an honest statement of a limitation.'
    },
    'Calibration': {
      task: 'Find something in your project that is consistently off in the same direction \u2014 always a bit far, a bit slow, a bit high. Measure how far off it is across at least five attempts, apply ONE correction based on that average, then re-measure the same way to check.',
      predict: 'Say how much you think it is off by, and in which direction, before measuring.',
      done: 'I have before and after numbers from the same procedure, and I can say what the correction did not fix.'
    },
    'Sensors': {
      task: 'Display the raw reading from a sensor on screen and watch it change as you change the real world around it. Write down the highest and lowest values you can produce. Only then write a rule that uses a number from inside that range.',
      predict: 'Before you look, guess the range of numbers you think the sensor will give.',
      done: 'I know the actual range of my sensor, and my rule uses a number inside it.'
    },
    'Input / output': {
      task: 'Make your project respond differently to two different inputs. Test each one. Then point at your code and name which part is the input and which part is the output for each.',
      predict: 'Say what each input should cause, before you test it.',
      done: 'Two inputs produce two different outputs, and I can name the input and output in each case.'
    },
    'Data': {
      task: 'Collect at least ten readings or results and write them all down. Find the highest, the lowest and the middle. Then write one claim your data supports and one claim it does not, even though someone might want to make it.',
      predict: 'Before collecting, say what pattern you expect to see in the numbers.',
      done: 'Ten recorded values, a summary, and one claim I refused to make.'
    },
    'Prediction': {
      task: 'Before you build anything, write down exactly what you expect your project to do \u2014 be specific enough to be wrong. Build it, run it once, and write down what actually happened. Then explain the gap between the two.',
      predict: 'Write your prediction down where you cannot quietly change it later.',
      done: 'I have a written prediction, a written result, and an explanation of the difference.'
    },
    'Pattern recognition': {
      task: 'Look at your project or a sequence of instructions and find the part that repeats. Circle it. Count how many times it appears. Then write the whole thing the short way, using the repeat.',
      predict: 'Before you look closely, guess how many genuinely different actions there are.',
      done: 'I marked the repeating group and wrote a short version that means exactly the same thing.'
    },
    'Decomposition': {
      task: 'Split your project into three separate pieces that each do one job. Build and test each piece on its own before joining any of them. Then join them one at a time, testing after each join.',
      predict: 'Say which of your three pieces you think will be hardest, and why.',
      done: 'I tested each piece alone first, and when something broke after joining I could say which piece it was in.'
    },
    'Algorithms': {
      task: 'Solve the same problem two different ways. Both must actually work and produce the same result. Then decide which you prefer \u2014 and give a reason that is not just "fewer steps".',
      predict: 'Before building the second version, say how many steps you think it will take.',
      done: 'Two working solutions, same result, and a stated reason for my preference.'
    },
    'Optimisation': {
      task: 'Get your project working first, and measure it \u2014 time it, count the steps, or count the blocks. Write that number down. Now make one change to improve it and measure again the same way. Keep both numbers.',
      predict: 'Say how much better you think your change will make it, before you measure.',
      done: 'I have a before number and an after number from the same measurement, and my project still works.'
    },
    'Iteration': {
      task: 'Get a rough version working, however scrappy. Then make exactly three rounds of improvement. After each round, write one sentence: what you changed, and what it fixed or broke.',
      predict: 'Before round one, write down what you think the weakest part is.',
      done: 'Three recorded rounds, each with a change and its effect \u2014 including any that made things worse.'
    },
    'State': {
      task: 'Give your project two clearly different modes \u2014 on and off, playing and stopped, armed and idle. Make it start in a known mode, switch between them on purpose, and show which mode it is in at all times.',
      predict: 'Say what should happen if you try to switch mode twice quickly.',
      done: 'The current mode is always visible, and I can switch both ways on purpose.'
    },
    'Transfer': {
      task: 'Take the main idea from this project and find it somewhere completely unrelated \u2014 at home, at school, in a game. Describe two examples without using any block names or code words. Then find one thing that looks like the idea but is not, and say where it stops fitting.',
      predict: 'Say the idea in one sentence with no technical words, before you go looking for it.',
      done: 'Two real examples, one non-example, and I explained the idea without naming any blocks.'
    }
  };

  /*
    ---------- Keyed by concept keyword, tried first. ----------
    The template bank has ~55 specific concepts, most of which fall back to "Prediction"
    when read as a skill. A prediction brief is a poor fit for a mission about Coordinates
    or Radio, so these catch the families that deserve their own task.
  */
  const byConceptKeyword = [
    { match: /coordinate|geometry|angle|distance|rotation/i, brief: {
      task: 'Predict a position or an angle using numbers before you move anything \u2014 write the numbers down. Run it, then measure how far off you were. Adjust once, using your measurement rather than a guess, and check again.',
      predict: 'Write down the exact numbers you expect before anything moves.',
      done: 'I have a predicted number, a measured result, and one correction based on the measurement.' } },

    { match: /random/i, brief: {
      task: 'Add something random to your project, then run it twenty times and tally the results. Is it as even as you expected? Write down what you found, and what twenty runs cannot tell you.',
      predict: 'Before running, say how even you expect the twenty results to be.',
      done: 'Twenty tallied results, and an honest statement about what the sample does not prove.' } },

    { match: /timing|speed|pwm/i, brief: {
      task: 'Make the same action happen at three clearly different speeds or delays. Write down the number you used for each. Then find the point where it becomes too fast to be useful, and describe what goes wrong there.',
      predict: 'Guess which of your three settings will be the most usable, and why.',
      done: 'Three recorded settings and a described failure point at the fast end.' } },

    { match: /list|array|files|storage/i, brief: {
      task: 'Store at least five items, then do three things with them: show them all, add a new one, and remove one. Check after each operation that the rest are untouched.',
      predict: 'Say what you expect the collection to contain after adding one and removing one.',
      done: 'All three operations work, and nothing else in the collection was disturbed.' } },

    { match: /radio|communicat|protocol|interface/i, brief: {
      task: 'Send two different messages between two parts of your system and make the receiver react differently to each. Then explain where the meaning of each message actually lives \u2014 the message only carries data.',
      predict: 'Say what the receiver should do for each message before you send either.',
      done: 'Two messages, two different reactions, and I can explain that the meaning is an agreement, not part of the message.' } },

    { match: /threshold|feedback control|autonom|reliab/i, brief: {
      task: 'Find the exact value where your rule flips behaviour. Approach it slowly and record the last value before the flip and the first value after. Then set a different threshold and predict the new flip point before testing it.',
      predict: 'Write down the value at which you expect the behaviour to change.',
      done: 'Recorded values either side of the flip, for two different thresholds.' } },

    { match: /structure|linkage|torque|mechanical|fabricat/i, brief: {
      task: 'Build the mechanism, then test it to the point where it fails \u2014 too heavy, too fast, too far. Record what failed and where. Make one change to that specific weak point and test the same way again.',
      predict: 'Before testing, say which part you think will give out first.',
      done: 'I found the real failure point, changed that part specifically, and re-tested identically.' } },

    { match: /cad|tolerance/i, brief: {
      task: 'Measure the real object with a ruler and write the numbers down before you model anything. Build the part to those numbers, then check your model against the real thing and note every gap of more than a millimetre or two.',
      predict: 'Write your measurements down first \u2014 no modelling from memory.',
      done: 'Written measurements taken first, and a recorded comparison between model and reality.' } },

    { match: /html|css|responsive|web product/i, brief: {
      task: 'Get one visible thing on the page working before adding anything else. Then add exactly three more elements, checking after each that the page still looks right at both a narrow phone width and a wide one.',
      predict: 'Say which of your additions is most likely to break the narrow layout.',
      done: 'Four working elements, checked at two widths, with nothing overflowing sideways.' } },

    { match: /\bui\b|ux|accessib|user design|interaction/i, brief: {
      task: 'Hand your project to someone who has never seen it and say nothing at all. Watch where they hesitate or do the wrong thing \u2014 write down every moment. Then change exactly one thing because of what you saw, and watch someone use it again.',
      predict: 'Before they start, write down where you think they will get confused.',
      done: 'I watched in silence, recorded the hesitations, and made one change driven by what I saw.' } },

    { match: /ai|machine learning|classification|generative/i, brief: {
      task: 'Test it with five examples you expect it to get right, and five you think will fool it. Write down the result for all ten before judging it. Then describe the pattern in what it got wrong.',
      predict: 'Write down which of your ten examples you expect to fail, and why.',
      done: 'Ten recorded results including the failures, and a described pattern in the errors.' } },

    { match: /safety|responsible/i, brief: {
      task: 'List three ways your project could go wrong or be misused \u2014 be specific, not general. For each, write down what you would change to make it safer. Then actually make the easiest of the three changes.',
      predict: 'Before you start, say which failure you think is most likely in real use.',
      done: 'Three specific risks, three responses, and one of them actually implemented.' } },

    { match: /syntax/i, brief: {
      task: 'Get one single line running before writing anything longer. Then break it on purpose four different ways, one at a time, and copy down the exact error message and line number each time. Fix it, then break the next.',
      predict: 'Before each break, write down what you think the error will complain about.',
      done: 'Four recorded error messages, each matched to the mistake that caused it.' } },

    { match: /abstraction|modelling|software design|project design|design thinking|product design|open engineering/i, brief: {
      task: 'Write your plan on paper before you build anything \u2014 what it does, and how someone knows it worked. Build the riskiest part first. When you finish, be able to point at any part and say why it is there.',
      predict: 'Write down which part you expect to go wrong first.',
      done: 'A plan written before building, the risky part tackled first, and no part I cannot explain.' } },

    { match: /fair test|constraint/i, brief: {
      task: 'Before testing anything, write down three things you will keep exactly the same every time. Then change one single thing and test each version at least three times, recording every result including the poor ones.',
      predict: 'Say which version you expect to win, and what the deciding difference is.',
      done: 'Three constants written down first, one variable changed, and every result kept.' } }
  ];

  window.INVENTORLAB_BRIEFS = { bySkill, byConceptKeyword };
})();

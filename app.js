'use strict';

const LESSONS = window.INVENTORLAB_LESSONS || [];
const DEEP = window.INVENTORLAB_DEEP || {};
const CHAPTERS = window.INVENTORLAB_CHAPTERS || {};
const VIRTUAL_LABS = window.INVENTORLAB_VIRTUAL_LABS || {};
const LAB_ENGINE = window.InventorLabLabEngine || {};
const RETRIEVAL_PROMPTS = window.INVENTORLAB_RETRIEVAL_PROMPTS || {};
const ENGINEER_RETRIEVAL_CHECKS = window.INVENTORLAB_ENGINEER_RETRIEVAL_CHECKS || {};
const STUDIO_BLUEPRINTS = window.INVENTORLAB_STUDIO_BLUEPRINTS || {};
const PLATFORM_GUIDES = window.INVENTORLAB_PLATFORM_GUIDES || {};
const BY_ID = Object.fromEntries(LESSONS.map(m => [m.id, m]));
/*
  Two archetypes, not two children. FAMILY holds the track templates; the actual list of
  learners lives in state.roster, so a family with three kids or a teacher with a group is
  no longer capped at the two profiles this build shipped with.
*/
const TRACKS = {
  Explorer: {emoji:'🌟', track:'Explorer', path:['ct2','d1','d2','d3','d4','d5','w1','w2','w3','s1','s2','m1','m2','m3','x1']},
  Engineer: {emoji:'⚙️', track:'Engineer', path:['e1','e6','e7','e2','e8','e3','e4','e11','e9','e5','e10','i1']}
};
const FAMILY_SEED = {
  faye: {name:'Explorer', ...TRACKS.Explorer},
  philip: {name:'Engineer', ...TRACKS.Engineer}
};
/* Reads like the old FAMILY map, but assembled from the roster at call time. */
const FAMILY = new Proxy({},{
  get(_,key){
    if(typeof key!=='string')return undefined;
    const entry=(state&&state.roster||{})[key];
    if(entry)return{name:entry.name,emoji:entry.emoji||TRACKS[entry.track].emoji,track:entry.track,path:TRACKS[entry.track].path};
    return FAMILY_SEED[key];
  },
  ownKeys(){return Object.keys((state&&state.roster)||FAMILY_SEED);},
  has(_,key){return !!((state&&state.roster||{})[key]||FAMILY_SEED[key]);},
  getOwnPropertyDescriptor(){return{enumerable:true,configurable:true};}
});
function learnerKeys(){return Object.keys((state&&state.roster)||FAMILY_SEED);}
function rosterEntry(key=state.activeLearner){return (state.roster||{})[key]||FAMILY_SEED[key];}
function newLearnerKey(name){
  const base=(String(name||'learner').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'learner').slice(0,24);
  let key=base,n=2;
  while(state.roster[key]||FAMILY_SEED[key])key=`${base}-${n++}`;
  return key;
}
function addLearner(name,track){
  const clean=String(name||'').trim();
  if(!clean){toast('Give the learner a name first.');return;}
  if(learnerKeys().length>=12){toast('Twelve learners is the limit on one device.');return;}
  const key=newLearnerKey(clean);
  state.roster[key]={name:clean,track:TRACKS[track]?track:'Explorer',emoji:TRACKS[track]?TRACKS[track].emoji:'🌟'};
  state.learners[key]=blankLearner();
  state.prefs.noKitPath={...(state.prefs.noKitPath||{}),[key]:hasNoHardware()};
  state.activeLearner=key;
  save();
  toast(`${clean} added.`);
  renderPage(ui.page);
}
function renameLearner(key,name){
  const clean=String(name||'').trim();
  if(!clean||!state.roster[key])return;
  state.roster[key].name=clean;
  if(state.prefs.learnerNames)delete state.prefs.learnerNames[key];   /* roster is the single source now */
  save();updateLearnerChip();renderPage(ui.page);
}
function removeLearner(key){
  if(learnerKeys().length<=1){toast('You need at least one learner.');return;}
  const name=publicDisplayName(key);
  if(!confirm(`Remove ${name} and permanently delete their recorded evidence on this device? Export a backup first if you might want it.`))return;
  delete state.roster[key];delete state.learners[key];
  if(state.prefs.learnerNames)delete state.prefs.learnerNames[key];
  if(state.prefs.noKitPath)delete state.prefs.noKitPath[key];
  if(state.activeLearner===key)state.activeLearner=learnerKeys()[0];
  save();
  toast(`${name} removed.`);
  showPage('settings');
}
function selectLearner(key){
  if(!state.roster[key])return;
  if(ui.page==='lesson')captureMissionDraft(true);
  state.activeLearner=key;save();
  renderPage(ui.page==='lesson'?'path':ui.page);
  toast(`Switched to ${profile().name}`);
}
const ALL_GEAR=['Dash','LEGO WeDo','Scratch','micro:bit','SPIKE Prime','MIT App Inventor','Python','Arduino','3D Printing','Web browser'];
const GEAR_GUIDES={
  'Dash':{adult:'Charge Dash, pair it in the app, clear a flat floor area, and place a visible start marker.',learner:'Put Dash on the start marker facing the agreed direction before every fair test.',check:'If behaviour looks strange, first re-check pairing, starting position and wheel clearance.',safety:'Keep fingers, hair and loose objects away from moving wheels.'},
  'LEGO WeDo':{adult:'Check hub power/connection and put the needed beams, axles, gears, motor and sensor within reach.',learner:'Press connections firmly and make sure moving parts can turn freely before RUN.',check:'If a mechanism stalls, disconnect power and inspect alignment/friction before changing code.',safety:'Stop the motor before adjusting gears or moving parts.'},
  'Scratch':{adult:'Open Scratch in a supported browser/app and create or open a blank project.',learner:'Know where the green flag, stop button, stage and sprite are. Save a copy before a big experiment.',check:'If nothing happens, check which event starts the script and which sprite owns the code.',safety:'No special hardware safety requirement.'},
  'micro:bit':{adult:'Prepare the editor, USB/Bluetooth connection and a powered micro:bit. For radio work, have two boards ready if possible.',learner:'Confirm the latest program is actually on the board before debugging the logic.',check:'If output is unchanged, verify download/flash, event trigger and radio group before rewriting code.',safety:'Use normal low-voltage micro:bit accessories only; disconnect before changing external wiring.'},
  'SPIKE Prime':{adult:'Charge the hub, connect motors/sensors firmly and note which port each device uses.',learner:'Match code ports to physical ports and make sure the build can move without snagging cables.',check:'Test one motor or sensor by itself before debugging an integrated robot.',safety:'Stop motors before touching gears, wheels or linkages.'},
  'MIT App Inventor':{adult:'Prepare a browser plus a test phone/tablet or emulator, and confirm the companion connection works.',learner:'Name important components clearly and test one event at a time.',check:'If the app does nothing, identify the event, component and state involved before editing multiple blocks.',safety:'No special hardware safety requirement.'},
  'Python':{adult:'Open a working Python environment or browser-based editor and run one tiny print statement.',learner:'Run small pieces often and read the first error message rather than changing many lines.',check:'Check input values, types and the exact line where actual behaviour first differs.',safety:'Only run code you understand; do not paste commands that alter system files.'},
  'Arduino':{adult:'Use a known board/cable, a low-voltage breadboard circuit, and current-limiting resistors where required.',learner:'Disconnect power before moving wires; check pin numbers in both wiring and code.',check:'If the circuit fails, separate power/wiring/code checks instead of rewiring randomly.',safety:'Adult supervision recommended. Use low-voltage educational circuits only; never connect mains electricity.'},
  '3D Printing':{adult:'Prepare slicer/printer, measuring tool and safe workspace. Adult handles hot-end/bed access and machine maintenance.',learner:'Measure the design target, record dimensions, and keep hands out of the printer while it is moving/hot.',check:'If fit is wrong, measure the printed part before changing the CAD model.',safety:'Hot nozzle/bed and moving axes can injure; adult supervision is required for printer handling.'},
  'Web browser':{adult:'Use an up-to-date browser and open InventorLab. No account is required for this build.',learner:'Keep one tab for the lab/project and one for references only if needed.',check:'If an interactive element seems stuck, refresh only after noting what you were doing.',safety:'Use age-appropriate browsing and do not share personal information.'}
};
const CORE_SKILLS=['Prediction','Sequencing','Pattern recognition','Loops','Conditionals','Input / output','Sensors','Variables','Events','State','Functions','Debugging','Decomposition','Measurement','Calibration','Algorithms','Optimisation','Data','Testing','Iteration','Transfer'];
const PREREQ={
  'Prediction':[], 'Sequencing':['Prediction'], 'Pattern recognition':['Sequencing'], 'Loops':['Sequencing','Pattern recognition'],
  'Conditionals':['Sequencing'], 'Input / output':['Prediction'], 'Sensors':['Input / output','Conditionals'],
  'Variables':['Sequencing'], 'Events':['Sequencing'], 'State':['Variables','Events'], 'Functions':['Sequencing','Variables'],
  'Debugging':['Prediction','Sequencing'], 'Decomposition':['Sequencing'], 'Measurement':['Prediction'],
  'Calibration':['Measurement','Debugging'], 'Algorithms':['Sequencing','Decomposition'],
  'Optimisation':['Algorithms','Measurement'], 'Data':['Measurement'], 'Testing':['Prediction'],
  'Iteration':['Testing','Debugging'], 'Transfer':['Prediction','Testing']
};

const CONCEPTS={
  'Prediction':{why:'A prediction turns RUN into an experiment. You compare what you expected with what actually happened.',model:'INSTRUCTIONS → PREDICTION → TEST → DIFFERENCE → LEARNING',trap:'Running first and thinking afterwards.',remedy:'Before RUN, point, draw, or say what should happen and why.',check:['Why predict before testing?',['To create a mental model to compare with evidence','Because robots require a password','To avoid ever making mistakes'],0],parent:['What do you expect before you press RUN?','Which instruction causes that part of your prediction?'],avoid:'Do not ask “Did it work?” as the first question; ask what differed from the prediction.'},
  'Sequencing':{why:'Computers follow order literally. A correct set of actions in the wrong order can still fail.',model:'STEP 1 → STATE CHANGES → STEP 2 → STATE CHANGES → STEP 3',trap:'Knowing the right actions but ignoring their order.',remedy:'Act out the instructions one at a time and describe the state after each.',check:['What is the strongest way to check a sequence?',['Explain what changes after each step','Count the number of blocks','Make every block the same colour'],0],parent:['What is true after step 1?','Could step 3 happen before step 2? Why not?'],avoid:'Do not reorder blocks for the learner. Make the dependency visible.'},
  'Pattern recognition':{why:'Recognising repeated structure helps you find reusable solutions instead of treating every step as new.',model:'EXAMPLES → NOTICE SAME STRUCTURE → NAME PATTERN → REUSE',trap:'Looking only at surface differences.',remedy:'Circle or say the part that repeats before choosing a coding block.',check:['What should you identify before using a loop?',['The repeated pattern','The screen colour','The longest variable name'],0],parent:['What part is happening again?','What stays the same even when the details change?'],avoid:'Do not point straight to the Repeat block.'},
  'Loops':{why:'Loops make repetition explicit, changeable and reliable—not merely shorter.',model:'PATTERN × N → REPEAT(PATTERN, N)',trap:'Thinking loops are only a shortcut for fewer blocks.',remedy:'Build the long repeated version first, then circle exactly what belongs inside the loop.',check:['When is a loop most useful?',['When a pattern repeats','Whenever a program has an error','Only when a robot moves'],0],parent:['What repeats?','What belongs outside the loop?'],avoid:'Do not supply the repeat count until the learner identifies the repeating unit.'},
  'Conditionals':{why:'Conditionals let a system choose behaviour based on what is true now.',model:'IF condition? → YES: action A / NO: action B',trap:'Naming the action but not the condition that decides it.',remedy:'Say the rule aloud as “IF ___ THEN ___”.',check:['What does a conditional need?',['A condition and a resulting action','Only a loop','Only an output'],0],parent:['What exact question is the program asking?','What happens when the answer is false?'],avoid:'Do not conflate the sensor reading with the decision.'},
  'Input / output':{why:'Interactive systems receive information, process it, then produce an effect.',model:'WORLD / USER → INPUT → PROGRAM → OUTPUT',trap:'Calling every physical part a sensor or every screen element an input.',remedy:'For each part, ask: information going in or effect coming out?',check:['A button press is usually…',['an input','an output','a loop'],0],parent:['What information entered the system?','What did the system do in response?'],avoid:'Avoid giving the labels until the learner describes the direction of information.'},
  'Sensors':{why:'A sensor measures or detects something. The program—not the sensor—decides what that information means.',model:'WORLD → SENSOR VALUE/EVENT → INTERPRETATION → DECISION → ACTION',trap:'Treating the sensor as if it “knows” the situation.',remedy:'Observe the raw sensor value/event before connecting it to an action.',check:['What does a sensor give a program?',['A measurement or event','A guaranteed correct decision','A finished algorithm'],0],parent:['What did the sensor actually measure?','How did your program interpret that measurement?'],avoid:'Do not say “the sensor knows there is an obstacle”.'},
  'Variables':{why:'Variables are named memory. They let a program remember information that changes.',model:'START VALUE → EVENT → UPDATE VALUE → READ VALUE',trap:'Treating a variable as a fixed label instead of changing state.',remedy:'Name the information, its starting value, and exactly what events change it.',check:['Why use a variable?',['To remember changing information','To make a motor stronger','To replace every loop'],0],parent:['What does this variable mean right now?','Which event is allowed to change it?'],avoid:'Do not focus on the variable name before its meaning is clear.'},
  'Events':{why:'Events answer “when should this behaviour begin?” and connect user/world actions to code.',model:'EVENT HAPPENS → HANDLER RUNS → STATE/OUTPUT CHANGES',trap:'Confusing what starts a behaviour with what the behaviour does.',remedy:'Underline the WHEN separately from the DO.',check:['What is an event?',['Something that triggers a behaviour','A number that never changes','A type of loop only'],0],parent:['What starts this script?','Could two events happen close together?'],avoid:'Do not assume event order if the system can receive multiple inputs.'},
  'State':{why:'State describes what the system currently remembers about itself and its world.',model:'CURRENT STATE + EVENT → NEW STATE',trap:'Tracking separate variables without understanding the overall system mode.',remedy:'Write the allowed states and what event moves the system between them.',check:['Why does state matter?',['Future behaviour can depend on what happened before','It removes the need for events','It makes every program shorter'],0],parent:['What state is the system in now?','Which transitions are allowed from here?'],avoid:'Do not let an interface hide contradictory state values.'},
  'Functions':{why:'Functions package a meaningful behaviour behind a name and, often, inputs.',model:'INPUTS → NAMED FUNCTION → RESULT / EFFECT',trap:'Using functions only as copied chunks to make code shorter.',remedy:'Describe the function’s job in one sentence and identify what should vary as a parameter.',check:['A useful function usually…',['represents a meaningful reusable behaviour','contains the whole program','has the longest possible name'],0],parent:['What promise does this function make?','What should be a parameter rather than hard-coded?'],avoid:'Do not extract code into functions without a clear abstraction boundary.'},
  'Debugging':{why:'Debugging is evidence-based diagnosis: reproduce, isolate, test a hypothesis, then verify.',model:'REPRODUCE → EXPECTED ≠ ACTUAL → ISOLATE → HYPOTHESIS → TEST → VERIFY',trap:'Changing many things randomly until the problem disappears.',remedy:'Return to the last known state and change one important thing at a time.',check:['Best first debugging move?',['Reproduce and describe the failure','Rewrite everything','Add more features'],0],parent:['Can you make the failure happen again?','Which smallest subsystem could cause it?'],avoid:'Do not fix the code while explaining; preserve the learner’s evidence trail.'},
  'Decomposition':{why:'Large problems become solvable when you separate them into testable parts with clear interfaces.',model:'BIG PROBLEM → SUBSYSTEMS → TEST EACH → INTEGRATE',trap:'Trying to debug the entire system at once.',remedy:'Name 3 smaller jobs and test the riskiest one independently.',check:['Why decompose a system?',['To isolate manageable pieces and interfaces','To make it sound technical','To avoid testing'],0],parent:['What are the three smaller jobs?','Which one can you prove independently first?'],avoid:'Do not let integration begin before a failing subsystem is isolated.'},
  'Measurement':{why:'Measurement replaces “looks about right” with evidence that can be compared across trials.',model:'QUESTION → REPEATED MEASUREMENTS → SUMMARY → DECISION',trap:'Making a decision from one trial.',remedy:'Repeat the same measurement at least three times before changing the design.',check:['Why repeat measurements?',['To see variation and typical error','Because the first result never counts','To avoid using units'],0],parent:['What unit are you measuring?','Is the difference consistent or random?'],avoid:'Do not celebrate one perfect trial as proof of reliability.'},
  'Calibration':{why:'Calibration connects a command or reading to real-world behaviour by measuring systematic error and adjusting.',model:'COMMAND → ACTUAL → ERROR → ADJUST → RETEST',trap:'Treating calibration as a one-time tweak.',remedy:'Collect before and after data under the same test conditions.',check:['What is calibration trying to reduce?',['Difference between intended and actual behaviour','Number of variables','Screen brightness'],0],parent:['What is the average error before the change?','Did accuracy improve, consistency improve, or both?'],avoid:'Do not change calibration from a single trial.'},
  'Algorithms':{why:'An algorithm is a precise method for solving a class of problems; multiple valid algorithms can have different trade-offs.',model:'PROBLEM → STEPS → TEST → COMPARE → IMPROVE',trap:'Assuming the first working solution is the only or best algorithm.',remedy:'Compare at least two approaches using a criterion such as clarity, steps or reliability.',check:['Two algorithms both work. What next?',['Compare clarity, efficiency and reliability','Choose the first one forever','Nothing; they are identical'],0],parent:['What criterion makes one solution better here?','Could another input break this algorithm?'],avoid:'Do not equate fewer blocks with a better algorithm automatically.'},
  'Optimisation':{why:'Optimisation means improving a defined metric under constraints, not “make everything better”.',model:'BASELINE → METRIC → CHANGE → RETEST → TRADE-OFF',trap:'Changing the design without defining what “better” means.',remedy:'Choose one measurable target and hold other important conditions constant.',check:['Why define a metric first?',['So “better” has a measurable meaning','Metrics replace testing','To avoid all trade-offs'],0],parent:['What exactly are you optimising?','What might get worse while this metric improves?'],avoid:'Do not optimise before the baseline works reliably.'},
  'Data':{why:'Data becomes evidence only when collection is consistent, checked and interpreted with appropriate limits.',model:'QUESTION → COLLECT → CHECK → SUMMARISE → CONCLUDE + LIMITATION',trap:'Cherry-picking favourite results or treating a pretty graph as proof.',remedy:'Review the full dataset and state one conclusion plus one limitation.',check:['A good data conclusion should be…',['No stronger than the evidence supports','As exciting as possible','Based on one favourite result'],0],parent:['How was each row collected?','What result does not fit the pattern?'],avoid:'Do not remove unusual values without investigating why they occurred.'},
  'Testing':{why:'A test is useful when it answers a specific question under controlled enough conditions.',model:'QUESTION → TEST SETUP → RESULT → DECISION',trap:'Running the whole project repeatedly without knowing what each run tests.',remedy:'Write the one question this test should answer.',check:['A useful test should…',['Answer a specific question','Change many variables','Avoid recording results'],0],parent:['What question will this run answer?','What are you keeping the same?'],avoid:'Do not accept “testing if it works” when a narrower question is possible.'},
  'Iteration':{why:'Iteration is purposeful improvement: each version responds to evidence from the previous one.',model:'VERSION → TEST → EVIDENCE → CHANGE WITH REASON → NEXT VERSION',trap:'Adding features without learning from the previous test.',remedy:'Record what changed and why before building the next version.',check:['A strong iteration note includes…',['What changed and why','Only the final version','Only what worked'],0],parent:['What evidence caused this change?','What are you deliberately not changing yet?'],avoid:'Do not reward version count without evidence-driven changes.'},
  'Transfer':{why:'Transfer shows the learner owns the idea: it still works when the surface details or tool change.',model:'LEARNED IDEA → NEW CONTEXT → ADAPT → EXPLAIN',trap:'Mistaking memorised reproduction for understanding.',remedy:'Change the tool, starting condition or constraint and solve without copying the old answer.',check:['Best evidence of transfer?',['Using the same concept successfully in a new context','Repeating the same worksheet','Remembering the old answer'],0],parent:['Where else could this idea work?','What changed, and what core idea stayed the same?'],avoid:'Do not assess transfer with an identical task.'}
};

const DIAGNOSTICS={
  faye:[
    {skill:'Sequencing',q:'A robot must move forward, turn, then beep. What matters most?',opts:['How colourful it is','The order of the instructions','How fast you press RUN'],ans:1},
    {skill:'Debugging',q:'Your robot went too far. What is the best next move?',opts:['Change lots of blocks','Reduce one distance value and test again','Keep pressing RUN'],ans:1},
    {skill:'Loops',q:'You wrote the same dance four times. What idea could help?',opts:['A repeat / loop','A louder sound','A sensor'],ans:0},
    {skill:'Input / output',q:'A sensor notices an object. The sensor is giving the program…',opts:['An input','Decoration','Battery power'],ans:0},
    {skill:'Variables',q:'A game score needs to remember 0, then 1, then 2. What helps?',opts:['A variable','A turn block','A costume only'],ans:0},
    {skill:'Prediction',q:'Before pressing RUN, what is a useful thing to do?',opts:['Guess after it moves','Say what you expect to happen','Change everything first'],ans:1}
  ],
  philip:[
    {skill:'Calibration',q:'A robot turns 87°, 89°, 88° on repeated 90° commands. Best response?',opts:['Add random extra turns','Measure the bias and calibrate','Rewrite everything'],ans:1},
    {skill:'Decomposition',q:'Why prototype subsystems separately?',opts:['To isolate failures and evidence','It always makes code shorter','To avoid tests'],ans:0},
    {skill:'Sensors',q:'A security sensor alarms when a door slams nearby. This is primarily…',opts:['A false positive to investigate','A syntax error','Proof the sensor is broken'],ans:0},
    {skill:'Transfer',q:'A working program cannot be explained or adapted by its author. Treat it as…',opts:['Full mastery','Incomplete mastery','Impossible to assess'],ans:1},
    {skill:'Optimisation',q:'Before optimising robot speed, what should be defined?',opts:['A measurable success metric and constraints','More decorations','A second programming language'],ans:0},
    {skill:'Data',q:'One sensor reading strongly supports your hypothesis but nine do not. Best conclusion?',opts:['Use the one best reading','Interpret all ten and investigate variation','Delete the nine'],ans:1}
  ]
};
const DIAGNOSTIC_VERIFY={
  faye:{
    'Sequencing':{skill:'Sequencing',q:'The robot faces right. It turns LEFT, then moves forward. Which way does it move?',opts:['Up','Right','Down'],ans:0},
    'Debugging':{skill:'Debugging',q:'Three fair tests stop about 10 cm too short. What is the strongest next test?',opts:['Increase one distance value and repeat from the same start','Change distance, speed and turn together','Press RUN until one result looks right'],ans:0},
    'Loops':{skill:'Loops',q:'A dance does FLASH then BEEP, and that pair happens 3 times. What belongs inside the loop?',opts:['FLASH then BEEP','Only BEEP','The start button'],ans:0},
    'Input / output':{skill:'Input / output',q:'Pressing button A makes an LED light. Which flow is correct?',opts:['LED → code → button','Button → code → LED','Code → LED → button'],ans:1},
    'Variables':{skill:'Variables',q:'A score should go 2 → 3 after a point. Which update makes sense?',opts:['score = 0','score = score + 1','score = 2 forever'],ans:1},
    'Prediction':{skill:'Prediction',q:'A program says forward 20 cm, then forward 20 cm. Before RUN, what is the best prediction?',opts:['It should travel about 40 cm if conditions stay the same','It will definitely travel exactly 20 cm','No prediction is possible'],ans:0}
  },
  philip:{
    'Calibration':{skill:'Calibration',q:'A 100 cm command repeatedly gives 92, 93, 92 cm. Which plan is strongest?',opts:['Estimate the systematic shortfall, apply one justified correction, then repeat the same test','Add a different random correction each run','Use the 93 cm run only because it is closest'],ans:0},
    'Decomposition':{skill:'Decomposition',q:'Navigation works alone. The sensor works alone. Together the robot fails. Where should you investigate first?',opts:['The interface/timing between the two known-working subsystems','Rewrite both subsystems immediately','Add another feature'],ans:0},
    'Sensors':{skill:'Sensors',q:'A threshold is 30. Noisy readings bounce 29, 31, 30, 29. What engineering issue should you test?',opts:['Boundary instability; consider repeated sampling or hysteresis','The sensor must be removed','The program needs more colours'],ans:0},
    'Transfer':{skill:'Transfer',q:'You move a state-machine idea from Scratch to Python. What best demonstrates transfer?',opts:['Keep the state/transition logic but adapt the implementation to Python','Copy the Scratch blocks as pictures','Use identical variable names and assume that is enough'],ans:0},
    'Optimisation':{skill:'Optimisation',q:'A faster robot improves time by 20% but failures rise from 1/10 to 4/10. Reliability must stay at least 9/10. Is this an optimisation?',opts:['No; it violates the stated constraint','Yes; speed is the only metric that matters','Yes; any newer version is better'],ans:0},
    'Data':{skill:'Data',q:'Nine trials cluster near 50, but one reads 90. What is the strongest response?',opts:['Investigate the outlier and keep the full evidence trail unless exclusion is justified','Delete 90 automatically','Use 90 because it is the most interesting'],ans:0}
  }
};

const ASSESS_BANK=window.INVENTORLAB_ASSESSMENT_BANK||{};

/*
  RESPONSE-POSITION INTEGRITY
  ---------------------------
  The authored banks intentionally keep semantic content separate from display order.
  Before any learner sees a multiple-choice item, correct-option positions are
  deterministically counterbalanced. This prevents "always choose the first answer"
  from becoming a usable strategy while keeping refresh/retest order stable.
*/
function placeCorrectObject(q,target){
  if(!q||!Array.isArray(q.opts)||q.opts.length<2)return q;
  const n=q.opts.length,t=((Number(target)||0)%n+n)%n,a=Number(q.ans);
  if(!Number.isInteger(a)||a<0||a>=n)return q;
  const correct=q.opts[a],d=q.opts.filter((_,i)=>i!==a),out=[];
  let j=0;
  for(let i=0;i<n;i++)out.push(i===t?correct:d[j++]);
  q.opts=out;q.ans=t;return q;
}
function placeCorrectArray(q,target){
  if(!Array.isArray(q)||!Array.isArray(q[1])||q[1].length<2)return q;
  const n=q[1].length,t=((Number(target)||0)%n+n)%n,a=Number(q[2]);
  if(!Number.isInteger(a)||a<0||a>=n)return q;
  const correct=q[1][a],d=q[1].filter((_,i)=>i!==a),out=[];
  let j=0;
  for(let i=0;i<n;i++)out.push(i===t?correct:d[j++]);
  q[1]=out;q[2]=t;return q;
}
function counterbalanceResponsePositions(){
  // Six-item independent forms: exactly two correct answers in each position.
  const six=[1,2,0,2,0,1];
  Object.values(ASSESS_BANK).forEach(qs=>(qs||[]).forEach((q,i)=>placeCorrectObject(q,six[i%six.length])));

  // Three chapter checks per concept: one correct answer in each position.
  const three=[1,2,0];
  Object.values(CHAPTERS).forEach(ch=>(ch?.checks||[]).forEach((q,i)=>placeCorrectArray(q,three[i%3])));

  // Short concept checks: balanced globally across the 21 core skills.
  Object.values(CONCEPTS).forEach((c,i)=>placeCorrectArray(c?.check,i%3));

  // Placement screen + verification: balanced within each six-question track.
  Object.values(DIAGNOSTICS).forEach(qs=>(qs||[]).forEach((q,i)=>placeCorrectObject(q,six[i%six.length])));
  Object.values(DIAGNOSTIC_VERIFY).forEach(group=>Object.values(group||{}).forEach((q,i)=>placeCorrectObject(q,six[i%six.length])));

  // Engineer delayed-retrieval checks: rotate evenly through positions.
  Object.values(ENGINEER_RETRIEVAL_CHECKS).forEach((q,i)=>placeCorrectObject(q,three[i%3]));
}
counterbalanceResponsePositions();


const DEFAULT_STATE={
  schema:9,
  activeLearner:'faye',
  roster:{faye:{name:'Explorer',track:'Explorer',emoji:'🌟'},philip:{name:'Engineer',track:'Engineer',emoji:'⚙️'}},
  equipment:['Web browser'],
  prefs:{largeText:false,textSize:'normal',fontStyle:'default',motion:'on',theme:'auto',focus:false,equipmentConfirmed:false,viewMode:'learner',betaOnboarded:false,learnerNames:{faye:'',philip:''},noKitPath:{faye:false,philip:false},selfDirected:false,lastView:null,installDismissed:false,lastBackupAt:null,lastBackupCount:0,backupNudgeDismissedAt:null,betaTesterType:'parent'},
  learners:{
    faye:{completed:[],missions:{},evidence:{},diagnostics:[],assessments:[],reviews:[],journals:[],artifacts:[],misconceptions:{},remediation:{},startId:null,sessions:[],sessionDraft:null,designReviews:[],vocabViews:{},defects:[],rescueLogs:[],testLogs:[],labAttempts:[],reviewAttempts:[],remediationAttempts:[],attemptPackets:[],debugLogs:[],missionDrafts:{},entryProbes:[],learningSignals:[]},
    philip:{completed:[],missions:{},evidence:{},diagnostics:[],assessments:[],reviews:[],journals:[],artifacts:[],misconceptions:{},remediation:{},startId:null,sessions:[],sessionDraft:null,designReviews:[],vocabViews:{},defects:[],rescueLogs:[],testLogs:[],labAttempts:[],reviewAttempts:[],remediationAttempts:[],attemptPackets:[],debugLogs:[],missionDrafts:{},entryProbes:[],learningSignals:[]}
  }
};
const STORAGE_KEY='inventorlab.publicbeta.v1';

/*
  Storage safety.
  localStorage throws outright when the page is opened from a file:// path, in some
  private-browsing modes, and in browsers where site data is blocked. The app used to
  read it unguarded during start-up, so a single throw meant a blank white page and no
  explanation. STORE degrades to memory instead, and says so.
*/
const STORE=(function(){
  let live=true;const mem=Object.create(null);
  try{const k='inventorlab.__probe';window.localStorage.setItem(k,'1');window.localStorage.removeItem(k);}catch(e){live=false;}
  const fail=()=>{if(live){live=false;announceStorage();}};
  return{
    get live(){return live;},
    getItem(k){if(live){try{return window.localStorage.getItem(k);}catch(e){fail();}}return k in mem?mem[k]:null;},
    setItem(k,v){mem[k]=v;if(!live)return false;try{window.localStorage.setItem(k,v);return true;}catch(e){fail();return false;}},
    removeItem(k){delete mem[k];if(!live)return;try{window.localStorage.removeItem(k);}catch(e){fail();}}
  };
})();
/*
  Offline support. Registered late and defensively: a failure here must never stop the app,
  and on file:// there is no service-worker scope at all.
*/
/*
  The site is installable and works offline, but nothing ever said so, so in
  practice nobody installed it. The browser's own prompt is captured and offered
  once there is something worth keeping \u2014 after onboarding \u2014 and never again
  once dismissed.
*/
let deferredInstall=null;
function watchInstallPrompt(){
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();deferredInstall=e;maybeShowInstall();
  });
  window.addEventListener('appinstalled',()=>{
    deferredInstall=null;state.prefs.installDismissed=true;save();
    const el=document.getElementById('installBar');if(el)el.hidden=true;
  });
}
function maybeShowInstall(){
  const el=document.getElementById('installBar');if(!el)return;
  if(!deferredInstall||!state.prefs.betaOnboarded||state.prefs.installDismissed){el.hidden=true;return;}
  el.hidden=false;
  el.innerHTML='<div><b>\ud83d\udcf2 Keep InventorLab on this device?</b><p>It opens like an app and every mission still works with no internet.</p></div>'
    +'<div class="button-row"><button class="primary" data-action="do-install">Add it</button><button class="ghost" data-action="dismiss-install">No thanks</button></div>';
}
async function doInstall(){
  if(!deferredInstall)return;
  deferredInstall.prompt();
  try{ await deferredInstall.userChoice; }catch(e){}
  deferredInstall=null;
  const el=document.getElementById('installBar');if(el)el.hidden=true;
}
function dismissInstall(){
  state.prefs.installDismissed=true;save();
  const el=document.getElementById('installBar');if(el)el.hidden=true;
}
function registerServiceWorker(){
  if(!('serviceWorker'in navigator)||location.protocol==='file:')return;
  navigator.serviceWorker.register('sw.js').then(reg=>{
    /* A tablet left open for days would otherwise never notice a new version. */
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){try{reg.update();}catch(e){}}});
    reg.addEventListener('updatefound',()=>{
      const incoming=reg.installing;if(!incoming)return;
      incoming.addEventListener('statechange',()=>{
        /* Only prompt when an older version is already running the page. */
        if(incoming.state==='installed'&&navigator.serviceWorker.controller)showUpdateBanner();
      });
    });
  }).catch(()=>{});
}
function showUpdateBanner(){
  const el=document.getElementById('netBanner');if(!el)return;
  el.hidden=false;el.className='net-banner update';
  el.innerHTML='<b>\ud83c\udd95 A newer version of InventorLab is ready.</b> Your saved work is not affected. <button class="ghost" data-action="apply-update">Reload now</button>';
}
function applyUpdate(){
  if(!('serviceWorker'in navigator)){location.reload();return;}
  navigator.serviceWorker.getRegistration().then(reg=>{
    if(reg&&reg.waiting)reg.waiting.postMessage('skip-waiting');
    setTimeout(()=>location.reload(),150);
  }).catch(()=>location.reload());
}
function announceNetwork(){
  const el=document.getElementById('netBanner');if(!el)return;
  if(el.classList.contains('update'))return;      /* an update prompt outranks this */
  if(navigator.onLine){el.hidden=true;return;}
  el.hidden=false;el.className='net-banner offline';
  el.innerHTML='<b>\ud83d\udcf4 You are offline.</b> Missions, labs and your progress all keep working. The buttons that open Scratch or MakeCode will need a connection.';
}
/*
  The export button existed from the start, but nothing ever asked anyone to press it.
  Evidence accumulates for months in one browser's local storage with no account behind it,
  so the realistic failure is a cleared browser, not a missing feature.
*/
function backupNudgeState(){
  const count=totalEvidenceCount();
  const since=count-(state.prefs.lastBackupCount||0);
  const never=!state.prefs.lastBackupAt;
  if(count<5)return null;                                   /* too early to matter */
  if(state.prefs.backupNudgeDismissedAt){
    const days=(Date.now()-new Date(state.prefs.backupNudgeDismissedAt))/86400000;
    if(days<14&&since<15)return null;                       /* asked recently, let it rest */
  }
  if(never)return{count,since,never:true};
  if(since>=10)return{count,since,never:false};
  return null;
}
function maybeShowBackupNudge(){
  const el=document.getElementById('backupNudge');if(!el)return;
  const n=backupNudgeState();
  if(!n){el.hidden=true;return;}
  el.hidden=false;
  el.innerHTML=`<div><b>\ud83d\udcbe ${n.never?`There are ${n.count} rated attempts on this device and no backup yet.`:`${n.since} rated attempts since your last backup.`}</b>
    <p>All of this lives in this one browser. Clearing site data, resetting the device or switching browsers loses it \u2014 there is no account it can be recovered from.</p></div>
    <div class="button-row"><button class="primary" data-action="export">Download a backup</button><button class="ghost" data-action="dismiss-backup-nudge">Not now</button></div>`;
}
function dismissBackupNudge(){
  state.prefs.backupNudgeDismissedAt=nowISO();
  save();
  const el=document.getElementById('backupNudge');if(el)el.hidden=true;
}
function announceStorage(){
  const el=document.getElementById('storageBanner');if(!el)return;
  if(STORE.live){el.hidden=true;return;}
  el.hidden=false;
  el.innerHTML='<b>&#9888;&#65039; This browser is not letting InventorLab save anything.</b> You can still do every mission and lab, but progress will disappear when you close the tab. This usually means the page was opened from a downloaded file instead of a web address, or that site data is blocked \u2014 private windows often block it too.';
}

let state=loadState();
let ui={page:'home',currentMissionId:null,library:{q:'',level:'all',tool:'all',quality:'studio',interest:''},diag:null,assess:null,currentAttemptHints:new Set(),missionRated:false,explorerStep:0,currentChapter:null,currentLab:null,remediationSkill:null,remediationPassed:null,resumingDraft:false,currentAttemptQuick:null,lab:{gridCommands:[],gridResult:null,sensorResult:null,calibrationResult:null,traceResult:null,traceReveals:0,traceMode:null,gridScenarioId:null,sensorScenarioId:null,calibrationScenarioId:null,traceScenarioId:null}};

function clone(v){return JSON.parse(JSON.stringify(v));}
function safeParse(s,fallback){if(s===null||s===undefined||s==='')return fallback;try{const v=JSON.parse(s);return v===null?fallback:v}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function nowISO(){return new Date().toISOString();}
function learner(){return state.learners[state.activeLearner];}
const NO_KIT_PATHS=window.INVENTORLAB_NO_KIT_PATHS||{};
function noKitEnabled(key=state.activeLearner){return !!(state.prefs.noKitPath||{})[key];}
function noKitPathFor(track){return (NO_KIT_PATHS[track]||[]).filter(id=>BY_ID[id]);}
function profile(){
  const base=FAMILY[state.activeLearner];
  const custom=(state.prefs.learnerNames||{})[state.activeLearner];
  const alt=noKitEnabled()?noKitPathFor(base.track):null;
  return {...base,name:(custom||base.name),path:(alt&&alt.length?alt:base.path),noKit:!!(alt&&alt.length)};
}
/* True when the learner owns no physical kit at all \u2014 the moment the hardware path stops working. */
function hasNoHardware(){return !(state.equipment||[]).some(g=>!isSoftwareGear(g));}
function toggleNoKitPath(on){
  const key=state.activeLearner;
  state.prefs.noKitPath={...(state.prefs.noKitPath||{}),[key]:!!on};
  learner().startId=null;
  save();
  toast(on?'Switched to the browser-only path.':'Switched back to the full path.');
  showPage('path');
}
function noKitSwitchHTML(){
  const on=noKitEnabled(),p=profile(),len=noKitPathFor(FAMILY[state.activeLearner].track).length;
  if(!len)return'';
  return `<div class="nokit-switch ${on?'on':''}"><div><span class="tag">${on?'BROWSER-ONLY PATH ACTIVE':'NO KIT AT HOME?'}</span><b>${on?`${len} missions you can do with nothing but this laptop or tablet.`:`There is a full ${len}-mission path that needs no robot at all.`}</b><p>${on?'Same concepts, same evidence standard, same Boss checks. Hardware missions are waiting on the full path whenever a kit turns up.':'It teaches the same ideas \u2014 instructions, sequence, patterns, events, loops, conditionals, variables, debugging, transfer \u2014 using free browser tools.'}</p></div><button class="${on?'ghost':'primary'}" data-action="toggle-nokit" data-on="${on?'0':'1'}">${on?'Use the full path instead':'Use the browser-only path \u2192'}</button></div>`;
}
function save(){STORE.setItem(STORAGE_KEY,JSON.stringify(state));applyPrefs();updateLearnerChip();}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2200);}

function loadState(){
  const saved=safeParse(STORE.getItem(STORAGE_KEY),null);
  if(saved && saved.schema===9){return mergeState(clone(DEFAULT_STATE),saved);}
  const internal=safeParse(STORE.getItem('inventorlab.familyalpha.freevirtual.v9'),null);
  if(internal && internal.schema===9){
    const migrated=mergeState(clone(DEFAULT_STATE),internal);
    migrated.prefs={...DEFAULT_STATE.prefs,...(internal.prefs||{}),betaOnboarded:false};
    STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));
    return migrated;
  }
  const v8=safeParse(STORE.getItem('inventorlab.familyalpha.learningvalidation.v8'),null);
  if(v8 && v8.schema===8){const migrated=mergeState(clone(DEFAULT_STATE),v8);migrated.schema=9;migrated.prefs.equipmentConfirmed=true;STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  const q10=safeParse(STORE.getItem('inventorlab.familyalpha.q10.v7'),null);
  if(q10 && q10.schema===7){const migrated=mergeState(clone(DEFAULT_STATE),q10);migrated.schema=9;STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  const q9=safeParse(STORE.getItem('inventorlab.familyalpha.q9.v6'),null);
  if(q9 && q9.schema===6){const migrated=mergeState(clone(DEFAULT_STATE),q9);migrated.schema=9;STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  const q8=safeParse(STORE.getItem('inventorlab.familyalpha.q8.v5'),null);
  if(q8 && q8.schema===5){const migrated=mergeState(clone(DEFAULT_STATE),q8);migrated.schema=9;STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  const q7=safeParse(STORE.getItem('inventorlab.familyalpha.q7.v4'),null);
  if(q7 && q7.schema===4){const migrated=mergeState(clone(DEFAULT_STATE),q7);migrated.schema=9;STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  const stable=safeParse(STORE.getItem('inventorlab.familyalpha.stable.v3'),null);
  if(stable && stable.schema===3){const migrated=mergeState(clone(DEFAULT_STATE),stable);migrated.schema=9;STORE.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  const s=clone(DEFAULT_STATE);
  // Best-effort migration from the rapid prototype series.
  const active=STORE.getItem('familyLearner'); if(active==='faye'||active==='philip')s.activeLearner=active;
  const done=safeParse(STORE.getItem('inventorDone'),[]);
  for(const k of Object.keys(s.roster)) s.learners[k].completed=done.filter(id=>FAMILY[k].path.includes(id));
  const journals=safeParse(STORE.getItem('familyJournal'),[]);
  for(const j of journals){const k=j.who==='philip'?'philip':'faye';s.learners[k].journals.push({date:j.date||nowISO(),title:j.title||'Project',prediction:j.p||'',observed:j.o||'',change:j.c||''});}
  const gear=safeParse(STORE.getItem('invOwnedGear'),null); if(Array.isArray(gear)){s.equipment=gear;s.prefs.equipmentConfirmed=true;}
  const oldEvidence=safeParse(STORE.getItem('invSkillEvidence'),{});
  const target=s.learners[s.activeLearner];
  for(const [skill,v] of Object.entries(oldEvidence||{})){
    target.evidence[skill]=(v.events||[]).map(e=>({value:Number(e.points)||1,source:e.source||'Migrated evidence',date:e.date||nowISO()}));
  }
  const oldAssess=safeParse(STORE.getItem('invAssessments'),[]); for(const a of oldAssess){const k=a.who==='philip'?'philip':'faye';s.learners[k].assessments.push(a);}
  const oldArts=safeParse(STORE.getItem('invArtifacts'),[]); for(const a of oldArts){const k=a.who==='philip'?'philip':'faye';s.learners[k].artifacts.push(a);}
  STORE.setItem(STORAGE_KEY,JSON.stringify(s));
  return s;
}
/* A fresh learner record, shaped from the default so new fields are never missed. */
function blankLearner(){return clone(DEFAULT_STATE.learners.faye);}
function mergeState(base,incoming){
  const out={...base,...incoming,prefs:{...base.prefs,...(incoming.prefs||{})},learners:{},roster:{}};
  /*
    Union of both sides, not a fixed pair. The old version looped over ['faye','philip'],
    so restoring a backup that contained a third learner silently discarded them.
  */
  const incomingRoster=(incoming&&incoming.roster)||{};
  const keys=new Set([...Object.keys(base.roster||{}),...Object.keys(incomingRoster),...Object.keys((incoming&&incoming.learners)||{})]);
  for(const k of keys){
    const seed=incomingRoster[k]||(base.roster||{})[k]||FAMILY_SEED[k];
    if(!seed)continue;
    out.roster[k]={name:seed.name||k,track:TRACKS[seed.track]?seed.track:'Explorer',emoji:seed.emoji||'🌟'};
    out.learners[k]={...blankLearner(),...((base.learners||{})[k]||{}),...((incoming.learners||{})[k]||{})};
  }
  if(!Object.keys(out.roster).length){out.roster={...clone(DEFAULT_STATE.roster)};out.learners={...clone(DEFAULT_STATE.learners)};}
  if(!out.roster[out.activeLearner])out.activeLearner=Object.keys(out.roster)[0];
  return out;
}

/*
  A child who closes the tab mid-mission used to land back on Home and have to
  find their way in again. The page they were on is remembered; a mission is
  only reopened if it still has unfinished work saved against it, so coming
  back never drops them into something they had already finished.
*/
const RESTORABLE=new Set(['path','labs','library','learn','review','portfolio','home','skills']);
function rememberView(){
  if(!state.prefs.betaOnboarded)return;
  state.prefs.lastView=(ui.page==='lesson'&&ui.currentMissionId)
    ? {page:'lesson',missionId:ui.currentMissionId}
    : {page:RESTORABLE.has(ui.page)?ui.page:'home'};
  persistStateOnly();
}
function restoreLastView(){
  const v=state.prefs.lastView;
  if(!v||!v.page)return false;
  if(v.page==='lesson'){
    const d=v.missionId&&missionDraft(v.missionId);
    if(d&&!d.completed&&BY_ID[v.missionId]){ui.resumingDraft=true;openMission(v.missionId);return true;}
    showPage('path');return true;
  }
  if(RESTORABLE.has(v.page)){showPage(v.page);return true;}
  return false;
}
function applyNavigation(){
  const mode=state.prefs.viewMode||'learner',track=profile().track;
  /* Nothing in the nav works until onboarding picks a track, so hide it until then. */
  document.body.classList.toggle('pre-onboard',!state.prefs.betaOnboarded);
  document.body.classList.toggle('learner-view',mode!=='adult');document.body.classList.toggle('adult-view',mode==='adult');
  document.querySelectorAll('nav [data-audience]').forEach(el=>{const a=(el.dataset.audience||'').split(/\s+/);el.hidden=!(mode==='adult'?a.includes('adult'):a.includes('learner')||(track==='Engineer'&&a.includes('engineer')));});
  const t=document.getElementById('viewModeToggle');if(t){t.textContent=mode==='adult'?'🧒 Learner view':'👩‍🏫 Grown-up';t.setAttribute('aria-pressed',mode==='adult'?'true':'false');}
}
/*
  Reading comfort lives in the top bar, not in Settings. Settings is adult-only, which
  meant a child who set the site up alone could not reach the text-size controls at all.
*/
function prefSeg(action,attr,current,opts){
  return `<div class="seg">${opts.map(([v,l])=>`<button class="${current===v?'on':''}" data-action="${action}" data-${attr}="${v}">${l}</button>`).join('')}</div>`;
}
function readingControlsHTML(){
  return `<div class="pref-row"><b>Text size</b>${prefSeg('text-size','size',state.prefs.textSize||'normal',[['normal','Normal'],['large','Large'],['xlarge','Extra large']])}</div>`
   +`<div class="pref-row"><b>Letter style</b>${prefSeg('font-style','font',state.prefs.fontStyle||'default',[['default','Standard'],['readable','Easier to read']])}</div>`
   +`<div class="pref-row"><b>Motion</b>${prefSeg('motion-pref','motion',state.prefs.motion||'on',[['on','Animations on'],['off','Calm mode']])}</div>`
   +`<div class="pref-row"><b>Colours</b>${prefSeg('theme-pref','theme',state.prefs.theme||'auto',[['auto','Match device'],['light','Light'],['dark','Dark']])}</div>`;
}
function renderReadingPanel(){
  const el=document.getElementById('readingPanel');if(!el)return;
  el.innerHTML=`<div class="reading-panel-head"><b>\ud83d\udc41\ufe0f Reading comfort</b><button class="ghost" data-action="open-reading">Close</button></div>`
    +readingControlsHTML()
    +`<p class="muted">These follow you around the whole site and are remembered on this device.</p>`;
}
function toggleReadingPanel(force){
  const el=document.getElementById('readingPanel'),btn=document.getElementById('readingBtn');
  if(!el)return;
  const open=typeof force==='boolean'?force:el.hidden;
  if(open)renderReadingPanel();
  el.hidden=!open;
  if(btn)btn.setAttribute('aria-expanded',String(open));
  if(open){const h=el.querySelector('.reading-panel-head b');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}}
  else if(btn)btn.focus();
}
/* A preference change has to redraw whichever surface is currently showing it. */
function refreshPrefsUI(){
  const el=document.getElementById('readingPanel');
  if(el&&!el.hidden)renderReadingPanel();
  if(ui.page==='settings')renderSettings();
}
/*
  Theme. 'auto' follows the device, which is what most people want and the only
  option a child will understand. The explicit choices exist because a shared
  family tablet is often set to one mode for everyone.
*/
function applyTheme(){
  const pref=state.prefs.theme||'auto';
  const root=document.documentElement;
  if(pref==='auto')root.removeAttribute('data-theme');
  else root.setAttribute('data-theme',pref);
  const dark=pref==='dark'||(pref==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark-ui',dark);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',dark?'#10141f':'#5b52d6');
}
function watchSystemTheme(){
  if(!window.matchMedia)return;
  const mq=window.matchMedia('(prefers-color-scheme: dark)');
  const onChange=()=>{if((state.prefs.theme||'auto')==='auto')applyTheme();};
  if(mq.addEventListener)mq.addEventListener('change',onChange);
  else if(mq.addListener)mq.addListener(onChange);
}
function applyPrefs(){
  const b=document.body;
  /* Legacy flag from earlier builds maps onto the new three-step scale. */
  const size=state.prefs.textSize||(state.prefs.largeText?'large':'normal');
  b.classList.toggle('text-large',size==='large');
  b.classList.toggle('text-xlarge',size==='xlarge');
  b.classList.toggle('large-text',size!=='normal');
  b.classList.toggle('readable-font',(state.prefs.fontStyle||'default')==='readable');
  b.classList.toggle('calm',(state.prefs.motion||'on')==='off');
  applyTheme();
  b.classList.toggle('focus',!!state.prefs.focus);
  applyNavigation();
}
function updateLearnerChip(){const p=profile();const el=document.getElementById('learnerChip');if(el)el.textContent=`${p.emoji} ${p.name}`;}
function switchLearner(){
  const keys=learnerKeys();
  if(keys.length<2){toast('Add another learner in Settings to switch between them.');return;}
  const i=keys.indexOf(state.activeLearner);
  selectLearner(keys[(i+1)%keys.length]);
}

function showPage(id){
  if(ui.page==='lesson'&&id!=='lesson')captureMissionDraft(true);
  stopReading();
  ui.page=id;
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===id));
  document.querySelectorAll('nav [data-page]').forEach(x=>{const on=x.dataset.page===id;x.classList.toggle('active',on);if(on)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
  renderPage(id);
  applyNavigation();
  rememberView();
  window.scrollTo({top:0,behavior:(state.prefs.motion||'on')==='off'?'auto':'smooth'});
  focusPageHeading(id);
}
/*
  Changing "page" here only swaps a CSS class, so a keyboard or screen-reader user was
  left focused on the nav button with no signal that the whole view had changed.
  Move focus to the new heading and announce it.
*/
function focusPageHeading(id){
  const host=document.getElementById(id);if(!host)return;
  const h=host.querySelector('h1,h2');if(!h)return;
  h.setAttribute('tabindex','-1');
  h.focus({preventScroll:true});
  const live=document.getElementById('routeStatus');
  if(live)live.textContent=h.textContent.replace(/\s+/g,' ').trim();
}
/*
  Any thrown error inside a render used to leave the child looking at a blank
  white panel with no way out. The work is all stored locally, so recovery is
  genuinely possible: say so plainly, offer a way back, and keep the technical
  detail folded away for an adult.
*/
function renderPage(id){
  try{ renderPageInner(id); }
  catch(err){
    const host=document.getElementById(id+'Body');
    console.error('InventorLab render error on page "'+id+'":',err);
    if(host)host.innerHTML=`<div class="render-error"><h2>\ud83d\ude45 This screen did not load properly</h2>
      <p>Nothing you have done is lost \u2014 your work is saved on this device. Try going back to your path, or reload the page.</p>
      <div class="button-row"><button class="primary" data-page="path">Back to My Path</button><button class="secondary" data-action="reload-page">Reload</button></div>
      <details><summary>Details for a grown-up</summary><pre>${esc(String(err&&err.stack||err))}</pre></details></div>`;
  }
}
function renderPageInner(id){
  if(id==='home')renderHome(); else if(id==='path')renderPath(); else if(id==='session')renderSession(); else if(id==='learn')renderLearnHub(); else if(id==='chapter')renderConceptChapter(ui.currentChapter); else if(id==='labs')renderLabs(); else if(id==='library')renderLibrary(); else if(id==='lesson')renderLesson();
  else if(id==='skills')renderSkills(); else if(id==='assessment')renderAssessment(); else if(id==='review')renderReview();
  else if(id==='portfolio')renderPortfolio(); else if(id==='parent')renderParent(); else if(id==='diagnostic')renderDiagnostic();
  else if(id==='coach')renderCoach(); else if(id==='summary')renderTeacherSummary(); else if(id==='settings')renderSettings(); else if(id==='feedback')renderFeedback(); else if(id==='welcome')renderWelcome();
}

const EXPLORER_VISUALS={
  ...(window.INVENTORLAB_EXTRA_VISUALS||{}),
  ct2:[['📍','Start'],['🗣️','One exact instruction'],['🤖','Robot follows literally'],['🐞','Fix the unclear step'],['🔁','Move treasure & adapt']],
  d1:[['📍','Start'],['➡️','Move'],['↪️','Turn'],['🔊','Light / sound'],['👀','Check finish']],
  d2:[['📏','Estimate'],['▶️','Run once'],['👀','Too far / short?'],['🔧','Change one value'],['🍕','Deliver']],
  d3:[['💃','Make 3 moves'],['🔁','Spot repetition'],['📦','Put pattern in loop'],['4️⃣','Repeat ×4'],['🗣️','Explain inside/outside']],
  d4:[['🗺️','Draw route'],['➡️','Solve first straight'],['↪️','Solve first turn'],['🧪','Test same start'],['🧩','Add next section']],
  d5:[['👀','Sense obstacle'],['❓','Ask IF?'],['🛑','Choose response'],['➡️','Add safe action'],['🔄','Move obstacle & adapt']],
  w1:[['⚙️','Test motor'],['🧱','Connect mechanism'],['▶️','Run'],['👀','What moved?'],['🔄','Reverse & explain']],
  w2:[['⚙️','Choose gears'],['🔮','Predict speed'],['⏱️','Same run time'],['📊','Compare turns'],['🧠','Explain gear size']],
  w3:[['👀','INPUT'],['❓','DECISION'],['⚙️','OUTPUT'],['🧪','Test separately'],['🔁','Change trigger']],
  s1:[['🟩','Start event'],['🐱','Choose target'],['➡️','Small moves'],['🧪','Test'],['⚡','Change speed']],
  s2:[['0️⃣','Set score = 0'],['🎯','Scoring event'],['➕','Change +1'],['🔄','Restart'],['🧪','Prove no old points']],
  m1:[['🤳','Shake = input'],['🧠','Event runs'],['✨','Icon = output'],['🧪','Test'],['🅰️','Add button A']],
  m2:[['🤳','Shake'],['🎲','Random 1–6'],['📦','Store roll'],['🔢','Display'],['🔄','Change range']],
  m3:[['📡','Sender'],['✉️','Message'],['📻','Same group'],['📥','Receiver'],['✅','Different response']],
  x1:[['🗺️','Navigation'],['🧰','Rescue part'],['🏁','Safe-zone finish'],['🧪','Test separately'],['🔗','Integrate & adapt']]
};
const EXPLORER_MISSION_CHECKS={
  ...(window.INVENTORLAB_EXTRA_CHECKS||{}),
  ct2:{q:'The human robot asks “Where is over there?” What is the best fix?',opts:['Point silently','Replace it with a direction and number of steps','Start the whole route again'],ans:1,explain:'Precise algorithms replace vague instructions with actions another person can follow.'},
  d1:{q:'You swap TURN and MOVE. What should happen before RUN?',opts:['Predict a different finish','Press RUN quickly','Add more blocks'],ans:0,explain:'Order changes the state after each step, so the finishing position can change.'},
  d2:{q:'Dash stops 25 cm short. What is the strongest next move?',opts:['Change distance using the size of the error','Change distance, speed and turn together','Keep rerunning unchanged'],ans:0,explain:'Use measured error to make one controlled adjustment.'},
  d3:{q:'Which actions belong inside Repeat?',opts:['Only the actions that form the repeating dance pattern','Every block in the whole program','Only the final sound'],ans:0,explain:'A loop should contain exactly the repeated unit.'},
  d4:{q:'Dash misses the second turn. What should you change first?',opts:['Only the part responsible for that turn','Every distance and angle','The start position each trial'],ans:0,explain:'Decomposition lets you isolate the failing part instead of disturbing working sections.'},
  d5:{q:'The sensor reports an obstacle. Who decides what Dash does next?',opts:['The program rule','The sensor itself','The obstacle'],ans:0,explain:'The sensor provides information; the program interprets it and chooses an action.'},
  w1:{q:'You reverse the motor and the mechanism reverses. What is the output?',opts:['The changed physical movement','The code block','The battery'],ans:0,explain:'Output is the physical effect produced by the programmed system.'},
  w2:{q:'To compare two gear pairings fairly, what should stay the same?',opts:['Motor power and run time','Gear pairing','Your prediction'],ans:0,explain:'A fair comparison changes the factor being studied while controlling the others.'},
  w3:{q:'The creature moves at the wrong time. What should you inspect first?',opts:['The sensor condition / decision','Decoration','Motor colour'],ans:0,explain:'If triggering is wrong, check the input and decision before changing the output.'},
  s1:{q:'What starts the chase behaviour?',opts:['An event such as green flag','The sprite colour','The score variable'],ans:0,explain:'Events answer when a behaviour begins.'},
  s2:{q:'Where should “set score to 0” go?',opts:['At the game-start event','Every time a point is earned','Only when the player wins'],ans:0,explain:'The variable should be initialised when a new game starts.'},
  m1:{q:'In “shake → show heart”, which is the input?',opts:['The shake','The heart display','The program name'],ans:0,explain:'The shake is information entering the program; the display is the output.'},
  m2:{q:'Twelve dice rolls do not show every number twice. Is the program automatically wrong?',opts:['No — small random samples can be uneven','Yes — random means perfectly even every time','Yes — a dice must repeat in order'],ans:0,explain:'Random does not mean perfectly balanced in a tiny sample.'},
  m3:{q:'Sender is group 7 and Receiver is group 3. What is the first thing to fix?',opts:['Make the radio groups match','Change the displayed icon','Press the button faster'],ans:0,explain:'Both devices need compatible communication settings before message debugging.'},
  x1:{q:'The route works, but the rescue attachment fails. What should you debug?',opts:['The rescue subsystem by itself','The whole system at once','Only the final safe-zone position'],ans:0,explain:'Capstone debugging should isolate the failing subsystem before reintegration.'}
};
const ENGINEER_LENSES={
  e1:{metric:'Detection reliability and false-positive rate',risk:'Alarm triggers from irrelevant movement/noise',tradeoff:'Sensitivity ↔ false alarms'},
  e6:{metric:'Successful acknowledged exchanges / attempts',risk:'Sender assumes delivery when receiver never handled the message',tradeoff:'Reliability ↔ protocol complexity'},
  e7:{metric:'Mean error and spread before vs after calibration',risk:'One “good” run hides systematic or variable error',tradeoff:'Accuracy ↔ robustness across conditions'},
  e2:{metric:'Delivery success rate, error and completion time',risk:'Optimising one lucky route rather than repeatability',tradeoff:'Speed ↔ accuracy/reliability'},
  e8:{metric:'Correct state transitions including invalid/blocked cases',risk:'Simulation allows impossible contradictory states',tradeoff:'Model simplicity ↔ realism'},
  e3:{metric:'Correct commands, status and state transitions under misuse',risk:'UI says one state while robot/system is actually in another',tradeoff:'Interface simplicity ↔ explicit status/safety'},
  e4:{metric:'Correctness after modifying inputs/requirements without template copying',risk:'Code works but abstraction is not understood',tradeoff:'Generality ↔ readability/simplicity'},
  e11:{metric:'Reproducible dataset + justified conclusion',risk:'Conclusion is stronger than the measurements support',tradeoff:'More data ↔ time/collection effort'},
  e9:{metric:'Circuit behaves according to predicted timing/input cases',risk:'Code debugging masks a wiring/power problem',tradeoff:'Circuit simplicity ↔ richer behaviour'},
  e5:{metric:'Measured fit/function improvement from v1 to v2',risk:'Pretty CAD without solving the physical requirement',tradeoff:'Material/time ↔ strength/fit'},
  e10:{metric:'A new user can understand evidence and use interaction unaided',risk:'Polished page hides weak engineering evidence or inaccessible controls',tradeoff:'Visual complexity ↔ clarity/accessibility'},
  i1:{metric:'Requirements met across repeated normal + failure tests',risk:'Integrated demo works once but lacks fallback or diagnosability',tradeoff:'Capability ↔ reliability/cost/complexity'}
};
function visualStoryboardHTML(m){const v=EXPLORER_VISUALS[m.id];if(!v)return'';return `<div class="visual-storyboard"><div class="storyboard-title">👁️ Mission map — look first, then read</div><div class="storyboard-flow">${v.map(([icon,label],i)=>`${i?'<span class="story-arrow">→</span>':''}<div class="story-card"><span>${icon}</span><b>${esc(label)}</b></div>`).join('')}</div></div>`;}
function missionQuickCheck(m){return EXPLORER_MISSION_CHECKS[m.id]||(()=>{const p=conceptProfile(m);return{q:p.check[0],opts:p.check[1],ans:p.check[2],explain:p.why};})();}
function engineeringLensHTML(m){const x=ENGINEER_LENSES[m.id];if(!x)return'';return `<div class="engineering-lens"><span class="tag">PROFESSIONAL REVIEW LENS</span><div><b>📏 Primary evidence:</b> ${esc(x.metric)}</div><div><b>⚠️ Main failure risk:</b> ${esc(x.risk)}</div><div><b>⚖️ Trade-off to discuss:</b> ${esc(x.tradeoff)}</div></div>`;}
const RESCUE_TYPES={
  setup:{icon:'🔌',label:'Robot / app setup problem',blocking:false,category:'equipment',severity:'medium',child:'A grown-up may fix charging, pairing, cables, login/app setup, or move the equipment. Then the learner takes over the thinking again.'},
  safety:{icon:'🦺',label:'I need grown-up hands for safety',blocking:false,category:'safety',severity:'medium',child:'A grown-up may handle the unsafe or physically difficult part. They should not choose the code, number, algorithm or answer.'},
  language:{icon:'🗣️',label:'I do not understand the words',blocking:true,category:'language',severity:'medium',child:'First listen to the step again and open the word help. If the wording is still unclear, a grown-up may explain the words only — not the solution.'},
  navigation:{icon:'🧭',label:'I do not know what the page wants me to do',blocking:true,category:'usability',severity:'medium',child:'A grown-up may point to the instruction or website control, but should not decide the solution. This is logged as product friction.'},
  debug:{icon:'🐞',label:'Something happened and I do not know why',blocking:true,category:'self-learning',severity:'medium',child:'Use the symptom checker first. If you still cannot continue, a grown-up may ask one diagnostic question without telling you what to change.'},
  concept:{icon:'🧠',label:'I do not know how to solve the thinking part',blocking:true,category:'scaffolding',severity:'medium',child:'A grown-up may ask one small question. They should not give the block, number, route or finished answer.'}
};
function rescueType(log){return RESCUE_TYPES[log?.reason]||{blocking:true,label:'Legacy / unclassified learning rescue',category:'self-learning',severity:'medium'};}
function rescueIsBlocking(log){return rescueType(log).blocking!==false;}
function rescueSummary(id,since=null){
  const all=(learner().rescueLogs||[]).filter(x=>(!id||x.missionId===id)&&(!since||new Date(x.date)>=new Date(since)));
  const blocking=all.filter(rescueIsBlocking),setup=all.filter(x=>!rescueIsBlocking(x));
  return{all,blocking,setup,byReason:Object.fromEntries(Object.keys(RESCUE_TYPES).map(k=>[k,all.filter(x=>x.reason===k).length]))};
}
function rescueReasonPickerHTML(){return `<div class="rescue-reason-picker"><h3>👩‍🏫 What kind of help do you need?</h3><p class="muted">This matters: setup and safety help are allowed. Help with the thinking is recorded separately.</p><div class="rescue-reason-grid">${Object.entries(RESCUE_TYPES).map(([key,r])=>`<button data-action="adult-rescue-reason" data-reason="${key}"><span>${r.icon}</span><b>${esc(r.label)}</b><small>${r.blocking?'learning help • affects independence evidence':'setup / safety • does not reduce mastery'}</small></button>`).join('')}</div></div>`;}
function rescueBridgeHTML(m){const logs=(learner().rescueLogs||[]).filter(x=>x.missionId===m.id&&rescueIsBlocking(x));if(!logs.length)return'';const step=logs[0].step,bridges={0:'Before starting, point to each item you need and say the job in one sentence.',1:'Before RUN, point or draw where you think the result will end. No numbers are needed unless the mission asks for them.',2:'Do exactly one baseline test. Your only job is to watch; do not fix anything yet.',3:'Choose one: too far / too short / wrong turn / wrong trigger / different from prediction. Then say what evidence you saw.',4:'Use the sentence frame: “I changed ___ because I noticed ___.”',5:'Change one condition and explain what should stay the same.'};return `<div class="rescue-bridge"><b>🪜 Your retry bridge</b><p>Last time you needed help at <b>${esc(explorerStepNames()[step]||'this mission')}</b>. This time, try this tiny step first:</p><p>${esc(bridges[step]||'Do one small test and explain what you notice before changing anything.')}</p></div>`;}

const STUDIO_SKILLS={
  ...(window.INVENTORLAB_EXTRA_SKILLS||{}),
  ct2:['Algorithms','Sequencing','Prediction','Debugging','Transfer','Testing'],
  d1:['Sequencing','Prediction','Testing'],
  d2:['Measurement','Debugging','Prediction','Testing','Iteration'],
  d3:['Loops','Pattern recognition','Sequencing','Testing','Transfer'],
  d4:['Decomposition','Algorithms','Sequencing','Prediction','Testing'],
  d5:['Sensors','Conditionals','Input / output','Testing','Transfer'],
  w1:['Input / output','Testing','Measurement','Iteration'],
  w2:['Measurement','Pattern recognition','Prediction','Testing','Optimisation'],
  w3:['Sensors','Conditionals','Input / output','Events','Testing'],
  s1:['Events','Sequencing','State','Testing'],
  s2:['Variables','State','Events','Testing'],
  m1:['Input / output','Events','Sensors','Conditionals','Testing'],
  m2:['Variables','Events','Testing','Transfer'],
  m3:['Events','Input / output','State','Testing','Debugging'],
  x1:['Debugging','Decomposition','Algorithms','Testing','Iteration','Transfer','Prediction'],
  e1:['Sensors','Conditionals','Testing','Debugging','Measurement'],
  e6:['Input / output','Events','State','Testing','Debugging','Decomposition'],
  e7:['Calibration','Measurement','Testing','Data','Optimisation'],
  e2:['Optimisation','Algorithms','Measurement','Testing','Decomposition','Iteration'],
  e8:['State','Variables','Events','Testing','Decomposition'],
  e3:['State','Events','Variables','Decomposition','Testing'],
  e4:['Functions','Variables','Algorithms','Transfer','Debugging','Testing'],
  e11:['Data','Measurement','Testing','Transfer'],
  e9:['Input / output','Sequencing','Testing','Debugging','Variables'],
  e5:['Iteration','Measurement','Testing','Optimisation','Transfer'],
  e10:['Decomposition','Events','State','Testing','Transfer'],
  i1:['Decomposition','Algorithms','Testing','Iteration','Measurement','Optimisation','Transfer','Debugging']
};

const STUDIO_PREREQS={
  ...(window.INVENTORLAB_EXTRA_PREREQS||{}),
  ct2:[], d1:['Sequencing'], d2:['Prediction','Sequencing'], d3:['Sequencing'], d4:['Sequencing','Prediction'], d5:['Sequencing'],
  w1:['Prediction'], w2:['Measurement'], w3:['Input / output','Conditionals'], s1:['Sequencing'], s2:['Events'], m1:['Input / output','Events'],
  m2:['Events','Variables'], m3:['Events','Input / output'], x1:['Debugging','Decomposition','Testing'],
  e1:[], e6:['Sensors','Testing','Debugging'], e7:['Measurement','Debugging'], e2:['Calibration','Measurement','Testing'], e8:['Decomposition','Testing'],
  e3:['State','Events'], e4:['Variables','Debugging'], e11:['Measurement','Testing'], e9:['Debugging','Testing'], e5:['Measurement','Iteration'],
  e10:['Decomposition','State'], i1:['Decomposition','Testing','Transfer']
};
function missionRequiredSkills(m){
  if(STUDIO_PREREQS[m.id])return [...STUDIO_PREREQS[m.id]];
  const all=new Set();for(const s of missionSkills(m))for(const p of prereqClosure(s))all.add(p);return [...all];
}

function missionSkills(m){
  if(STUDIO_SKILLS[m.id])return [...STUDIO_SKILLS[m.id]];
  const c=(m.concept||'').toLowerCase(); const a=['Prediction','Testing'];
  const rules=[['sequenc','Sequencing'],['pattern','Pattern recognition'],['loop','Loops'],['condition','Conditionals'],['input','Input / output'],['output','Input / output'],['sensor','Sensors'],['variable','Variables'],['event','Events'],['state','State'],['function','Functions'],['debug','Debugging'],['decom','Decomposition'],['measure','Measurement'],['calibr','Calibration'],['algorithm','Algorithms'],['optim','Optimisation'],['data','Data'],['iterat','Iteration'],['integration','Iteration'],['system','Decomposition'],['precision','Sequencing']];
  for(const [needle,skill] of rules)if(c.includes(needle))a.push(skill);
  if(c.includes('motor')||c.includes('gear')||c.includes('mechanism'))a.push('Testing','Measurement');
  return [...new Set(a)];
}
function primarySkill(m){const s=missionSkills(m).filter(x=>!['Prediction','Testing'].includes(x));return s[0]||'Prediction';}
function prereqClosure(skill,seen=new Set()){if(seen.has(skill))return[];seen.add(skill);const d=PREREQ[skill]||[];return [...d,...d.flatMap(x=>prereqClosure(x,seen))];}
function evidenceEvents(skill){return learner().evidence[skill]||[];}
function evidencePoints(skill){return evidenceEvents(skill).reduce((n,e)=>n+(Number(e.value)||0),0);}
function addEvidence(skill,value,source,meta={}){if(!learner().evidence[skill])learner().evidence[skill]=[];learner().evidence[skill].unshift({value,source,date:nowISO(),...meta});learner().evidence[skill]=learner().evidence[skill].slice(0,40);}
function evidenceType(e){const s=String(e.source||'').toLowerCase();if(s.startsWith('mission evidence'))return'mission';if(s.startsWith('concept assessment'))return'assessment';if(s.startsWith('spaced review'))return'review';if(s.includes('changed-context'))return'transfer';if(s.includes('remediation')||s.includes('refresher'))return'remediation';if(s.includes('quick understanding'))return'quick';if(s.includes('placement'))return'placement';return'other';}
function missionEvidenceKey(e){if(e?.missionId)return e.missionId;const src=String(e?.source||'');const title=src.replace(/^Mission evidence:\s*/i,'').trim();const m=LESSONS.find(x=>x.title===title);return m?.id||title||null;}
function strongAssessmentEvent(e){return evidenceType(e)==='assessment'&&(Number(e.value)||0)>=3&&e.assessmentStrong!==false;}
function evidenceDiversity(skill){const events=evidenceEvents(skill),strongProjects=events.filter(e=>evidenceType(e)==='mission'&&Number(e.rating)>=3),projectKeys=[...new Set(strongProjects.map(missionEvidenceKey).filter(Boolean))],strongAssessments=events.filter(strongAssessmentEvent),verifiedReviews=events.filter(e=>evidenceType(e)==='review'&&e.reviewCorrect===true&&(e.reviewRate==='ok'||e.reviewRate==='easy'));return{distinctStrongProjects:projectKeys.length,projectKeys,strongAssessments:strongAssessments.length,verifiedReviews:verifiedReviews.length,independentSources:(projectKeys.length?1:0)+(strongAssessments.length?1:0)+(verifiedReviews.length?1:0)};}
function reviewDueForSkill(skill){const now=new Date();return (learner().reviews||[]).some(r=>r.skill===skill&&new Date(r.due)<=now);}
function skillChallengeEvents(skill){
  const out=[];
  for(const a of learner().reviewAttempts||[])if(a.skill===skill&&a.correct===false)out.push({date:a.date,type:'retrieval-gap',detail:a.title||skill});
  for(const a of learner().assessments||[])if(a.skill===skill&&Number(a.score)<100)out.push({date:a.date,type:'assessment-gap',detail:`${a.score}% cross-context check`});
  for(const a of learner().attemptPackets||[]){const m=BY_ID[a.missionId];if(m&&primarySkill(m)===skill&&Number(a.rating)<=2)out.push({date:a.completedAt||a.date,type:'supported-project',detail:a.title||m.title});}
  return out.filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function skillRecoveryEvents(skill){
  const out=[];
  for(const e of evidenceEvents(skill)){
    const t=evidenceType(e);if((t==='mission'&&Number(e.rating)>=3)||(t==='assessment'&&strongAssessmentEvent(e))||(t==='review'&&e.reviewCorrect===true))out.push({date:e.date,type:t,detail:e.source});
  }
  return out.filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function skillFreshness(skill,historicalRank){
  const challenge=skillChallengeEvents(skill)[0]||null,recovery=skillRecoveryEvents(skill)[0]||null;
  const unresolved=!!(challenge&&(!recovery||new Date(challenge.date)>new Date(recovery.date)));
  const due=historicalRank>=3&&reviewDueForSkill(skill);
  if(unresolved)return{state:'reconfirm',reason:`Recent evidence found a gap: ${challenge.detail}. Reconfirm before relying on old mastery.`,challenge,recovery,due};
  if(due)return{state:'due',reason:'A delayed retrieval check is due. Historical mastery is preserved, but current readiness should be reconfirmed before harder dependent work.',challenge,recovery,due};
  return{state:'current',reason:'No newer contradictory evidence is unresolved.',challenge,recovery,due};
}
function evidenceProfile(skill){
  const events=evidenceEvents(skill),by={mission:0,assessment:0,review:0,legacyReview:0,transfer:0,remediation:0,quick:0,placement:0,other:0};events.forEach(e=>{const t=evidenceType(e);if(t==='review'&&e.reviewCorrect!==true)by.legacyReview++;else by[t]++;});
  const strongMission=events.some(e=>evidenceType(e)==='mission'&&Number(e.rating)>=3),developMission=events.some(e=>evidenceType(e)==='mission'&&Number(e.rating)>=2);
  const diversity=evidenceDiversity(skill),assessment=events.some(strongAssessmentEvent),review=events.some(e=>evidenceType(e)==='review'&&e.reviewCorrect===true&&(e.reviewRate==='ok'||e.reviewRate==='easy'));
  const transfer=events.some(e=>evidenceType(e)==='transfer')||events.some(e=>evidenceType(e)==='mission'&&Number(e.rating)>=4);
  const corroborated=assessment||review||diversity.distinctStrongProjects>=2;
  const masteryEvents=events.filter(e=>evidenceType(e)!=='placement');
  let historicalLabel='Not yet evidenced',historicalPct=5,historicalRank=0;
  if(masteryEvents.length){historicalLabel='Emerging';historicalPct=28;historicalRank=1;}
  if(developMission||assessment||review){historicalLabel='Developing';historicalPct=52;historicalRank=2;}
  if(strongMission&&corroborated){historicalLabel='Secure';historicalPct=78;historicalRank=3;}
  if(transfer&&(review||assessment)){historicalLabel='Transfer';historicalPct=100;historicalRank=4;}
  const freshness=skillFreshness(skill,historicalRank);let label=historicalLabel,pct=historicalPct,rank=historicalRank;
  if(historicalRank>=3&&freshness.state!=='current'){label='Reconfirm';pct=58;rank=2;}
  return{label,pct,rank,by,points:evidencePoints(skill),strongMission,assessment,review,transfer,corroborated,diversity,historicalLabel,historicalPct,historicalRank,freshness};
}
function mastery(input){return typeof input==='string'?evidenceProfile(input):input&&input.label?input:{label:Number(input)>=8?'Developing':Number(input)>0?'Emerging':'Not yet evidenced',pct:Number(input)>0?28:5,rank:Number(input)>0?1:0};}
function missionPrereqs(m){return missionRequiredSkills(m).map(skill=>{const profile=evidenceProfile(skill);return{skill,points:profile.points,ok:profile.rank>=2,status:profile.label,rank:profile.rank}}).sort((a,b)=>a.rank-b.rank||a.points-b.points);}
function curriculumGapFor(m){const p=profile(),idx=p.path.indexOf(m.id);if(idx<0)return[];const prior=new Set(p.path.slice(0,idx).flatMap(id=>STUDIO_SKILLS[id]||[]));return missionRequiredSkills(m).filter(s=>!prior.has(s)&&evidenceProfile(s).rank===0);}

function conceptProfile(m){return CONCEPTS[primarySkill(m)]||CONCEPTS.Prediction;}



function probeQuestionFor(m){
  const skill=primarySkill(m),c=chapterFor(skill),bank=(c?.checks||[]).map(x=>({q:x[0],opts:x[1],ans:x[2],explain:x[3]}));if(!bank.length){const p=CONCEPTS[skill]||CONCEPTS.Prediction;bank.push({q:p.check[0],opts:p.check[1],ans:p.check[2],explain:p.why});}
  const attempt=Math.max(1,missionRecord(m.id).attempts||1),seed=[...`${m.id}:${attempt}`].reduce((n,c)=>n+c.charCodeAt(0),0);
  const index=seed%bank.length,q=bank[index];return{...q,index,skill,source:'instructional-probe'};
}
function currentEntryProbe(id){
  const started=currentAttemptStarted(id);return (learner().entryProbes||[]).find(x=>x.missionId===id&&(!started||new Date(x.date)>=new Date(started)))||null;
}
function currentLearningSignal(id){
  const started=currentAttemptStarted(id);return (learner().learningSignals||[]).find(x=>x.missionId===id&&(!started||new Date(x.date)>=new Date(started)))||null;
}
function entryProbeHTML(m){
  if(m.quality!=='studio')return'';const done=currentEntryProbe(m.id),q=probeQuestionFor(m),skill=primarySkill(m);if(!q)return'';
  if(done)return `<div class="entry-probe saved"><span class="tag">STARTING-POINT CHECK SAVED</span><h3>🧭 ${esc(skill)} starting point</h3><p>${done.chosen<0?'You chose “Not sure yet”. That is useful information — no penalty.':'Your answer is saved.'} InventorLab uses this only to choose the amount of guidance and compare with the later Boss Check.</p><small>${done.confidence===2?'Certain':done.confidence===1?'Pretty sure':'Not sure'} • this does not count as mastery evidence</small></div>`;
  return `<div class="entry-probe" data-entry-probe="${esc(m.id)}"><span class="tag">BEFORE THE TEACHING • NOT GRADED</span><h3>${profile().track==='Explorer'?'🌱 What do you think right now?':'⚙️ Entry probe: prior knowledge'}</h3><p class="muted">${profile().track==='Explorer'?'Pick your best answer. “Not sure yet” is completely okay.':'Answer before reading the concept refresher. This is a starting-point signal, not mastery evidence.'}</p><p><b>${esc(q.q)}</b></p><div class="entry-options">${q.opts.map((o,i)=>`<button data-action="entry-probe-answer" data-id="${esc(m.id)}" data-answer="${i}">${esc(o)}</button>`).join('')}<button class="ghost" data-action="entry-probe-unsure" data-id="${esc(m.id)}">I’m not sure yet</button></div><div class="entry-confidence"></div></div>`;
}
function entryProbeAnswer(btn){
  const host=btn.closest('.entry-probe');if(!host||host.dataset.pending)return;host.dataset.pending=String(btn.dataset.answer);host.querySelectorAll('.entry-options button').forEach(b=>b.disabled=true);
  const c=host.querySelector('.entry-confidence');if(c)c.innerHTML=`<h4>How sure were you before choosing?</h4><div class="confidence-row"><button data-action="entry-probe-confidence" data-id="${esc(btn.dataset.id)}" data-confidence="0">Not sure</button><button data-action="entry-probe-confidence" data-id="${esc(btn.dataset.id)}" data-confidence="1">Pretty sure</button><button data-action="entry-probe-confidence" data-id="${esc(btn.dataset.id)}" data-confidence="2">Certain</button></div><p class="muted">No correctness feedback yet. The point is to find the right amount of teaching.</p>`;
}
function saveEntryProbe(id,chosen,confidence){
  const m=BY_ID[id],q=probeQuestionFor(m);if(!m||!q||currentEntryProbe(id))return;
  if(!learner().entryProbes)learner().entryProbes=[];const c=Number(chosen),rec={missionId:id,title:m.title,skill:q.skill,itemIndex:q.index,chosen:c,correct:c===Number(q.ans),confidence:Number(confidence)||0,date:nowISO(),attemptStarted:currentAttemptStarted(id)};
  learner().entryProbes.unshift(rec);learner().entryProbes=learner().entryProbes.slice(0,160);save();renderLesson();
}
function entryProbeConfidence(btn){const host=btn.closest('.entry-probe'),chosen=Number(host?.dataset.pending);if(!host||Number.isNaN(chosen))return;saveEntryProbe(btn.dataset.id,chosen,Number(btn.dataset.confidence));}
function entryProbeUnsure(id){saveEntryProbe(id,-1,0);}
function learningSignalCategory(pre,postCorrect){if(!postCorrect)return pre?.correct?'mixed':'needs-repair';return pre?.correct?'confirmed-prior':'newly-demonstrated';}
function recordLearningSignal(m,postCorrect){
  const pre=currentEntryProbe(m.id);if(!pre||currentLearningSignal(m.id))return null;const category=learningSignalCategory(pre,!!postCorrect),rec={missionId:m.id,title:m.title,skill:primarySkill(m),preCorrect:!!pre.correct,preConfidence:pre.confidence,postCorrect:!!postCorrect,category,date:nowISO(),attemptStarted:currentAttemptStarted(m.id)};
  if(!learner().learningSignals)learner().learningSignals=[];learner().learningSignals.unshift(rec);learner().learningSignals=learner().learningSignals.slice(0,160);return rec;
}
function learningSignalLabel(x){return x==='newly-demonstrated'?'Newly demonstrated':x==='confirmed-prior'?'Confirmed prior knowledge':x==='mixed'?'Inconsistent — repair/recheck':'Needs repair';}
function learningSignalSummary(){const all=learner().learningSignals||[];return{n:all.length,newly:all.filter(x=>x.category==='newly-demonstrated').length,confirmed:all.filter(x=>x.category==='confirmed-prior').length,mixed:all.filter(x=>x.category==='mixed').length,repair:all.filter(x=>x.category==='needs-repair').length,recent:all.slice(0,8)};}
function instructionAdaptation(m){
  const pre=currentEntryProbe(m.id),skill=primarySkill(m),ep=evidenceProfile(skill),c=chapterFor(skill);if(!pre)return{mode:'unprobed',banner:''};
  const strong=pre.correct&&pre.confidence>=1&&ep.rank>=2;
  if(strong)return{mode:'challenge-first',banner:`<div class="adaptive-instruction challenge"><b>🚀 Challenge-first</b><p>You already showed a credible starting signal for <b>${esc(skill)}</b> and have prior evidence. The refresher is collapsed so you can spend your effort on applying, testing and explaining.</p></div>`};
  if(!pre.correct||pre.confidence===0)return{mode:'guided',banner:`<div class="adaptive-instruction guide"><b>🪜 Guided start</b><p>This idea is not secure enough to skip support yet. Start with one example, then make your own prediction.</p>${c?`<div class="worked-mini"><b>${esc(c.icon)} One example:</b> ${esc(c.examples[0])}</div>`:''}</div>`};
  return{mode:'brief',banner:`<div class="adaptive-instruction"><b>🌱 Short refresher</b><p>Your starting signal suggests partial familiarity. Use the short explanation, then move quickly into the task.</p></div>`};
}
/* The correct index and the explanation used to sit in the markup, where a curious learner
   could read them without answering. They are now held in memory and looked up on click. */
function missionCheckHTML(m){
  const q=missionQuickCheck(m),skill=primarySkill(m);
  ui.quickKey={missionId:m.id,ans:Number(q.ans),explain:q.explain,skill};
  return`<div class="lesson-card quick-check" data-quick-skill="${esc(skill)}" data-mission="${esc(m.id)}"><span class="tag">AFTER PRACTICE</span><h3>🧩 30-second Boss concept check</h3><p><b>${esc(q.q)}</b></p>${q.opts.map((o,i)=>`<button data-action="quick-answer" data-answer="${i}" data-skill="${esc(skill)}">${esc(o)}</button>`).join('')}<div class="quick-feedback"></div></div>`;
}

const GLOSSARY={
  'Prediction':['prediction','what you think will happen before you test','“I think Dash will stop before the tape because the distance is shorter.”'],
  'Sequencing':['sequence','instructions in the exact order they happen','First move, then turn, then beep.'],
  'Pattern recognition':['pattern','something that repeats or has the same structure','Move-turn, move-turn, move-turn.'],
  'Loops':['loop','an instruction that repeats a pattern','Repeat the dance 4 times.'],
  'Conditionals':['IF / THEN','a rule that chooses what to do when something is true','IF an obstacle is close, THEN stop.'],
  'Input / output':['input / output','information going into a system / an effect coming out','Button press = input; light = output.'],
  'Sensors':['sensor','a part that measures or detects something','A distance sensor gives a reading; your code decides what it means.'],
  'Variables':['variable','named memory whose value can change','Score starts at 0 and increases.'],
  'Events':['event','something that starts a behaviour','When button A is pressed…'],
  'State':['state','what the system currently remembers about itself','The game is in PLAYING or GAME OVER state.'],
  'Functions':['function','a named reusable job in code','turnAround(angle) does one clear job.'],
  'Debugging':['debug','finding why actual behaviour differs from expected behaviour','Reproduce → isolate → test one cause.'],
  'Decomposition':['decompose','break a big problem into smaller jobs','Test sensing separately from movement.'],
  'Measurement':['measurement','a recorded value with a clear meaning','Dash travelled 94 cm, not “about right”.'],
  'Calibration':['calibration','adjusting a system using measured error','Command 100 cm → actual 94 cm → adjust → retest.'],
  'Algorithms':['algorithm','a precise method or sequence for solving a problem','A route plan that another person could follow.'],
  'Optimisation':['optimise','improve a chosen measurable quality under constraints','Make it faster without reducing reliability.'],
  'Data':['data','recorded observations or measurements used as evidence','Five distance readings from the same test.'],
  'Testing':['test','a planned check that answers a specific question','Does changing only speed affect stopping distance?'],
  'Iteration':['iteration','test, learn, change, and test again','Version 1 → evidence → version 2.'],
  'Transfer':['transfer','use the same idea successfully in a new situation','Use conditional logic in Scratch after learning it with Dash.']
};
function glossaryHTML(m){
  const terms=[primarySkill(m),...missionSkills(m)].filter((x,i,a)=>GLOSSARY[x]&&a.indexOf(x)===i).slice(0,4);
  if(!terms.length)return'';
  return `<details class="glossary-card"><summary><b>🗣 Need a word?</b> <small class="muted">${terms.length} word${terms.length===1?'':'s'} from this mission</small></summary><p class="muted">Tap a word. You do not need to memorise definitions before doing the mission.</p><div class="glossary-chips">${terms.map(s=>`<button class="vocab-chip" data-action="vocab" data-skill="${esc(s)}">${esc(GLOSSARY[s][0])}</button>`).join('')}</div>${terms.map(s=>`<div class="vocab-def" id="vocab-${esc(s).replace(/[^a-zA-Z0-9]/g,'_')}"><b>${esc(GLOSSARY[s][0])}</b> — ${esc(GLOSSARY[s][1])}<br><small>${esc(GLOSSARY[s][2])}</small></div>`).join('')}</details>`;
}
function toggleVocab(skill){
  const id='vocab-'+skill.replace(/[^a-zA-Z0-9]/g,'_'),el=document.getElementById(id);if(el)el.classList.toggle('open');
  learner().vocabViews[skill]=(learner().vocabViews[skill]||0)+1;save();
}
function sessionControlHTML(m){
  const d=learner().sessionDraft;
  if(!d||d.missionId!==m.id)return'';
  return `<button class="ghost" data-action="end-session">🏁 End learning session</button>`;
}
function challengeContractHTML(m){
  if(state.activeLearner!=='philip')return'';
  return `<div class="challenge-contract"><h3>⚙️ Challenge contract</h3><p>Choose one standard that makes a working prototype insufficient.</p>
  <label><input type="radio" name="challengeContract" value="reliability" checked> Reliability — prove it works repeatedly, not once.</label>
  <label><input type="radio" name="challengeContract" value="failure"> Failure analysis — deliberately test an abnormal/failure case.</label>
  <label><input type="radio" name="challengeContract" value="transfer"> Transfer — change a constraint/tool and adapt independently.</label>
  <button data-action="commit-challenge" data-id="${m.id}">Commit challenge</button></div>`;
}
function designReviewHTML(m){
  if(state.activeLearner!=='philip')return'';
  return `<div class="design-review"><h3>📐 Engineering design review</h3><p>Score the <b>evidence</b>, not effort. 0 = not shown, 3 = strong and independently demonstrated.</p><div class="design-grid">
  ${[['repeat','Repeatability'],['measure','Measurement quality'],['explain','Explanation / causality'],['edge','Edge case / transfer']].map(([id,label])=>`<label>${label}<select id="dr-${id}"><option value="0">0 — not shown</option><option value="1">1 — weak</option><option value="2">2 — adequate</option><option value="3">3 — strong</option></select></label>`).join('')}</div>
  <label style="display:block;margin-top:10px"><b>Reviewer note</b><textarea id="dr-note" class="big-input" placeholder="What evidence supports these ratings?"></textarea></label>
  <button class="secondary" data-action="save-design-review" data-id="${m.id}">Save design review</button></div>`;
}
function startFamilySession(){
  const active=learner().sessionDraft;if(active&&!active.ended){openMission(active.missionId);toast('Resumed the current beta learning session.');return}
  const plan=learningPlan();
  if(plan.kind==='review'){showPage('review');toast('Review is the best next learning move before new work.');return}
  if(plan.kind==='remediation'||plan.kind==='prerequisite'){practiceSkill(plan.skill);toast('Repair the prerequisite before starting a new session.');return}
  if(plan.kind==='equipment'){showPage('settings');toast('Prepare or select the required equipment first.');return}
  if(!['mission','parallel','rescue-bridge'].includes(plan.kind)||!plan.mission){toast('No ready Studio mission for this session.');return}
  const m=plan.mission;learner().sessionDraft={missionId:m.id,started:nowISO(),mode:state.activeLearner==='faye'?'self-learn':'engineering-sprint',challenge:null,ended:null};state.prefs.focus=true;save();openMission(m.id);
}
function endFamilySession(){
  if(!learner().sessionDraft)return;learner().sessionDraft.ended=nowISO();state.prefs.focus=false;save();showPage('session');
}
function saveSessionObservation(){
  const d=learner().sessionDraft;if(!d)return;
  const get=id=>document.getElementById(id)?.value||'';
  const entry={...d,saved:nowISO(),observed:sessionObservedSignals(d),adultHelp:get('sessionHelp'),translation:get('sessionTranslation'),engagement:get('sessionEngagement'),independence:get('sessionIndependence'),stopReason:get('sessionStopReason'),notes:get('sessionNotes')};
  entry.validation=sessionValidationStatus(entry);
  learner().sessions.unshift(entry);learner().sessions=learner().sessions.slice(0,80);deriveSessionDefects(entry);learner().sessionDraft=null;save();toast('Beta session observation saved.');renderSession();
}
function commitChallenge(id){
  const chosen=document.querySelector('input[name="challengeContract"]:checked')?.value||'reliability';
  if(learner().sessionDraft&&learner().sessionDraft.missionId===id)learner().sessionDraft.challenge=chosen;
  const rec=missionRecord(id);rec.challengeContract=chosen;rec.challengeContractAt=nowISO();save();toast(`Challenge committed: ${chosen}`);
}
function saveDesignReview(id){
  const n=x=>Number(document.getElementById(x)?.value||0);
  const review={missionId:id,date:nowISO(),repeatability:n('dr-repeat'),measurement:n('dr-measure'),explanation:n('dr-explain'),edge:n('dr-edge'),note:document.getElementById('dr-note')?.value||''};
  review.total=review.repeatability+review.measurement+review.explanation+review.edge;
  learner().designReviews.unshift(review);learner().designReviews=learner().designReviews.slice(0,80);
  if(review.total>=9)addEvidence('Transfer',.5,`Engineering design review: ${BY_ID[id]?.title||id}`,{designReview:review.total});
  save();toast(`Design review saved: ${review.total}/12`);
}
function sessionDurationMinutes(d){if(!d?.started)return 0;const end=d.ended||d.saved||nowISO(),mins=Math.max(0,Math.round((new Date(end)-new Date(d.started))/60000));return Number.isFinite(mins)?mins:0;}
function sessionObservedSignals(d){
  if(!d)return{hints:0,rescues:0,setupAssists:0,selfDiagnosis:0,rating:null,support:'none',step:null,completed:false,duration:0};
  const packets=(learner().attemptPackets||[]).filter(x=>x.missionId===d.missionId&&new Date(x.completedAt)>=new Date(d.started)).sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt)),packet=packets[0]||null,duration=sessionDurationMinutes(d);
  if(packet)return{hints:packet.hints||0,rescues:packet.blockingRescues??packet.adultRescues??0,setupAssists:packet.setupAssists||0,selfDiagnosis:packet.selfDiagnosisUses||0,rating:packet.rating,support:packet.support||'recorded',step:packet.process?.handoffDone?'handoff recorded':null,completed:true,duration};
  const draft=missionDraft(d.missionId),rs=rescueSummary(d.missionId,d.started),debug=(learner().debugLogs||[]).filter(x=>x.missionId===d.missionId&&new Date(x.date)>=new Date(d.started)).length,hints=draft?.hints?.length||0;
  const support=rs.blocking.length?'adult-assisted':hints>1?'heavily-scaffolded':hints===1?'lightly-scaffolded':rs.setup.length?'independent-with-setup':'unassisted-in-progress';
  return{hints,rescues:rs.blocking.length,setupAssists:rs.setup.length,selfDiagnosis:debug,rating:null,support,step:draft?.mode==='explorer'?explorerStepNames()[Number(draft.explorerStep||0)]:null,completed:false,duration};
}
function sessionObservedHTML(d){const o=sessionObservedSignals(d);return `<div class="observed-signals"><span class="tag">SYSTEM-OBSERVED • COMPLEMENTS THE PARENT DEBRIEF</span><div class="observed-grid"><div><b>${o.completed?'✓':'—'}</b><small>${o.completed?'rated endpoint':'unfinished'}</small></div><div><b>${o.hints}</b><small>hint${o.hints===1?'':'s'}</small></div><div><b>${o.rescues}</b><small>learning rescue${o.rescues===1?'':'s'}</small></div><div><b>${o.setupAssists}</b><small>setup/safety assist${o.setupAssists===1?'':'s'}</small></div><div><b>${o.selfDiagnosis}</b><small>self-diagnosis</small></div><div><b>${o.rating??'—'}</b><small>mastery rating</small></div></div><p><b>Support pattern:</b> ${esc(o.support)}${o.step?` • ${esc(o.step)}`:''} • ~${o.duration} min</p><p class="muted">System logs cannot see every spoken prompt or adult intervention. The debrief is deliberately combined with these logs, and the more conservative signal wins for validation.</p></div>`;}
function renderSession(){
  const p=profile(),plan=learningPlan(),m=plan.mission||recommendedMission(),d=learner().sessionDraft;
  if(d&&!d.ended){const dm=BY_ID[d.missionId];document.getElementById('sessionBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">SESSION IN PROGRESS</p><h1 id="sessionTitle">${p.emoji} Continue the same learning attempt</h1></div><button class="ghost" data-action="switch-learner">Switch learner</button></div><div class="resume-card strong"><div><span class="tag">DO NOT START OVER</span><h2>${dm?.icon||'🚀'} ${esc(dm?.title||d.missionId)}</h2><p>${p.track==='Explorer'?'The child can continue at the saved step. Adult setup remains setup/safety only.':'Continue the same engineering sprint so hypotheses, trial fields and evidence stay attached to one attempt.'}</p><small>Session started ${new Date(d.started).toLocaleString()}</small></div><div class="button-row"><button class="primary" data-action="resume-mission" data-id="${d.missionId}">Resume mission →</button><button class="ghost" data-action="end-session">End & debrief</button></div></div>`;return;}
  if(d&&d.ended){
    document.getElementById('sessionBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">BETA SESSION DEBRIEF</p><h1 id="sessionTitle">What happened without rescuing?</h1></div></div>
    <div class="session-observation"><p><span class="alpha-signal">${p.emoji} ${p.name}</span> <b>${esc(BY_ID[d.missionId]?.title||'Session')}</b></p>${sessionObservedHTML(d)}
    <label>Adult help actually needed<select id="sessionHelp"><option>Physical setup / safety only</option><option>One small prompt</option><option>Several prompts</option><option>I had to teach or solve part of it</option></select></label>
    <label>Did the child need adult translation of the website?<select id="sessionTranslation"><option>No</option><option>One phrase / word</option><option>Several instructions</option><option>Could not continue without translation</option></select></label>
    <label>Engagement<select id="sessionEngagement"><option>Very engaged</option><option>Mostly engaged</option><option>Mixed</option><option>Bored / resistant</option></select></label>
    <label>Independence<select id="sessionIndependence"><option>Independent</option><option>Independent after one in-product hint</option><option>Needed repeated support</option><option>Adult-led</option></select></label>
    <label>Why did this session end?<select id="sessionStopReason"><option ${sessionObservedSignals(d).completed?'selected':''}>Mission endpoint reached</option><option ${!sessionObservedSignals(d).completed?'selected':''}>Planned time box ended</option><option>Website wording / navigation blocked progress</option><option>Equipment / setup blocked progress</option><option>Learner chose to stop</option><option>Adult took over</option></select></label>
    <label>Exact confusing words / moments<textarea id="sessionNotes" placeholder="Example: She asked what ‘threshold’ meant even after opening the word help."></textarea></label>
    <button class="primary" data-action="save-session-observation">Save beta session observation</button></div>`;return;
  }
  const sessionHistory=learner().sessions||[],last=sessionHistory[0];
  if(!['mission','parallel','rescue-bridge'].includes(plan.kind)){
    document.getElementById('sessionBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">GUIDED BETA SESSION</p><h1 id="sessionTitle">${p.emoji} ${p.name}: do the learning need first</h1></div><button class="ghost" data-action="switch-learner">Switch learner</button></div><div class="info-box"><b>A new build session is intentionally paused.</b><p>InventorLab found a more important learning move first. Finish it, then return here.</p></div>${learningPlanHTML(plan)}${last?`<h2>Last beta session observation</h2><div class="insight"><b>${esc(last.adultHelp)}</b><p>Translation: ${esc(last.translation)} • Engagement: ${esc(last.engagement)} • Independence: ${esc(last.independence)}</p><p>${esc(last.notes||'No note.')}</p></div>`:''}`;return;
  }
  document.getElementById('sessionBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">GUIDED BETA SESSION</p><h1 id="sessionTitle">${p.emoji} ${p.name}: ${p.track==='Explorer'?'20–30 minute self-learning session':'Engineering sprint'}</h1></div><button class="ghost" data-action="switch-learner">Switch learner</button></div>
  ${p.track==='Explorer'?`<div class="session-hero"><h2>Goal: prepare the environment, then hand the thinking to the learner.</h2><div class="session-timeline"><div class="session-step"><b>1 • 3 min</b>Adult sets up equipment</div><div class="session-step"><b>2 • 15–20 min</b>Child follows mission</div><div class="session-step"><b>3 • 3 min</b>Boss check</div><div class="session-step"><b>4 • 2 min</b>Parent debrief</div></div></div>
  <div class="parent-prep"><h3>👩‍🏫 Before handing over the device</h3><p>Charge / connect <b>${esc(m.tool)}</b>, make the physical area safe, and do <b>not</b> pre-teach the concept. If she asks what the website means, record the exact phrase later — that is a product defect to fix.</p><div class="preflight"><label><input type="checkbox"> Device / robot charged</label><label><input type="checkbox"> App / project ready</label><label><input type="checkbox"> Floor / build area safe</label><label><input type="checkbox"> Adult stops teaching after setup</label></div></div>
  <div class="handover"><h3>🌟 Handover rule</h3><p>After setup, say: <b>“Follow the site. I’ll help only if it tells us to ask a grown-up or if something is unsafe.”</b></p></div>`:
  `<div class="session-hero"><h2>Goal: a real engineering sprint, not another coding lesson.</h2><div class="session-timeline"><div class="session-step"><b>1 • Define</b>Success metric</div><div class="session-step"><b>2 • Test</b>Baseline / subsystem</div><div class="session-step"><b>3 • Improve</b>Evidence-driven change</div><div class="session-step"><b>4 • Review</b>Defend the evidence</div></div></div>
  <div class="parent-prep"><h3>⚙️ Engineer challenge rule</h3><p>Do not accept “it works.” Require repeatability, measurement, failure analysis or transfer. The design-review rubric records evidence quality.</p></div>`}
  <div class="today-card"><span class="quality-badge studio">★ Studio mission</span><h2>${m.icon} ${esc(m.title)}</h2><p>${esc(m.goal)}</p>${missionBlueprint(m)?`<p class="mission-objective-mini"><b>Learning target:</b> ${esc(missionBlueprint(m).objective)}</p>`:''}<div class="mission-meta"><span class="pill">${esc(m.tool)}</span><span class="pill blue">${esc(m.concept)}</span><span class="pill">⏱ ${m.mins} min</span></div><button class="primary" data-action="start-family-session">Start focused session →</button></div>
  ${last?`<h2>Last beta session observation</h2><div class="insight"><b>${esc(sessionValidationStatus(last).label)}</b><p>${esc(sessionValidationStatus(last).reason)}</p><p>Translation: ${esc(last.translation)} • Engagement: ${esc(last.engagement)} • Parent independence note: ${esc(last.independence)}${last.stopReason?` • Ended: ${esc(last.stopReason)}`:''}</p><p>${esc(last.notes||'No note.')}</p></div>`:''}`;
}

function createDefect(category,severity,title,detail,source){
  const existing=learner().defects.find(d=>d.status!=='resolved'&&d.category===category&&d.title===title);
  if(existing){existing.count=(existing.count||1)+1;existing.last=nowISO();existing.details.unshift(detail);existing.details=existing.details.slice(0,8);return existing;}
  const d={id:`def-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,category,severity,title,details:[detail],source,status:'open',count:1,created:nowISO(),last:nowISO(),retest:null,resolved:null};
  learner().defects.unshift(d);learner().defects=learner().defects.slice(0,100);return d;
}
function deriveSessionDefects(entry){
  const mission=BY_ID[entry.missionId],name=mission?.title||'Session';
  if(entry.translation&&entry.translation!=='No'){
    createDefect('language',entry.translation.includes('Could not')?'high':'medium','Website wording required adult translation',`${name}: ${entry.translation}. ${entry.notes||''}`,'session');
  }
  if(entry.adultHelp==='I had to teach or solve part of it'||entry.independence==='Adult-led'||entry.stopReason==='Adult took over'){
    createDefect('scaffolding','high','Learner could not continue independently',`${name}: ${entry.adultHelp}. Stop reason: ${entry.stopReason||'not recorded'}. ${entry.notes||''}`,'session');
  }else if(entry.adultHelp==='Several prompts'||entry.independence==='Needed repeated support'){
    createDefect('scaffolding','medium','Repeated prompting was needed',`${name}: ${entry.adultHelp}. ${entry.notes||''}`,'session');
  }
  if(entry.stopReason==='Website wording / navigation blocked progress')createDefect('usability','high','Product interface blocked the learning session',`${name}: ${entry.notes||'No exact wording/navigation note recorded.'}`,'session');
  if(entry.stopReason==='Equipment / setup blocked progress')createDefect('equipment','medium','Equipment/setup blocked the learning session',`${name}: ${entry.notes||'No setup detail recorded.'}`,'session');
  if(entry.stopReason==='Learner chose to stop')createDefect('engagement','medium','Learner ended the session before the mission endpoint',`${name}: ${entry.notes||'No reason recorded.'}`,'session');
  if(entry.engagement==='Bored / resistant'){
    createDefect('challenge','medium','Learner disengaged during a Studio session',`${name}: ${entry.notes||'No note recorded.'}`,'session');
  }
}
function markDefect(id,status){
  const d=learner().defects.find(x=>x.id===id);if(!d)return;
  d.status=status;
  if(status==='retest')d.retest=nowISO();
  if(status==='resolved')d.resolved=nowISO();
  save();renderAlphaLab();
}
function defectStats(){
  const d=learner().defects||[];
  return {open:d.filter(x=>x.status==='open').length,retest:d.filter(x=>x.status==='retest').length,resolved:d.filter(x=>x.status==='resolved').length,high:d.filter(x=>x.status!=='resolved'&&x.severity==='high').length};
}
function sessionValidationStatus(entry){
  const o=entry?.observed||{},completed=!!(o.completed||o.rating!=null),hints=Number(o.hints||0),rescues=Number(o.rescues||0);
  const parentHeavy=entry?.adultHelp==='I had to teach or solve part of it'||entry?.adultHelp==='Several prompts'||entry?.independence==='Adult-led'||entry?.independence==='Needed repeated support'||entry?.stopReason==='Adult took over';
  const parentThinkingPrompt=entry?.adultHelp==='One small prompt';
  const translationBlock=entry?.translation==='Several instructions'||entry?.translation==='Could not continue without translation';
  const productBlock=entry?.stopReason==='Website wording / navigation blocked progress'||entry?.stopReason==='Equipment / setup blocked progress';
  if(!completed)return{code:'incomplete',label:'Incomplete / no rated endpoint',valid:false,completed:false,reason:entry?.stopReason||'No completed attempt packet was recorded.'};
  if(parentHeavy||rescues>0||translationBlock)return{code:'adult-supported',label:'Adult-supported',valid:false,completed:true,reason:rescues>0?`${rescues} learning rescue${rescues===1?'':'s'} recorded.`:parentHeavy?'Parent debrief reports thinking help / adult takeover.':'Adult translation was needed to continue.'};
  if(productBlock)return{code:'product-blocked',label:'Product-blocked',valid:false,completed:true,reason:entry.stopReason};
  if(parentThinkingPrompt)return{code:'adult-prompted',label:'Adult-prompted',valid:false,completed:true,reason:'A spoken adult thinking prompt was needed; this is not counted as independent self-learning.'};
  if(hints>1||o.support==='heavily-scaffolded')return{code:'heavily-scaffolded',label:'Heavily scaffolded',valid:false,completed:true,reason:`${hints} in-product hints were used.`};
  return{code:'self-learning-valid',label:o.setupAssists>0?'Valid self-learning + setup assist':hints===1?'Valid self-learning + one product hint':'Valid self-learning',valid:true,completed:true,reason:o.setupAssists>0?'Only physical setup/safety assistance was recorded.':hints===1?'Completed with one in-product hint and no adult thinking help.':'Completed with no adult thinking help.'};
}
function recentValidationWindow(n=3){
  const sessions=(learner().sessions||[]).slice(0,n),classified=sessions.map(x=>({session:x,status:sessionValidationStatus(x)}));
  const independent=classified.filter(x=>x.status.valid).length,completed=classified.filter(x=>x.status.completed).length,incomplete=classified.filter(x=>!x.status.completed).length;
  const translation=sessions.filter(x=>x.translation&&x.translation!=='No').length;
  const learningRescues=sessions.reduce((sum,x)=>sum+Number(x.observed?.rescues||0),0),setupAssists=sessions.reduce((sum,x)=>sum+Number(x.observed?.setupAssists||0),0);
  return{sessions,classified,n:sessions.length,independent,completed,incomplete,translation,learningRescues,setupAssists};
}
function fayeReadiness(){
  const old=state.activeLearner;state.activeLearner='faye';const ss=sessionStats(),window=recentValidationWindow(3),ds=defectStats(),retained=CORE_SKILLS.reduce((n,s)=>n+evidenceEvents(s).filter(e=>evidenceType(e)==='review'&&(e.reviewRate==='ok'||e.reviewRate==='easy')).length,0);state.activeLearner=old;
  const gates=[
    {label:'At least 3 logged self-learning sessions',pass:ss.n>=3,value:`${ss.n}/3 total`},
    {label:'At least 2 of the most recent 3 sessions reached a rated learning endpoint',pass:window.n>=3&&window.completed>=2,value:`${window.completed}/3 recent completed • ${window.incomplete} incomplete`},
    {label:'At least 2 of the most recent 3 are valid self-learning sessions',pass:window.n>=3&&window.independent>=2,value:`${window.independent}/3 recent valid • parent debrief can override missing system logs`},
    {label:'Adult translation in no more than 1 of the most recent 3 validation sessions',pass:window.n>=3&&window.translation<=1,value:`${window.translation}/3 recent translation sessions`},
    {label:'No more than 1 learning rescue across the most recent 3 validation sessions',pass:window.n>=3&&window.learningRescues<=1,value:`${window.learningRescues} learning rescue${window.learningRescues===1?'':'s'} • ${window.setupAssists} setup/safety assist${window.setupAssists===1?'':'s'} allowed`},
    {label:'At least 1 successful delayed retrieval',pass:retained>=1,value:`${retained} review retrieval${retained===1?'':'s'}`},
    {label:'No unresolved high-severity self-learning defect',pass:ds.high===0,value:`${ds.high} high-severity open`}
  ];
  return {gates,pass:gates.every(g=>g.pass),validationWindow:window};
}
function latestByMission(rows){
  const map=new Map();for(const row of [...rows].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)))if(row?.missionId&&!map.has(row.missionId))map.set(row.missionId,row);return [...map.values()];
}
function engineerValidationContexts(){
  const packets=(learner().attemptPackets||[]).filter(x=>x.mode==='engineer'&&Number(x.rating)>=3),qualifiedIds=new Set(packets.map(x=>x.missionId));
  const reviews=latestByMission((learner().designReviews||[]).filter(x=>qualifiedIds.has(x.missionId))),tests=latestByMission((learner().testLogs||[]).filter(x=>qualifiedIds.has(x.missionId)));
  const transfers=latestByMission(evidenceEvents('Transfer').filter(e=>evidenceType(e)==='transfer'&&e.missionId&&qualifiedIds.has(e.missionId)).map(e=>({...e,date:e.date||0})));
  const reviewAvg=reviews.length?reviews.reduce((n,r)=>n+Number(r.total||0),0)/reviews.length:0,testAvg=tests.length?tests.reduce((n,t)=>n+Number((t.quality||testLogQuality(t)).score||0),0)/tests.length:0;
  return{qualifiedIds:[...qualifiedIds],reviews,tests,transfers,reviewAvg,testAvg,distinctReviews:new Set(reviews.map(x=>x.missionId)).size,distinctTests:new Set(tests.map(x=>x.missionId)).size,distinctTransfers:new Set(transfers.map(x=>x.missionId)).size};
}
function philipReadiness(){
  const old=state.activeLearner;state.activeLearner='philip';const v=engineerValidationContexts(),ds=defectStats();state.activeLearner=old;
  const gates=[
    {label:'At least 3 completed Secure/Transfer engineering mission contexts',pass:v.qualifiedIds.length>=3,value:`${v.qualifiedIds.length}/3 distinct completed contexts`},
    {label:'Design reviews across at least 3 distinct completed missions',pass:v.distinctReviews>=3,value:`${v.distinctReviews}/3 distinct reviews • latest-per-mission average ${v.reviewAvg.toFixed(1)}/12`},
    {label:'Average latest design evidence ≥ 8/12 across those contexts',pass:v.distinctReviews>=3&&v.reviewAvg>=8,value:`${v.reviewAvg.toFixed(1)}/12`},
    {label:'Structured test logs across at least 3 distinct completed missions',pass:v.distinctTests>=3&&v.testAvg>=4,value:`${v.distinctTests}/3 distinct logs • latest-per-mission average ${v.testAvg.toFixed(1)}/6`},
    {label:'At least 2 changed-context mastery events from different missions',pass:v.distinctTransfers>=2,value:`${v.distinctTransfers}/2 distinct transfer contexts`},
    {label:'No unresolved high-severity challenge-depth defect',pass:ds.high===0,value:`${ds.high} high-severity open`}
  ];
  return {gates,pass:gates.every(g=>g.pass),validation:v};
}
function gateHTML(r){
  return r.gates.map(g=>`<div class="gate ${g.pass?'pass':'fail'}"><span class="icon">${g.pass?'✅':'🟡'}</span><div><b>${esc(g.label)}</b><br><small>${esc(g.value)}</small></div></div>`).join('');
}
function exportAlphaReport(){
  const who=state.activeLearner,p=profile(),ss=sessionStats(),ds=defectStats(),ready=who==='faye'?fayeReadiness():philipReadiness(),vocab=Object.entries(learner().vocabViews||{}).sort((a,b)=>b[1]-a[1]).slice(0,10),open=(learner().defects||[]).filter(x=>x.status!=='resolved'),funnel=sessionFunnelStats();
  const gateRows=ready.gates.map(g=>`<tr><td>${g.pass?'PASS':'NOT YET'}</td><td>${esc(g.label)}</td><td>${esc(g.value)}</td></tr>`).join('');
  const defectRows=open.map(d=>`<tr><td>${esc(d.severity)}</td><td>${esc(d.category)}</td><td>${esc(d.title)}</td><td>${esc(d.details?.[0]||'')}</td></tr>`).join('')||'<tr><td colspan="4">No open defects</td></tr>';
  const contextLine=who==='faye'?`Started sessions: ${funnel.started} • reached rated endpoint: ${funnel.completed} • validation-valid self-learning: ${funnel.valid} • later retained on same mission: ${funnel.retained}`:(()=>{const v=engineerValidationContexts();return `Distinct completed Secure/Transfer contexts: ${v.qualifiedIds.length} • distinct reviewed contexts: ${v.distinctReviews} • distinct test-log contexts: ${v.distinctTests} • distinct Transfer contexts: ${v.distinctTransfers}`;})();
  const html=`<!doctype html><meta charset="utf-8"><title>InventorLab Public Beta Evidence Report</title><style>body{font:15px system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#17283d}h1,h2{color:#15263b}table{width:100%;border-collapse:collapse}td,th{border:1px solid #dbe3eb;padding:9px;text-align:left}.pass{font-weight:700}</style><h1>InventorLab Academy — Beta Evidence Report</h1><p><b>Learner:</b> ${esc(p.name)} • ${esc(p.track)}<br><b>Generated:</b> ${new Date().toLocaleString()}<br><b>Curriculum:</b> 27 Studio / ${LESSONS.filter(x=>x.quality!=='studio').length} Extended / ${LESSONS.length} total</p><h2>Readiness gate</h2><p><b>${ready.pass?'READY TO EXPAND':'NOT YET VALIDATED'}</b></p><table><tr><th>Status</th><th>Gate</th><th>Evidence</th></tr>${gateRows}</table><h2>Validation integrity</h2><p>${esc(contextLine)}</p><p>Incomplete sessions remain in the denominator. Parent-reported thinking help can override optimistic system logs. Repeating one Engineer mission does not create multiple validation contexts.</p><h2>Beta-session use</h2><p>Sessions: ${ss.n} • valid self-learning: ${ss.independent} • completed endpoints: ${ss.completed} • incomplete: ${ss.incomplete} • translation sessions: ${ss.translation} • adult-supported: ${ss.adultLed} • bored/resistant: ${ss.bored}</p><h2>Open product defects</h2><table><tr><th>Severity</th><th>Category</th><th>Signal</th><th>Latest detail</th></tr>${defectRows}</table><h2>Vocabulary friction</h2><p>${vocab.length?vocab.map(([k,n])=>`${esc(k)} (${n})`).join(' • '):'No vocabulary-help use recorded.'}</p><h2>Interpretation rule</h2><p>Low learning evidence is not automatically low ability. Adult translation and repeated interface confusion should be treated as possible product defects before being attributed to the learner.</p><h2>Commercial status</h2><p>Public beta. Not production SaaS: no authenticated accounts, secure cloud sync, consent workflow, server-side analytics or broad external validation.</p>`;
  const blob=new Blob([html],{type:'text/html'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`inventorlab-alpha-${who}-report.html`;a.click();URL.revokeObjectURL(url);
}
function renderAlphaLab(){
  const active=profile(),fs=fayeReadiness(),ps=philipReadiness(),d=learner().defects||[],vocab=Object.entries(learner().vocabViews||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const open=d.filter(x=>x.status!=='resolved');
  const priority=open.filter(x=>x.severity==='high').length?'Fix high-severity defects before adding or promoting content.':open.length?'Retest the oldest open usability/challenge signal before expanding curriculum.':'No open Alpha defects for this learner; collect another real session before changing the product.';
  document.getElementById('alphaBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">INTERNAL BETA PRODUCT LAB</p><h1 id="alphaTitle">Is the product ready — not just impressive?</h1></div><button class="ghost" data-action="switch-learner">${active.emoji} ${active.name} • switch</button></div>
  <div class="product-signal"><b>Current product priority</b><p>${esc(priority)}</p></div><div class="alpha-export"><b>📄 Evidence pack for vetting</b><p>Export a compact HTML report with readiness gates, beta-session observations, defects, vocabulary friction and curriculum-quality counts. Useful for teacher/professional review without exposing the entire app state.</p><button class="secondary" data-action="export-alpha-report">Download beta evidence report</button></div>
  <div class="readiness-grid"><div class="readiness-card"><span class="tag">FAYE • SELF-LEARNING GATE</span><strong>${fs.pass?'READY TO EXPAND':'NOT YET'}</strong><p>Do not call Explorer self-learning validated until these gates pass.</p></div><div class="readiness-card"><span class="tag">PHILIP • CHALLENGE GATE</span><strong>${ps.pass?'READY TO EXPAND':'NOT YET'}</strong><p>Do not add beginner-style content just because the path needs more volume.</p></div><div class="readiness-card"><span class="tag">OPEN PRODUCT DEFECTS</span><strong>${open.length}</strong><p>${open.filter(x=>x.severity==='high').length} high severity • ${d.filter(x=>x.status==='resolved').length} resolved</p></div></div>
  <div class="validation-integrity-note"><span class="tag">VALIDATION INTEGRITY</span><h3>Do not validate only the sessions that went well.</h3><p>Incomplete sessions stay in the recent validation window. Parent-reported thinking help can override silent system logs. The Engineer challenge gate counts distinct completed engineering contexts rather than repeated reviews of one build.</p></div>
  <h2>${active.track==='Explorer'?'Recent Explorer validation sessions':'Recent focused sessions'}</h2>${validationTimelineHTML()}
  <h2>Explorer readiness</h2>${gateHTML(fs)}
  <h2>Engineer readiness</h2>${gateHTML(ps)}
  <h2>${active.emoji} ${active.name} — open defects</h2>${open.length?open.map(x=>`<div class="defect ${x.severity}"><div class="defect-head"><div><span class="severity ${x.severity}">${x.severity.toUpperCase()}</span> <span class="pill">${esc(x.category)}</span><h3>${esc(x.title)}</h3></div><b>×${x.count}</b></div><p>${esc(x.details[0]||'')}</p><div class="button-row"><button class="ghost" data-action="defect-status" data-id="${x.id}" data-status="retest">Mark ready to retest</button><button class="secondary" data-action="defect-status" data-id="${x.id}" data-status="resolved">Resolve after successful retest</button></div></div>`).join(''):'<div class="info-box">No open defects recorded for this learner yet.</div>'}
  <h2>Resolved / retest history</h2>${d.filter(x=>x.status!=='open').slice(0,10).map(x=>`<div class="defect resolved"><b>${esc(x.title)}</b> <span class="pill">${esc(x.status)}</span><p>${esc(x.details[0]||'')}</p></div>`).join('')||'<div class="info-box">No closed defects yet.</div>'}
  <h2>Vocabulary friction</h2><div class="product-signal"><p>Repeated word lookups are useful product signals. They may indicate unclear language, not weak understanding.</p><div class="vocab-heat">${vocab.length?vocab.map(([k,n])=>`<span>${esc(k)} • ${n} view${n===1?'':'s'}</span>`).join(''):'<span>No vocabulary-help use recorded yet.</span>'}</div></div>
  <h2>Curriculum prerequisite integrity</h2>${profile().path.map(id=>BY_ID[id]).filter(Boolean).map(m=>({m,gaps:curriculumGapFor(m)})).filter(x=>x.gaps.length).map(x=>`<div class="curriculum-gap"><strong>${esc(x.m.title)}</strong><p>Requires ${esc(x.gaps.join(', '))} before the Studio path has explicitly introduced/evidenced it. Treat this as a curriculum sequencing issue, not a learner deficit.</p></div>`).join('')||'<div class="info-box">No unintroduced explicit prerequisites detected in this path.</div>'}<h2>Content promotion gate</h2><div class="promotion-gate"><h3>Extended → Studio is earned, not cosmetic.</h3><p>Promote an Extended mission only when it fills an observed learning gap and has unique setup, prediction, staged hints, misconception support, mastery/transfer evidence, parent coaching, and at least one successful beta retest.</p><p><b>Current inventory:</b> 27 Studio • ${LESSONS.filter(x=>x.quality!=='studio').length} Extended. The goal is not to make those numbers closer.</p></div>`;
}

function sessionStats(){
  const s=learner().sessions||[];if(!s.length)return{n:0,translation:0,adultLed:0,bored:0,independent:0,completed:0,incomplete:0,observed:0};
  const statuses=s.map(sessionValidationStatus);
  return {n:s.length,translation:s.filter(x=>x.translation&&x.translation!=='No').length,adultLed:statuses.filter(x=>x.code==='adult-supported'||x.code==='adult-prompted').length,bored:s.filter(x=>x.engagement==='Bored / resistant').length,independent:statuses.filter(x=>x.valid).length,completed:statuses.filter(x=>x.completed).length,incomplete:statuses.filter(x=>!x.completed).length,observed:s.filter(x=>x.observed).length};
}
function sessionFunnelStats(){
  const s=learner().sessions||[],statuses=s.map((x,i)=>({entry:x,status:sessionValidationStatus(x),i})),completed=statuses.filter(x=>x.status.completed),valid=statuses.filter(x=>x.status.valid);
  let retained=0;for(const x of valid){const later=(learner().reviewAttempts||[]).some(r=>r.correct&&r.missionId===x.entry.missionId&&new Date(r.date)>new Date(x.entry.saved||x.entry.ended||x.entry.started));if(later)retained++;}
  return{started:s.length,completed:completed.length,valid:valid.length,retained};
}
function validationTimelineHTML(){
  const rows=(learner().sessions||[]).slice(0,5).map(x=>({x,status:sessionValidationStatus(x)}));if(!rows.length)return'<div class="info-box">No focused validation sessions logged yet.</div>';
  return `<div class="validation-timeline">${rows.map(({x,status})=>`<div class="validation-session ${esc(status.code)}"><div><b>${status.valid?'✅':status.completed?'🟡':'⚪'} ${esc(BY_ID[x.missionId]?.title||x.missionId)}</b><span>${esc(status.label)}</span></div><small>${esc(status.reason)}${x.stopReason?` • ended: ${esc(x.stopReason)}`:''}</small></div>`).join('')}</div>`;
}


const LAB_SKILL_MAP={'Prediction':'grid','Sequencing':'grid','Pattern recognition':'grid','Loops':'trace','Algorithms':'grid','Debugging':'grid','Decomposition':'grid','Functions':'trace','Sensors':'sensor','Conditionals':'sensor','Input / output':'sensor','Events':'trace','State':'trace','Variables':'trace','Measurement':'calibration','Calibration':'calibration','Data':'calibration','Testing':'calibration','Iteration':'calibration','Optimisation':'calibration','Transfer':'trace'};

function labScenarioPool(labId){return (LAB_ENGINE.scenarios?.[labId]?.[profile().track==='Engineer'?'engineer':'explorer']||[]);}
function labScenarioKey(labId){return `${labId}ScenarioId`;}
function labScenario(labId){const pool=labScenarioPool(labId);if(!pool.length)return LAB_ENGINE.defaultScenario?.(labId)||null;const key=labScenarioKey(labId),wanted=ui.lab[key];return pool.find(s=>s.id===wanted)||pool[0];}
function chooseTraceScenarioForSkill(skill){
  if(!skill)return chooseLabScenario('trace',false);
  const pool=labScenarioPool('trace'),solved=new Set(solvedLabScenarioIds('trace'));
  const matches=pool.filter(x=>x.primarySkill===skill||(x.skills||[]).includes(skill));
  const chosen=matches.find(x=>!solved.has(x.id))||matches[0]||pool.find(x=>!solved.has(x.id))||pool[0];
  if(chosen)ui.lab.traceScenarioId=chosen.id;
  return chosen||null;
}
function labScenarioHistory(labId){return (learner().labAttempts||[]).filter(a=>a.labId===labId);}
function solvedLabScenarioIds(labId){const allowed=new Set(labScenarioPool(labId).map(s=>s.id));return [...new Set(labScenarioHistory(labId).filter(a=>a.success&&a.scenarioId&&allowed.has(a.scenarioId)).map(a=>a.scenarioId))];}
function chooseLabScenario(labId,advance=false){const pool=labScenarioPool(labId);if(!pool.length)return null;const key=labScenarioKey(labId),current=pool.findIndex(s=>s.id===ui.lab[key]),solved=new Set(solvedLabScenarioIds(labId));let chosen=null;if(!advance&&!ui.lab[key])chosen=pool.find(s=>!solved.has(s.id))||pool[0];else if(advance){for(let step=1;step<=pool.length;step++){const cand=pool[(Math.max(0,current)+step)%pool.length];if(!solved.has(cand.id)){chosen=cand;break;}}chosen=chosen||pool[(Math.max(0,current)+1)%pool.length];}else chosen=pool[current>=0?current:0];ui.lab[key]=chosen.id;return chosen;}
function labVariantStatus(labId){const pool=labScenarioPool(labId),solved=solvedLabScenarioIds(labId);return{solved:solved.length,total:pool.length,all:pool.length>0&&solved.length>=pool.length};}
function newLabScenario(labId){chooseLabScenario(labId,true);if(labId==='grid'){ui.lab.gridCommands=[];ui.lab.gridResult=null;}if(labId==='sensor')ui.lab.sensorResult=null;if(labId==='calibration')ui.lab.calibrationResult=null;if(labId==='trace'){ui.lab.traceResult=null;ui.lab.traceReveals=0;ui.lab.traceMode=traceSupportMode();}ui.currentLab=labId;renderLabs();}
function dirIcon(d){return({N:'↑',E:'→',S:'↓',W:'←'})[d]||d;}
function labForSkill(skill){return LAB_SKILL_MAP[skill]||'grid';}
function equipmentFallbackLab(m){return labForSkill(primarySkill(m));}
function labAttempts(){return learner().labAttempts||[];}
function recordLabAttempt(labId,success,summary,skills=[],scenarioId=null,meta={}){
  if(!learner().labAttempts)learner().labAttempts=[];
  const prior=[...learner().labAttempts],before=new Set(prior.filter(a=>a.labId===labId&&a.success&&a.scenarioId&&a.scenarioId!=='legacy').map(a=>a.scenarioId)),newDistinct=!!(success&&scenarioId&&!before.has(scenarioId)),legacyFirst=!!(success&&!scenarioId&&!prior.some(a=>a.labId===labId&&a.success));
  learner().labAttempts.unshift({date:nowISO(),labId,scenarioId:scenarioId||'legacy',success:!!success,summary,skills:[...skills],meta:{...meta}});learner().labAttempts=learner().labAttempts.slice(0,120);
  if((newDistinct&&before.size<2)||legacyFirst){for(const s of skills)addEvidence(s,.15,scenarioId?`Virtual lab variant: ${labId}`:`Virtual lab: ${labId}`,{labId,scenarioId:scenarioId||'legacy'});}
  save();
}
function labCardHTML(id){const l=VIRTUAL_LABS[id];if(!l)return'';const n=labScenarioHistory(id).length,v=labVariantStatus(id);return`<article class="lab-card"><div class="lab-card-icon">${l.icon}</div><div><span class="tag">EQUIPMENT-FREE • ${v.solved?`${v.solved}/${v.total} VARIANT${v.total===1?'':'S'} SOLVED`:n?`${n} ATTEMPT${n===1?'':'S'}`:'FREE TO TRY'}</span><h3>${esc(l.title)}</h3><p>${esc(l.tagline)}</p><div class="lab-skills">${l.skills.slice(0,5).map(s=>`<span class="pill">${esc(s)}</span>`).join('')}</div>${v.solved>=2?'<p class="variant-proof">🌉 Changed-context practice: more than one scenario solved.</p>':''}</div><button class="primary" data-action="open-lab" data-lab="${id}">${n?'Open again':'Try lab'} →</button></article>`;}
function samplerProgress(){const order=['trace','grid','sensor','calibration'],done=order.filter(id=>labAttempts().some(a=>a.labId===id&&a.success)),next=order.find(id=>!done.includes(id))||null;return{order,done,next};}
function renderLabs(){const p=profile(),id=ui.currentLab;if(!id||!VIRTUAL_LABS[id]){const sampler=samplerProgress();document.getElementById('labsBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">FREE VIRTUAL LABS</p><h1 id="labsTitle">${(state.prefs.viewMode||'learner')==='adult'?'Learn by experimenting \u2014 even without a robotics kit':'Try things out \u2014 no robot needed'}</h1><p>${(state.prefs.viewMode||'learner')==='adult'?'These labs teach coding comprehension and engineering reasoning. They add only low-stakes evidence and <b>never</b> pretend to replace a physical Studio mission.':'Four little experiments you can do right now, with nothing but this screen. No robot needed. They are good practice \u2014 but building a real thing still counts for more.'}</p></div><span class="free-badge">No account • no hardware</span></div><div class="sampler-card"><div><span class="tag">35-MINUTE FREE SAMPLER</span><h2>${sampler.done.length===4?'Sampler complete — now try a real Studio project when hardware is available.':`${sampler.done.length}/4 experiments completed`}</h2><p>${(state.prefs.viewMode||'learner')==='adult'?'Code comprehension \u2192 algorithmic planning \u2192 sensing/decision \u2192 measurement/calibration. This samples both coding and engineering rather than only project setup.':'Read some code \u2192 plan a route \u2192 make a sensor decide \u2192 measure and fix. Four different kinds of thinking, about half an hour in total.'}</p><div class="sampler-steps">${sampler.order.map((x,i)=>`<span class="${sampler.done.includes(x)?'done':''}">${sampler.done.includes(x)?'✅':i+1} ${VIRTUAL_LABS[x].title}</span>`).join('')}</div></div>${sampler.next?`<button class="primary" data-action="open-lab" data-lab="${sampler.next}">Continue sampler →</button>`:'<button class="primary" data-page="learn">Explore concept chapters →</button>'}</div><div class="lab-promise"><b>${p.emoji} ${p.name} mode:</b> ${(state.prefs.viewMode||'learner')==='adult'?(p.track==='Explorer'?'one visible goal, immediate feedback, faded examples when useful, and no typing required.':'independent tracing, representation transfer, boundary reasoning and evidence-quality prompts.'):(p.track==='Explorer'?'one goal at a time, an answer straight away, and no typing needed.':'you work it out yourself, then explain how you know.')}</div><div class="lab-list">${['trace','grid','sensor','calibration'].map(labCardHTML).join('')}</div>${(state.prefs.viewMode||'learner')==='adult'?'<div class="info-box"><b>Evidence integrity:</b> Virtual-lab success is low-stakes practice. It cannot by itself make a skill Secure or Transfer; physical projects, cross-context assessment and delayed retrieval still matter.</div>':'<div class="info-box"><b>\ud83e\uddea These are practice, not proof.</b> Finishing a lab does not tick off a mission \u2014 you still need to build the real thing and explain how it works.</div>'}`;return;}if(id==='trace')renderTraceLab();else if(id==='grid')renderGridLab();else if(id==='sensor')renderSensorLab();else if(id==='calibration')renderCalibrationLab();}
function openLab(id,skill=null){ui.currentLab=id;if(id==='trace'&&skill)chooseTraceScenarioForSkill(skill);else chooseLabScenario(id,false);if(id==='grid'){ui.lab.gridCommands=[];ui.lab.gridResult=null;}if(id==='sensor')ui.lab.sensorResult=null;if(id==='calibration')ui.lab.calibrationResult=null;if(id==='trace'){ui.lab.traceResult=null;ui.lab.traceReveals=0;ui.lab.traceMode=traceSupportMode();}showPage('labs');}
function labHeader(l){const s=labScenario(l.id),v=labVariantStatus(l.id);return `<div class="section-head"><div><p class="eyebrow">EQUIPMENT-FREE VIRTUAL LAB • VARIANT ${Math.min(v.solved+1,v.total||1)}/${v.total||1}</p><h1 id="labsTitle">${l.icon} ${esc(l.title)}</h1><p>${esc(profile().track==='Explorer'?l.explorer:l.engineer)}</p>${s?`<span class="scenario-chip">Current scenario: ${esc(s.label)}</span>`:''}</div><div class="button-row"><button class="secondary" data-action="new-lab-scenario" data-lab="${l.id}">New scenario ↻</button><button class="ghost" data-action="labs-home">← All labs</button></div></div>`;}
const TRACE_DIAGNOSTIC_CUES={
  'loop-count':'Write the starting value, then make one tiny box for each repeat. Update the value once per box.',
  'condition-direction':'Substitute the actual value into the condition and say TRUE or FALSE before choosing a branch.',
  'event-order':'List the events in time order and write the state immediately after each event.',
  'state-update':'Write the value before the event, apply the update, then test the condition using the new value.',
  'conditional-loop':'For each item, mark whether the condition is true. Update the accumulator only on the TRUE items.',
  'function-return':'Trace each function call separately. Stop when RETURN happens and write that returned value beside the call.',
  'state-cascade':'After the first IF changes the state, evaluate the next IF using the new state, not the old one.',
  'boundary-operator':'Replace the variable with the exact boundary number and evaluate the operator literally: < is different from ≤.',
  'loop-boundary':'List the actual loop values first. Only then update the accumulator.'
};
function traceDiagnosticCue(s){return TRACE_DIAGNOSTIC_CUES[s?.misconception]||'Trace one instruction at a time and write the state/value after each step.';}

function traceSupportMode(){
  const h=labScenarioHistory('trace'),latest=h[0];
  if(profile().track==='Engineer')return latest&&latest.success===false?'faded':'independent';
  if(!h.length)return'faded';
  if(latest&&latest.meta?.correct===false)return'faded';
  if(latest&&Number(latest.meta?.reveals||0)>1)return'faded';
  return'independent';
}
function traceVisibleCount(){return Number(ui.lab.traceReveals||0)+(ui.lab.traceMode==='faded'?1:0);}
function traceCodeHTML(s){
  const block=`<div class="code-pane block-pane"><div class="code-pane-title">🧩 Block-style idea</div>${s.blocks.map((x,i)=>`<div class="code-line" data-code-line="${i}">${esc(x)}</div>`).join('')}</div>`;
  const text=`<div class="code-pane text-pane"><div class="code-pane-title">⌨️ Text form</div><pre>${s.text.map(esc).join('\n')}</pre></div>`;
  if(profile().track==='Explorer')return`${block}<details class="text-bridge"><summary>See the same idea as text code</summary>${text}</details>`;
  return`<div class="code-bridge-grid">${block}${text}</div>`;
}
function traceStepsHTML(s){
  const visible=Math.min(traceVisibleCount(),s.trace.length);
  if(!visible)return'<div class="trace-empty">No trace steps revealed yet. Predict first.</div>';
  return `<div class="trace-steps">${s.trace.slice(0,visible).map((x,i)=>`<div class="trace-step"><span>${i+1}</span><b>${esc(x[0])}</b><em>${esc(x[1])}</em></div>`).join('')}</div>`;
}
function codeBridgeWarmupHTML(m){
  if(!m||!['Variables','Events','State','Functions','Loops','Conditionals'].includes(primarySkill(m)))return'';
  const rank=evidenceProfile(primarySkill(m)).rank,success=labAttempts().some(a=>a.labId==='trace'&&a.success);
  if(rank>=2||success)return'';
  return `<div class="code-warmup"><div><span class="tag">5-MINUTE CODE COMPREHENSION WARM-UP</span><b>Before building, prove you can mentally run a tiny program.</b><p>This checks the idea without relying on block placement or copying a template.</p></div><button class="secondary" data-action="open-lab" data-lab="trace" data-skill="${esc(primarySkill(m))}">Open Code Bridge →</button></div>`;
}
function renderTraceLab(){
  const l=VIRTUAL_LABS.trace,s=labScenario('trace'),r=ui.lab.traceResult,visible=traceVisibleCount(),verified=r?.verified===true;
  const supportLabel=ui.lab.traceMode==='faded'?'Faded example — one trace step is shown':'Independent trace — predict before revealing';
  const engineer=profile().track==='Engineer';
  document.getElementById('labsBody').innerHTML=`${labHeader(l)}<div class="virtual-lab-shell code-lab"><div class="lab-instruction"><span class="tag">${esc(s.representation)} • ${esc(s.primarySkill)}</span><h2>${engineer?'Mentally execute the program and justify the final state.':'Follow the program in order. What will it do at the end?'}</h2><p><b>${supportLabel}</b></p><p>${engineer?'Separate syntax from semantics: describe what values/state change, not merely what the code looks like.':'You may reveal a trace step if you need it. Try to need less help on the next example.'}</p></div>${traceCodeHTML(s)}<div class="trace-work"><div><h3>State trace</h3>${traceStepsHTML(s)}<div class="button-row"><button class="ghost" data-action="lab-trace-reveal" ${visible>=s.trace.length?'disabled':''}>Reveal one trace step</button>${visible?'<button class="ghost" data-action="lab-trace-reset">Try from memory</button>':''}</div></div><div class="trace-question"><h3>${esc(s.q)}</h3>${engineer?`<label><b>Reason first</b><textarea id="traceReason" placeholder="State/value changes → condition/loop/function effect → final result"></textarea></label>`:''}<div class="trace-options">${s.opts.map((o,i)=>`<button class="assessment-choice" data-action="lab-trace-answer" data-answer="${i}">${esc(o)}</button>`).join('')}</div></div></div>${r?`<div class="lab-feedback ${verified?'success':''}"><b>${r.correct?(verified?'✅ Correct — and the support level is low enough to count as a verified lab variant.':'🟡 Correct with substantial support. Good practice, but do it again from memory before it counts as verified evidence.'):'↩️ Not yet. Find the first state/value where your mental trace diverges, then answer again.'}</b>${r.correct?`<p>${esc(s.explain)}</p>`:`<p><b>Diagnostic cue:</b> ${esc(traceDiagnosticCue(s))}</p><p class="muted">InventorLab logged this as a ${esc(s.misconception.replace(/-/g,' '))} misconception signal, not as a mastery failure.</p>`}${r.correct&&!verified?'<button class="secondary" data-action="lab-trace-independent">Retry independently →</button>':''}${verified?'<button class="secondary" data-action="new-lab-scenario" data-lab="trace">Trace a changed program →</button>':''}</div>`:''}<details class="lab-theory"><summary>🧠 Why this lab exists</summary><p>Building code and understanding code are related but not identical. This lab asks you to predict state changes before execution, then reduces support across scenarios. The paired block/text view helps make the underlying concept visible across representations.</p></details></div>`;
}
function revealTraceStep(){const s=labScenario('trace');ui.lab.traceReveals=Math.min(Number(ui.lab.traceReveals||0)+1,s.trace.length);ui.lab.traceResult=null;renderTraceLab();}
function resetTrace(fromMemory=false){ui.lab.traceResult=null;ui.lab.traceReveals=0;if(fromMemory)ui.lab.traceMode='independent';renderTraceLab();}
function answerTrace(answer){
  const s=labScenario('trace'),engineer=profile().track==='Engineer',reason=(document.getElementById('traceReason')?.value||'').trim();
  if(engineer&&reason.length<12){toast('Explain the state/value changes before choosing the answer.');return;}
  const r=LAB_ENGINE.traceSuite(answer,s),support=traceVisibleCount(),verified=r.correct&&(engineer?support===0:support<=1);
  ui.lab.traceResult={...r,verified,support,reason};
  const summary=`${s.label}: ${r.correct?'correct':'incorrect'} trace; support steps ${support}${verified?'; verified':'; supported practice'}`;
  recordLabAttempt('trace',verified,summary,verified?s.skills:[],s.id,{correct:r.correct,verified,reveals:support,representation:s.representation,reason});
  if(!r.correct)recordMisconception(s.primarySkill,`Code Bridge: ${s.label}`);
  renderTraceLab();
}

function gridCellHTML(x,y,result,scenario){const isStart=x===scenario.start[0]&&y===scenario.start[1],isGoal=x===scenario.goal[0]&&y===scenario.goal[1],isObstacle=(scenario.obstacles||[]).includes(`${x},${y}`),end=result&&result.x===x&&result.y===y;return `<div class="grid-cell ${isStart?'start':''} ${isGoal?'goal':''} ${isObstacle?'obstacle':''} ${end?'robot':''}">${end?`🤖${dirIcon(result.dir)}`:isObstacle?'🧱':isGoal?'🏁':isStart?`START ${dirIcon(scenario.dir)}`:''}</div>`;}
function renderGridLab(){const l=VIRTUAL_LABS.grid,s=labScenario('grid'),r=ui.lab.gridResult,cmds=ui.lab.gridCommands||[],grid=Array.from({length:5},(_,y)=>Array.from({length:5},(_,x)=>gridCellHTML(x,y,r,s)).join('')).join(''),goalOnly=r?.goalReached&&!r?.constraintPass,feedback=!r?'Build a route, predict what will happen, then RUN.':r.success?'✅ Scenario solved. The strongest next evidence is solving a different map.':goalOnly?`🟡 You reached the goal, but the engineering constraint is not met yet (${s.maxTokens?`≤${s.maxTokens} command tokens`:''}${s.requireLoop?' + use a repeat command':''}).`:r.failed?`🐞 The first failure was expanded step ${r.failureStep}: ${r.reason}. Change the smallest relevant part.`:`↩️ Safe run, but you finished at (${r.x}, ${r.y}) rather than the goal. Trace the first place your mental route differs.`;document.getElementById('labsBody').innerHTML=`${labHeader(l)}<div class="virtual-lab-shell"><div class="lab-instruction"><span class="tag">${profile().track==='Explorer'?'ONE JOB':'ENGINEERING TASK'}</span><h2>${profile().track==='Explorer'?'Get 🤖 to 🏁 without touching 🧱.':`Reach the goal${s.maxTokens?` in ≤${s.maxTokens} command tokens`:''}${s.requireLoop?' and use a repeat command':''}.`}</h2><p><b>Start:</b> (${s.start[0]}, ${s.start[1]}) facing ${dirIcon(s.dir)} • <b>Goal:</b> (${s.goal[0]}, ${s.goal[1]}).</p><p><b>Before RUN:</b> ${profile().track==='Explorer'?'point to where you think the robot will finish.':'state the expected final coordinate and one likely failure mode.'}</p></div><div class="grid-lab-layout"><div class="robot-grid" aria-label="5 by 5 virtual robot grid">${grid}</div><div><h3>Command queue</h3><div class="command-queue">${cmds.length?cmds.map((c,i)=>`<span>${i+1}. ${c}</span>`).join(''):'<span class="muted">No commands yet.</span>'}</div><div class="command-pad"><button data-action="lab-grid-add" data-token="F">↑ Forward</button><button data-action="lab-grid-add" data-token="L">↶ Left</button><button data-action="lab-grid-add" data-token="R">↷ Right</button><button data-action="lab-grid-add" data-token="F2">🔁 Forward ×2</button><button data-action="lab-grid-add" data-token="F3">🔁 Forward ×3</button></div><div class="button-row"><button class="primary" data-action="lab-grid-run">▶ RUN</button><button class="ghost" data-action="lab-grid-undo">Undo</button><button class="ghost" data-action="lab-grid-clear">Clear</button></div><details class="scenario-hint"><summary>One planning hint</summary><p>${esc(s.hint||'Trace one safe segment at a time.')}</p></details></div></div><div class="lab-feedback ${r&&r.success?'success':''}"><b>${feedback}</b>${r&&r.success?`<p>Command tokens: ${r.tokenCount} • expanded actions: ${r.expanded.length}${r.usesLoop?' • repeat used':''}.</p><button class="secondary" data-action="new-lab-scenario" data-lab="grid">Prove it on a changed map →</button>`:''}</div><details class="lab-theory"><summary>🧠 What this lab is really teaching</summary><p><b>Sequencing:</b> each command changes the state used by the next command. <b>Debugging:</b> find the first mismatch instead of rewriting everything. <b>Algorithms:</b> describe a route precisely enough to execute. <b>Transfer:</b> a route memorised for one map is not enough; the method must survive a changed map.</p></details></div>`;}
function gridAdd(token){ui.lab.gridCommands.push(token);ui.lab.gridResult=null;renderGridLab();}function gridUndo(){ui.lab.gridCommands.pop();ui.lab.gridResult=null;renderGridLab();}function gridClear(){ui.lab.gridCommands=[];ui.lab.gridResult=null;renderGridLab();}
function runGrid(){const s=labScenario('grid'),r=LAB_ENGINE.simulateGrid(ui.lab.gridCommands,s);ui.lab.gridResult=r;recordLabAttempt('grid',r.success,`${s.label}: ended at (${r.x},${r.y}); ${r.failed?`failed at step ${r.failureStep} (${r.reason})`:r.success?'scenario solved':r.goalReached?'goal reached but constraint missed':'goal not reached'}${r.usesLoop?'; used repeat command':''}`,r.success?['Sequencing','Algorithms','Debugging'].concat(r.usesLoop?['Loops']:[]):[],s.id,{tokenCount:r.tokenCount,usesLoop:r.usesLoop});renderGridLab();}
function renderSensorLab(){const l=VIRTUAL_LABS.sensor,s=labScenario('sensor'),r=ui.lab.sensorResult,defaultT=r?r.threshold:Math.max(10,s.safeDistance-6),opt=LAB_ENGINE.optimalSensorScore(s),rows=r?r.rows.map(x=>`<tr><td>${x.actual} cm</td><td>${x.reading} cm</td><td>${x.stop?'STOP':'GO'}</td><td>${x.expected?'STOP':'GO'}</td><td>${x.pass?'✅':'❌'}</td></tr>`).join(''):'';document.getElementById('labsBody').innerHTML=`${labHeader(l)}<div class="virtual-lab-shell"><div class="lab-instruction"><span class="tag">${profile().track==='Explorer'?'ONE JOB':'BOUNDARY / TRADE-OFF TEST'}</span><h2>STOP when the <i>actual</i> distance is ≤${s.safeDistance} cm; GO when it is farther away.</h2><div class="sensor-chain"><span>🌍 actual distance</span><b>→</b><span>📡 noisy reading</span><b>→</b><span>❓ IF reading &lt; threshold</span><b>→</b><span>🛑 STOP / ▶ GO</span></div>${s.tradeoff?`<p class="tradeoff-callout"><b>Engineer warning:</b> the readings overlap in this scenario. A simple threshold cannot score 5/5. The engineering task is to find the best available trade-off and recognise the limitation.</p>`:''}</div><label class="lab-slider"><b>Threshold: <span id="sensorThresholdLabel">${defaultT}</span> cm</b><input id="sensorThreshold" type="range" min="10" max="55" value="${defaultT}" step="1"></label><p class="muted">Five hidden test cases include measurement noise. Best possible score for this scenario: <b>${opt.max}/5</b>.</p><button class="primary" data-action="lab-sensor-run">Run five boundary/noise tests →</button>${r?`<div class="lab-feedback ${r.success?'success':''}"><b>${r.success?`✅ ${r.score}/5 — you reached the best possible score for this scenario.`:`${r.score}/5 cases passed. Inspect the first wrong decision and adjust the boundary.`}</b>${r.success&&!r.perfect?'<p>There is still an unavoidable error with one simple threshold. That limitation is part of the engineering conclusion.</p>':''}${r.success?'<button class="secondary" data-action="new-lab-scenario" data-lab="sensor">Try changed sensor conditions →</button>':''}</div><div class="table-wrap"><table><thead><tr><th>World</th><th>Sensor</th><th>Your action</th><th>Wanted</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`:''}<details class="lab-theory"><summary>⚙️ Engineer lens</summary><p>The sensor reading is not the world itself. Threshold choice creates a trade-off between stopping too early and failing to stop when close. A changed scenario prevents one remembered threshold from masquerading as understanding.</p></details></div>`;}
function runSensor(){const s=labScenario('sensor'),v=Number(document.getElementById('sensorThreshold')?.value||s.safeDistance),r=LAB_ENGINE.sensorSuite(v,s);ui.lab.sensorResult=r;recordLabAttempt('sensor',r.success,`${s.label}: threshold ${v} cm; ${r.score}/${r.rows.length} cases correct (best possible ${r.maxScore})`,r.success?['Sensors','Conditionals','Testing']:[],s.id,{threshold:v,score:r.score,maxScore:r.maxScore,perfect:r.perfect});renderSensorLab();}
function renderCalibrationLab(){const l=VIRTUAL_LABS.calibration,s=labScenario('calibration'),r=ui.lab.calibrationResult,defaultF=r?r.factor:1,rows=r?r.rows.map(x=>`<tr><td>${x.trial}</td><td>${s.target} cm</td><td>${x.actual.toFixed(1)} cm</td><td>${(x.actual-s.target).toFixed(1)} cm</td></tr>`).join(''):'';document.getElementById('labsBody').innerHTML=`${labHeader(l)}<div class="virtual-lab-shell"><div class="lab-instruction"><span class="tag">${profile().track==='Explorer'?'MEASURE → CHANGE → RETEST':'CALIBRATION VALIDATION'}</span><h2>This virtual rover is commanded to travel ${s.target} cm, but its hidden systematic bias has changed.</h2><p>${profile().track==='Explorer'?'Start at correction 1.000. Run five trials. Decide whether it usually goes too far or too short, then make one evidence-based correction.':'Estimate the new bias from repeated trials; make one justified correction; validate using the identical five-trial protocol. Do not reuse the factor from another scenario.'}</p></div><label class="lab-number"><b>Correction factor</b><input id="calibrationFactor" type="number" min="0.80" max="1.25" value="${Number(defaultF).toFixed(3)}" step="0.001"></label><div class="button-row"><button class="secondary" data-action="lab-cal-baseline">Use baseline 1.000</button><button class="primary" data-action="lab-cal-run">Run 5 trials →</button></div>${r?`<div class="cal-metrics"><div><small>MEAN</small><b>${r.mean.toFixed(2)} cm</b></div><div><small>MEAN ERROR</small><b>${r.error>=0?'+':''}${r.error.toFixed(2)} cm</b></div><div><small>RANGE</small><b>${r.range.toFixed(2)} cm</b></div></div><div class="lab-feedback ${r.success?'success':''}"><b>${r.success?'✅ Calibration target met for this hidden-bias scenario.':'Use the mean error to justify one correction. Do not chase individual noisy trials.'}</b>${r.success?'<p>Now prove the method transfers: the next scenario changes the target and/or systematic bias.</p><button class="secondary" data-action="new-lab-scenario" data-lab="calibration">Calibrate a different rover →</button>':''}</div><div class="table-wrap"><table><thead><tr><th>Trial</th><th>Command</th><th>Actual</th><th>Error</th></tr></thead><tbody>${rows}</tbody></table></div></div>`:''}<details class="lab-theory"><summary>📐 Technical model</summary><p>The scenario contains a hidden gain bias plus small trial-to-trial variation. Calibration should reduce systematic error without pretending random variation disappears. If you understand the method, you should be able to derive a different correction when the hidden bias changes.</p></details></div>`;}
function calibrationBaseline(){const el=document.getElementById('calibrationFactor');if(el)el.value='1.000';}function runCalibration(){const s=labScenario('calibration'),v=Number(document.getElementById('calibrationFactor')?.value||1),r=LAB_ENGINE.calibrationSuite(v,s);ui.lab.calibrationResult=r;recordLabAttempt('calibration',r.success,`${s.label}: factor ${v.toFixed(3)}; target ${s.target} cm; mean ${r.mean} cm; mean error ${r.error} cm; range ${r.range} cm`,r.success?['Measurement','Calibration','Testing']:[],s.id,{factor:v,target:s.target,mean:r.mean,error:r.error,range:r.range});renderCalibrationLab();}
function equipmentIntroHTML(){if(state.prefs.equipmentConfirmed)return'';return`<div class="equipment-intro"><div><span class="tag">NEW / FREE TRY SETUP</span><h2>Tell InventorLab what you actually have — or try it first.</h2><p>Fresh users no longer pretend to own every robot. Select kits/platforms once; if hardware is missing, InventorLab offers equipment-free concept labs without falsely marking the physical mission complete.</p></div><div class="button-row"><button class="primary" data-page="settings">Choose equipment →</button><button class="secondary" data-page="labs">Try 35-minute sampler</button></div></div>`;}

function gearGuideHTML(m,mode='explorer'){
  const needs=toolNeeds(m.tool).filter(g=>GEAR_GUIDES[g]);if(!needs.length)return'';
  return `<details class="gear-preflight"><summary>${mode==='explorer'?'🧰 Grown-up setup — 2 minute preflight':'🧰 Equipment preflight'}</summary>${needs.map(g=>{const x=GEAR_GUIDES[g];return`<div class="gear-preflight-item"><b>${esc(g)}</b><p><b>${mode==='explorer'?'Adult prepares':'Prepare'}:</b> ${esc(x.adult)}</p><p><b>Learner checks:</b> ${esc(x.learner)}</p><p><b>If it behaves strangely:</b> ${esc(x.check)}</p>${x.safety?`<p class="safety-line"><b>Safety:</b> ${esc(x.safety)}</p>`:''}</div>`}).join('')}</details>`;
}
const LAUNCH=window.INVENTORLAB_LAUNCH||{};
/* A mission that says "open Scratch" should hand the learner the door, not just the name. */
function launchTargets(m){
  const direct=LAUNCH[m.tool];if(direct)return[[m.tool,direct]];
  return toolNeeds(m.tool).filter(g=>LAUNCH[g]).map(g=>[g,LAUNCH[g]]);
}
function launchLinksHTML(m,mode='explorer'){
  const targets=launchTargets(m);if(!targets.length)return'';
  return `<div class="launch-strip"><div class="launch-strip-head"><span class="tag">OPEN THE TOOL</span><b>${mode==='explorer'?'Everything you need is one click away.':'Working environment'}</b></div>${targets.map(([name,x])=>`<div class="launch-item"><div><b>${esc(name)}</b><p class="launch-free">${esc(x.free)}</p><p class="launch-first"><b>First thing to do:</b> ${esc(x.first)}</p>${SIMULATED_GEAR[name]?`<p class="launch-sim"><b>No ${esc(name)} yet?</b> ${esc(SIMULATED_GEAR[name])}</p>`:''}</div><a class="primary launch-btn" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)} \u2197</a></div>`).join('')}<p class="launch-note">Opens in a new tab. InventorLab stays here \u2014 come back to this tab to record what happened.</p></div>`;
}
function selectedGearGuidesHTML(){const selected=state.equipment.filter(g=>GEAR_GUIDES[g]);return selected.length?`<div class="gear-guide-grid">${selected.map(g=>{const x=GEAR_GUIDES[g];return`<article class="gear-guide-card"><h3>${esc(g)}</h3><p><b>Prepare:</b> ${esc(x.adult)}</p><p><b>First check:</b> ${esc(x.check)}</p><p class="muted">${esc(x.safety)}</p></article>`}).join('')}</div>`:'<div class="empty">Select a kit/platform above to see its preflight guide.</div>';}

function toolNeeds(tool){
  if(tool==='No hardware'||tool==='Choose your tools')return[];
  const t=tool.toLowerCase(),out=[];
  const map=[['dash','Dash'],['wedo','LEGO WeDo'],['scratch','Scratch'],['micro:bit','micro:bit'],['spike','SPIKE Prime'],['app inventor','MIT App Inventor'],['python','Python'],['arduino','Arduino'],['3d','3D Printing'],['html','Web browser'],['javascript','Web browser']];
  for(const [needle,g] of map)if(t.includes(needle)&&!out.includes(g))out.push(g);
  return out;
}
const SOFTWARE_GEAR=window.INVENTORLAB_SOFTWARE||['Scratch','MIT App Inventor','Python','Web browser'];
const SIMULATED_GEAR=window.INVENTORLAB_SIMULATED||{};
function isSoftwareGear(g){return SOFTWARE_GEAR.includes(g);}
/* Free browser software is not something a family has to own, so it is never an equipment gap. */
function simulatorOnly(m){return !!(m&&m.simulator)&&(state.equipment||[]).includes('Web browser');}
function gearAvailable(m){if(simulatorOnly(m))return true;const eq=state.equipment||[],browser=eq.includes('Web browser');return toolNeeds(m.tool).every(g=>eq.includes(g)||(browser&&isSoftwareGear(g)));}
function missingKits(m){if(simulatorOnly(m))return[];const eq=state.equipment||[],browser=eq.includes('Web browser');return toolNeeds(m.tool).filter(g=>!eq.includes(g)&&!(browser&&isSoftwareGear(g)));}
function gearStatus(m){
  if(simulatorOnly(m)&&!toolNeeds(m.tool).every(g=>(state.equipment||[]).includes(g)))
    return{ok:true,cls:'good',label:'free \u2014 runs in the on-screen simulator'};
  const needs=toolNeeds(m.tool);
  if(!needs.length)return{ok:true,cls:'good',label:'no equipment needed'};
  const missing=missingKits(m);
  if(!missing.length)return needs.every(isSoftwareGear)?{ok:true,cls:'good',label:'free \u2014 opens in your browser'}:{ok:true,cls:'good',label:'equipment ready'};
  const sim=missing.filter(g=>SIMULATED_GEAR[g]);
  if(sim.length===missing.length)return{ok:false,cls:'blue',label:missing.join(', ')+' \u2014 simulator available'};
  return{ok:false,cls:'warn',label:'needs '+missing.join(', ')};
}
function missionDone(id){return learner().completed.includes(id);}
function missionRecord(id){if(!learner().missions[id])learner().missions[id]={attempts:0,hints:0,ratings:[],started:[],quickChecks:0};return learner().missions[id];}
function missionDraft(id){return (learner().missionDrafts||{})[id]||null;}
function latestMissionDraft(){const all=Object.values(learner().missionDrafts||{}).filter(d=>d&&!d.completed&&BY_ID[d.missionId]);return all.sort((a,b)=>new Date(b.lastSaved||b.started)-new Date(a.lastSaved||a.started))[0]||null;}
function draftHasWork(d){if(!d)return false;return Object.values(d.fields||{}).some(v=>v&&((v.kind==='check'&&v.checked)||(v.kind!=='check'&&String(v.value||'').trim())))||(d.hints||[]).length>0||!!d.quick||Number(d.explorerStep||0)>0;}
function persistStateOnly(){STORE.setItem(STORAGE_KEY,JSON.stringify(state));}
let missionAutosaveTimer=null;
function captureMissionDraft(silent=false){
  if(ui.page!=='lesson'||!ui.currentMissionId||ui.missionRated)return null;
  const m=BY_ID[ui.currentMissionId];if(!m)return null;
  if(!learner().missionDrafts)learner().missionDrafts={};
  const existing=learner().missionDrafts[m.id]||{},fields={...(existing.fields||{})};
  document.querySelectorAll('#lessonBody input[id],#lessonBody textarea[id],#lessonBody select[id]').forEach(el=>{
    if(el.type==='file')return;
    fields[el.id]=el.type==='checkbox'||el.type==='radio'?{kind:'check',checked:!!el.checked,value:el.value||''}:{kind:'value',value:el.value??''};
  });
  const challenge=document.querySelector('input[name="challengeContract"]:checked')?.value||existing.challenge||null;
  const started=existing.started||currentAttemptStarted(m.id)||nowISO();
  const d={...existing,missionId:m.id,title:m.title,mode:(state.activeLearner==='faye'&&m.level==='explorer')?'explorer':'engineer',started,lastSaved:nowISO(),fields,challenge,explorerStep:ui.explorerStep,hints:[...ui.currentAttemptHints],quick:ui.currentAttemptQuick||null,completed:false};
  learner().missionDrafts[m.id]=d;persistStateOnly();
  const status=document.getElementById('attemptSaveStatus');if(status)status.textContent='Saved just now';
  if(!silent)toast('Mission progress autosaved.');
  return d;
}
function scheduleMissionAutosave(){clearTimeout(missionAutosaveTimer);missionAutosaveTimer=setTimeout(()=>captureMissionDraft(true),300);}
function restoreMissionDraft(m){
  const d=missionDraft(m.id);if(!d)return;
  for(const [id,v] of Object.entries(d.fields||{})){
    const el=document.getElementById(id);if(!el)continue;
    if(v.kind==='check')el.checked=!!v.checked;else el.value=v.value??'';
  }
  if(d.challenge){const r=document.querySelector(`input[name="challengeContract"][value="${d.challenge}"]`);if(r)r.checked=true;}
  for(const i of d.hints||[]){const el=document.getElementById(`hint-${i}`);if(el)el.classList.add('revealed');}
  ui.currentAttemptHints=new Set(d.hints||[]);ui.currentAttemptQuickCorrect=!!d.quick?.correct;ui.currentAttemptQuick=d.quick||null;ui.explorerStep=Number(d.explorerStep||0);
  if(d.quick){const block=document.querySelector('.quick-check');if(block){block.dataset.answered='1';block.querySelectorAll('button[data-action="quick-answer"]').forEach(b=>b.disabled=true);const f=block.querySelector('.quick-feedback');if(f){f.className=`quick-feedback feedback ${d.quick.correct?'good':'bad'}`;f.innerHTML=`<b>${d.quick.correct?'✅ Previously answered correctly':'↩️ Previous answer needs repair'}</b><p>${esc(d.quick.explain||'Your answer was saved with this attempt.')}</p>`;}}}
  const dbg=currentAttemptDebugLogs(m.id)[0],host=document.getElementById('troubleshoot-result');if(dbg&&host)host.innerHTML=`<div class="diagnostic-next"><b>Last self-diagnosis:</b> ${esc(dbg.idea)}<br><b>Next test:</b> ${esc(dbg.nextTest)}</div>`;
  const status=document.getElementById('attemptSaveStatus');if(status)status.textContent=`Restored • ${new Date(d.lastSaved||d.started).toLocaleString()}`;
}
/*
  This was a 135px card of infrastructure messaging sitting above the mission title — the
  first thing a child saw on every mission. It matters most when work is actually being
  restored, so it stays a card then and collapses to one quiet line otherwise.
*/
function attemptContinuityHTML(m){
  const d=missionDraft(m.id),restoring=ui.resumingDraft&&d;
  if(restoring)return `<div class="attempt-continuity restored"><div><span class="tag">↩️ ATTEMPT RESTORED</span><b>Your unfinished work is back.</b><small id="attemptSaveStatus">${d?.lastSaved?`Last saved ${new Date(d.lastSaved).toLocaleTimeString()}`:''}</small></div><button class="ghost" data-action="fresh-attempt" data-id="${m.id}">Discard draft & start fresh</button></div>`;
  return `<p class="autosave-line">💾 <b>Saved as you go.</b> <small id="attemptSaveStatus">${d?.lastSaved?`Last saved ${new Date(d.lastSaved).toLocaleTimeString()}`:'Your work stays in this browser.'}</small></p>`;
}
function resumeDraftCardHTML(){const d=latestMissionDraft();if(!d)return'';const m=BY_ID[d.missionId];return `<div class="resume-card"><div><span class="tag">UNFINISHED ATTEMPT</span><h2>↩️ Continue ${esc(m.title)}</h2><p>${d.mode==='explorer'?`Resume at ${esc(explorerStepNames()[Number(d.explorerStep||0)]||'Ready')}.`:'Your hypothesis, criteria, test fields and notes are autosaved.'} Nothing here counts as evidence until the attempt is rated.</p><small>Last saved ${new Date(d.lastSaved||d.started).toLocaleString()}</small></div><button class="primary" data-action="resume-mission" data-id="${m.id}">Resume →</button></div>`;}
function clearMissionDraft(id){if(learner().missionDrafts)delete learner().missionDrafts[id];persistStateOnly();}
function startFreshMission(id){const d=missionDraft(id);if(d&&draftHasWork(d)&&!confirm('Discard the unfinished work in this attempt and start fresh?'))return;clearMissionDraft(id);openMission(id,true);}

function pathStartIndex(){const p=profile();if(learner().startId&&p.path.includes(learner().startId))return p.path.indexOf(learner().startId);return 0;}
function activePathIds(){const p=profile();return p.path.slice(pathStartIndex());}
function strictNextMission(){const ids=activePathIds();return ids.map(id=>BY_ID[id]).filter(Boolean).find(m=>!missionDone(m.id))||null;}
function recommendedMission(){return strictNextMission();}
function dueReviews(){const now=new Date();return learner().reviews.filter(r=>new Date(r.due)<=now).sort((a,b)=>new Date(a.due)-new Date(b.due));}
function topRemediation(){return Object.entries(learner().remediation||{}).filter(([,v])=>v&&v.count>0).sort((a,b)=>(b[1].count||0)-(a[1].count||0))[0]||null;}
function learningPlan(){
  const due=dueReviews(); if(due.length)return{kind:'review',title:`Retrieve ${due[0].skill} before new work`,detail:`${due.length} spaced review${due.length===1?' is':'s are'} due. Retrieval after time has passed is stronger evidence than starting another mission.`,action:'review',reasons:['A previously learned idea is due for retrieval.','Review protects against “I could do it yesterday” mastery.']};
  const rem=topRemediation(); if(rem)return{kind:'remediation',skill:rem[0],title:`Repair ${rem[0]} first`,detail:(CONCEPTS[rem[0]]||CONCEPTS.Prediction).remedy,action:'remediation',reasons:[`${rem[1].count} learning signal${rem[1].count===1?'':'s'} point to this bottleneck.`,`Harder work should not pile on top of an unresolved misconception.`]};
  const m=strictNextMission();if(!m)return{kind:'complete',title:'Studio path complete',detail:'Use review, assessment and an open capstone instead of adding filler.',action:'review',reasons:['The curated path has been evidenced.']};
  const gaps=curriculumGapFor(m),pre=missionPrereqs(m).filter(x=>x.rank<2),ids=activePathIds(),idx=ids.indexOf(m.id),priorDone=idx>0&&ids.slice(0,idx).some(missionDone),diag=learner().diagnostics[0],provisional=diag&&diag.confirmed===false&&diag.startId===m.id;
  if(gaps.length&&priorDone&&!provisional){return{kind:'curriculum-gap',mission:m,skill:gaps[0],title:`Curriculum check before ${m.title}`,detail:`${gaps[0]} is marked as required but has not yet been explicitly taught or evidenced in the Studio path.`,action:'alpha',reasons:['This is treated as a product/curriculum gap, not a learner weakness.','Do not remediate the child for content the product has not properly introduced.']};}
  if(!gearAvailable(m)){const missing=missingKits(m),labId=equipmentFallbackLab(m),parallel=parallelStudioAlternative(m);if(parallel)return{kind:'parallel',mission:parallel,blocked:m,labId,title:`Keep learning while ${m.tool} is unavailable`,detail:`${m.title} stays in the path. Meanwhile, ${parallel.title} is a prerequisite-ready Studio mission using equipment you already selected.`,action:'mission',reasons:['The blocked mission is not skipped or marked complete.','The parallel mission has explicit prerequisites at Developing or stronger evidence.','This keeps the learner progressing without pretending different hardware produces identical evidence.']};return{kind:'equipment',mission:m,labId,title:`Prepare equipment for ${m.title}`,detail:`Missing or unselected: ${missing.join(', ')||m.tool}.`,action:'settings',reasons:['The next physical Studio mission is intentionally not skipped just because hardware is unavailable.','Use the equipment-free concept lab to practise the underlying reasoning without pretending it replaces physical evidence.']};}
  const rescue=(learner().rescueLogs||[]).find(x=>x.missionId===m.id&&rescueIsBlocking(x));if(rescue&&state.activeLearner==='faye'){return{kind:'rescue-bridge',mission:m,title:`Retry ${m.title} with one smaller step`,detail:`Last time, adult help was requested at ${rescue.stepName}. The mission now shows a short bridge for that exact point before you retry.`,action:'mission',reasons:['Direct evidence from the previous attempt takes priority over a generic prerequisite inference.','The retry keeps the original challenge but reduces unnecessary language/scaffolding friction.']};}
  if(pre.length&&priorDone&&!provisional){const w=pre[0];return{kind:'prerequisite',mission:m,skill:w.skill,title:`Refresh ${w.skill} before ${m.title}`,detail:(CONCEPTS[w.skill]||CONCEPTS.Prediction).remedy,action:'remediation',reasons:[`${w.skill} is currently ${w.status.toLowerCase()} evidence.`,`This is an explicit prerequisite for the next Studio mission.`]};}
  const skill=primarySkill(m),pts=evidencePoints(skill),ep=evidenceProfile(skill);return{kind:'mission',mission:m,title:m.title,detail:m.goal,action:'mission',reasons:[`It is the next unfinished Studio mission after placement.`,`Required equipment is selected.`,`It adds evidence for ${skill}, currently ${ep.label.toLowerCase()}${ep.label==='Reconfirm'?` (historical best ${ep.historicalLabel})`:''} with ${ep.by.mission} project and ${ep.by.review} review evidence event(s).`]};
}
function learningPlanHTML(plan){const icons={review:'🧠',remediation:'🛠️',prerequisite:'🧱','curriculum-gap':'🧭',equipment:'📦',parallel:'🛤️','rescue-bridge':'🪜',mission:'🚀',complete:'🏆'};let button='';if(plan.kind==='review')button='<button class="primary" data-page="review">Do review first →</button>';else if(plan.kind==='remediation'||plan.kind==='prerequisite')button=`<button class="primary" data-action="practice-skill" data-skill="${esc(plan.skill)}">Open 5-minute refresher →</button>`;else if(plan.kind==='curriculum-gap')button='<button class="primary" data-page="parent">Open parent guidance →</button>';else if(plan.kind==='equipment')button=`<button class="primary" data-page="settings">Check equipment →</button>${plan.labId?`<button class="secondary" data-action="open-lab" data-lab="${plan.labId}" data-skill="${esc(primarySkill(plan.mission))}">Try equipment-free lab →</button>`:''}<button class="ghost" data-page="assessment">Use concept check instead</button>`;else if(plan.kind==='parallel')button=`<button class="primary" data-action="start-mission" data-id="${plan.mission.id}">Do parallel Studio mission →</button><button class="ghost" data-page="settings">Prepare ${esc(plan.blocked.tool)}</button>`;else if(plan.kind==='mission'||plan.kind==='rescue-bridge')button=`<button class="primary" data-action="start-mission" data-id="${plan.mission.id}">${plan.kind==='rescue-bridge'?'Retry with bridge':'Start mission'} →</button>`;else button='<button class="primary" data-page="review">Open Review →</button>';return`<div class="learning-plan"><div class="plan-kicker">BEST NEXT LEARNING MOVE</div><h2>${icons[plan.kind]||'→'} ${esc(plan.title)}</h2><p>${esc(plan.detail)}</p><div class="plan-reasons">${plan.reasons.map(x=>`<div class="plan-reason"><span>✓</span><div>${esc(x)}</div></div>`).join('')}</div><div class="button-row">${button}<button class="ghost" data-page="path">See roadmap</button></div></div>`;}
function pathProgress(){const ids=activePathIds();return ids.length?ids.filter(missionDone).length/ids.length:1;}


function publicDisplayName(key=state.activeLearner){
  const custom=(state.prefs.learnerNames||{})[key];
  const entry=rosterEntry(key);
  return custom||(entry&&entry.name)||key;
}
function renderWelcome(){
  const eq=state.equipment||['Web browser'];
  document.getElementById('welcomeBody').innerHTML=`<div class="beta-welcome">
    <div class="beta-hero">
      <div><span class="beta-badge">FREE PUBLIC BETA</span><h1 id="welcomeTitle">Coding + robotics + engineering that asks children to <em>think</em>, not just click through lessons.</h1>
      <p>Try InventorLab without an account. Start with browser-only labs, or tell us which kits you already own. Progress stays on this device.</p>
      <div class="beta-trust"><span>✓ No account</span><span>✓ No payment</span><span>✓ No ads</span><span>✓ No cloud upload</span></div></div>
      <div class="beta-hero-art">🤖<br><span>⚙️ 🧠</span></div>
    </div>
    <div class="beta-onboard-card kid-start">
      <span class="tag">SETTING THIS UP BY YOURSELF?</span>
      <h2>👋 Are you the kid who is going to use this?</h2>
      <p>You do not need a grown-up to start. Pick the one that sounds like you, and you will go straight to a mission you can do with nothing but this screen.</p>
      <div class="kid-start-grid">
        <button data-action="learner-self-start" data-track="explorer"><span>🌟</span><b>I am new to coding</b><small>Or I have only tried it a little. Short missions, pictures, and a read-aloud button.</small></button>
        <button data-action="learner-self-start" data-track="engineer"><span>⚙️</span><b>I have coded before</b><small>I have built things in Scratch, micro:bit or Python. Give me the harder builds.</small></button>
      </div>
      <p class="muted">Nothing gets sent anywhere — your work stays on this device. A grown-up can add robot kits later in Settings.</p>
    </div>
    <div class="beta-onboard-grid">
      <section class="beta-onboard-card">
        <span class="tag">1 • CHOOSE A STARTING TRACK</span>
        <h2>Which sounds more like your child?</h2>
        <label class="track-choice"><input type="radio" name="betaTrack" value="faye" ${state.activeLearner==='faye'?'checked':''}> <span><b>🌟 Explorer</b><small>Newer to coding/robotics. Visual, guided, short missions. Roughly suitable for many learners around 6–9, but ability matters more than age.</small></span></label>
        <label class="track-choice"><input type="radio" name="betaTrack" value="philip" ${state.activeLearner==='philip'?'checked':''}> <span><b>⚙️ Engineer</b><small>Already has some Scratch / robotics / micro:bit / coding experience. More measurement, debugging and open engineering. Often 9–13+.</small></span></label>
        <label class="beta-name"><b>Optional learner name</b><input id="betaLearnerName" maxlength="24" placeholder="First name or nickname — stays only in this browser"></label>
      </section>
      <section class="beta-onboard-card">
        <span class="tag">2 • WHAT DO YOU HAVE?</span>
        <h2>Select only what is genuinely available</h2>
        <p class="muted">You can test InventorLab with only a web browser. Hardware missions stay in sequence and won’t be falsely marked complete.</p>
        <div class="beta-gear-grid">${ALL_GEAR.map(g=>`<label><input type="checkbox" class="beta-gear" value="${esc(g)}" ${eq.includes(g)?'checked':''}> ${esc(g)}</label>`).join('')}</div>
      </section>
    </div>
    <div class="beta-onboard-card beta-parent-rule">
      <span class="tag">3 • PARENT TESTING RULE</span>
      <h2>Set up the environment. Don’t solve the thinking.</h2>
      <p>You may help with charging, pairing, opening apps, cables and safety. Try not to choose the block, number, route or answer. If the site is confusing, tell us — that may be a product defect, not your child’s weakness.</p>
      <label class="beta-check"><input id="betaPrivacyAck" type="checkbox"> I understand this is a beta. Learning data stays in this browser unless I manually export it.</label>
      <div class="button-row"><button class="primary" data-action="finish-beta-onboarding">Start free beta →</button><button class="secondary" data-action="quick-browser-trial">Just try browser-only labs →</button></div>
    </div>
    <div class="beta-note"><b>What we want from testers:</b> Can your child understand what to do? Where do they ask you for help? Are missions too easy, too hard, or engaging? Use the Feedback page to turn your notes into a short report you can send to whoever invited you to the beta.</div>
  </div>`;
}
function startAsLearner(track){
  const key=track==='engineer'?'philip':'faye';
  state.activeLearner=key;
  state.equipment=['Web browser'];
  state.prefs.equipmentConfirmed=true;
  state.prefs.betaOnboarded=true;
  state.prefs.viewMode='learner';
  state.prefs.selfDirected=true;
  state.prefs.noKitPath={...(state.prefs.noKitPath||{}),[key]:true};
  save();
  toast('You are all set. Start whenever you are ready.');
  showPage('path');
}
function guardedFinishBetaOnboarding(){
  if(!document.getElementById('betaPrivacyAck')?.checked){toast('Please confirm the beta/privacy note first.');return;}
  finishBetaOnboarding(false);
}
function finishBetaOnboarding(browserOnly=false){
  const track=document.querySelector('input[name="betaTrack"]:checked')?.value||'faye';
  state.activeLearner=track;
  const name=(document.getElementById('betaLearnerName')?.value||'').trim();
  state.prefs.learnerNames=state.prefs.learnerNames||{faye:'',philip:''};
  if(name)state.prefs.learnerNames[track]=name;
  const selected=browserOnly?['Web browser']:[...document.querySelectorAll('.beta-gear:checked')].map(x=>x.value);
  state.equipment=selected.includes('Web browser')?selected:['Web browser',...selected];
  state.prefs.equipmentConfirmed=true;
  state.prefs.betaOnboarded=true;
  state.prefs.viewMode='learner';
  save();
  toast('Welcome to the InventorLab public beta!');
  showPage(browserOnly?'labs':'home');
}
function betaFeedbackSnapshot(){
  const p=profile(),l=learner(),funnel=sessionFunnelStats(),ind=independenceStats();
  const lastSession=l.sessions?.[0],openDefects=(l.defects||[]).filter(x=>x.status!=='resolved');
  const completed=p.path.filter(missionDone).length;
  return {track:p.track,name:p.name,completed,total:p.path.length,independence:ind.pct,sessions:funnel.started||0,validSessions:funnel.valid||0,lastSession,openDefects:openDefects.slice(0,3)};
}
function feedbackText(){
  const s=betaFeedbackSnapshot();
  const child=document.getElementById('fbChild')?.value||'';
  const parent=document.getElementById('fbParent')?.value||'';
  const easy=document.getElementById('fbDifficulty')?.value||'';
  const bug=document.getElementById('fbBug')?.value||'';
  const recommend=document.getElementById('fbRecommend')?.value||'';
  return `InventorLab Public Beta feedback
Track: ${s.track}
Studio progress: ${s.completed}/${s.total}
Rated-attempt independence: ${s.independence}%
Focused sessions logged: ${s.sessions}
What my child said/did:
${child||'—'}

What I had to help with:
${parent||'—'}

Difficulty / engagement:
${easy||'—'}

Bug / confusing wording:
${bug||'—'}

Would I use this again / recommend it?
${recommend||'—'}

Note: This text is generated locally. No data was sent automatically.`;
}
async function copyFeedback(){
  const text=feedbackText();
  try{await navigator.clipboard.writeText(text);toast('Feedback copied to your clipboard.');}
  catch{downloadText('inventorlab-beta-feedback.txt',text);toast('Feedback downloaded as a text file.');}
}
function downloadText(name,text){
  const blob=new Blob([text],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
}
function renderFeedback(){
  const s=betaFeedbackSnapshot();
  document.getElementById('feedbackBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">PUBLIC BETA FEEDBACK</p><h1 id="feedbackTitle">Tell us where the product—not the child—needs work.</h1><p>No form is submitted anywhere. This page turns your notes into a short text report you can copy or download and send on.</p></div></div>
  <div class="beta-feedback-summary"><span>Track: <b>${esc(s.track)}</b></span><span>Studio: <b>${s.completed}/${s.total}</b></span><span>Independence: <b>${s.independence}%</b></span><span>Sessions: <b>${s.sessions}</b></span></div>
  <div class="beta-feedback-form">
    <label><b>What did your child say / do?</b><textarea id="fbChild" placeholder="E.g. She understood the mission immediately and wanted another one."></textarea></label>
    <label><b>What did you have to help with?</b><textarea id="fbParent" placeholder="E.g. I had to explain what 'threshold' meant; pairing Dash was fine."></textarea></label>
    <label><b>Difficulty / engagement</b><select id="fbDifficulty"><option value="">Choose…</option><option>Too easy / bored</option><option>About right</option><option>Challenging but productive</option><option>Too hard / frustrating</option><option>Mixed</option></select></label>
    <label><b>Bug, confusing wording or navigation problem</b><textarea id="fbBug" placeholder="Please quote the exact wording if possible."></textarea></label>
    <label><b>Would you use this again / recommend it?</b><select id="fbRecommend"><option value="">Choose…</option><option>Yes — definitely</option><option>Probably</option><option>Not sure yet</option><option>Probably not</option><option>No</option></select></label>
    <div class="button-row"><button class="primary" data-action="copy-feedback">Copy feedback →</button><button class="secondary" data-action="download-feedback">Download .txt</button></div>
  </div>
  <div class="info-box"><b>Privacy:</b> InventorLab does not automatically send this feedback, learner progress or portfolio evidence anywhere in this beta. You decide what to copy/share.</div>`;
}

function renderHome(){
  const p=profile(),l=learner(),plan=learningPlan();
  const activeIds=activePathIds(),completed=activeIds.filter(missionDone).length,assessed=l.assessments.length,reviews=dueReviews().length;
  const latestDiag=l.diagnostics[0],provisional=latestDiag&&latestDiag.confirmed===false;
  document.getElementById('homeBody').innerHTML=`
  <div class="hero"><div><p class="eyebrow">${(state.prefs.viewMode||'learner')==='adult'?'FREE PUBLIC BETA • LEARNING-FIRST':`${p.emoji} ${p.track.toUpperCase()} LEARNER VIEW`}</p><h1 id="homeTitle">Build. Test. Explain. Transfer.</h1><p>${state.activeLearner==='faye'?'Short visual missions: predict, test, diagnose, explain and prove what you learned.':'Engineering briefs with measurement, failure analysis, repeatability and evidence—not beginner busywork.'}</p><div class="button-row"><button class="primary" data-page="path">Start / continue learning →</button><button class="secondary" data-page="labs">Try browser labs</button><button class="ghost" data-page="diagnostic">Placement</button></div></div><div class="hero-art">${p.emoji}<br>${state.activeLearner==='faye'?'🤖✨':'⚙️📊'}</div></div>
  <div class="metric-grid" style="margin-top:16px"><div class="metric"><span class="tag">STUDIO PATH</span><strong>${completed}/${activeIds.length}</strong><small>${(state.prefs.viewMode||'learner')==='adult'?'curated missions evidenced':'missions finished'}</small></div><div class="metric"><span class="tag">ASSESSMENTS</span><strong>${assessed}</strong><small>${(state.prefs.viewMode||'learner')==='adult'?'saved concept checks':'quizzes done'}</small></div><div class="metric"><span class="tag">REVIEW</span><strong>${reviews}</strong><small>${(state.prefs.viewMode||'learner')==='adult'?'spaced checks due':'things to remember'}</small></div></div>
  ${equipmentIntroHTML()}
  ${resumeDraftCardHTML()}
  ${provisional?`<div class="provisional"><b>🧭 Placement is provisional.</b><p>The first recommended mission will confirm the level. If it requires substantial help, InventorLab automatically steps the starting point back rather than assuming the quiz was right.</p></div>`:''}
  ${learningPlanHTML(plan)}
  ${badgeStripHTML('compact')}
  <div class="section-head"><div><p class="eyebrow">QUALITY PROMISE</p><h2>Not all ${LESSONS.length} missions are treated equally</h2></div></div>
  <div class="two-col"><div class="card"><span class="quality-badge studio">★ ${LESSONS.filter(x=>x.quality==='studio').length} Studio missions</span><h3>Hand-curated Studio path</h3><p>Deep, curated projects with a real task, prediction, testing, debugging, explanation and evidence checks. These are the ones written by a person.</p></div><div class="card"><span class="quality-badge extended">${LESSONS.filter(x=>x.quality!=='studio').length} Extended practice prompts</span><h3>Broader practice bank</h3><p>The mission text here is template-generated, so each one now carries a <b>generated challenge</b>: a real, specific task written for that concept, with actual numbers to hit. Good for extra reps and for choice. What they lack is the hand-written storyboard, worked reasoning and troubleshooter that Studio missions carry — so they count for breadth, not for curriculum depth.</p></div></div>`;
}

function recommendationReason(m){
  if(!m)return'';const plan=learningPlan(),skill=primarySkill(m),pts=evidencePoints(skill),pre=missionPrereqs(m).filter(x=>!x.ok).slice(0,2);
  const parts=[`This is the next unfinished Studio mission after placement.`,`Target skill: ${skill} (${evidenceProfile(skill).label.toLowerCase()}; ${evidenceProfile(skill).by.mission} project, ${evidenceProfile(skill).by.assessment} assessment, ${evidenceProfile(skill).by.review} review).`];
  if(!gearAvailable(m))parts.push('Required equipment is not currently selected, so the planner will not pretend a later mission is an equivalent substitute.');
  if(pre.length)parts.push(`Prerequisite evidence to watch: ${pre.map(x=>x.skill).join(' and ')}.`);
  if(plan.kind!=='mission')parts.push(`The planner currently recommends ${plan.kind} before starting this mission.`);
  return `<div class="info-box"><b>Why this sits next in the roadmap</b><p>${parts.map(esc).join(' ')}</p></div>`;
}

function renderPath(){
  const p=profile(),next=recommendedMission(),progress=Math.round(pathProgress()*100),start=pathStartIndex(),activeIds=activePathIds();
  const rows=p.path.map((id,i)=>{const m=BY_ID[id];if(!m)return'';const waived=i<start&&!missionDone(id),done=missionDone(id),current=next&&next.id===id,gear=gearAvailable(m);const pre=missionPrereqs(m).filter(x=>!x.ok).slice(0,2);return`<div class="path-row ${done?'done':''} ${current?'current':''}"><div class="path-icon">${done?'✅':waived?'↷':m.icon}</div><div><div>${waived?'<span class="pill">placement-skipped • optional</span> ':''}${current?'<span class="badge">RECOMMENDED</span> ':''}${i===start&&!done?'<span class="pill blue">placement start</span> ':''}<b>${esc(m.title)}</b></div><small>${esc(m.tool)} • ${esc(m.concept)} • ${m.mins} min${missionBlueprint(m)?` • ${esc(missionBlueprint(m).strand)}`:''}</small>${missionBlueprint(m)?`<div class="path-objective">🎯 ${esc(missionBlueprint(m).objective)}</div>`:''}<div class="mission-meta" style="margin-top:5px">${(()=>{const gs=gearStatus(m);return `<span class="pill ${gs.cls}">${esc(gs.label)}</span>`;})()}${pre.length?`<span class="pill warn">refresh: ${pre.map(x=>esc(x.skill)).join(', ')}</span>`:''}</div></div><div class="path-action"><button class="${current?'primary':'ghost'}" data-action="start-mission" data-id="${id}">${done?'Review':waived?'Optional review':'Start'}</button></div></div>`}).join('');
  document.getElementById('pathBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">${p.track.toUpperCase()} PATH</p><h1 id="pathTitle">${p.emoji} ${p.name}’s Studio roadmap</h1></div><button class="ghost" data-action="switch-learner">Switch learner</button></div><p class="muted">${state.activeLearner==='faye'?'A short, finishable path with deep evidence checks instead of repetitive worksheets.':'A faster route into systems, measurement, text code, embedded hardware and an open capstone.'}</p>${noKitSwitchHTML()}<div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><p><b>${progress}%</b> of the active Studio path evidenced • ${activeIds.filter(missionDone).length}/${activeIds.length} missions from the placement start.</p>${next?recommendationReason(next):''}${rows}${curriculumBlueprintHTML()}`;
}

/*
  A deterministic cover per mission: hue derived from the concept strand so related
  missions look related, and the emoji the content already carries. No image files,
  nothing to download, and it survives the offline cache for free.
*/
function missionHue(m){
  const strand=(missionBlueprint(m)||{}).strand||m.concept||'';
  let h=0;for(let i=0;i<strand.length;i++)h=(h*31+strand.charCodeAt(i))%360;
  return h;
}
function missionCoverHTML(m){
  const h=missionHue(m),done=missionDone(m.id);
  return `<div class="mission-cover" style="--h:${h}" aria-hidden="true"><span class="cover-emoji">${m.icon||'\ud83e\uddea'}</span>${m.quality==='studio'?'<span class="cover-star">\u2605</span>':''}${done?'<span class="cover-done">\u2713</span>':''}</div>`;
}
/*
  A child does not browse 251 missions by tool name. They browse by what they
  feel like making. Each interest maps to concepts and tools the bank already
  has, so this is a view over existing data rather than new metadata.
*/
const INTERESTS=[
  {id:'games',   icon:'\ud83c\udfae', label:'Make a game',        test:m=>/game|score|chase|maze|dice|random|enem|player/i.test(m.title+' '+m.concept+' '+m.goal)},
  {id:'moving',  icon:'\ud83e\udd16', label:'Make something move', test:m=>/dash|wedo|spike|motor|gear|robot|move|drive|wheel|mechan/i.test(m.title+' '+m.tool+' '+m.concept)},
  {id:'sensing', icon:'\ud83d\udca1', label:'Lights and sensors',  test:m=>/sensor|light|sound|detect|threshold|input|output|circuit|led|button/i.test(m.title+' '+m.concept+' '+m.goal)},
  {id:'apps',    icon:'\ud83d\udcf1', label:'Apps and websites',   test:m=>/app inventor|html|css|javascript|web|interface|\bui\b|screen/i.test(m.title+' '+m.tool+' '+m.concept)},
  {id:'unplug',  icon:'\u270f\ufe0f', label:'No computer needed',  test:m=>/no hardware/i.test(m.tool)},
  {id:'making',  icon:'\ud83d\udd27', label:'Design and build',    test:m=>/3d printing|cad|tolerance|fabricat|design|print/i.test(m.title+' '+m.tool+' '+m.concept)}
];
function interestChipsHTML(active){
  return `<div class="interest-chips" role="group" aria-label="What do you feel like making?">`
    +`<button class="${active?'':'on'}" data-action="library-interest" data-interest="">\ud83c\udf1f Everything</button>`
    +INTERESTS.map(x=>`<button class="${active===x.id?'on':''}" data-action="library-interest" data-interest="${x.id}">${x.icon} ${esc(x.label)}</button>`).join('')
    +`</div>`;
}
function matchesInterest(m,id){
  if(!id)return true;
  const x=INTERESTS.find(i=>i.id===id);
  return x?x.test(m):true;
}
function renderLibrary(){
  const tools=[...new Set(LESSONS.map(m=>m.tool))].sort(); const f=ui.library;
  const list=LESSONS.filter(m=>(f.quality==='all'||m.quality===f.quality)&&(f.level==='all'||m.level===f.level)&&(f.tool==='all'||m.tool===f.tool)&&(!f.ready||gearAvailable(m))&&matchesInterest(m,f.interest)&&(!f.q||[m.title,m.tool,m.concept,m.goal].join(' ').toLowerCase().includes(f.q.toLowerCase())));
  const startable=LESSONS.filter(gearAvailable).length;
  document.getElementById('libraryBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">MISSION LIBRARY</p><h1 id="libraryTitle">${(state.prefs.viewMode||'learner')==='adult'?'Browse with quality labels':'Find something to build'}</h1></div><span class="pill">${list.length} shown</span></div>${(state.prefs.viewMode||'learner')==='adult'?'<div class="info-box"><b>Recommendation engine uses Studio missions first.</b> Extended practice is kept for breadth and choice, but it is not treated as equivalent evidence of curriculum depth.</div>':`<div class="info-box"><b>\u2b50 Studio missions are the fully written ones</b> \u2014 pictures, worked examples and a stuck-button that actually helps. Practice missions give you a real challenge to hit but less help around it, so save them for extra reps. ${startable} mission${startable===1?'':'s'} can be started with what you have right now.</div>`}${interestChipsHTML(f.interest)}<div class="library-controls" style="margin-top:14px"><input id="librarySearch" aria-label="Search missions" placeholder="Search title, tool or concept" value="${esc(f.q)}"><select id="qualityFilter" aria-label="Quality filter"><option value="studio" ${f.quality==='studio'?'selected':''}>${(state.prefs.viewMode||'learner')==='adult'?'Studio quality':'\u2b50 Fully written'}</option><option value="extended" ${f.quality==='extended'?'selected':''}>${(state.prefs.viewMode||'learner')==='adult'?'Extended practice':'Extra practice'}</option><option value="all" ${f.quality==='all'?'selected':''}>All</option></select><select id="levelFilter" aria-label="Level filter"><option value="all">All levels</option><option value="explorer" ${f.level==='explorer'?'selected':''}>Explorer</option><option value="engineer" ${f.level==='engineer'?'selected':''}>Engineer</option></select><label class="ready-toggle"><input type="checkbox" id="readyFilter" ${f.ready?'checked':''}> Only what I can start now</label><select id="toolFilter" aria-label="Tool filter"><option value="all">All tools</option>${tools.map(t=>`<option ${f.tool===t?'selected':''} value="${esc(t)}">${esc(t)}</option>`).join('')}</select></div><div class="mission-list">${list.map(m=>`<article class="mission-card">${missionCoverHTML(m)}<div><span class="quality-badge ${m.quality}">${m.quality==='studio'?'★ Studio':'Practice • generated challenge'}</span><h3>${esc(m.title)}</h3><p>${esc(m.goal)}</p><div class="mission-meta"><span class="pill">${esc(m.tool)}</span><span class="pill blue">${esc(m.concept)}</span><span class="pill">${m.mins} min</span>${missionDone(m.id)?'<span class="pill good">evidenced</span>':''}</div></div><button class="ghost" data-action="start-mission" data-id="${m.id}">${missionDone(m.id)?'Review':'Open'}</button></article>`).join('')||'<div class="empty">No missions match those filters.</div>'}</div>`;
}

const STRAND_BY_SKILL={'Prediction':'Computational Foundations','Sequencing':'Computational Foundations','Pattern recognition':'Computational Foundations','Loops':'Computational Foundations','Algorithms':'Algorithms & Decomposition','Decomposition':'Algorithms & Decomposition','Optimisation':'Algorithms & Decomposition','Measurement':'Measurement & Debugging','Calibration':'Measurement & Debugging','Debugging':'Measurement & Debugging','Testing':'Measurement & Debugging','Iteration':'Measurement & Debugging','Data':'Measurement & Data','Sensors':'Sensing & Control','Conditionals':'Sensing & Control','Input / output':'Sensing & Control','Variables':'Interactive Software','State':'Interactive Software','Events':'Interactive Software','Functions':'Software Engineering','Transfer':'Systems Integration'};
const GENERATED_BLUEPRINTS=Object.create(null);
function lowerFirst(t){const x=String(t||'').trim();return x?x.charAt(0).toLowerCase()+x.slice(1):x;}
function stripDot(t){return String(t||'').trim().replace(/\.$/,'');}
/*
  Only 27 of 223 missions were hand-authored with an objective and success criteria.
  The rest rendered with no learning target at all, so a learner never saw what they were
  aiming at and an adult never saw the standard. These are derived from the mission's own
  fields and flagged as generated, so hand-authored Studio work stays distinguishable.
*/
function generatedBlueprint(m){
  if(GENERATED_BLUEPRINTS[m.id])return GENERATED_BLUEPRINTS[m.id];
  const skill=primarySkill(m);
  const bp={
    generated:true,
    strand:STRAND_BY_SKILL[skill]||'Computational Foundations',
    objective:`I can ${lowerFirst(m.goal)}`,
    ready:m.setup,
    success:[
      'I said or wrote what I expected before the first run, and I can say how the real result differed.',
      `I can do it again on purpose, not by luck: ${stripDot(m.goal)}.`,
      `I can explain ${skill.toLowerCase()} in my own words, using this project as my example.`
    ],
    evidence:missionDoneCheck(m),
    stretch:m.extend,
    adult:m.coach
  };
  GENERATED_BLUEPRINTS[m.id]=bp;return bp;
}
/*
  Resolve a concrete task for a template mission. Studio missions are hand-authored and are
  returned untouched; everything else gets a real challenge instead of a description of one.
*/
const BRIEFS=window.INVENTORLAB_BRIEFS||{bySkill:{},byConceptKeyword:[]};
const BRIEF_CACHE=Object.create(null);
/*
  Some bank missions claim 90 to 180 minutes, which is not one sitting for a primary learner.
  Rather than quietly rewriting the estimate, say how many sessions it really is. The app
  already saves drafts between sessions, so this is a pacing hint, not a new feature.
*/
const SESSION_MINUTES=35;
function missionSessions(m){return m&&m.mins>55?Math.max(2,Math.round(m.mins/SESSION_MINUTES)):1;}
function sessionPlanHTML(m){
  const n=missionSessions(m);if(n<2)return'';
  return `<div class="session-plan"><span class="tag">PACING</span><b>\u23f3 This one is about ${n} sittings, not one.</b>
    <p>It is listed as ${m.mins} minutes. Aim for roughly ${SESSION_MINUTES} minutes at a time and stop at a point where you could explain where you got to. Your writing is saved automatically, so closing the tab loses nothing.</p>
    <p class="muted">Finishing tired is how good work gets thrown away. Stopping on purpose is not giving up.</p></div>`;
}
function missionBrief(m){
  if(!m||m.quality==='studio')return null;
  if(BRIEF_CACHE[m.id]!==undefined)return BRIEF_CACHE[m.id];
  let hit=null;
  for(const rule of (BRIEFS.byConceptKeyword||[])){
    if(rule.match.test(String(m.concept||''))){hit=rule.brief;break;}
  }
  if(!hit)hit=(BRIEFS.bySkill||{})[primarySkill(m)]||null;
  BRIEF_CACHE[m.id]=hit;
  return hit;
}
function missionChallenge(m){const b=missionBrief(m);return b?b.task:m.challenge;}
function missionPredictPrompt(m){const b=missionBrief(m);return b?b.predict:m.predict;}
function missionDoneCheck(m){const b=missionBrief(m);return b?b.done:m.check;}
function missionBlueprint(m){if(!m)return null;return STUDIO_BLUEPRINTS[m.id]||generatedBlueprint(m);}
function objectiveCardHTML(m,mode='explorer'){
  const b=missionBlueprint(m);if(!b)return'';
  if(mode==='explorer')return `<div class="learning-target explorer-target"><span class="tag">🎯 TODAY I CAN</span>${b.generated?'<span class="pill auto">auto-generated target</span>':''}<h2>${esc(b.objective.replace(/^I can\s*/i,''))}</h2><div class="ready-when"><b>🟢 Ready when:</b> ${esc(b.ready)}</div><details><summary><b>🏆 What winning looks like</b></summary><ul>${b.success.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p><b>Show it with:</b> ${esc(b.evidence)}</p><p class="muted">At the Boss Check you will confirm each success criterion before choosing a mastery level.</p></details></div>`;
  return `<div class="learning-contract"><div><span class="tag">MISSION LEARNING CONTRACT • ${esc(b.strand)}${b.generated?' • AUTO-GENERATED':''}</span><h2>${esc(b.objective)}</h2><p><b>Ready condition:</b> ${esc(b.ready)}</p></div><div><h3>Acceptance criteria</h3><ol>${b.success.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p><b>Required evidence:</b> ${esc(b.evidence)}</p></div></div>`;
}
function professionalStretchHTML(m){const b=missionBlueprint(m);if(!b?.stretch)return'';return `<div class="professional-stretch"><span class="tag">${m.level==='engineer'?'⚙️ PROFESSIONAL STRETCH':'🚀 TRANSFER CHALLENGE'}</span><p>${esc(b.stretch)}</p></div>`;}
function curriculumStrandProgress(){
  const ids=profile().path,rows={};
  for(const id of ids){const m=BY_ID[id],b=missionBlueprint(m);if(!m||!b)continue;if(!rows[b.strand])rows[b.strand]={n:0,d:0,objectives:[]};rows[b.strand].n++;if(missionDone(id))rows[b.strand].d++;rows[b.strand].objectives.push({id,title:m.title,objective:b.objective,done:missionDone(id)});}
  return rows;
}
function curriculumBlueprintHTML(){const rows=curriculumStrandProgress();return `<div class="curriculum-blueprint"><div class="section-head"><div><p class="eyebrow">OBJECTIVE-FIRST CURRICULUM</p><h2>What the path is trying to teach</h2><p>Projects are vehicles. The learning target and evidence standard are the curriculum.</p></div></div>${Object.entries(rows).map(([strand,v])=>`<div class="strand-card"><div class="strand-head"><b>${esc(strand)}</b><span>${v.d}/${v.n} evidenced</span></div><div class="mini-bar"><span style="width:${Math.round(v.d/v.n*100)}%"></span></div>${v.objectives.map(o=>`<div class="objective-row ${o.done?'done':''}"><span>${o.done?'✅':'○'}</span><div><b>${esc(o.title)}</b><small>${esc(o.objective)}</small></div></div>`).join('')}</div>`).join('')}</div>`;}
function parallelStudioAlternative(blocked){
  if(!blocked)return null;const p=profile(),bi=p.path.indexOf(blocked.id),progress=pathProgress();
  const blockedSkills=new Set(missionSkills(blocked));
  const candidates=p.path.map((id,i)=>({m:BY_ID[id],i})).filter(x=>x.m&&x.i>bi&&!missionDone(x.m.id)&&gearAvailable(x.m)&&x.m.quality==='studio'&&missionPrereqs(x.m).every(q=>q.ok));
  const filtered=candidates.filter(x=>!['x1','i1'].includes(x.m.id)||progress>=.6);
  for(const x of filtered){const skills=missionSkills(x.m),overlap=skills.filter(s=>blockedSkills.has(s)).length,weak=skills.filter(s=>evidenceProfile(s).rank<2).length,distance=x.i-bi;x.score=overlap*4+weak*1.5-distance*.35;}
  return filtered.sort((a,b)=>b.score-a.score)[0]?.m||null;
}
function weeklyLearningPlan(){
  const p=profile(),plan=learningPlan(),due=dueReviews(),rem=topRemediation(),next=plan.mission||strictNextMission(),b=missionBlueprint(next),items=[];
  if(due.length)items.push({title:'Session 1 • Retrieve',mins:p.track==='Explorer'?10:15,child:`Closed-book review: ${due[0].title}`,adult:p.track==='Explorer'?'Listen to the explanation; do not reopen the old solution first.':'Ask for the changed-context reasoning before discussing correctness.',evidence:'Verified delayed retrieval'});
  else if(rem)items.push({title:'Session 1 • Repair',mins:p.track==='Explorer'?10:15,child:`5-minute refresher + tiny transfer on ${rem[0]}`,adult:'Use the coach prompt only; do not reteach the whole mission.',evidence:'Verified remediation check'});
  else items.push({title:'Session 1 • Warm retrieval',mins:p.track==='Explorer'?8:12,child:'Explain one recent idea without opening the previous solution.',adult:'Ask “What stays the same if the story/tool changes?”',evidence:'Oral/drawn retrieval note if useful'});
  if(next)items.push({title:`Session 2 • ${next.title}`,mins:next.mins,child:b?.objective||next.goal,adult:p.track==='Explorer'?(b?.adult||next.coach):'Require the success criterion before testing; accept evidence, not “it works.”',evidence:b?.evidence||next.check});
  const weak=CORE_SKILLS.map(s=>({s,e:evidenceProfile(s)})).sort((a,b)=>a.e.rank-b.e.rank||a.e.points-b.e.points)[0]?.s||'Transfer';
  items.push({title:'Session 3 • Transfer / portfolio',mins:p.track==='Explorer'?10:20,child:b?.stretch||`Use ${weak} in a changed context and explain what stayed the same.`,adult:p.track==='Explorer'?'Ask one transfer question, then let the child demonstrate.':'Add one measurable constraint or failure case and record the engineering decision.',evidence:'Changed-context explanation + one portfolio artifact'});
  return items.slice(0,3);
}
function weeklyLearningPlanHTML(){return `<div class="weekly-plan">${weeklyLearningPlan().map((x,i)=>`<article><span class="tag">${esc(x.title)} • ~${x.mins} MIN</span><p><b>Learner:</b> ${esc(x.child)}</p><p><b>Adult role:</b> ${esc(x.adult)}</p><p><b>Evidence:</b> ${esc(x.evidence)}</p></article>`).join('')}</div>`;}

function toolFlow(m){const t=m.tool.toLowerCase(),c=m.concept.toLowerCase();if(t.includes('dash'))return['🤖 Command','➡️ Motion','👀 Sense','🧠 Decide','🎯 Act'];if(t.includes('wedo'))return['🧱 Build','⚙️ Motor','🔄 Mechanism','👀 Observe','⬆️ Improve'];if(t.includes('scratch'))return['🟩 Event','📦 State','🧠 Logic','🐱 Sprite','🎮 Result'];if(t.includes('micro:bit'))return['👋 Input','🔴 Device','🧠 Logic','✨ Output'];if(t.includes('spike'))return['⚙️ Build','📏 Measure','💻 Code','🧪 Test','🔁 Iterate'];if(t.includes('python'))return['⌨️ Input','📦 Data','🐍 Logic','🧰 Function','📤 Output'];if(t.includes('arduino'))return['🔘 Input','🔌 Board','💻 Code','💡 Output'];if(t.includes('3d'))return['📏 Measure','🧊 CAD','🖨️ Print','🧪 Fit','🔁 Revise'];if(t.includes('html'))return['🧱 HTML','🎨 CSS','⚡ JS','♿ Test','🌐 Publish'];if(c.includes('data'))return['❓ Question','📊 Collect','🔍 Check','📈 Analyse','💡 Conclude'];return['🎯 Goal','🛠 Build','🧪 Test','📊 Evidence','⬆️ Improve'];}
function systemMap(m){const n=toolFlow(m);return`<div class="system-map">${n.map((x,i)=>`${i?'<span class="system-arrow">→</span>':''}<span class="system-node">${x}</span>`).join('')}</div>`;}
function hardConstraint(m){const s=primarySkill(m);const map={'Sensors':'Test at least one false positive and one false negative.','Measurement':'Collect at least five baseline trials and report variation, not only the mean.','Calibration':'Compare before/after using identical test conditions.','Debugging':'Keep a hypothesis log: suspected cause → test → result.','Functions':'Remove one hard-coded value by designing a meaningful parameter.','Data':'State one limitation that could change the conclusion.','State':'Create and test one invalid or impossible transition.','Decomposition':'Define interfaces between subsystems before integration.','Optimisation':'Define one metric and one trade-off before changing the design.','Transfer':'Rebuild the core idea with a different tool or altered constraint.'};return map[s]||'Add a measurable constraint and prove improvement with repeated tests.';}
function renderPrereqs(m){const p=missionPrereqs(m);if(!p.length)return'';return`<div class="lesson-card"><h3>🧱 Prerequisite check</h3><p class="muted">These are curated mission prerequisites, not every theoretical dependency in the skill graph. Green means Developing or stronger evidence; yellow means refresh if needed.</p><div class="prereq-row">${p.map(x=>`<span class="pill ${x.ok?'good':'warn'}">${x.ok?'✓':'↻'} ${esc(x.skill)} • ${esc(x.status)}</span>`).join('')}</div></div>`;}
function hintsHTML(m){return`<div class="lesson-card"><h3>💡 Hint ladder</h3><p class="muted">Reveal one only when you need it. Using a hint is useful evidence, not failure.</p>${m.hints.map((h,i)=>`<button class="ghost hint-btn" data-action="reveal-hint" data-index="${i}" data-id="${m.id}">Hint ${i+1}</button><div class="hint" id="hint-${i}">${esc(h)}</div>`).join('')}</div>`;}
function conceptTeaching(m){const p=conceptProfile(m),skill=primarySkill(m),a=instructionAdaptation(m),core=`<span class="tag">BIG IDEA • ${esc(skill)}</span><h2>🧠 Why this matters</h2><p>${esc(p.why)}</p><div class="system-map"><span class="system-node">${esc(p.model)}</span></div><div class="warning-box" style="margin-top:12px"><b>Common trap:</b> ${esc(p.trap)}</div>`;if(a.mode==='challenge-first')return`${a.banner}<details class="lesson-card optional-refresher"><summary><b>Open ${esc(skill)} refresher only if needed</b></summary>${core}</details>`;return`${a.banner}<div class="lesson-card">${core}</div>`;}
function artifactsForMission(id){return learner().artifacts.filter(a=>a.missionId===id);}
function currentAttemptStarted(id){return missionRecord(id).started?.[0]||null;}
function currentArtifact(id){const started=currentAttemptStarted(id);return artifactsForMission(id).find(a=>!started||new Date(a.date)>=new Date(started))||null;}
function currentAttemptRescues(id){const started=currentAttemptStarted(id);if(!started)return[];return (learner().rescueLogs||[]).filter(x=>x.missionId===id&&new Date(x.date)>=new Date(started));}
function currentAttemptBlockingRescues(id){return currentAttemptRescues(id).filter(rescueIsBlocking);}
function currentAttemptSetupAssists(id){return currentAttemptRescues(id).filter(x=>!rescueIsBlocking(x));}
function currentAttemptDebugLogs(id){const started=currentAttemptStarted(id);if(!started)return[];return (learner().debugLogs||[]).filter(x=>x.missionId===id&&new Date(x.date)>=new Date(started));}
function latestAttemptPacket(id){return (learner().attemptPackets||[]).find(x=>!id||x.missionId===id)||null;}
function criterionEvidenceState(m,mode){
  const b=missionBlueprint(m);if(!b)return{items:[],complete:true};
  const items=b.success.map((criterion,i)=>{if(mode==='explorer'){const el=document.getElementById(`criterion-check-${i}`);return{criterion,met:!!el?.checked,evidence:el?.checked?'learner confirmed/showed criterion':''};}const evidence=(document.getElementById(`criterion-evidence-${i}`)?.value||'').trim();return{criterion,met:evidence.length>=12,evidence};});
  return{items,complete:items.every(x=>x.met)};
}
function explorerProcessState(m){
  const prediction=(document.getElementById('predictionText')?.value||'').trim(),predictionOral=!!document.getElementById('predictionOral')?.checked;
  const observation=(document.getElementById('observationText')?.value||'').trim(),observationOral=!!document.getElementById('observationOral')?.checked;
  const explanation=(document.getElementById('explanationText')?.value||'').trim(),explanationOral=!!document.getElementById('explainDone')?.checked;
  return{handoffDone:!!document.getElementById('handoffDone')?.checked,prediction,predictionOral,testBeforeChange:!!document.getElementById('testDone')?.checked,observation,observationOral,explanation,explanationOral,quickCorrect:!!ui.currentAttemptQuickCorrect,criteria:criterionEvidenceState(m,'explorer')};
}
function engineerProcessState(m){
  return{hypothesis:(document.getElementById('predictionText')?.value||'').trim(),criteria:criterionEvidenceState(m,'engineer')};
}
function attemptSupportBand(m,rating){
  const hints=ui.currentAttemptHints.size,blocking=currentAttemptBlockingRescues(m.id).length,setup=currentAttemptSetupAssists(m.id).length;
  if(blocking)return'adult-assisted';
  if(hints>1)return'heavily-scaffolded';
  if(hints===1)return'lightly-scaffolded';
  if(Number(rating)>=3&&setup)return'independent-with-setup';
  return Number(rating)>=3?'independent':'unassisted-not-yet-secure';
}
function saveAttemptPacket(m,rating){
  if(!m)return null;const b=missionBlueprint(m),mode=state.activeLearner==='faye'&&m.level==='explorer'?'explorer':'engineer',process=mode==='explorer'?explorerProcessState(m):engineerProcessState(m),test=currentTestLog(m.id),review=currentDesignReview(m.id),art=currentArtifact(m.id),rescues=currentAttemptRescues(m.id),debug=currentAttemptDebugLogs(m.id);
  const blockingRescues=rescues.filter(rescueIsBlocking),setupAssists=rescues.filter(x=>!rescueIsBlocking(x));const packet={missionId:m.id,title:m.title,tool:m.tool,mode,objective:b?.objective||m.goal,started:currentAttemptStarted(m.id),completedAt:nowISO(),rating:Number(rating),support:attemptSupportBand(m,rating),hints:ui.currentAttemptHints.size,adultRescues:rescues.length,blockingRescues:blockingRescues.length,setupAssists:setupAssists.length,rescueReasons:rescues.map(x=>x.reason||'legacy'),selfDiagnosisUses:debug.length,entryProbe:currentEntryProbe(m.id)||undefined,learningSignal:currentLearningSignal(m.id)||undefined,process,transfer:transferResponse()||undefined,transferOral:transferOral()||undefined,artifact:art?.note||undefined,testSummary:test?testLogSummary(test):undefined,designReview:review?.total??undefined};
  if(!learner().attemptPackets)learner().attemptPackets=[];learner().attemptPackets.unshift(packet);learner().attemptPackets=learner().attemptPackets.slice(0,150);return packet;
}
function adaptiveSupportHTML(m){
  const prev=latestAttemptPacket(m.id);if(!prev)return'';
  if(state.activeLearner==='faye'&&m.level==='explorer'){
    const blocking=prev.blockingRescues??prev.adultRescues??0;
    if(blocking>0)return`<div class="adaptive-support bridge"><b>🪜 Independence retry</b><p>Last attempt needed help with the learning itself. This time: use the symptom checker first, then at most one hint. Setup/safety help is still allowed; the goal is to finish without a learning rescue.</p></div>`;
    if(prev.hints>1)return`<div class="adaptive-support"><b>🌱 Fade one scaffold</b><p>Last attempt used ${prev.hints} hints. Try the same mission with the symptom checker first and no more than one hint before asking for learning help.</p></div>`;
    if(prev.rating>=3)return`<div class="adaptive-support challenge"><b>🚀 Challenge mode</b><p>You previously showed independent evidence. Keep hints closed unless truly needed and try the transfer challenge under a changed condition.</p></div>`;
  }
  if(state.activeLearner==='philip'&&prev.rating>=3)return`<div class="adaptive-support challenge"><b>⚙️ Evidence escalation</b><p>Previous evidence was Secure/Transfer. This attempt should add a tougher constraint, failure case, or measurement—not simply repeat the same build.</p></div>`;
  return'';
}
function criteriaEvidenceHTML(m,mode){
  const b=missionBlueprint(m);if(!b)return'';
  if(mode==='explorer')return`<div class="criteria-evidence explorer-criteria"><h3>🔎 Show all three things</h3><p class="muted">Tick only what you can actually show. If a grown-up had to solve it, choose a supported mastery rating and retry later.</p>${b.success.map((x,i)=>`<label><input type="checkbox" id="criterion-check-${i}"> <span>${esc(x)}</span></label>`).join('')}</div>`;
  return`<div class="criteria-evidence engineer-criteria"><h3>🧾 Acceptance-criteria evidence — required for Secure/Transfer</h3><p>For each acceptance criterion, point to the measurement, test, code behaviour, or observation that proves it. “It works” is not evidence.</p>${b.success.map((x,i)=>`<label><b>${i+1}. ${esc(x)}</b><textarea id="criterion-evidence-${i}" placeholder="Evidence for this criterion…"></textarea></label>`).join('')}</div>`;
}
function troubleshootingHTML(m,mode='explorer'){
  const rows=DEEP[m.id]?.debug||[];if(!rows.length)return'';
  return`<div class="troubleshooter"><div class="troubleshooter-head"><div><span class="tag">${mode==='explorer'?'🩺 STUCK? PICK WHAT HAPPENED':'🧭 FAULT-ISOLATION CHECK'}</span><h3>${mode==='explorer'?'Do one diagnostic test before asking for the answer.':'Localise the fault before changing the design.'}</h3></div></div><div class="symptom-buttons">${rows.map((x,i)=>`<button class="ghost" data-action="troubleshoot-choice" data-id="${m.id}" data-index="${i}">${esc(x[0])}</button>`).join('')}</div><div class="troubleshoot-result" id="troubleshoot-result"></div></div>`;
}
function chooseTroubleshoot(id,index){
  const m=BY_ID[id],row=DEEP[id]?.debug?.[Number(index)];if(!m||!row)return;const host=document.getElementById('troubleshoot-result');if(host)host.innerHTML=`<div class="diagnostic-next"><b>Likely idea to inspect:</b> ${esc(row[1])}<br><b>Best next test:</b> ${esc(row[2])}<p class="muted">Run that test before changing several things at once.</p></div>`;
  if(!learner().debugLogs)learner().debugLogs=[];const started=currentAttemptStarted(id),already=(learner().debugLogs||[]).some(x=>x.missionId===id&&x.index===Number(index)&&(!started||new Date(x.date)>=new Date(started)));if(!already){learner().debugLogs.unshift({missionId:id,title:m.title,index:Number(index),symptom:row[0],idea:row[1],nextTest:row[2],date:nowISO()});learner().debugLogs=learner().debugLogs.slice(0,150);save();captureMissionDraft(true);}
}
function latestDesignReview(id){return (learner().designReviews||[]).find(r=>r.missionId===id)||null;}
function currentDesignReview(id){const started=currentAttemptStarted(id);return (learner().designReviews||[]).find(r=>r.missionId===id&&(!started||new Date(r.date)>=new Date(started)))||null;}
function transferResponse(){return (document.getElementById('transferText')?.value||'').trim();}
function transferOral(){return !!document.getElementById('transferOral')?.checked;}

function explorerStepNames(){return['Ready','Predict','Test','Notice','Explain','Boss check'];}
function explorerStepperHTML(){return `<div class="explorer-stepper">${explorerStepNames().map((x,i)=>`<span data-step-dot="${i}">${i+1} ${x}</span>`).join('')}<button class="ghost step-audio" data-action="read-step">🔊 Read step</button></div>`;}
function applyExplorerStep(step=ui.explorerStep){
  ui.explorerStep=Math.max(0,Math.min(5,Number(step)||0));
  document.querySelectorAll('.explorer-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===ui.explorerStep));
  document.querySelectorAll('[data-step-dot]').forEach(el=>{const on=Number(el.dataset.stepDot)===ui.explorerStep;el.classList.toggle('active',on);el.setAttribute('aria-current',on?'step':'false');});
  window.scrollTo({top:0,behavior:(state.prefs.motion||'on')==='off'?'auto':'smooth'});
  const first=document.querySelector('.explorer-step.active .one-job strong,.explorer-step.active h2,.explorer-step.active h3');
  if(first){first.setAttribute('tabindex','-1');first.focus({preventScroll:true});}
  const live=document.getElementById('routeStatus');
  if(live)live.textContent=`Step ${ui.explorerStep+1} of 6: ${explorerStepNames()[ui.explorerStep]}`;
}
function explorerNext(delta=1){
  if(delta>0){
    if(ui.explorerStep===0){const m=BY_ID[ui.currentMissionId];if(m?.quality==='studio'&&!currentEntryProbe(m.id)){toast('Do the tiny starting-point check first. “Not sure yet” is a valid answer.');return;}}
    if(ui.explorerStep===1){const typed=(document.getElementById('predictionText')?.value||'').trim(),oral=!!document.getElementById('predictionOral')?.checked;if(typed.length<3&&!oral){toast('Make a prediction first — type it, say it aloud, or draw it and tick the box.');return;}}
    if(ui.explorerStep===2&&!document.getElementById('testDone')?.checked){toast('Tick the box after you have tested once without changing anything.');return;}
    if(ui.explorerStep===3){const typed=(document.getElementById('observationText')?.value||'').trim(),oral=!!document.getElementById('observationOral')?.checked;if(typed.length<3&&!oral){toast('Say or record what you noticed before moving on.');return;}}
    if(ui.explorerStep===4){const typed=(document.getElementById('explanationText')?.value||'').trim(),oral=!!document.getElementById('explainDone')?.checked;if(typed.length<5&&!oral){toast('Explain why your change follows from what you noticed — type it, say it aloud, or draw it and tick the box.');return;}}
  }
  applyExplorerStep(ui.explorerStep+delta);captureMissionDraft(true);
}
/*
  The old version read the entire active step, button labels included, with no way to stop it
  short of navigating away. It now reads only the instructional text, and the same button stops it.
*/
function readableTextIn(root){
  if(!root)return'';
  const skip=new Set(['BUTTON','INPUT','TEXTAREA','SELECT','SUMMARY','NAV']);
  const walk=n=>{
    if(n.nodeType===3)return n.textContent;
    if(n.nodeType!==1)return'';
    if(skip.has(n.tagName))return'';
    if(n.classList&&(n.classList.contains('explorer-nav')||n.classList.contains('explorer-help-host')||n.classList.contains('tag')))return'';
    if(n.hidden||n.getAttribute&&n.getAttribute('aria-hidden')==='true')return'';
    return [...n.childNodes].map(walk).join(' ');
  };
  return walk(root).replace(/\s+/g,' ').trim();
}
function speaking(){return 'speechSynthesis'in window&&(speechSynthesis.speaking||speechSynthesis.pending);}
function stopReading(){if('speechSynthesis'in window)speechSynthesis.cancel();document.querySelectorAll('[data-action="read-step"],[data-action="read-mission"]').forEach(b=>{b.classList.remove('reading');b.textContent=b.dataset.idleLabel||b.textContent;});}
function speak(text,rate){
  if(!('speechSynthesis'in window)){toast('Read-aloud is not available in this browser.');return false;}
  speechSynthesis.cancel();
  /* Long text is split so a stop feels immediate and long passages do not get truncated. */
  const chunks=String(text).match(/[^.!?]+[.!?]*/g)||[String(text)];
  chunks.forEach(c=>{const u=new SpeechSynthesisUtterance(c.trim());u.rate=rate;speechSynthesis.speak(u);});
  return true;
}
function readCurrentStep(btn){
  const b=btn||document.querySelector('[data-action="read-step"]');
  if(speaking()){stopReading();return;}
  const el=document.querySelector('.explorer-step.active');if(!el)return;
  const text=readableTextIn(el);
  if(!text){toast('Nothing to read on this step.');return;}
  if(!speak(text,.88))return;
  if(b){b.dataset.idleLabel=b.dataset.idleLabel||b.textContent;b.classList.add('reading');b.textContent='\u23f9 Stop';}
  const poll=setInterval(()=>{if(!speaking()){clearInterval(poll);stopReading();}},400);
}
/* One concrete, doable action for the exact step the learner is stuck on. */
const STEP_MICRO_HELP={
  0:['Point at each thing you need and say its job out loud.','If something is missing or will not turn on, that is the first problem \u2014 and it is a setup problem, not a you problem.'],
  1:['Do not try to be right. Point at where you think it will end up, or draw it.','A wrong prediction is just as useful as a right one. It is the comparing that teaches you, not the guessing.'],
  2:['Run it once and only watch. Hands off the code.','You are collecting evidence right now, not fixing. Fixing comes after you know what actually happened.'],
  3:['Say one sentence out loud: "I expected ___ but it actually ___."','If you cannot finish that sentence, run it one more time and watch only the ending.'],
  4:['Finish this sentence: "I changed ___ because I noticed ___."','If you have not changed anything yet, that is fine \u2014 say what you would change and why.'],
  5:['Read the three tick boxes again and tick only what you could show someone right now.','Leaving one unticked is an honest answer, not a fail.']
};
function workedExampleHTML(m){
  const steps=DEEP[m.id]?.worked||[];
  const skill=primarySkill(m),c=CONCEPTS[skill]||CONCEPTS.Prediction;
  const body=steps.length
    ? `<ol class="worked-steps">${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="muted">This is how the thinking usually goes. Your version does not have to look the same.</p>`
    : `<div class="model">${esc(c.model)}</div><p><b>Try this:</b> ${esc(c.remedy)}</p>`;
  return `<details class="worked-peek"><summary>\ud83d\udc40 Show me how this kind of problem is usually solved</summary>${body}</details>`;
}
function explorerHelp(){
  const host=document.querySelector('.explorer-step.active .explorer-help-host');if(!host)return;
  const m=BY_ID[ui.currentMissionId],step=Number(ui.explorerStep||0);
  const micro=STEP_MICRO_HELP[step]||STEP_MICRO_HELP[0];
  const hasHints=!!(m&&(m.hints||[]).length);
  host.innerHTML=`<div class="explorer-help-panel">
    <h3>\ud83e\udde0 Let\u2019s get you moving again</h3>
    <div class="micro-help"><b>Right now, just do this:</b><p>${esc(micro[0])}</p><small>${esc(micro[1])}</small></div>
    <ol class="help-ladder">
      <li>Press <b>\ud83d\udd0a Read step</b> at the top and listen to it once.</li>
      <li>Tap any word you do not know in the word list.</li>
      ${hasHints?'<li>Open <b>Hint 1</b> \u2014 one hint still counts as working independently.</li>':''}
      <li>Open the peek below if you want to see the shape of the thinking.</li>
    </ol>
    ${m?workedExampleHTML(m):''}
    <p class="help-foot">Still stuck after all that? That is normal, and it is worth telling us <b>what kind</b> of help you need \u2014 help with plugging things in is completely different from help with the thinking.</p>
    <button class="ghost" data-action="adult-rescue">I still need a grown-up</button>
  </div>`;
}
function showAdultRescueReasons(){const host=document.querySelector('.explorer-step.active .explorer-help-host');if(host)host.innerHTML=rescueReasonPickerHTML();}
function recordAdultRescue(reason='concept'){
  const m=BY_ID[ui.currentMissionId],type=RESCUE_TYPES[reason]||RESCUE_TYPES.concept;if(!m)return;
  const log={missionId:m.id,title:m.title,step:ui.explorerStep,stepName:explorerStepNames()[ui.explorerStep],reason,reasonLabel:type.label,blocking:type.blocking,date:nowISO()};
  learner().rescueLogs.unshift(log);learner().rescueLogs=learner().rescueLogs.slice(0,100);
  const same=learner().rescueLogs.filter(x=>x.missionId===m.id&&x.step===ui.explorerStep&&x.reason===reason).length;
  if(same>=2)createDefect(type.category,type.severity,`Repeated ${type.label.toLowerCase()} at ${log.stepName}`,`${m.title}: this help type was requested ${same} times at the same step.`,'in-lesson rescue taxonomy');
  save();captureMissionDraft(true);
  const host=document.querySelector('.explorer-step.active .explorer-help-host');
  if(host)host.innerHTML=`<div class="explorer-rescue ${type.blocking?'learning-rescue':'setup-rescue'}"><b>${type.blocking?'👩‍🏫 Small learning rescue logged':'✅ Setup / safety help is allowed'}</b><p>${esc(type.child)}</p><p class="muted">${type.blocking?'This attempt can still record useful supported learning, but Independent mastery will need a later attempt without learning rescue.':'This does not reduce Independent mastery because the adult is not doing the learner’s reasoning.'}</p></div>`;
}
function currentTestLog(id){const started=currentAttemptStarted(id);return (learner().testLogs||[]).find(x=>x.missionId===id&&(!started||new Date(x.date)>=new Date(started)))||null;}
function engineeringTestLogHTML(m){return `<div class="engineer-testlog"><h3>📊 Structured test evidence — required for Secure/Transfer</h3><p>Define success first, then record at least three trials. Finish by making a claim, naming a limitation, and stating the decision the evidence supports.</p><label><b>Success criterion</b><input id="test-success" class="big-input" style="min-height:auto" placeholder="Example: 4 of 5 runs finish within ±3 cm"></label><div class="testlog-grid" style="margin-top:12px"><div class="head">Condition / change</div><div class="head">Measured result / observation</div><div class="head">Pass?</div><div class="head">Edge / abnormal?</div>${[1,2,3,4].map(i=>`<input type="text" id="test-cond-${i}" placeholder="Trial ${i} condition"><input type="text" id="test-result-${i}" placeholder="Result / measurement"><label><input type="checkbox" id="test-pass-${i}"> pass</label><label><input type="checkbox" id="test-edge-${i}"> edge</label>`).join('')}</div><div class="testlog-reflection"><label>Claim from the evidence<textarea id="test-claim" placeholder="The evidence shows…"></textarea></label><label>Limitation / uncertainty<textarea id="test-limit" placeholder="This evidence does not prove… / One uncertainty is…"></textarea></label><label>What result would weaken or overturn your claim?<textarea id="test-falsify" placeholder="I would change my conclusion if…"></textarea></label><label>Engineering decision<textarea id="test-decision" placeholder="Because of these results, I will…"></textarea></label></div><button class="secondary" style="margin-top:12px" data-action="save-test-log" data-id="${m.id}">Save test evidence</button></div>`;}
function testLogQuality(log){if(!log)return{score:0,max:6,checks:[]};const results=log.trials.filter(t=>String(t.result||'').trim()),distinct=new Set(results.map(t=>String(t.result).trim().toLowerCase())).size,conditions=new Set(log.trials.map(t=>String(t.condition||'').trim().toLowerCase()).filter(Boolean)).size;const checks=[['clear criterion',String(log.criterion||'').trim().length>=10],['≥3 results',results.length>=3],['non-duplicated evidence',distinct>=2],['test conditions recorded',conditions>=2||results.length>=3],['claim + decision',String(log.claim||'').trim().length>=12&&String(log.decision||'').trim().length>=12],['limitation named',String(log.limitation||'').trim().length>=10]];return{score:checks.filter(x=>x[1]).length,max:checks.length,checks};}
function saveTestLog(id){const m=BY_ID[id],criterion=(document.getElementById('test-success')?.value||'').trim(),claim=(document.getElementById('test-claim')?.value||'').trim(),limitation=(document.getElementById('test-limit')?.value||'').trim(),falsifier=(document.getElementById('test-falsify')?.value||'').trim(),decision=(document.getElementById('test-decision')?.value||'').trim(),trials=[];for(let i=1;i<=4;i++){const condition=(document.getElementById(`test-cond-${i}`)?.value||'').trim(),result=(document.getElementById(`test-result-${i}`)?.value||'').trim();if(condition||result)trials.push({condition,result,pass:!!document.getElementById(`test-pass-${i}`)?.checked,edge:!!document.getElementById(`test-edge-${i}`)?.checked});}if(criterion.length<8||trials.filter(t=>t.result).length<3){toast('Add a clear success criterion and at least 3 trial results.');return}const log={missionId:id,title:m?.title||id,tool:m?.tool||'',criterion,trials,claim,limitation,falsifier,decision,date:nowISO()};log.quality=testLogQuality(log);learner().testLogs.unshift(log);learner().testLogs=learner().testLogs.slice(0,100);save();toast(`Structured evidence saved • quality ${log.quality.score}/${log.quality.max}`);}
function testLogSummary(log){if(!log)return'';const passed=log.trials.filter(t=>t.pass).length,edge=log.trials.filter(t=>t.edge).length,q=log.quality||testLogQuality(log);return `${log.trials.length} trials • ${passed} pass • ${edge} edge/abnormal • evidence quality ${q.score}/${q.max}`}

function evidenceStrengthFor(id){const rec=missionRecord(id),art=currentArtifact(id),review=currentDesignReview(id),test=currentTestLog(id);return{prediction:!!currentAttemptStarted(id),test:!!test,artifact:!!art,review:!!review,transfer:(rec.ratings||[]).some(x=>x.rating===4)};}

function evidenceGateHTML(m,mode){
  if(mode==='explorer')return `<div class="evidence-gate"><b>🔐 What the mastery buttons mean</b><ul><li><b>3 • Independent:</b> complete the Predict → Test → Notice → Explain process, pass the concept check, show all three success criteria, need no adult learning rescue (setup/safety help is allowed), and use at most one hint.</li><li><b>4 • Transfer:</b> all Independent evidence, no hints in this attempt, plus a genuinely new example/context.</li></ul><p class="gate-note">Setup/safety help does not reduce mastery. If adult help was needed for wording, navigation, debugging or the solution—or several hints were needed—record supported learning honestly and retry later.</p></div>`;
  return `<div class="evidence-gate"><b>🔐 Engineering evidence gate</b><ul><li><b>3 • Secure:</b> pre-test hypothesis + evidence for all three acceptance criteria + structured test log (≥3 trials, quality ≥4/6) + evidence note + design review ≥6/12.</li><li><b>4 • Transfer:</b> all Secure evidence + test quality ≥5/6 + challenge contract + ≥1 edge/abnormal trial + a falsification condition + design review ≥9/12 + changed-context explanation.</li></ul></div>`;
}
function transferBoxHTML(mode){return `<div class="transfer-box"><b>🔄 Changed-context evidence</b><p>${mode==='explorer'?'Give one different example that uses the same big idea. You may type it or explain it out loud.':'Describe how the same concept would change under a different tool, constraint, failure mode or context.'}</p><textarea id="transferText" placeholder="${mode==='explorer'?'Example: I could use IF/THEN when…':'Changed context → what stays the same → what must change…'}"></textarea>${mode==='explorer'?'<label><input id="transferOral" type="checkbox"> I explained a new example out loud.</label>':''}</div>`;}
function validateMastery(m,r){
  if(r<3)return{ok:true};const rec=missionRecord(m.id);if(m.quality==='studio'&&!currentEntryProbe(m.id))return{ok:false,msg:'Do the short starting-point check before recording Secure/Independent mastery. It is not graded; it lets InventorLab adapt the teaching and measure a within-mission learning signal.'};
  if(!ui.currentAttemptQuickCorrect)return{ok:false,msg:'Pass the after-practice Boss concept check in this attempt before recording Secure/Independent mastery.'};
  if(state.activeLearner==='faye'&&m.level==='explorer'){
    const ps=explorerProcessState(m),rescues=currentAttemptBlockingRescues(m.id).length,setupAssists=currentAttemptSetupAssists(m.id).length,hints=ui.currentAttemptHints.size;
    if((ps.prediction.length<3&&!ps.predictionOral)||!ps.testBeforeChange||(ps.observation.length<3&&!ps.observationOral)||(ps.explanation.length<5&&!ps.explanationOral))return{ok:false,msg:'Finish the Predict → Test → Notice → Explain process before recording independent mastery. Speaking or drawing is fine.'};
    if(!ps.quickCorrect)return{ok:false,msg:'Do the 30-second understanding check correctly in this attempt before recording independent mastery.'};
    if(!ps.criteria.complete)return{ok:false,msg:'At the Boss Check, confirm all three success criteria you can actually show before recording Independent/Transfer.'};
    if(rescues>0)return{ok:false,msg:'This attempt included grown-up help with language, navigation, debugging or the solution. Record a supported rating (1–2), then retry later without learning rescue to demonstrate Independent mastery.'};
    if(hints>1)return{ok:false,msg:'This attempt used more than one hint. Record supported learning, then retry with at most one hint for Independent mastery.'};
    if(r===4&&hints>0)return{ok:false,msg:'Transfer is reserved for a changed-context demonstration without hints in this attempt. Retry the transfer challenge independently.'};
    if(r===4&&!transferOral()&&transferResponse().length<12)return{ok:false,msg:'For Transfer, give a new example in the changed-context box or tick that you explained one aloud.'};
    return{ok:true};
  }
  const process=engineerProcessState(m),b=missionBlueprint(m),artifact=currentArtifact(m.id),review=currentDesignReview(m.id),test=currentTestLog(m.id),contract=rec.challengeContractAt&&new Date(rec.challengeContractAt)>=new Date(currentAttemptStarted(m.id)||0)?rec.challengeContract:null;
  if(process.hypothesis.length<20)return{ok:false,msg:'Write a meaningful pre-test hypothesis / predicted failure mode before recording Secure/Transfer mastery.'};
  if(b&&!process.criteria.complete)return{ok:false,msg:'Add specific evidence for all three acceptance criteria before recording Secure/Transfer mastery.'};
  if(!test||test.trials.filter(t=>t.result).length<3)return{ok:false,msg:'Save a success criterion and at least 3 structured test trials before recording Secure/Transfer mastery.'};const tq=test.quality||testLogQuality(test);if(tq.score<4)return{ok:false,msg:`Strengthen the test log before Secure mastery: evidence quality is ${tq.score}/${tq.max}. Add a clearer claim, limitation, decision, or more distinct trial evidence.`};
  if(!artifact)return{ok:false,msg:'Save an engineering evidence note before recording Secure/Transfer mastery.'};
  if(!review||review.total<6)return{ok:false,msg:'Save an Engineering Design Review of at least 6/12 before recording Secure mastery.'};
  if(r===4){if(tq.score<5)return{ok:false,msg:`Transfer needs stronger engineering evidence quality (at least 5/${tq.max}).`};if(!contract)return{ok:false,msg:'Commit a challenge contract before recording Transfer.'};if(!test.trials.some(t=>t.edge))return{ok:false,msg:'Transfer requires at least one edge, abnormal, failure, or changed-condition trial in the structured test log.'};if(String(test.falsifier||'').trim().length<12)return{ok:false,msg:'Transfer requires a falsification condition: state what result would weaken or overturn your claim.'};if(review.total<9)return{ok:false,msg:'Transfer requires a design review of at least 9/12.'};if(transferResponse().length<20)return{ok:false,msg:'Describe the changed context and adaptation before recording Transfer.'};}
  return{ok:true};
}
function calibratePlacementAfterMission(m,r){const d=learner().diagnostics[0];if(!d||d.confirmed!==false||m.id!==d.startId)return;const path=profile().path,idx=path.indexOf(d.startId);if(r<=2&&idx>0){const old=d.startId,newStart=path[idx-1];d.confirmed=true;d.calibration='stepped-back';d.calibrationDate=nowISO();d.originalStart=old;d.startId=newStart;learner().startId=newStart;toast(`Placement adjusted back to ${BY_ID[newStart].title}.`);}else{d.confirmed=true;d.calibration='confirmed';d.calibrationDate=nowISO();}}


function chapterFor(skill){return CHAPTERS[skill]||null;}
function compactChapterHTML(skill,mode='explorer'){
  const c=chapterFor(skill);if(!c)return'';
  if(mode==='explorer')return `<details class="tiny-lesson"><summary>📘 Tiny lesson — one example and one not-example</summary><div class="tiny-analogy"><b>${esc(c.icon)} Think of it like this:</b> ${esc(c.analogy)}</div><div class="example-pair"><div class="good-example"><b>✅ Example</b><p>${esc(c.examples[0])}</p></div><div class="bad-example"><b>🚫 Not-example</b><p>${esc(c.nonexamples[0])}</p></div></div><button class="ghost" data-action="open-chapter" data-skill="${esc(skill)}">Open the full ${esc(skill)} mini-chapter →</button></details>`;
  return `<details class="theory-note"><summary>📐 Technical note — ${esc(skill)}</summary><p>${esc(c.engineer)}</p><div class="technical-box"><b>Technical model</b><p>${esc(c.technical)}</p></div><p><b>Cross-context uses:</b> ${c.transfer.map(x=>esc(x)).join(' • ')}</p><button class="ghost" data-action="open-chapter" data-skill="${esc(skill)}">Open full concept chapter →</button></details>`;
}
function conceptMapHTML(){
  const groups=[
    ['FOUNDATIONS',['Prediction','Sequencing','Pattern recognition']],
    ['CONTROL',['Loops','Conditionals','Input / output','Sensors','Events']],
    ['SOFTWARE THINKING',['Variables','State','Functions','Algorithms']],
    ['ENGINEERING',['Debugging','Decomposition','Measurement','Calibration','Optimisation']],
    ['EVIDENCE',['Data','Testing','Iteration','Transfer']]
  ];
  return `<div class="concept-map">${groups.map(([g,skills])=>`<div class="concept-column"><b>${g}</b>${skills.map(s=>{const ep=evidenceProfile(s);return`<button data-action="open-chapter" data-skill="${esc(s)}"><span>${CHAPTERS[s]?.icon||'🧠'}</span>${esc(s)}<small>${esc(ep.label)}</small></button>`}).join('')}</div>`).join('')}</div>`;
}
function renderConceptChapter(skill){
  const c=chapterFor(skill);if(!c){showPage('learn');return}
  ui.currentChapter=skill;
  const ep=evidenceProfile(skill),used=LESSONS.filter(m=>m.quality==='studio'&&missionSkills(m).includes(skill));
  document.getElementById('chapterBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">FREE CONCEPT MINI-CHAPTER</p><h1 id="chapterTitle">${esc(c.icon)} ${esc(skill)}</h1><p class="chapter-question">${esc(c.question)}</p></div><div class="button-row"><button class="ghost" data-page="learn">← Knowledge Hub</button><button class="ghost" data-action="print-page">🖨 Print / Save PDF</button></div></div>
  <div class="chapter-hero"><div><span class="tag">CURRENT EVIDENCE • ${esc(ep.label)}</span><h2>Start with the idea, not the block.</h2><p>${esc(c.explorer)}</p></div><div class="chapter-analogy"><b>${esc(c.icon)} Analogy</b><p>${esc(c.analogy)}</p></div></div>
  ${c.prereqs.length?`<div class="prereq-strip"><b>Helpful first:</b> ${c.prereqs.map(p=>`<button class="ghost" data-action="open-chapter" data-skill="${esc(p)}">${esc(p)}</button>`).join(' ')}</div>`:''}
  <div class="chapter-grid"><section class="chapter-panel"><h2>✅ Examples</h2>${c.examples.map(x=>`<div class="example-line">${esc(x)}</div>`).join('')}</section><section class="chapter-panel"><h2>🚫 Not-examples</h2>${c.nonexamples.map(x=>`<div class="nonexample-line">${esc(x)}</div>`).join('')}</section></div>
  <section class="chapter-panel chapter-try"><h2>🧪 Try it now</h2><p>${esc(c.try)}</p></section>
  <section class="chapter-panel engineer-depth"><h2>⚙️ Engineer lens</h2><p>${esc(c.engineer)}</p><div class="technical-box"><b>Technical model</b><p>${esc(c.technical)}</p></div></section>
  <section class="chapter-panel"><h2>🌉 Transfer it</h2><div class="transfer-cards">${c.transfer.map(x=>`<div>${esc(x)}</div>`).join('')}</div></section>
  <section class="chapter-panel"><h2>🧠 Three-question understanding check</h2><div class="chapter-check" data-skill="${esc(skill)}">${c.checks.map((q,qi)=>`<div class="chapter-q" data-q="${qi}"><b>${qi+1}. ${esc(q[0])}</b>${q[1].map((o,oi)=>`<button class="choice" data-action="chapter-answer" data-skill="${esc(skill)}" data-q="${qi}" data-answer="${oi}">${esc(o)}</button>`).join('')}<div class="chapter-feedback" id="chapter-feedback-${qi}"></div></div>`).join('')}</div></section>
  <section class="chapter-panel"><h2>👩‍🏫 Parent coaching</h2><ul>${c.parent.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="muted">The aim is to prompt thinking, not reveal the solution.</p></section>
  ${used.length?`<section class="chapter-panel"><h2>🛠 Studio missions using ${esc(skill)}</h2><div class="mission-links">${used.map(m=>`<button class="ghost" data-action="start-mission" data-id="${m.id}">${m.icon} ${esc(m.title)}</button>`).join('')}</div></section>`:''}`;
}
function openChapter(skill){ui.currentChapter=skill;showPage('chapter');}
function answerChapterQuestion(skill,qi,answer,btn){
  const c=chapterFor(skill),q=c?.checks?.[qi];if(!q)return;
  const block=btn.closest('.chapter-q');if(block?.dataset.answered)return;block.dataset.answered='1';block.querySelectorAll('button').forEach(b=>b.disabled=true);
  const ok=Number(answer)===Number(q[2]),f=document.getElementById(`chapter-feedback-${qi}`);if(f){f.className=`chapter-feedback feedback ${ok?'good':'bad'}`;f.textContent=ok?`✅ ${q[3]}`:`↩️ ${q[3]}`;}
  if(ok){addEvidence(skill,.25,`Free concept chapter check: ${skill}`);}else{queueRemediation(skill,`Concept chapter: ${skill}`);recordMisconception(skill,'Concept chapter check');save();}
}

function deepContentHTML(m,mode){const d=DEEP[m.id];if(!d)return'';const ladder=(d.ladder||[]);return`<details class="deep-dive"><summary>📚 Deep Dive — understand why this works</summary><div class="deep-grid"><div class="deep-panel"><h4>🧠 Big idea</h4><p>${esc(d.why)}</p></div><div class="deep-panel"><h4>🌍 Where engineers use this</h4><p>${esc(d.real)}</p></div></div><h3>👣 Worked example</h3><ol class="worked-steps">${(d.worked||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>🐞 Debug clinic</h3><table class="debug-table"><thead><tr><th>Symptom</th><th>Likely idea</th><th>Best next test</th></tr></thead><tbody>${(d.debug||[]).map(([a,b,c])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table><h3>${mode==='explorer'?'🏅 Challenge ladder':'📈 Evidence ladder'}</h3><div class="challenge-ladder">${ladder.map((x,i)=>`<div><b>${i===0?'1 • Start':i===1?'2 • Secure':'3 • Transfer'}</b><p>${esc(x)}</p></div>`).join('')}</div><div class="remember-card"><b>Remember this</b><p>${esc(d.remember)}</p></div></details>`;}
function renderLearnHub(){const concepts=Object.entries(CONCEPTS);const studio=LESSONS.filter(m=>m.quality==='studio');document.getElementById('learnBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">FREE KNOWLEDGE HUB</p><h1 id="learnTitle">Learn the ideas behind the projects</h1></div><span class="free-badge">No account required</span></div><div class="free-banner"><h2>Try InventorLab deeply before paying for anything.</h2><p>The free experience now includes curated Studio missions plus complete concept mini-chapters. Learn an idea, see examples and non-examples, try it, check understanding, then transfer it into a project.</p><button class="primary" data-page="path">Start a Studio path →</button></div><h2>Concept roadmap</h2><p class="muted">This is a learning map, not a rigid age ladder. Evidence level appears under each concept.</p>${conceptMapHTML()}<h2>Core concept mini-chapters</h2><div class="knowledge-grid">${concepts.map(([name,c])=>{const used=studio.filter(m=>missionSkills(m).includes(name)).slice(0,3),ch=chapterFor(name);return`<article class="knowledge-card"><span class="tag">${esc(name)}</span><h3>${ch?esc(ch.icon)+' ':''}${esc(name)}</h3><p>${esc(c.why)}</p><div class="model">${esc(c.model)}</div><p><b>Common trap:</b> ${esc(c.trap)}</p><p><b>5-minute fix:</b> ${esc(c.remedy)}</p>${ch?`<button class="primary" data-action="open-chapter" data-skill="${esc(name)}">Read free mini-chapter →</button>`:''}${used.length?`<p><b>Projects:</b> ${used.map(m=>`<button class="ghost deep-link" data-action="start-mission" data-id="${m.id}">${m.icon} ${esc(m.title)}</button>`).join(' ')}</p>`:''}</article>`}).join('')}</div><h2>Equipment-free virtual labs</h2><p class="muted">Try the reasoning before you own the hardware. These labs create only low-stakes evidence and never substitute for a physical Studio project.</p><div class="lab-list">${['trace','grid','sensor','calibration'].map(labCardHTML).join('')}</div><h2>Platform guides</h2>${Object.entries(PLATFORM_GUIDES).map(([name,g])=>`<article class="platform-card"><h3>${esc(name)}</h3><p>${esc(g.intro)}</p><div class="deep-grid"><div><b>Best for</b><p>${esc(g.best)}</p></div><div><b>Watch out for</b><p>${esc(g.watch)}</p></div></div><p><b>Where to go next:</b> ${esc(g.next)}</p>${LAUNCH[name]?`<p><a class="secondary launch-inline" href="${esc(LAUNCH[name].url)}" target="_blank" rel="noopener noreferrer">${esc(LAUNCH[name].label)} \u2197</a> <small class="muted">${esc(LAUNCH[name].free)}</small></p>`:''}</article>`).join('')}`;}

function parentHandoffHTML(m){
  const b=missionBlueprint(m),needs=toolNeeds(m.tool),safety=needs.map(g=>GEAR_GUIDES[g]?.safety).filter(Boolean).join(' ');
  /*
    554px of adult instructions sat open in the child's view, pushing the actual mission
    below three screens of scrolling. Collapsed for the learner, open in grown-up view.
  */
  const openAttr=(state.prefs.viewMode||'learner')==='adult'?' open':'';
  return `<details class="handoff-card"${openAttr}><summary><span class="tag">👩‍🏫 GROWN-UP → CHILD HANDOFF</span><b>Setting up? Read this first.</b></summary><div><h3>Set up the environment, not the answer.</h3><p><b>Grown-up may:</b> charge/connect equipment, open the correct app/project, make the area safe${safety?`, and check: ${esc(safety)}`:'.'}</p><p><b>Grown-up should not:</b> pre-explain the algorithm, choose numbers/blocks, or point out the solution. ${esc(b?.adult||'Use questions only if the site explicitly requests adult help.')}</p><p><b>Then hand over:</b> the learner owns Predict → Test → Notice → Explain.</p></div><label class="handoff-check"><input id="handoffDone" type="checkbox"> Setup finished — learner now controls the thinking.</label></details>`;
}
function explorerLesson(m){const p=conceptProfile(m);return`<div class="lesson-shell explorer-shell">${attemptContinuityHTML(m)}<div class="button-row"><button class="ghost" data-page="path">← My Path</button>${sessionControlHTML(m)}</div><div class="lesson-hero" style="margin-top:10px"><span class="tag">EXPLORER MISSION • ${m.mins} MIN</span><h1 id="lessonTitle">${m.icon} ${esc(m.title)}</h1><p>${esc(m.goal)}</p><div class="mission-meta"><span class="pill">${esc(m.tool)}</span><span class="pill">${esc(m.concept)}</span><span class="quality-badge ${m.quality}">${m.quality==='studio'?'★ Studio':'Extended'}</span></div></div>${explorerStepperHTML()}
<div class="explorer-step" data-step="0"><div class="child-mode-note"><b>🌟 One job at a time.</b> You only need to do what is on this screen. Press <b>I need help</b> before asking a grown-up.</div>${adaptiveSupportHTML(m)}${rescueBridgeHTML(m)}${parentHandoffHTML(m)}${visualStoryboardHTML(m)}${objectiveCardHTML(m,'explorer')}${entryProbeHTML(m)}${codeBridgeWarmupHTML(m)}${renderPrereqs(m)}${glossaryHTML(m)}${launchLinksHTML(m,'explorer')}${gearGuideHTML(m,'explorer')}<details class="lesson-card system-peek"><summary><b>👀 See how the whole system fits together</b></summary>${systemMap(m)}</details><div class="one-job"><strong>1 • Get ready</strong><p>${esc(m.setup)}</p></div><div class="one-job"><strong>Your mission</strong>${missionBrief(m)?'<span class="pill auto">challenge generated for this concept</span>':''}<p>${esc(missionChallenge(m))}</p></div>${sessionPlanHTML(m)}<div class="explorer-help-host"></div><div class="explorer-nav"><button class="ghost" data-action="explorer-help">🧠 I need help</button><button class="primary" data-action="explorer-next" data-delta="1">I’m ready →</button></div></div>
<div class="explorer-step" data-step="1">${conceptTeaching(m)}${compactChapterHTML(primarySkill(m),'explorer')}<div class="one-job"><strong>🔮 Predict before RUN</strong><p>${esc(missionPredictPrompt(m))}</p><textarea id="predictionText" class="big-input" placeholder="You can type it here, or say/draw it and tick below."></textarea><div class="process-check"><label><input id="predictionOral" type="checkbox"> I said or drew my prediction before testing.</label></div></div><div class="explorer-help-host"></div><div class="explorer-nav"><button class="ghost" data-action="explorer-prev">← Back</button><button class="ghost" data-action="explorer-help">🧠 I need help</button><button class="primary" data-action="explorer-next" data-delta="1">I made my prediction →</button></div></div>
<div class="explorer-step" data-step="2"><div class="one-job"><strong>🧪 Test once</strong><p>Run the program or test the build once. Watch carefully. <b>Do not change anything yet.</b></p><div class="process-check"><label><input id="testDone" type="checkbox"> I tested it once before changing anything.</label></div></div><div class="explorer-help-host"></div><div class="explorer-nav"><button class="ghost" data-action="explorer-prev">← Back</button><button class="ghost" data-action="explorer-help">🧠 I need help</button><button class="primary" data-action="explorer-next" data-delta="1">I tested it →</button></div></div>
<div class="explorer-step" data-step="3"><div class="one-job"><strong>👀 Notice the difference</strong><p>What happened? Was it the same as your prediction? A useful failure is evidence.</p><textarea id="observationText" class="big-input" placeholder="I noticed…"></textarea><div class="process-check"><label><input id="observationOral" type="checkbox"> I said what I noticed aloud.</label></div></div>${troubleshootingHTML(m,'explorer')}${hintsHTML(m)}<div class="explorer-help-host"></div><div class="explorer-nav"><button class="ghost" data-action="explorer-prev">← Back</button><button class="ghost" data-action="explorer-help">🧠 I need help</button><button class="primary" data-action="explorer-next" data-delta="1">I know what happened →</button></div></div>
<div class="explorer-step" data-step="4"><div class="lesson-card success"><h2>💬 Say it back</h2><p>Finish: <b>“I changed ___ because I noticed ___.”</b></p><p>Then explain <b>${esc(primarySkill(m))}</b> in your own words.</p><textarea id="explanationText" class="big-input" placeholder="I changed… because I noticed… (or say/draw it instead)"></textarea><div class="process-check"><label><input id="explainDone" type="checkbox"> I said or drew my explanation aloud instead of typing it.</label></div></div>${deepContentHTML(m,'explorer')}${transferBoxHTML('explorer')}<div class="lesson-card"><h3>📁 Optional evidence note</h3><p class="muted">Typing is optional. Speaking is fine for Explorer learning.</p><textarea id="artifactNote" class="big-input" placeholder="One useful thing I learned…"></textarea><button class="secondary" data-action="save-artifact" data-id="${m.id}">Save evidence note</button></div><div class="explorer-help-host"></div><div class="explorer-nav"><button class="ghost" data-action="explorer-prev">← Back</button><button class="ghost" data-action="explorer-help">🧠 I need help</button><button class="primary" data-action="explorer-next" data-delta="1">Boss check →</button></div></div>
<div class="explorer-step" data-step="5">${missionCheckHTML(m)}<div class="lesson-card"><h2>🏆 Boss check</h2><p>${esc(missionDoneCheck(m))}</p>${criteriaEvidenceHTML(m,'explorer')}${evidenceGateHTML(m,'explorer')}<p><b>Working once is not enough.</b> Choose the box that matches what you can really do.</p>${masteryRubric(m,'explorer')}</div><div class="lesson-card"><h3>🚀 Bonus level</h3><p>${esc(m.extend)}</p>${professionalStretchHTML(m)}</div><details class="lesson-card"><summary><b>👩‍🏫 Grown-up note</b></summary><p>${esc(m.coach)}</p><p><b>Ask:</b> ${esc(p.parent.join(' • '))}</p><p><b>Avoid:</b> ${esc(p.avoid)}</p></details><div class="explorer-nav"><button class="ghost" data-action="explorer-prev">← Back</button><button class="ghost" data-page="path">Roadmap</button></div></div></div>`;}
function engineerLesson(m){const p=conceptProfile(m);return`<div class="lesson-shell">${attemptContinuityHTML(m)}<div class="button-row"><button class="ghost" data-page="path">← My Path</button>${sessionControlHTML(m)}</div><div class="lesson-hero" style="margin-top:10px"><span class="tag">ENGINEERING BRIEF • ${esc(m.tool)}</span><h1 id="lessonTitle">${m.icon} ${esc(m.title)}</h1><p>${esc(m.goal)}</p><div class="mission-meta"><span class="pill">⏱ ${m.mins} min target</span><span class="pill">${esc(m.concept)}</span><span class="quality-badge ${m.quality}">${m.quality==='studio'?'★ Studio':'Extended'}</span></div><div class="lesson-actions"><button data-page="coach">🧠 Diagnose a blocker</button></div></div>${adaptiveSupportHTML(m)}${renderPrereqs(m)}${objectiveCardHTML(m,'engineer')}${entryProbeHTML(m)}${codeBridgeWarmupHTML(m)}${launchLinksHTML(m,'engineer')}${gearGuideHTML(m,'engineer')}<div class="lesson-card engineer"><h2>📋 Engineering brief</h2>${missionBrief(m)?'<span class="pill auto">challenge generated for this concept</span>':''}<p>${esc(missionChallenge(m))}</p>${sessionPlanHTML(m)}<h3>Resources / setup</h3><p>${esc(m.setup)}</p>${systemMap(m)}</div>${engineeringLensHTML(m)}${conceptTeaching(m)}${compactChapterHTML(primarySkill(m),'engineer')}${deepContentHTML(m,'engineer')}<div class="lesson-card stop"><h2>🔮 Pre-test hypothesis</h2><p>${esc(missionPredictPrompt(m))}</p><textarea id="predictionText" class="big-input" placeholder="Hypothesis • predicted failure mode • expected measurement…"></textarea></div><div class="lesson-card engineer"><h2>🧪 Test protocol</h2><p>Before running: define <b>what changes</b>, <b>what you measure</b>, <b>what stays controlled</b>, and <b>what counts as success</b>.</p><div class="warning-box"><b>Hard-mode constraint:</b> ${esc(hardConstraint(m))}</div>${professionalStretchHTML(m)}${challengeContractHTML(m)}</div>${troubleshootingHTML(m,'engineer')}${hintsHTML(m)}${criteriaEvidenceHTML(m,'engineer')}${engineeringTestLogHTML(m)}<div class="lesson-card"><h3>📓 Engineering evidence note — required for Secure/Transfer</h3><textarea id="artifactNote" class="big-input" placeholder="Baseline → test → evidence → change → retest. Include numbers where possible."></textarea><button class="secondary" data-action="save-artifact" data-id="${m.id}">Save evidence note</button></div>${designReviewHTML(m)}${transferBoxHTML('engineer')}${missionCheckHTML(m)}<div class="lesson-card"><h2>🏆 Design review / evidence of mastery</h2><p>${esc(missionDoneCheck(m))}</p>${evidenceGateHTML(m,'engineer')}<p>Rate the evidence, not confidence or effort.</p>${masteryRubric(m,'engineer')}</div><div class="lesson-card"><h3>🚀 Stretch constraint</h3><p>${esc(m.extend)}</p></div><details class="lesson-card"><summary><b>Coach note</b></summary><p>${esc(m.coach)}</p><p><b>Ask:</b> ${esc(p.parent.join(' • '))}</p><p><b>Avoid:</b> ${esc(p.avoid)}</p></details></div>`;}
function masteryRubric(m,mode){const labels=mode==='explorer'?[['1','I needed lots of help','Can repeat parts with help.'],['2','I needed a little help','Can finish with prompts.'],['3','I did it by myself','Can explain and adapt a small change.'],['4','I can use it somewhere new','Can transfer the idea independently.']]:[['1','Beginning','Working result but weak explanation/evidence.'],['2','Developing','Meets brief with some prompting.'],['3','Secure','Independent, repeatable and explainable.'],['4','Transfer','Adapts concept under a new constraint/context.']];return`<div class="rubric">${labels.map(([r,l,d])=>`<button data-action="complete-mission" data-id="${m.id}" data-rating="${r}"><b>${r} • ${esc(l)}</b><small>${esc(d)}</small></button>`).join('')}</div>`;}
function renderLesson(){const m=BY_ID[ui.currentMissionId];if(!m){document.getElementById('lessonBody').innerHTML='<div class="empty">Choose a mission from My Path or Missions.</div>';return}const explorer=state.activeLearner==='faye'&&m.level==='explorer';document.getElementById('lessonBody').innerHTML=explorer?explorerLesson(m):engineerLesson(m);restoreMissionDraft(m);if(explorer)applyExplorerStep(ui.explorerStep);ui.resumingDraft=false;}
function openMission(id,forceNew=false){const m=BY_ID[id];if(!m)return;const existing=!forceNew&&missionDraft(id);ui.currentMissionId=id;ui.currentAttemptHints=new Set(existing?.hints||[]);ui.currentAttemptQuickCorrect=!!existing?.quick?.correct;ui.currentAttemptQuick=existing?.quick||null;ui.missionRated=false;ui.explorerStep=Number(existing?.explorerStep||0);ui.resumingDraft=!!existing;if(!existing){const rec=missionRecord(id),started=nowISO();rec.attempts++;rec.started.unshift(started);rec.started=rec.started.slice(0,20);if(!learner().missionDrafts)learner().missionDrafts={};learner().missionDrafts[id]={missionId:id,title:m.title,started,lastSaved:started,mode:(state.activeLearner==='faye'&&m.level==='explorer')?'explorer':'engineer',fields:{},hints:[],explorerStep:0,quick:null,completed:false};save();}showPage('lesson');}
function revealHint(id,index){const el=document.getElementById(`hint-${index}`);if(el)el.classList.add('revealed');if(!ui.currentAttemptHints.has(index)){ui.currentAttemptHints.add(index);const rec=missionRecord(id);rec.hints++;save();captureMissionDraft(true);}}
function completeMission(id,rating){
  if(ui.missionRated){toast('This attempt is already recorded. Start or review the mission again for new evidence.');return}
  const m=BY_ID[id],r=Number(rating),gate=validateMastery(m,r);if(!gate.ok){toast(gate.msg);return}
  ui.missionRated=true;const rec=missionRecord(id),transfer=transferResponse();
  rec.ratings.unshift({rating:r,date:nowISO(),hints:ui.currentAttemptHints.size,transfer:transfer||undefined,oralTransfer:transferOral()||undefined});rec.ratings=rec.ratings.slice(0,20);
  if(r>=2&&!learner().completed.includes(id))learner().completed.push(id);
  const value={1:.5,2:1,3:2,4:3}[r];for(const s of missionSkills(m))addEvidence(s,value,`Mission evidence: ${m.title}`,{rating:r,hints:ui.currentAttemptHints.size,missionId:m.id,attemptStarted:currentAttemptStarted(m.id)});
  if(r===4)addEvidence('Transfer',1,`Changed-context mastery: ${m.title}`,{missionId:id});
  if(r<=2){const skill=primarySkill(m);queueRemediation(skill,`Mission rating ${r}: ${m.title}`);}
  const badgesBefore=new Set(badgeState().filter(b=>b.earned).map(b=>b.id));const packet=saveAttemptPacket(m,r);scheduleMissionReview(m,r);calibratePlacementAfterMission(m,r);if(learner().missionDrafts)delete learner().missionDrafts[id];save();
  maybeShowBackupNudge();
  const newBadge=badgeState().find(b=>b.earned&&!badgesBefore.has(b.id));
  if(newBadge)celebrate(`${newBadge.icon} ${newBadge.name} unlocked!`,newBadge.how);
  else if(r>=3)celebrate('Evidence recorded!',r===4?'Transfer \u2014 you used the idea somewhere new and explained it.':'You showed you can do this one on your own.');
  const skill=primarySkill(m),p=CONCEPTS[skill]||CONCEPTS.Prediction,plan=learningPlan();
  const cta=plan.kind==='mission'?`<button class="primary" data-action="start-mission" data-id="${plan.mission.id}">Next Studio mission →</button>`:plan.kind==='review'?'<button class="primary" data-page="review">Do spaced review →</button>':(plan.kind==='remediation'||plan.kind==='prerequisite')?`<button class="primary" data-action="practice-skill" data-skill="${esc(plan.skill)}">Do refresher →</button>`:'<button class="primary" data-page="home">See next learning move →</button>';
  document.getElementById('lessonBody').insertAdjacentHTML('afterbegin',`<div class="lesson-card ${r>=3?'success':'stop'}"><h2>${r>=3?'✅ Evidence recorded':'🧠 Keep learning — this is useful evidence'}</h2><p>${r>=3?'The system recorded the strength of the evidence, not just a completion tick.':`A refresher on <b>${esc(skill)}</b> is queued before harder work depends on it.`}</p>${r<=2?`<p><b>5-minute fix:</b> ${esc(p.remedy)}</p>`:''}<div class="button-row">${cta}<button class="ghost" data-page="path">Back to roadmap</button></div></div>`);window.scrollTo({top:0,behavior:'smooth'});
}
function saveArtifact(id){const note=document.getElementById('artifactNote')?.value.trim();if(!note){toast('Add a short evidence note first.');return}learner().artifacts.unshift({missionId:id,title:BY_ID[id]?.title||id,note,date:nowISO(),tool:BY_ID[id]?.tool||''});learner().artifacts=learner().artifacts.slice(0,100);save();toast('Evidence note saved to Portfolio.');}
function readMission(id){const m=BY_ID[id];if(!m||!('speechSynthesis'in window)){toast('Read-aloud is not available in this browser.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`${m.title}. Your mission: ${m.goal}. Get ready: ${m.setup}. Challenge: ${missionChallenge(m)}. Before you run: ${missionPredictPrompt(m)}`);u.rate=.92;speechSynthesis.speak(u);}

function quickAnswer(btn){
  const block=btn.closest('.quick-check');
  if(block?.dataset.answered)return;
  const m=BY_ID[ui.currentMissionId];
  const key=(ui.quickKey&&ui.quickKey.missionId===(m&&m.id))?ui.quickKey:missionQuickCheck(m);
  const skill=btn.dataset.skill||key.skill||'Prediction',explain=key.explain||'';
  const correct=Number(btn.dataset.answer)===Number(key.ans);
  if(block){block.dataset.answered='1';block.querySelectorAll('button[data-action="quick-answer"]').forEach(b=>b.disabled=true);}
  const f=block?.querySelector('.quick-feedback');
  if(f){f.className=`quick-feedback feedback ${correct?'good':'bad'}`;f.innerHTML=`<b>${correct?'✅ Yes':'↩️ Not yet'}</b><p>${esc(explain)}</p>${!correct?`<p><b>Next move:</b> ${esc((CONCEPTS[skill]||CONCEPTS.Prediction).remedy)}</p>`:''}`;}
  ui.currentAttemptQuickCorrect=correct;ui.currentAttemptQuick={correct,chosen:Number(btn.dataset.answer),skill,explain};
  const signal=m?recordLearningSignal(m,correct):null;
  if(f&&signal)f.insertAdjacentHTML('beforeend',`<p class="learning-signal-note"><b>Learning signal:</b> ${esc(learningSignalLabel(signal.category))}. <small>This compares a one-item starting probe with a later concept check; it is useful pilot evidence, not a causal efficacy claim.</small></p>`);
  if(correct)addEvidence(skill,.25,`Quick understanding: ${m?.title||skill}`,{missionId:m?.id||null,currentAttempt:true});
  else recordMisconception(skill,'Quick understanding check');
  save();captureMissionDraft(true);
}

function recordMisconception(skill,source,confidence=0){
  const m=learner().misconceptions;
  if(!m[skill])m[skill]={count:0,sources:[],last:null,highConfidence:0};
  m[skill].count++;
  m[skill].last=nowISO();
  if(Number(confidence)>=2)m[skill].highConfidence=(m[skill].highConfidence||0)+1;
  m[skill].sources.unshift({source,date:nowISO(),confidence:Number(confidence)||0});
  m[skill].sources=m[skill].sources.slice(0,12);
}
function queueRemediation(skill,source){const r=learner().remediation;if(!r[skill])r[skill]={count:0,sources:[],last:null};r[skill].count++;r[skill].last=nowISO();r[skill].sources.unshift(source);r[skill].sources=r[skill].sources.slice(0,10);}
function clearRemediation(skill){if(learner().remediation[skill])learner().remediation[skill].count=0;save();}
function renderCoach(){const queue=Object.entries(learner().remediation||{}).filter(([,v])=>v.count>0).sort((a,b)=>b[1].count-a[1].count);const current=BY_ID[ui.currentMissionId]||recommendedMission();const skill=current?primarySkill(current):'Debugging';const p=CONCEPTS[skill]||CONCEPTS.Debugging;document.getElementById('coachBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">LEARNING COACH</p><h1 id="coachTitle">Fix the bottleneck, not the answer</h1></div></div>${queue.length?`<h2>Queued refreshers</h2>${queue.map(([s,v])=>{const c=CONCEPTS[s]||CONCEPTS.Prediction;return`<div class="coach-card"><span class="pill warn">${v.count} signal${v.count===1?'':'s'}</span><strong> ${esc(s)}</strong><p>${esc(c.remedy)}</p><button class="secondary" data-action="practice-skill" data-skill="${esc(s)}">Open verified refresher →</button></div>`}).join('')}`:'<div class="info-box">No remediation is currently queued. Use the symptom cards below if a learner gets stuck.</div>'}<h2>Common blocker patterns</h2><div class="two-col">${[['🎲 Random changes','Debugging','Reproduce the failure. Undo unrelated changes. Test one hypothesis.'],['😵 Too much at once','Decomposition','Split the system into three jobs. Test one subsystem only.'],['👀 Sensor confusion','Sensors','Observe the raw input first; separate measurement from decision.'],['🔁 Repeats code manually','Loops','Write the long version, circle the repeating unit, then create the loop.'],['🤷 Works but cannot explain','Transfer','Change one condition or tool and ask for an adaptation without copying.'],['🥱 Too easy','Optimisation','Add a measurable constraint: reliability, time, accuracy or simplicity.']].map(([t,s,d])=>`<div class="coach-card"><strong>${t}</strong><p><span class="pill">${s}</span></p><p>${d}</p><button class="ghost" data-action="practice-skill" data-skill="${s}">Open refresher</button></div>`).join('')}</div><h2>For the current work: ${esc(skill)}</h2><div class="coach-card"><p><b>Ask:</b> ${esc(p.parent.join(' • '))}</p><p><b>Avoid:</b> ${esc(p.avoid)}</p></div>`;}
function remediationQuestion(skill){
  const c=chapterFor(skill),q=c?.checks?.[1]||c?.checks?.[0],p=CONCEPTS[skill]||CONCEPTS.Prediction;
  if(q)return{q:q[0],opts:q[1],ans:q[2],explain:q[3]};
  return{q:p.check[0],opts:p.check[1],ans:p.check[2],explain:p.why};
}
function remediationAnswer(skill,answer,btn){
  const q=remediationQuestion(skill),ok=Number(answer)===Number(q.ans),box=btn.closest('.remediation-check');
  if(box?.dataset.answered)return;
  if(box){box.dataset.answered='1';box.querySelectorAll('button[data-action="remediation-answer"]').forEach(b=>b.disabled=true);}
  const f=document.getElementById('remediationFeedback');
  if(f){f.className=`feedback ${ok?'good':'bad'}`;f.innerHTML=`<b>${ok?'✅ Repair check passed':'↩️ Not yet'}</b><p>${esc(q.explain)}</p>`;}
  learner().remediationAttempts.unshift({skill,date:nowISO(),correct:ok,question:q.q});
  learner().remediationAttempts=learner().remediationAttempts.slice(0,100);
  if(ok){ui.remediationPassed=skill;const done=document.getElementById('remediationCompleteBtn');if(done)done.disabled=false;}
  else{ui.remediationPassed=null;recordMisconception(skill,'Remediation repair check');}
  save();
}
function completeRemediation(skill){
  if(ui.remediationPassed!==skill){toast('Pass the repair check before recording remediation evidence.');return}
  addEvidence(skill,.25,`Remediation verified: ${skill}`,{remediationVerified:true});
  clearRemediation(skill);ui.remediationPassed=null;ui.remediationSkill=null;save();toast('Verified refresher evidence recorded.');renderCoach();
}
function practiceSkill(skill){
  const p=CONCEPTS[skill]||CONCEPTS.Prediction,c=chapterFor(skill),q=remediationQuestion(skill);ui.remediationSkill=skill;ui.remediationPassed=null;showPage('coach');
  document.getElementById('coachBody').innerHTML=`<button class="ghost" data-page="coach">← Learning Coach</button><div class="lesson-card" style="margin-top:12px"><span class="tag">5-MINUTE VERIFIED REFRESHER</span><h1>${c?esc(c.icon)+' ':''}${esc(skill)}</h1><p>${esc(p.why)}</p><div class="system-map"><span class="system-node">${esc(p.model)}</span></div><div class="warning-box" style="margin-top:12px"><b>Common trap:</b> ${esc(p.trap)}</div><h3>Do this</h3><p>${esc(p.remedy)}</p>${c?`<div class="example-pair"><div class="good-example"><b>✅ Example</b><p>${esc(c.examples[0])}</p></div><div class="bad-example"><b>🚫 Not-example</b><p>${esc(c.nonexamples[0])}</p></div></div><p><b>Micro-lab:</b> ${esc(c.try)}</p><button class="ghost" data-action="open-chapter" data-skill="${esc(skill)}">Open full mini-chapter →</button>`:''}<h3>Repair check</h3><div class="remediation-check"><p><b>${esc(q.q)}</b></p>${q.opts.map((o,i)=>`<button class="assessment-choice" data-action="remediation-answer" data-skill="${esc(skill)}" data-answer="${i}">${esc(o)}</button>`).join('')}<div id="remediationFeedback"></div></div><h3>Transfer it</h3><p>Give a completely different real-life or technology example that uses the same idea. Explain what stays the same.</p><button id="remediationCompleteBtn" class="primary" data-action="complete-remediation" data-skill="${esc(skill)}" disabled>Repair check first → then record small evidence</button></div>`;
}

function skillStatusReason(skill){
  const e=evidenceProfile(skill);
  if(e.label==='Reconfirm')return `${e.freshness.reason} Historical best: ${e.historicalLabel}.`;
  if(e.rank===0)return e.by.placement?`Placement sampled this idea ${e.by.placement} time${e.by.placement===1?'':'s'}, but screening alone is not mastery evidence.`:'No verified learning evidence yet.';
  if(e.rank===1)return 'Some low-stakes evidence exists, but no verified project / assessment / delayed retrieval is strong enough yet.';
  if(e.rank===2){if(e.strongMission&&!e.corroborated)return `Developing: strong project evidence exists, but Secure still needs a different project, an independent assessment form, or verified delayed retrieval.`;return 'Developing: at least one stronger source exists, but Secure requires strong independent project evidence plus independent corroboration.';}
  if(e.rank===3)return 'Secure: strong project evidence is corroborated by another strong project, verified assessment, or delayed retrieval.';
  return 'Transfer: the learner has applied the idea in a changed context and later evidence corroborates it.';
}
function renderSkills(){
  const groups=[
    ['FOUNDATIONS',['Prediction','Sequencing','Pattern recognition']],
    ['CONTROL & INTERACTION',['Loops','Conditionals','Input / output','Sensors','Events']],
    ['SOFTWARE THINKING',['Variables','State','Functions','Algorithms']],
    ['ENGINEERING REASONING',['Debugging','Decomposition','Measurement','Calibration','Optimisation']],
    ['EVIDENCE & TRANSFER',['Data','Testing','Iteration','Transfer']]
  ];
  const p=profile();
  const overall=Math.round(CORE_SKILLS.reduce((n,s)=>n+evidenceProfile(s).pct,0)/CORE_SKILLS.length);
  document.getElementById('skillsBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">EVIDENCE-BASED SKILL MAP</p><h1 id="skillsTitle">${p.emoji} What does ${esc(p.name)} actually understand?</h1><p>${p.track==='Explorer'?'Simple status on top; evidence details are there for the adult when needed.':'Evidence provenance, prerequisite readiness and transfer are shown separately so completion cannot masquerade as mastery.'}</p></div><button class="secondary" data-page="assessment">Cross-context checks →</button></div>
  <div class="skill-overview"><div><span class="tag">MAP COVERAGE</span><strong>${overall}%</strong><small>average evidence status, not a grade</small></div><div><span class="tag">SECURE / TRANSFER</span><strong>${CORE_SKILLS.filter(s=>evidenceProfile(s).rank>=3).length}/${CORE_SKILLS.length}</strong><small>skills with corroborated mastery</small></div><div><span class="tag">PLACEMENT ONLY</span><strong>${CORE_SKILLS.filter(s=>evidenceProfile(s).by.placement>0&&evidenceProfile(s).rank===0).length}</strong><small>screened but not counted as mastery</small></div></div>
  <div class="skill-map-groups">${groups.map(([name,skills])=>`<section class="skill-group"><h2>${name}</h2>${skills.map(skill=>{
    const e=evidenceProfile(skill),pre=(PREREQ[skill]||[]),missing=pre.filter(x=>evidenceProfile(x).rank<2),chapter=CHAPTERS[skill];
    return `<article class="skill-evidence-card rank-${e.rank}"><div class="skill-card-top"><div><span class="skill-rank">${e.rank===4?'🌉':e.rank===3?'✅':e.rank===2?'🟦':e.rank===1?'🟡':'⚪'}</span><h3>${chapter?.icon||'🧠'} ${esc(skill)}</h3></div><span class="mastery-label ${e.label==='Reconfirm'?'reconfirm':''}">${esc(e.label)}</span></div><div class="evidence-bar"><span style="width:${e.pct}%"></span></div>${e.label==='Reconfirm'?`<div class="historical-best">Historical best: <b>${esc(e.historicalLabel)}</b> • current status is capped until retrieval/recovery evidence.</div>`:''}<p class="skill-reason">${esc(skillStatusReason(skill))}</p><div class="provenance-grid"><span><b>${e.diversity.distinctStrongProjects}</b><small>distinct strong projects</small></span><span><b>${e.diversity.strongAssessments}</b><small>strong assessment</small></span><span><b>${e.by.review}</b><small>verified review</small></span><span><b>${e.by.transfer}</b><small>transfer</small></span><span><b>${e.by.placement}</b><small>placement</small></span></div>${pre.length?`<p class="prereq-line"><b>Helpful first:</b> ${pre.map(x=>`<span class="pill ${evidenceProfile(x).rank>=2?'good':'warn'}">${esc(x)}</span>`).join(' ')}</p>`:''}${missing.length?`<div class="mini-warning">Refresh before relying on this as a prerequisite: ${missing.map(esc).join(', ')}</div>`:''}<div class="button-row"><button class="ghost" data-action="open-chapter" data-skill="${esc(skill)}">Learn / review</button><button class="secondary" data-action="start-assessment" data-skill="${esc(skill)}">3-question check</button></div></article>`}).join('')}</section>`).join('')}</div>
  <div class="info-box"><b>Mastery policy:</b> Placement screening can guide where to start, but does not create a mastery label. Secure requires strong independent project evidence plus <b>independent corroboration</b>: a different strong project, an unseen/eligible assessment form, or verified delayed retrieval. Repeating the same project does not count as a second proof.</div>`;
}

function assessmentForms(skill){const bank=ASSESS_BANK[skill]||[];if(bank.length<6)return [bank.slice(0,3)];return [bank.slice(0,3),bank.slice(3,6)];}
function assessmentFormKey(skill,attemptIndex){const forms=assessmentForms(skill);return String.fromCharCode(65+(attemptIndex%forms.length));}
function assessmentQuestionVariant(q,shift,id){const n=q.opts.length,s=((shift%n)+n)%n,opts=q.opts.map((_,i)=>q.opts[(i+s)%n]),ans=(q.ans-s+n)%n;return{...q,opts,ans,itemId:id};}
function nextAssessmentForm(skill){const prior=(learner().assessments||[]).filter(a=>a.skill===skill),attemptIndex=prior.length,forms=assessmentForms(skill),formIndex=attemptIndex%forms.length,key=assessmentFormKey(skill,attemptIndex),raw=forms[formIndex];const form=raw.map((q,i)=>assessmentQuestionVariant(q,attemptIndex+i+1,`${skill}:${key}:${i+1}`));const same=(learner().assessments||[]).find(a=>a.skill===skill&&a.formKey===key),elapsed=same?Date.now()-new Date(same.date).getTime():Infinity,strongEligible=!same||elapsed>=24*60*60*1000;return{form,key,strongEligible,lastSame:same||null};}
function renderAssessment(){if(!ui.assess){renderAssessmentHome();return}renderAssessmentQuestion();}
function renderAssessmentHome(){const sorted=[...CORE_SKILLS].sort((a,b)=>evidencePoints(a)-evidencePoints(b));document.getElementById('assessmentBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">INDEPENDENT CROSS-CONTEXT CHECKS</p><h1 id="assessmentTitle">Can the idea travel without the lesson template?</h1></div><button class="ghost" data-page="skills">Back to skill map</button></div><div class="info-box"><b>Assessment items are now separate from teaching checks.</b> Two alternate 3-question forms reduce item-memory effects. Repeating the same form within 24 hours is useful practice but cannot create strong corroborating evidence.</div><div class="skill-grid">${sorted.map(s=>{const next=nextAssessmentForm(s);return`<div class="card"><h3>${esc(s)}</h3><p>${evidenceProfile(s).label} • distinct strong projects ${evidenceProfile(s).diversity.distinctStrongProjects} • verified review ${evidenceProfile(s).by.review}</p><span class="pill ${next.strongEligible?'good':'warn'}">Form ${next.key} • ${next.strongEligible?'independent evidence eligible':'practice retest'}</span><button class="secondary" data-action="start-assessment" data-skill="${esc(s)}">Take 3-question Form ${next.key} →</button></div>`}).join('')}</div>`;}
function startAssessment(skill){const f=nextAssessmentForm(skill);ui.assess={skill,index:0,score:0,answers:[],pending:null,form:f.form,formKey:f.key,strongEligible:f.strongEligible};showPage('assessment');}
function renderAssessmentQuestion(){const a=ui.assess,bank=a.form||[];if(a.index>=bank.length){finishAssessment();return}const q=bank[a.index],pending=a.pending;document.getElementById('assessmentBody').innerHTML=`<button class="ghost" data-action="assessment-exit">← Assessments</button><div class="lesson-card" style="margin-top:12px"><span class="tag">${esc(a.skill)} • FORM ${esc(a.formKey)} • ${a.index+1}/${bank.length}</span><h2>${esc(q.q)}</h2>${!pending?q.opts.map((o,i)=>`<button class="assessment-choice" data-action="assessment-answer" data-index="${i}">${esc(o)}</button>`).join(''):`<div class="assessment-lock"><b>🔒 Answer locked.</b><p>You will see correctness and explanations after all three questions, so one answer does not teach the next one.</p></div><h3>How sure were you when you chose it?</h3><div class="confidence-row"><button data-action="assessment-confidence" data-confidence="0">Not sure</button><button data-action="assessment-confidence" data-confidence="1">Pretty sure</button><button data-action="assessment-confidence" data-confidence="2">Certain</button></div>`}</div>`;}
function assessmentAnswer(index){const a=ui.assess,q=a.form[a.index];a.pending={index:Number(index),correct:Number(index)===q.ans};renderAssessmentQuestion();}
function assessmentConfidence(conf){const a=ui.assess,q=a.form[a.index],p=a.pending,item={q:q.q,itemId:q.itemId,chosen:p.index,correct:p.correct,confidence:Number(conf)};a.answers.push(item);if(p.correct)a.score++;else{recordMisconception(a.skill,'Independent concept assessment',Number(conf));queueRemediation(a.skill,'Independent assessment error');}a.index++;a.pending=null;renderAssessmentQuestion();}
function finishAssessment(){const a=ui.assess,bank=a.form,pct=Math.round(a.score/bank.length*100),over=a.answers.filter(x=>!x.correct&&x.confidence===2).length,strong=!!(pct===100&&a.strongEligible),val=strong?3:pct>=50?1:0;addEvidence(a.skill,val,`Concept assessment ${pct}%`,{confidenceCalibration:true,assessmentStrong:strong,assessmentForm:a.formKey,itemIds:a.answers.map(x=>x.itemId)});learner().assessments.unshift({skill:a.skill,score:pct,answers:a.answers,date:nowISO(),overconfidence:over,formKey:a.formKey,strong});learner().assessments=learner().assessments.slice(0,100);if(strong)learner().remediation[a.skill]&&(learner().remediation[a.skill].count=0);save();const interpretation=strong?'Strong independent cross-context corroboration recorded.':pct===100?'Perfect practice retest, but this same form was seen within 24 hours. Keep the repair; use delayed review, another project, or a later form retest for strong corroboration.':pct>=50?'Partial understanding. A targeted refresher is queued before harder work depends on this idea.':'This concept needs remediation before it becomes a prerequisite for harder missions.';const review=a.answers.map((x,i)=>{const q=bank[i];return`<div class="assessment-review ${x.correct?'good':'bad'}"><b>${x.correct?'✅':'↩️'} ${esc(q.q)}</b><p>${esc(q.explain)}</p><small>Confidence: ${x.confidence===2?'certain':x.confidence===1?'pretty sure':'not sure'}</small></div>`}).join('');document.getElementById('assessmentBody').innerHTML=`<div class="assessment-result"><span class="tag">ASSESSMENT COMPLETE • FORM ${esc(a.formKey)}</span><h1>${esc(a.skill)}: ${pct}%</h1><p>${esc(interpretation)}</p>${over?`<div class="warning-box"><b>${over} confidently wrong response${over===1?'':'s'}.</b> This points to a misconception rather than mere uncertainty.</div>`:''}<h2>Now review the evidence</h2>${review}<div class="button-row" style="margin-top:12px">${pct<100?`<button class="secondary" data-action="practice-skill" data-skill="${esc(a.skill)}">Open targeted refresher</button>`:''}<button class="ghost" data-action="assessment-exit">Back to assessments</button></div></div>`;ui.assess=null;}

function scheduleMissionReview(m,rating){
  const l=learner(),days={1:1,2:3,3:7,4:14}[rating]||7,due=new Date();due.setDate(due.getDate()+days);
  const old=l.reviews.find(x=>x.missionId===m.id),cycle=(old?.cycle||0)+1;
  l.reviews=l.reviews.filter(x=>x.missionId!==m.id);
  l.reviews.push({missionId:m.id,title:m.title,skill:primarySkill(m),due:due.toISOString(),interval:days,lastRating:rating,cycle});
}
function reviewQuestion(item){
  const m=BY_ID[item.missionId];
  if(m?.level==='explorer'&&EXPLORER_MISSION_CHECKS[m.id])return EXPLORER_MISSION_CHECKS[m.id];
  if(ENGINEER_RETRIEVAL_CHECKS[item.missionId])return ENGINEER_RETRIEVAL_CHECKS[item.missionId];
  const c=chapterFor(item.skill),q=c?.checks?.[2]||c?.checks?.[0],p=CONCEPTS[item.skill]||CONCEPTS.Prediction;
  return q?{q:q[0],opts:q[1],ans:q[2],explain:q[3]}:{q:p.check[0],opts:p.check[1],ans:p.check[2],explain:p.why};
}
function currentReviewAttempt(item){
  return (learner().reviewAttempts||[]).find(a=>a.missionId===item.missionId&&a.cycle===(item.cycle||1))||null;
}
function reviewEvidenceHTML(item){
  const m=BY_ID[item.missionId],rp=RETRIEVAL_PROMPTS[item.missionId]||{},q=reviewQuestion(item),attempt=currentReviewAttempt(item),engineer=m?.level==='engineer';
  if(attempt?.correct){
    return `<div class="verified-review"><b>✅ Retrieval verified</b><p>${esc(attempt.explanation||q.explain)}</p>${attempt.reasoning?`<p><b>Your changed-context reasoning:</b> ${esc(attempt.reasoning)}</p>`:''}<p class="muted">Now rate how effortful retrieval felt. Difficulty changes the spacing interval; it does not decide correctness.</p><div class="button-row"><button class="ghost" data-action="review-rate" data-id="${item.missionId}" data-rate="hard">Hard but correct</button><button class="secondary" data-action="review-rate" data-id="${item.missionId}" data-rate="ok">Got it</button><button class="primary" data-action="review-rate" data-id="${item.missionId}" data-rate="easy">Easy / transferable</button></div></div>`;
  }
  if(attempt&&!attempt.correct){
    return `<div class="warning-box"><b>↩️ Retrieval gap found.</b><p>${esc(attempt.explanation||q.explain)}</p><p>A targeted refresher is queued. This review will return tomorrow; no positive mastery evidence was added.</p><button class="secondary" data-action="practice-skill" data-skill="${esc(item.skill)}">Open refresher →</button></div>`;
  }
  return `<div class="retrieval-task"><span class="tag">CLOSED-BOOK RETRIEVAL</span><p><b>Changed condition:</b> ${esc(rp.change||`Use ${item.skill} in a different situation and explain what stays the same.`)}</p><p class="look-for"><b>After answering, a strong response should include:</b> ${esc(rp.lookFor||'the core principle, the changed condition and a justified adaptation.')}</p>${engineer?`<label><b>Reason first — before choosing an answer</b><textarea id="review-reason-${item.missionId}" placeholder="Core principle stays… The changed condition is… Therefore I would adapt…"></textarea></label>`:`<label class="oral-recall"><input id="review-reasoned-${item.missionId}" type="checkbox"> I explained or drew my reasoning before choosing an answer.</label>`}<div class="review-mc"><p><b>${esc(q.q)}</b></p>${q.opts.map((o,i)=>`<button class="assessment-choice" data-action="verify-review" data-id="${item.missionId}" data-answer="${i}">${esc(o)}</button>`).join('')}</div></div>`;
}
function renderReview(){
  const l=learner(),now=new Date(),items=[...l.reviews].sort((a,b)=>new Date(a.due)-new Date(b.due)),due=items.filter(x=>new Date(x.due)<=now),future=items.filter(x=>new Date(x.due)>now),fresh=masteryFreshnessSummary();
  document.getElementById('reviewBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">VERIFIED SPACED RETRIEVAL</p><h1 id="reviewTitle">Remember it later — and prove it</h1></div><span class="pill ${due.length?'warn':'good'}">${due.length} due</span></div><p>Do not reopen the old solution first. Every due review now requires a delayed, changed-context check before it can contribute mastery evidence. The final Hard / Got it / Easy choice controls spacing only.</p><div class="memory-health"><b>Current knowledge health:</b> ${fresh.currentSecure.length} currently Secure/Transfer • ${fresh.reconfirm.length} awaiting reconfirmation • ${fresh.historicalSecure.length} historically reached Secure/Transfer.</div>${due.length?due.map(x=>`<div class="review-card due"><span class="badge">DUE</span><h3>${esc(x.title)}</h3><p><b>${esc(x.skill)}</b> • Retrieval cycle ${x.cycle||1}</p>${reviewEvidenceHTML(x)}</div>`).join(''):reviewEmptyHTML(future)}${future.length?`<h2>Coming later</h2>${future.slice(0,12).map(x=>`<div class="review-card"><span class="pill">${new Date(x.due).toLocaleDateString()}</span> <b>${esc(x.title)}</b> • ${esc(x.skill)} • cycle ${x.cycle||1}</div>`).join('')}`:''}`;
}
/*
  "Nothing due \ud83c\udf89" was a dead end: it congratulated the learner for an empty list and
  explained nothing. An empty queue means one of three different things, each with a
  different next move.
*/
function reviewEmptyHTML(future){
  const l=learner(),done=(l.attemptPackets||[]).length,next=future&&future[0];
  if(!done){
    return `<div class="empty review-empty"><h3>\ud83c\udf31 Nothing to review yet \u2014 and that is correct</h3>
      <p>Reviews are not homework handed out in advance. One gets scheduled automatically a few days after you finish a mission, because a few days later is when forgetting actually starts.</p>
      <p><b>Why it works:</b> pulling something back out of your memory makes it stick far better than reading it again. That is why this page never lets you reopen your old solution first.</p>
      <div class="button-row"><button class="primary" data-page="path">Do a mission first \u2192</button></div></div>`;
  }
  if(next){
    const days=Math.max(1,Math.ceil((new Date(next.due)-new Date())/86400000));
    return `<div class="empty review-empty"><h3>\u2705 Nothing due today</h3>
      <p>Your next review is <b>${esc(next.title)}</b> (${esc(next.skill)}), in about ${days} day${days===1?'':'s'}. It is deliberately not today \u2014 reviewing too soon feels easy and teaches you much less.</p>
      <p>Coming back on the day it is due is the point. Doing it early is not extra credit.</p>
      <div class="button-row"><button class="primary" data-page="path">Carry on with the path \u2192</button><button class="secondary" data-page="labs">Try a lab instead</button></div></div>`;
  }
  return `<div class="empty review-empty"><h3>\u2705 Review queue is clear</h3>
    <p>Every scheduled check has been done. New ones appear as you finish more missions.</p>
    <div class="button-row"><button class="primary" data-page="path">Next mission \u2192</button></div></div>`;
}
function verifyReview(id,answer){
  const item=learner().reviews.find(x=>x.missionId===id);if(!item)return;
  const m=BY_ID[id],q=reviewQuestion(item),engineer=m?.level==='engineer';
  let reasoning='';
  if(engineer){reasoning=(document.getElementById(`review-reason-${id}`)?.value||'').trim();if(reasoning.length<35){toast('Write a short changed-context explanation before answering.');return}}
  else if(!document.getElementById(`review-reasoned-${id}`)?.checked){toast('Explain or draw your reasoning before choosing the answer.');return}
  const correct=Number(answer)===Number(q.ans),attempt={missionId:id,title:item.title,skill:item.skill,cycle:item.cycle||1,date:nowISO(),correct,reasoning,chosen:Number(answer),explanation:q.explain};
  learner().reviewAttempts.unshift(attempt);learner().reviewAttempts=learner().reviewAttempts.slice(0,150);
  if(!correct){
    recordMisconception(item.skill,'Verified spaced retrieval',2);queueRemediation(item.skill,`Verified spaced retrieval: ${item.title}`);
    item.cycle=(item.cycle||1)+1;item.interval=1;const d=new Date();d.setDate(d.getDate()+1);item.due=d.toISOString();item.lastResult='incorrect';
  }
  save();renderReview();toast(correct?'Retrieval verified. Now rate effort.':'Retrieval gap recorded; refresher queued.');
}
function rateReview(id,rate){
  const item=learner().reviews.find(x=>x.missionId===id);if(!item)return;
  const attempt=currentReviewAttempt(item);
  if(!attempt?.correct){toast('Complete the changed-context retrieval check correctly first.');return}
  const add=rate==='easy'?2:1;
  addEvidence(item.skill,add,`Spaced review: ${item.title}`,{reviewRate:rate,reviewCorrect:true,reviewCycle:item.cycle||1,reasoning:attempt.reasoning||''});
  const days=rate==='easy'?Math.min(item.interval*2,30):rate==='ok'?Math.min(item.interval+7,21):Math.max(2,Math.min(item.interval,7));
  const d=new Date();d.setDate(d.getDate()+days);item.due=d.toISOString();item.interval=days;item.lastResult=rate;item.lastVerifiedAt=nowISO();item.cycle=(item.cycle||1)+1;
  save();renderReview();toast('Verified review evidence recorded.');
}

function renderDiagnostic(){
  if(!ui.diag){
    const last=learner().diagnostics?.[0];
    document.getElementById('diagnosticBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">PLACEMENT</p><h1 id="diagnosticTitle">Start where challenge begins — without pretending a quiz proves mastery</h1></div></div><p>Placement now uses a short screen plus three verification probes. Confidence is recorded but no answer feedback is shown during placement, so later questions are not accidentally taught by earlier ones.</p>${last?`<div class="diagnostic-summary"><b>Latest ${esc(profile().name)} placement:</b> ${last.score}% • reliability ${esc(last.reliability||'legacy')} • provisional start ${esc(BY_ID[last.startId]?.title||last.startId)}</div>`:''}<div class="two-col"><div class="card"><h2>🌟 Explorer placement</h2><p>6 reasoning screens + 3 targeted verification probes. No robotics kit required.</p><button class="primary" data-action="start-diagnostic" data-who="faye">Start Explorer placement</button></div><div class="card"><h2>⚙️ Engineer placement</h2><p>6 engineering screens + 3 targeted verification probes covering evidence, systems and transfer.</p><button class="primary" data-action="start-diagnostic" data-who="philip">Start Engineer placement</button></div></div><div class="info-box"><b>Important:</b> Placement determines a starting hypothesis only. It is not counted as Secure mastery; the first real Studio mission still confirms or adjusts the recommendation.</div>`;return;
  }
  renderDiagnosticQuestion();
}
function startDiagnostic(who){
  state.activeLearner=who;save();
  ui.diag={who,stage:'screen',index:0,answers:[],pending:null,verify:[]};
  renderDiagnostic();
}
function diagnosticCurrent(){
  const d=ui.diag;
  if(d.stage==='screen')return DIAGNOSTICS[d.who][d.index]||null;
  return d.verify[d.index]||null;
}
function prepareDiagnosticVerification(){
  const d=ui.diag,screen=d.answers.filter(a=>a.stage==='screen');
  const priorityWrong=screen.filter(a=>!a.correct).sort((a,b)=>b.confidence-a.confidence);
  const preferred=d.who==='faye'?['Sequencing','Debugging','Loops','Prediction','Input / output','Variables']:['Sensors','Calibration','Decomposition','Optimisation','Data','Transfer'];
  const correct=screen.filter(a=>a.correct).sort((a,b)=>preferred.indexOf(a.skill)-preferred.indexOf(b.skill)||b.confidence-a.confidence);
  const chosen=[];
  for(const a of [...priorityWrong,...correct]){
    if(!chosen.includes(a.skill)&&DIAGNOSTIC_VERIFY[d.who][a.skill])chosen.push(a.skill);
    if(chosen.length===3)break;
  }
  d.verify=chosen.map(s=>DIAGNOSTIC_VERIFY[d.who][s]);
  d.stage='verify';d.index=0;d.pending=null;
}
function renderDiagnosticQuestion(){
  const d=ui.diag;
  if(d.stage==='screen'&&d.index>=DIAGNOSTICS[d.who].length){prepareDiagnosticVerification();}
  if(d.stage==='verify'&&d.index>=d.verify.length){finishDiagnostic();return;}
  const q=diagnosticCurrent();if(!q){finishDiagnostic();return;}
  const total=d.stage==='screen'?DIAGNOSTICS[d.who].length:d.verify.length,pending=d.pending;
  document.getElementById('diagnosticBody').innerHTML=`<button class="ghost" data-action="diagnostic-exit">← Placement</button><div class="lesson-card diagnostic-card" style="margin-top:12px"><span class="tag">${d.stage==='screen'?'SCREEN':'VERIFY'} • ${d.index+1}/${total} • ${esc(q.skill)}</span><h2>${esc(q.q)}</h2>${!pending?q.opts.map((o,i)=>`<button class="assessment-choice" data-action="diagnostic-answer" data-index="${i}">${esc(o)}</button>`).join(''):`<div class="diagnostic-confidence"><h3>How sure were you <i>before</i> choosing?</h3><p class="muted">No correctness feedback yet — that keeps placement diagnostic.</p><div class="confidence-row"><button data-action="diagnostic-confidence" data-confidence="0">Not sure</button><button data-action="diagnostic-confidence" data-confidence="1">Pretty sure</button><button data-action="diagnostic-confidence" data-confidence="2">Certain</button></div></div>`}</div>`;
}
function diagnosticAnswer(i){
  const d=ui.diag,q=diagnosticCurrent();if(!q)return;
  d.pending={chosen:Number(i),correct:Number(i)===q.ans};
  renderDiagnosticQuestion();
}
function diagnosticConfidence(conf){
  const d=ui.diag,q=diagnosticCurrent(),p=d.pending;if(!q||!p)return;
  d.answers.push({stage:d.stage,skill:q.skill,correct:p.correct,chosen:p.chosen,confidence:Number(conf)});
  d.index++;d.pending=null;renderDiagnosticQuestion();
}
function diagnosticSkillScores(d){
  const out={};
  for(const a of d.answers){if(!out[a.skill])out[a.skill]=[];out[a.skill].push(a.correct?1:0);}
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.reduce((n,x)=>n+x,0)/v.length]));
}
function diagnosticReliability(d){
  const screen=Object.fromEntries(d.answers.filter(a=>a.stage==='screen').map(a=>[a.skill,a]));
  const verify=Object.fromEntries(d.answers.filter(a=>a.stage==='verify').map(a=>[a.skill,a]));
  const mismatches=Object.keys(verify).filter(s=>screen[s]&&screen[s].correct!==verify[s].correct).length;
  const over=d.answers.filter(a=>!a.correct&&a.confidence===2).length;
  const uncertain=d.answers.filter(a=>a.confidence===0).length;
  const reliability=(over===0&&mismatches===0&&uncertain<=2)?'high':(over<=1&&mismatches<=1?'medium':'low');
  return{reliability,mismatches,over,uncertain};
}
function placementStart(who,scores,reliability){
  const val=s=>scores[s]??0;
  let startId;
  if(who==='faye'){
    const foundations=(val('Prediction')+val('Sequencing'))/2;
    if(foundations<.75)startId='ct2';
    else if(val('Debugging')<.75)startId='d2';
    else if(val('Loops')<.75)startId='d3';
    else startId='d4';
  }else{
    if(val('Sensors')<.75||val('Decomposition')<.75)startId='e1';
    else if(val('Transfer')<.75)startId='e6';
    else if(val('Calibration')<.75||val('Data')<.75)startId='e7';
    else startId='e2';
  }
  if(reliability==='low'){
    const path=FAMILY[who].path,idx=path.indexOf(startId);
    if(idx>0)startId=path[idx-1];
  }
  return startId;
}
function finishDiagnostic(){
  const d=ui.diag,total=d.answers.length,correct=d.answers.filter(a=>a.correct).length,pct=Math.round(correct/Math.max(1,total)*100);
  const scores=diagnosticSkillScores(d),rel=diagnosticReliability(d),startId=placementStart(d.who,scores,rel.reliability);
  for(const a of d.answers){
    if(a.correct)addEvidence(a.skill,.2,`Placement ${a.stage}`,{diagnostic:true,placementCorrect:true});
    else if(a.confidence===2)recordMisconception(a.skill,'Placement high-confidence error',2);
  }
  learner().startId=startId;
  const record={score:pct,screenScore:Math.round(d.answers.filter(a=>a.stage==='screen'&&a.correct).length/DIAGNOSTICS[d.who].length*100),verifyScore:Math.round(d.answers.filter(a=>a.stage==='verify'&&a.correct).length/Math.max(1,d.verify.length)*100),skills:scores,answers:d.answers,date:nowISO(),startId,confirmed:false,reliability:rel.reliability,mismatches:rel.mismatches,overconfidentWrong:rel.over,uncertain:rel.uncertain};
  learner().diagnostics.unshift(record);learner().diagnostics=learner().diagnostics.slice(0,30);save();
  const reliabilityText=rel.reliability==='high'?'Screen and verification were consistent.':rel.reliability==='medium'?'Some uncertainty/inconsistency was detected, so the first Studio mission matters especially.':'Placement evidence was inconsistent or confidently wrong in places, so InventorLab chose a more conservative starting point.';
  document.getElementById('diagnosticBody').innerHTML=`<div class="assessment-result"><span class="tag">PROVISIONAL PLACEMENT • ${rel.reliability.toUpperCase()} RELIABILITY</span><h1>${pct}% across ${total} diagnostic items</h1><p><b>Recommended start:</b> ${esc(BY_ID[startId]?.title||startId)}</p><div class="diagnostic-metrics"><span><b>${record.screenScore}%</b><small>screen</small></span><span><b>${record.verifyScore}%</b><small>verification</small></span><span><b>${rel.mismatches}</b><small>screen/verify mismatch${rel.mismatches===1?'':'es'}</small></span><span><b>${rel.over}</b><small>confidently wrong</small></span></div><p>${esc(reliabilityText)}</p><div class="info-box"><b>Placement is not mastery.</b> Correct placement answers are stored only as screening evidence and do not move a skill to Emerging/Secure by themselves. The first real Studio mission confirms the level.</div><button class="primary" data-page="path">Try the provisional start →</button></div>`;
  ui.diag=null;
}

function journalForm(){return`<div class="panel"><div class="section-head"><div><h2>📓 Engineering journal</h2><p class="muted">Write from scratch or pull in the latest attempt trace, then add what you want to remember.</p></div><button class="ghost" data-action="prefill-journal">Use latest attempt evidence</button></div><div class="journal-grid"><div class="field"><label>Project / mission<input id="journalTitle" placeholder="What are you working on?"></label></div><div class="field"><label>Question / goal<input id="journalGoal" placeholder="What are you trying to find out or achieve?"></label></div><div class="field wide"><label>Prediction<textarea id="journalPrediction" placeholder="I expect… because…"></textarea></label></div><div class="field"><label>Observed<textarea id="journalObserved" placeholder="What actually happened?"></textarea></label></div><div class="field"><label>Next change<textarea id="journalChange" placeholder="What will you change, and why?"></textarea></label></div><div class="field wide"><label>Evidence<textarea id="journalEvidence" placeholder="Measurements, screenshot description, test result, failure mode, or other evidence"></textarea></label></div></div><button class="primary" data-action="save-journal" style="margin-top:10px">Save journal entry</button></div>`;}
function saveJournal(){const get=id=>document.getElementById(id)?.value.trim()||'';const entry={date:nowISO(),title:get('journalTitle')||'Project',goal:get('journalGoal'),prediction:get('journalPrediction'),observed:get('journalObserved'),change:get('journalChange'),evidence:get('journalEvidence')};if(!entry.prediction&&!entry.observed&&!entry.evidence){toast('Add at least a prediction, observation or evidence note.');return}learner().journals.unshift(entry);learner().journals=learner().journals.slice(0,150);save();renderPortfolio();toast('Journal entry saved.');}
function prefillJournal(){
  const a=latestAttemptPacket();if(!a){toast('Complete or rate a mission attempt first.');return}const set=(id,v)=>{const el=document.getElementById(id);if(el&&!el.value)el.value=v||'';};
  set('journalTitle',a.title);set('journalGoal',a.objective);if(a.mode==='explorer'){set('journalPrediction',a.process?.prediction|| (a.process?.predictionOral?'Explained/drew prediction aloud.':''));set('journalObserved',a.process?.observation||(a.process?.observationOral?'Explained observation aloud.':''));set('journalChange',a.process?.explanation||(a.process?.explanationOral?'Explained change from evidence aloud.':''));}else{set('journalPrediction',a.process?.hypothesis||'');set('journalObserved',a.testSummary||'');set('journalChange',a.process?.criteria?.items?.map(x=>x.evidence).filter(Boolean).join(' | ')||'');}set('journalEvidence',`Rating ${a.rating}; support=${a.support}; hints=${a.hints}; learning rescues=${a.blockingRescues??a.adultRescues??0}; setup assists=${a.setupAssists||0}; self-diagnosis uses=${a.selfDiagnosisUses}${a.designReview!==undefined?`; design review=${a.designReview}/12`:''}`);toast('Latest attempt evidence added. Edit it into your own journal voice.');
}
/*
  Badges. Every one of these is derived from evidence the learner actually produced,
  and the locked state says plainly what would earn it. Nothing is awarded for showing up,
  because a badge that means nothing teaches a child that badges mean nothing.
*/
const BADGES=[
  {id:'launch',icon:'\ud83d\ude80',name:'First Launch',how:'Finish and rate your first mission attempt.',
   test:l=>(l.attemptPackets||[]).length>=1},
  {id:'predictor',icon:'\ud83d\udd2e',name:'Predictor',how:'Make a real prediction before testing, on three separate missions.',
   test:l=>(l.attemptPackets||[]).filter(a=>a.process&&(String(a.process.prediction||'').trim()||a.process.predictionOral||String(a.process.hypothesis||'').trim())).length>=3},
  {id:'detective',icon:'\ud83d\udc1e',name:'Bug Detective',how:'Use the symptom checker to find a fault, then finish that mission.',
   test:l=>(l.debugLogs||[]).length>=1&&(l.attemptPackets||[]).length>=1},
  {id:'fairtest',icon:'\u2696\ufe0f',name:'Fair Tester',how:'Solve three different virtual-lab scenarios.',
   test:l=>new Set((l.labAttempts||[]).filter(x=>x.success&&x.scenarioId).map(x=>x.labId+':'+x.scenarioId)).size>=3},
  {id:'independent',icon:'\ud83d\udcaa',name:'On My Own',how:'Record three independent attempts with no help on the thinking.',
   test:l=>(l.attemptPackets||[]).filter(a=>['independent','independent-with-setup'].includes(a.support)).length>=3},
  {id:'memory',icon:'\ud83e\udde0',name:'Still Remember It',how:'Pass a spaced review days after the mission that taught it.',
   test:l=>(l.reviewAttempts||[]).some(x=>x.correct)},
  {id:'traveller',icon:'\ud83c\udf09',name:'Idea Traveller',how:'Use one idea somewhere new and explain it — a Transfer rating.',
   test:l=>(l.attemptPackets||[]).some(a=>Number(a.rating)===4)},
  {id:'finisher',icon:'\ud83c\udfc6',name:'Path Finisher',how:'Evidence every mission on your current path.',
   test:(l,p)=>p.path.length>0&&p.path.every(id=>l.completed.includes(id))}
];
function badgeState(){const l=learner(),p=profile();return BADGES.map(b=>({...b,earned:!!b.test(l,p)}));}
function badgeStripHTML(mode='full'){
  const all=badgeState(),got=all.filter(b=>b.earned),next=all.find(b=>!b.earned);
  if(mode==='compact'){
    return `<div class="badge-strip"><div class="badge-strip-head"><span class="tag">INVENTOR BADGES</span><b>${got.length} of ${all.length} earned</b></div><div class="badge-row">${all.map(b=>`<span class="badge-chip ${b.earned?'earned':'locked'}" title="${esc(b.earned?b.name:b.how)}"><i>${b.icon}</i><small>${esc(b.name)}</small></span>`).join('')}</div>${next?`<p class="badge-next"><b>Next up \u2014 ${esc(next.name)}:</b> ${esc(next.how)}</p>`:'<p class="badge-next"><b>All earned.</b> Every one of these came from evidence you produced.</p>'}</div>`;
  }
  return `<div class="badge-grid">${all.map(b=>`<div class="badge-card ${b.earned?'earned':'locked'}"><i>${b.icon}</i><b>${esc(b.name)}</b><small>${esc(b.earned?'Earned \u2014 from evidence you recorded.':b.how)}</small></div>`).join('')}</div>`;
}
function celebrate(title,line){
  if((state.prefs.motion||'on')==='off'){toast(title);return;}
  const host=document.createElement('div');
  host.className='celebrate';
  host.innerHTML=`<div class="celebrate-card"><div class="confetti">${Array.from({length:14},(_,i)=>`<span style="--i:${i}"></span>`).join('')}</div><div class="celebrate-emoji">\ud83c\udf89</div><h2>${esc(title)}</h2><p>${esc(line)}</p><button class="primary" data-action="close-celebrate">Keep going</button></div>`;
  document.body.appendChild(host);
  setTimeout(()=>host.classList.add('in'),10);
}
function closeCelebrate(){document.querySelectorAll('.celebrate').forEach(x=>x.remove());}
function renderPortfolio(){const p=profile(),done=p.path.map(id=>BY_ID[id]).filter(m=>m&&missionDone(m.id)),arts=learner().artifacts,j=learner().journals,tests=learner().testLogs||[],labs=learner().labAttempts||[],reviewAttempts=learner().reviewAttempts||[],packets=learner().attemptPackets||[];document.getElementById('portfolioBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">PORTFOLIO</p><h1 id="portfolioTitle">Evidence of thinking and iteration</h1></div><div class="button-row"><button class="secondary" data-action="export-portfolio">Download evidence report</button><button class="secondary" data-page="summary">🖨️ One-page summary</button><button class="ghost" data-action="switch-learner">Switch learner</button></div></div><div class="metric-grid"><div class="metric"><strong>${done.length}</strong><small>Studio missions evidenced</small></div><div class="metric"><strong>${j.length}</strong><small>journal entries</small></div><div class="metric"><strong>${arts.length}</strong><small>mission evidence notes</small></div><div class="metric"><strong>${tests.length}</strong><small>structured test logs</small></div><div class="metric"><strong>${labs.length}</strong><small>virtual-lab attempts</small></div><div class="metric"><strong>${reviewAttempts.filter(x=>x.correct).length}</strong><small>verified retrieval passes</small></div><div class="metric"><strong>${packets.length}</strong><small>attempt evidence packets</small></div></div>${badgeStripHTML('full')}${journalForm()}<h2>Mission process evidence</h2>${packets.length?packets.slice(0,12).map(a=>`<div class="attempt-packet"><div class="packet-head"><b>${a.mode==='explorer'?'🌟':'⚙️'} ${esc(a.title)}</b><span class="pill ${['independent','independent-with-setup'].includes(a.support)?'good':a.support==='adult-assisted'?'warn':''}">${esc(a.support)}</span></div><p><b>Objective:</b> ${esc(a.objective)}<br><b>Attempt evidence:</b> rating ${a.rating} • ${a.hints} hint${a.hints===1?'':'s'} • ${a.blockingRescues??a.adultRescues??0} learning rescue${(a.blockingRescues??a.adultRescues??0)===1?'':'s'} • ${a.setupAssists||0} setup assist${(a.setupAssists||0)===1?'':'s'} • ${a.selfDiagnosisUses} self-diagnosis use${a.selfDiagnosisUses===1?'':'s'}</p>${a.mode==='explorer'?`<p><b>Prediction:</b> ${esc(a.process?.prediction|| (a.process?.predictionOral?'spoken/drawn':'—'))}<br><b>Observed:</b> ${esc(a.process?.observation||(a.process?.observationOral?'spoken':'—'))}<br><b>Explanation:</b> ${esc(a.process?.explanation||(a.process?.explanationOral?'spoken/drawn':'—'))}</p>`:`<p><b>Hypothesis:</b> ${esc(a.process?.hypothesis||'—')}<br><b>Acceptance criteria evidenced:</b> ${(a.process?.criteria?.items||[]).filter(x=>x.met).length}/${(a.process?.criteria?.items||[]).length}${a.testSummary?`<br><b>Test log:</b> ${esc(a.testSummary)}`:''}</p>`}<small>${new Date(a.completedAt).toLocaleString()}</small></div>`).join(''):'<div class="empty">No rated mission attempts yet.</div>'}<h2>Verified retrieval evidence</h2>${reviewAttempts.length?reviewAttempts.slice(0,12).map(x=>`<div class="artifact-item"><b>${x.correct?'✅':'↩️'} ${esc(x.title)}</b> <span class="pill">${esc(x.skill)}</span><p>${x.correct?'Changed-context retrieval verified.':'Retrieval gap found; refresher queued.'}${x.reasoning?`<br><b>Reasoning:</b> ${esc(x.reasoning)}`:''}</p><small>${new Date(x.date).toLocaleString()} • cycle ${x.cycle}</small></div>`).join(''):'<div class="empty">No delayed retrieval attempts yet.</div>'}<h2>Equipment-free lab evidence</h2>${labs.length?labs.slice(0,10).map(x=>`<div class="artifact-item"><b>${VIRTUAL_LABS[x.labId]?.icon||'🧪'} ${esc(VIRTUAL_LABS[x.labId]?.title||x.labId)}</b> <span class="pill ${x.success?'good':'warn'}">${x.success?'successful trial':'attempt'}</span><p>${esc(x.summary)}</p><small>${new Date(x.date).toLocaleString()} • ${x.scenarioId?`scenario ${esc(x.scenarioId)} • `:''}low-stakes evidence only</small></div>`).join(''):'<div class="empty">No virtual-lab attempts yet.</div>'}<h2>Structured engineering test evidence</h2>${tests.length?tests.slice(0,10).map(t=>`<div class="portfolio-test"><b>${esc(t.title)}</b> <span class="pill">${esc(t.tool)}</span><p><b>Success:</b> ${esc(t.criterion)}<br><b>Evidence:</b> ${esc(testLogSummary(t))}${t.claim?`<br><b>Claim:</b> ${esc(t.claim)}`:''}${t.limitation?`<br><b>Limitation:</b> ${esc(t.limitation)}`:''}${t.falsifier?`<br><b>Would weaken claim:</b> ${esc(t.falsifier)}`:''}${t.decision?`<br><b>Decision:</b> ${esc(t.decision)}`:''}</p></div>`).join(''):'<div class="empty">No structured engineering test logs yet.</div>'}<h2>Recent evidence notes</h2>${arts.length?arts.slice(0,12).map(a=>`<div class="artifact-item"><b>${esc(a.title)}</b> <span class="pill">${esc(a.tool)}</span><p>${esc(a.note)}</p><small>${new Date(a.date).toLocaleString()}</small></div>`).join(''):'<div class="empty">No mission evidence notes yet.</div>'}<h2>Journal</h2>${j.length?j.slice(0,12).map(x=>`<div class="journal-item"><b>${esc(x.title)}</b><p>${x.goal?`<b>Goal:</b> ${esc(x.goal)}<br>`:''}<b>Predicted:</b> ${esc(x.prediction||'—')}<br><b>Observed:</b> ${esc(x.observed||'—')}<br><b>Next change:</b> ${esc(x.change||'—')}<br><b>Evidence:</b> ${esc(x.evidence||'—')}</p><small>${new Date(x.date).toLocaleString()}</small></div>`).join(''):'<div class="empty">No journal entries yet.</div>'}<h2>Completed Studio work</h2>${done.length?done.map(m=>{const b=missionBlueprint(m);return`<div class="artifact-item"><span class="quality-badge studio">★ Studio</span> <b>${m.icon} ${esc(m.title)}</b><p>${esc(m.goal)}</p>${b?`<p><b>Objective evidenced:</b> ${esc(b.objective)}<br><b>Expected evidence:</b> ${esc(b.evidence)}</p>`:''}</div>`}).join(''):'<div class="empty">Complete a Studio mission with evidence to begin the portfolio.</div>'}`;}

function portfolioMarkdown(){
  const p=profile(),l=learner(),lines=[`# InventorLab Evidence Report — ${p.name}`,`Generated: ${new Date().toLocaleString()}`,'',`Track: ${p.track}`,'','## Skill evidence'];
  for(const s of CORE_SKILLS){const e=evidenceProfile(s);lines.push(`- ${s}: current=${e.label}${e.label==='Reconfirm'?` (historical best=${e.historicalLabel})`:''} — distinct strong projects ${e.diversity.distinctStrongProjects}, strong assessments ${e.diversity.strongAssessments}, verified reviews ${e.diversity.verifiedReviews}, transfer ${e.by.transfer}`);}
  lines.push('','## Completed Studio missions');
  const done=p.path.map(id=>BY_ID[id]).filter(m=>m&&missionDone(m.id));if(done.length)for(const m of done){const b=missionBlueprint(m);lines.push(`- ${m.title} (${m.tool}) — ${m.concept}${b?`\n  Objective: ${b.objective}\n  Evidence standard: ${b.evidence}`:''}`);}else lines.push('- None yet.');
  lines.push('','## Mission process evidence');const packets=l.attemptPackets||[];if(packets.length)for(const a of packets.slice(0,30)){lines.push(`- ${a.title}: rating ${a.rating}; support=${a.support}; hints=${a.hints}; learning rescues=${a.blockingRescues??a.adultRescues??0}; setup assists=${a.setupAssists||0}; self-diagnosis=${a.selfDiagnosisUses}; learning signal=${a.learningSignal?learningSignalLabel(a.learningSignal.category):'—'}; objective=${a.objective}`);if(a.mode==='explorer')lines.push(`  Prediction=${a.process?.prediction||(a.process?.predictionOral?'spoken/drawn':'—')}; observed=${a.process?.observation||(a.process?.observationOral?'spoken':'—')}; explanation=${a.process?.explanation||(a.process?.explanationOral?'spoken/drawn':'—')}`);else lines.push(`  Hypothesis=${a.process?.hypothesis||'—'}; criteria evidenced=${(a.process?.criteria?.items||[]).filter(x=>x.met).length}/${(a.process?.criteria?.items||[]).length}; test=${a.testSummary||'—'}`);}else lines.push('- None yet.');
  lines.push('','## Within-mission learning signals');const sig=l.learningSignals||[];if(sig.length)for(const x of sig.slice(0,30))lines.push(`- ${x.title} / ${x.skill}: ${learningSignalLabel(x.category)} (entry ${x.preCorrect?'correct':'not yet'} → later check ${x.postCorrect?'correct':'not yet'})`);else lines.push('- None yet.');lines.push('  Note: these are paired one-item pilot signals, not causal efficacy estimates.');
  lines.push('','## Verified retrieval');
  const ra=l.reviewAttempts||[];if(ra.length)for(const x of ra.slice(0,30))lines.push(`- ${x.correct?'PASS':'GAP'} — ${x.title} / ${x.skill} / ${new Date(x.date).toLocaleDateString()}${x.reasoning?` — ${x.reasoning}`:''}`);else lines.push('- None yet.');
  lines.push('','## Engineering test evidence');
  const tests=l.testLogs||[];if(tests.length)for(const t of tests.slice(0,20))lines.push(`- ${t.title}: ${testLogSummary(t)}; claim: ${t.claim||'—'}; limitation: ${t.limitation||'—'}; would weaken claim: ${t.falsifier||'—'}; decision: ${t.decision||'—'}`);else lines.push('- None yet.');
  lines.push('','## Recent journal');
  if(l.journals.length)for(const j of l.journals.slice(0,20))lines.push(`- ${j.title}: prediction=${j.prediction||'—'}; observed=${j.observed||'—'}; next=${j.change||'—'}; evidence=${j.evidence||'—'}`);else lines.push('- None yet.');
  lines.push('','## Evidence policy','Virtual labs and remediation are low-stakes evidence. Secure mastery requires independent project evidence plus independent corroboration. Repeating the same mission is practice, not a second independent proof; corroboration comes from a different strong project, an eligible independent assessment form, or verified delayed retrieval. Transfer requires explicit changed-context evidence plus verified assessment/retrieval corroboration. Historical mastery is preserved in the evidence record, but current status is capped at Reconfirm when delayed retrieval is due or newer contradictory evidence has not yet been recovered.');
  return lines.join('\n');
}
function exportPortfolioReport(){
  const text=portfolioMarkdown(),blob=new Blob([text],{type:'text/markdown'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`inventorlab-${state.activeLearner}-evidence-report.md`;a.click();URL.revokeObjectURL(url);toast('Evidence report downloaded.');
}

function independenceStats(){const packets=learner().attemptPackets||[],recs=Object.values(learner().missions),hints=recs.reduce((n,r)=>n+(r.hints||0),0);if(packets.length){const independent=packets.filter(x=>x.rating>=3&&['independent','independent-with-setup'].includes(x.support)).length,adult=packets.filter(x=>(x.blockingRescues??x.adultRescues??0)>0).length,setup=packets.filter(x=>(x.setupAssists||0)>0).length;return{pct:Math.round(independent/packets.length*100),hints,ratings:packets.length,independent,adult,setup};}const ratings=recs.flatMap(r=>r.ratings||[]);if(!ratings.length)return{pct:0,hints,ratings:0,independent:0,adult:0,setup:0};const independent=ratings.filter(x=>x.rating>=3).length;return{pct:Math.round(independent/ratings.length*100),hints,ratings:ratings.length,independent,adult:0,setup:0};}
function overconfidenceCount(){return learner().assessments.reduce((n,a)=>n+(a.overconfidence||0),0);}
function platformStats(){const path=profile().path.map(id=>BY_ID[id]).filter(Boolean);const map={};for(const m of path){if(!map[m.tool])map[m.tool]={n:0,d:0};map[m.tool].n++;if(missionDone(m.id))map[m.tool].d++;}return map;}
function evidenceDiversitySummary(){const rows=CORE_SKILLS.map(skill=>({skill,e:evidenceProfile(skill)})),single=rows.filter(x=>x.e.strongMission&&!x.e.corroborated),secure=rows.filter(x=>x.e.rank>=3),diverse=secure.filter(x=>x.e.diversity.independentSources>=2||x.e.diversity.distinctStrongProjects>=2);return{single,secure,diverse};}
function evidenceDiversityPanelHTML(){const d=evidenceDiversitySummary();if(!d.single.length)return `<div class="info-box good-box"><b>🔎 Proof diversity:</b> no skill currently depends on one strong project alone. Secure labels require independent corroboration.</div>`;return `<div class="proof-diversity"><span class="tag">ONE MORE KIND OF PROOF NEEDED</span><h3>${d.single.length} skill${d.single.length===1?' has':'s have'} strong project evidence but not independent corroboration</h3>${d.single.slice(0,6).map(x=>`<div class="freshness-row"><b>${esc(x.skill)}</b><span>${x.e.diversity.distinctStrongProjects} distinct strong project • ${x.e.diversity.strongAssessments} strong assessment • ${x.e.diversity.verifiedReviews} verified review</span><button class="ghost" data-action="start-assessment" data-skill="${esc(x.skill)}">Independent check</button></div>`).join('')}</div>`;}
function masteryFreshnessSummary(){
  const rows=CORE_SKILLS.map(skill=>({skill,e:evidenceProfile(skill)}));
  return{reconfirm:rows.filter(x=>x.e.label==='Reconfirm'),currentSecure:rows.filter(x=>x.e.rank>=3),historicalSecure:rows.filter(x=>x.e.historicalRank>=3)};
}
function freshnessPanelHTML(){
  const f=masteryFreshnessSummary();
  if(!f.historicalSecure.length)return '<div class="info-box"><b>Knowledge freshness:</b> Secure/Transfer evidence has not been established yet.</div>';
  if(!f.reconfirm.length)return `<div class="info-box good-box"><b>🧠 Knowledge freshness:</b> all ${f.currentSecure.length} currently Secure/Transfer skill${f.currentSecure.length===1?' is':'s are'} up to date. Historical success is not being contradicted by newer evidence.</div>`;
  return `<div class="freshness-alert"><div><span class="tag">RECONFIRM BEFORE RELYING ON IT</span><h3>${f.reconfirm.length} skill${f.reconfirm.length===1?'':'s'} have older mastery but need current verification</h3></div>${f.reconfirm.map(x=>`<div class="freshness-row"><b>${esc(x.skill)}</b><span>historical ${esc(x.e.historicalLabel)} → current Reconfirm</span><button class="ghost" data-action="start-assessment" data-skill="${esc(x.skill)}">Check now</button></div>`).join('')}</div>`;
}
function renderParent(){
  const p=profile(),next=recommendedMission(),diversity=evidenceDiversitySummary(),unfinished=Object.values(learner().missionDrafts||{}).filter(d=>d&&!d.completed).length,gain=learningSignalSummary(),ind=independenceStats(),rescueStats=rescueSummary(),rescues=rescueStats.blocking.length,setupAssists=rescueStats.setup.length,tests=(learner().testLogs||[]).length,labs=(learner().labAttempts||[]).length,labVariants=new Set((learner().labAttempts||[]).filter(x=>x.success&&x.scenarioId).map(x=>`${x.labId}:${x.scenarioId}`)).size,verifiedReviews=(learner().reviewAttempts||[]).filter(x=>x.correct).length,reviewGaps=(learner().reviewAttempts||[]).filter(x=>!x.correct).length,fresh=masteryFreshnessSummary(),mis=Object.entries(learner().misconceptions).sort((a,b)=>(b[1].count||0)-(a[1].count||0)).slice(0,4),plat=platformStats(),transfer=evidencePoints('Transfer'),reviewsDue=learner().reviews.filter(r=>new Date(r.due)<=new Date()).length,ss=sessionStats(),funnel=sessionFunnelStats(),reviews=learner().designReviews||[],engVal=state.activeLearner==='philip'?engineerValidationContexts():null;
  const designAvg=reviews.length?(reviews.reduce((n,r)=>n+(r.total||0),0)/reviews.length).toFixed(1):'—',testQuality=tests?((learner().testLogs||[]).reduce((n,t)=>n+((t.quality||testLogQuality(t)).score),0)/tests).toFixed(1):'—',cp=next?conceptProfile(next):CONCEPTS.Transfer;
  const actions=[];
  if(diversity.single.length)actions.push(`Strengthen ${diversity.single[0].skill} with a different kind of proof; repeating the same project should not be treated as corroboration.`);
  if(fresh.reconfirm.length)actions.push(`Reconfirm ${fresh.reconfirm[0].skill} before treating its older ${fresh.reconfirm[0].e.historicalLabel} evidence as current readiness.`);
  if(ss.n===0)actions.push('Run one focused Session and log where adult help was genuinely needed.');
  else if(state.activeLearner==='faye'&&ss.incomplete>0)actions.push('Do not judge self-learning only from completed attempts: inspect why the recent unfinished session stopped, then fix or retest that friction.');
  else if(ss.translation/ss.n>.25)actions.push('Capture the exact sentence or word that required adult translation; treat it as a product-language defect.');
  if(state.activeLearner==='philip'&&engVal&&engVal.qualifiedIds.length>0&&engVal.qualifiedIds.length<3)actions.push('Validate challenge depth across different engineering missions; repeating one polished build does not prove the whole Engineer pathway is demanding enough.');
  if(ind.adult>=2)actions.push('Prioritise an independence retry on a previously adult-assisted mission; use the built-in symptom checker before giving a grown-up prompt.');
  else if(ind.ratings>0&&ind.pct<60)actions.push('Do not add harder content yet; use the Learning Coach on the most common bottleneck and retest transfer.');
  if(transfer<4)actions.push('Schedule one changed-context task so the learner must use the same concept somewhere new.');
  if(reviewGaps>verifiedReviews&&reviewGaps>=2)actions.push('Prioritise delayed retrieval repair: more review gaps than verified retrieval passes have been observed.');
  if(gain.n>=3&&(gain.repair+gain.mixed)>gain.newly+gain.confirmed)actions.push('Recent within-mission learning signals show more unresolved/inconsistent checks than successful uptake. Slow the path and repair the weakest concept before adding difficulty.');
  if(state.activeLearner==='philip'&&tests&&Number(testQuality)<4)actions.push('Raise engineering evidence quality: require distinct trial results plus a claim, limitation and evidence-based decision.');else if(state.activeLearner==='philip'&&reviews.length&&Number(designAvg)<7)actions.push('Raise evidence quality: require repeated trials, measurements and one abnormal/failure case before accepting the next build.');
  if(!actions.length)actions.push('Keep the current pace. Avoid adding adult explanation unless safety or physical setup requires it.');
  document.getElementById('parentBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">PARENT / TEACHER</p><h1 id="parentTitle">What should I actually do next?</h1></div><div class="button-row"><button class="secondary" data-page="summary">🖨️ One-page summary</button><button class="ghost" data-action="switch-learner">${p.emoji} ${p.name} • switch</button></div></div>
  <div class="metric-grid"><div class="metric"><span class="tag">UNFINISHED DRAFTS</span><strong>${unfinished}</strong><small>safe to resume without creating a new attempt</small></div><div class="metric"><span class="tag">RATED-ATTEMPT INDEPENDENCE</span><strong>${ind.pct}%</strong><small>among rated attempt packets only; unfinished sessions are shown separately</small></div>${state.activeLearner==='faye'?`<div class="metric session-validity-metric"><span class="tag">SESSION VIABILITY</span><strong>${funnel.valid}/${funnel.started||0}</strong><small>${funnel.completed} reached a rated endpoint • ${ss.incomplete} incomplete • ${funnel.retained} later retained</small></div>`:`<div class="metric"><span class="tag">DISTINCT ENGINEERING CONTEXTS</span><strong>${engVal?.qualifiedIds.length||0}</strong><small>${engVal?.distinctReviews||0} reviewed • ${engVal?.distinctTests||0} with test logs • ${engVal?.distinctTransfers||0} Transfer contexts</small></div>`}${state.activeLearner==='faye'?`<div class="metric rescue-metric"><span class="tag">LEARNING RESCUES</span><strong>${rescues}</strong><small>wording / navigation / debugging / concept help that affects independence evidence</small></div><div class="metric"><span class="tag">SETUP / SAFETY ASSISTS</span><strong>${setupAssists}</strong><small>tracked separately; allowed without reducing mastery</small></div>`:`<div class="metric"><span class="tag">TEST EVIDENCE</span><strong>${tests}</strong><small>${tests?`average quality ${testQuality}/6`:'no structured logs yet'}</small></div>`}<div class="metric"><span class="tag">ADULT TRANSLATION</span><strong>${ss.translation}</strong><small>sessions needing website translation</small></div><div class="metric"><span class="tag">TRANSFER</span><strong>${transfer.toFixed(1)}</strong><small>evidence points, not a grade</small></div><div class="metric"><span class="tag">VIRTUAL LABS</span><strong>${labVariants}</strong><small>distinct equipment-free scenarios solved • ${labs} total attempts</small></div><div class="metric"><span class="tag">VERIFIED RETRIEVAL</span><strong>${verifiedReviews}</strong><small>${reviewGaps} delayed retrieval gap${reviewGaps===1?'':'s'} found</small></div><div class="metric"><span class="tag">PROOF DIVERSITY</span><strong>${diversity.single.length}</strong><small>skills with one strong project but no independent corroboration yet</small></div><div class="metric ${fresh.reconfirm.length?'reconfirm-metric':''}"><span class="tag">MASTERY TO RECONFIRM</span><strong>${fresh.reconfirm.length}</strong><small>${fresh.historicalSecure.length} skill${fresh.historicalSecure.length===1?'':'s'} ever reached Secure/Transfer</small></div>${state.activeLearner==='philip'?`<div class="metric"><span class="tag">DESIGN REVIEW</span><strong>${designAvg}</strong><small>average /12 evidence quality</small></div>`:`<div class="metric"><span class="tag">HINT USE</span><strong>${ind.hints}</strong><small>hints across attempts</small></div>`}<div class="metric"><span class="tag">REVIEW DUE</span><strong>${reviewsDue}</strong><small>retrieval checks</small></div><div class="metric"><span class="tag">LEARNING SIGNALS</span><strong>${gain.newly}</strong><small>newly demonstrated • ${gain.confirmed} confirmed prior • ${gain.repair+gain.mixed} need repair/recheck</small></div></div>${freshnessPanelHTML()}${evidenceDiversityPanelHTML()}${state.activeLearner==='faye'?`<h2>Recent self-learning validation</h2>${validationTimelineHTML()}<p class="muted">A session does not become “independent” merely because the adult forgot to press a rescue button. The parent debrief and incomplete-session status are part of the validation evidence.</p>`:''}
  <h2>3 useful parent actions</h2>${actions.slice(0,3).map((x,i)=>`<div class="action-plan"><b>${i+1}. ${esc(x)}</b></div>`).join('')}<h2>Recent within-mission learning signals</h2>${gain.recent.length?`<div class="signal-list">${gain.recent.map(x=>`<div class="signal-row ${esc(x.category)}"><b>${esc(x.title)}</b><span>${esc(x.skill)} • ${esc(learningSignalLabel(x.category))}</span><small>entry ${x.preCorrect?'correct':'not yet'} → later check ${x.postCorrect?'correct':'not yet'}</small></div>`).join('')}</div><p class="muted">These are low-cost pilot signals from one starting item and one later concept item. Use trends across sessions; do not treat them as proof of causal learning efficacy.</p>`:'<div class="info-box">No paired starting/later concept checks yet.</div>'}
  <h2>This week: three purposeful sessions</h2>${weeklyLearningPlanHTML()}
  ${next?`<h2>Coach the next mission without taking over</h2><div class="two-col"><div class="insight"><b>Next: ${next.icon} ${esc(next.title)}</b><p>Target concept: <b>${esc(primarySkill(next))}</b></p>${missionBlueprint(next)?`<p><b>Learning objective:</b> ${esc(missionBlueprint(next).objective)}</p><p><b>Evidence to expect:</b> ${esc(missionBlueprint(next).evidence)}</p>`:''}<p>Ask: ${esc(cp.parent.join(' • '))}</p></div><div class="warning-box"><b>Avoid:</b><p>${esc(cp.avoid)}</p><p>${esc(missionBlueprint(next)?.adult||next.coach)}</p></div></div>`:''}
  <h2>Recurring misconception signals</h2>${mis.length?mis.map(([s,v])=>`<div class="insight"><b>${esc(s)}</b> • ${v.count} signal${v.count===1?'':'s'}<p>${esc((CONCEPTS[s]||CONCEPTS.Prediction).remedy)}</p></div>`).join(''):'<div class="info-box">No recurring misconception pattern recorded yet.</div>'}
  <h2>Platform progress</h2><div class="panel">${Object.entries(plat).map(([tool,v])=>{const pct=Math.round(v.d/v.n*100);return`<div class="platform-row"><b>${esc(tool)}</b><div class="mini-bar"><span style="width:${pct}%"></span></div><span>${v.d}/${v.n}</span></div>`}).join('')}</div>
  <h2>Beta testing loop</h2><div class="info-box"><b>Use → observe → log → fix product → retest.</b><p>Do not interpret a child asking for adult translation as a learner weakness until the wording itself has been tested.</p><button class="secondary" data-page="session">Open focused Session mode</button></div>
  <h2>Commercial-readiness honesty</h2><div class="commercial-note"><b>Free public beta — local-first, no account required.</b><p>The pedagogical loop is stronger, but commercial release still needs authenticated accounts, secure cloud storage, consent/privacy workflows, real uploads, external curriculum review, telemetry governance and broader usability validation.</p></div>`;
}
/*
  One sheet an adult can print, take to a parent evening, or keep in a folder.
  Deliberately plain: what was aimed at, what was evidenced, how independently, what to do next.
*/
function renderTeacherSummary(){
  const p=profile(),l=learner(),ind=independenceStats(),rs=rescueSummary(),fresh=masteryFreshnessSummary();
  const strands=curriculumStrandProgress();
  const done=p.path.filter(missionDone),pct=p.path.length?Math.round(done.length/p.path.length*100):0;
  const packets=(l.attemptPackets||[]).slice(0,6);
  const skills=CORE_SKILLS.map(sk=>({sk,e:evidenceProfile(sk)})).filter(x=>x.e.rank>0).sort((a,b)=>b.e.rank-a.e.rank);
  const gaps=CORE_SKILLS.map(sk=>({sk,e:evidenceProfile(sk)})).filter(x=>x.e.rank===0).map(x=>x.sk);
  const next=recommendedMission(),cp=next?conceptProfile(next):CONCEPTS.Prediction;
  document.getElementById('summaryBody').innerHTML=`<div class="section-head no-print"><div><p class="eyebrow">FOR A PARENT OR TEACHER</p><h1 id="summaryTitle">One-page learning summary</h1><p>Everything below is generated from evidence recorded on this device. Nothing is uploaded.</p></div><div class="button-row"><button class="primary" data-action="print-page">Print or save as PDF</button><button class="ghost" data-page="parent">Back to full view</button></div></div>
  <article class="summary-sheet">
    <header class="summary-head"><div><h2>${p.emoji} ${esc(p.name)} \u2014 ${esc(p.track)} track${p.noKit?' (browser-only path)':''}</h2><p>InventorLab Academy \u2022 summary generated ${new Date().toLocaleDateString()}</p></div><div class="summary-score"><strong>${pct}%</strong><small>of the current path evidenced</small></div></header>

    <section><h3>What this path is teaching</h3>${Object.keys(strands).length?`<div class="table-wrap"><table class="summary-table"><thead><tr><th>Strand</th><th>Evidenced</th><th>Learning targets</th></tr></thead><tbody>${Object.entries(strands).map(([name,v])=>`<tr><td><b>${esc(name)}</b></td><td>${v.d}/${v.n}</td><td>${v.objectives.map(o=>`${o.done?'\u2713':'\u25cb'} ${esc(o.objective)}`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`:'<p>No missions on the current path yet.</p>'}</section>

    <section><h3>Independence</h3><div class="summary-grid"><div><b>${ind.pct}%</b><small>of rated attempts were independent</small></div><div><b>${rs.blocking.length}</b><small>times an adult had to help with the thinking</small></div><div><b>${rs.setup.length}</b><small>setup or safety assists (these are fine)</small></div><div><b>${ind.hints}</b><small>hints opened across all attempts</small></div></div><p class="summary-note">Help with charging, pairing, cables and safety does not reduce mastery here. Help with wording, navigation, debugging or the answer does, and is counted separately on purpose.</p></section>

    <section><h3>Skills with evidence</h3>${skills.length?`<ul class="summary-skills">${skills.map(x=>`<li><b>${esc(x.sk)}</b> \u2014 ${esc(x.e.label)} <small>(${x.e.by.mission} project, ${x.e.by.assessment} concept check, ${x.e.by.review} delayed review)</small></li>`).join('')}</ul>`:'<p>No skill has recorded evidence yet.</p>'}${gaps.length?`<p class="summary-note"><b>Not yet evidenced:</b> ${gaps.map(esc).join(', ')}.</p>`:''}${fresh.reconfirm.length?`<p class="summary-note"><b>Due for reconfirmation:</b> ${fresh.reconfirm.map(x=>esc(x.skill)).join(', ')} \u2014 previously strong, not checked recently.</p>`:''}</section>

    <section><h3>Recent work</h3>${packets.length?`<div class="table-wrap"><table class="summary-table"><thead><tr><th>Mission</th><th>Rating</th><th>Support</th><th>When</th></tr></thead><tbody>${packets.map(a=>`<tr><td>${esc(a.title)}</td><td>${a.rating}/4</td><td>${esc(a.support)}</td><td>${new Date(a.completedAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`:'<p>No rated attempts recorded yet.</p>'}</section>

    ${next?`<section><h3>What to do next \u2014 and what to say</h3><p><b>Next mission:</b> ${next.icon} ${esc(next.title)} (${esc(next.tool)}, about ${next.mins} minutes). Target concept: <b>${esc(primarySkill(next))}</b>.</p><p><b>Good questions to ask:</b> ${esc(cp.parent.join(' \u2022 '))}</p><p><b>Worth avoiding:</b> ${esc(cp.avoid)}</p></section>`:''}

    <footer class="summary-foot">Generated locally by InventorLab Academy. Ratings are evidence of what was shown on the day, not a grade or a diagnosis.</footer>
  </article>`;
}
/* Roster management, plus a picker so switching does not mean cycling through everyone. */
function rosterManagerHTML(){
  const keys=learnerKeys();
  return `<h2>Learners on this device</h2>
  <p class="muted">Each learner keeps their own path, evidence and reviews. Everything stays in this browser \u2014 there is still no login and nothing is uploaded.</p>
  <div class="roster-list">${keys.map(k=>{
    const e=rosterEntry(k),active=k===state.activeLearner;
    const done=((state.learners[k]||{}).attemptPackets||[]).length;
    return `<div class="roster-row ${active?'active':''}">
      <span class="roster-emoji">${e.emoji||'\ud83c\udf1f'}</span>
      <div class="roster-main">
        <label class="sr-only" for="rn-${esc(k)}">Name for this learner</label>
        <input id="rn-${esc(k)}" class="roster-name" type="text" value="${esc(publicDisplayName(k))}" data-rename="${esc(k)}" maxlength="40">
        <small>${esc(e.track)} track \u2022 ${done} rated attempt${done===1?'':'s'}${active?' \u2022 currently selected':''}</small>
      </div>
      <div class="roster-actions">
        ${active?'<span class="pill good">selected</span>':`<button class="secondary" data-action="select-learner" data-key="${esc(k)}">Select</button>`}
        ${keys.length>1?`<button class="danger" data-action="remove-learner" data-key="${esc(k)}">Remove</button>`:''}
      </div></div>`;}).join('')}</div>
  <div class="roster-add">
    <label class="sr-only" for="newLearnerName">New learner name</label>
    <input id="newLearnerName" type="text" placeholder="New learner's name" maxlength="40">
    <label class="sr-only" for="newLearnerTrack">Track</label>
    <select id="newLearnerTrack"><option value="Explorer">Explorer \u2014 new to coding</option><option value="Engineer">Engineer \u2014 has coded before</option></select>
    <button class="primary" data-action="add-learner">Add learner</button>
  </div>
  <p class="muted">Up to twelve. Removing a learner deletes their evidence on this device and cannot be undone.</p>`;
}
function renderLearnerPanel(){
  const el=document.getElementById('learnerPanel');if(!el)return;
  const keys=learnerKeys();
  el.innerHTML=`<div class="reading-panel-head"><b>\ud83d\udc64 Who is working?</b><button class="ghost" data-action="open-learner-panel">Close</button></div>
  <div class="learner-pick">${keys.map(k=>{const e=rosterEntry(k);return `<button class="${k===state.activeLearner?'on':''}" data-action="select-learner" data-key="${esc(k)}"><span>${e.emoji||'\ud83c\udf1f'}</span><b>${esc(publicDisplayName(k))}</b><small>${esc(e.track)}</small></button>`;}).join('')}</div>
  ${(state.prefs.viewMode||'learner')==='adult'?'<p class="muted">Add or remove learners in Settings.</p>':''}`;
}
function toggleLearnerPanel(force){
  const el=document.getElementById('learnerPanel'),btn=document.getElementById('learnerChip');
  if(!el)return;
  const open=typeof force==='boolean'?force:el.hidden;
  if(open)renderLearnerPanel();
  el.hidden=!open;
  if(btn)btn.setAttribute('aria-expanded',String(open));
  if(open){const h=el.querySelector('.reading-panel-head b');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}}
  else if(btn)btn.focus();
}
function renderSettings(){document.getElementById('settingsBody').innerHTML=`<div class="section-head"><div><p class="eyebrow">BETA SETTINGS & DATA</p><h1 id="settingsTitle">Equipment, accessibility and backups</h1></div></div>${rosterManagerHTML()}<h2>Kits & platforms actually available</h2><p>InventorLab no longer assumes a new family owns everything. Select what the learner can genuinely use. <b>Web browser</b> is selected by default so the free labs remain available.</p><div class="equipment-grid">${ALL_GEAR.map(g=>`<label><input type="checkbox" data-action="gear" data-gear="${esc(g)}" ${state.equipment.includes(g)?'checked':''}> ${esc(g)}</label>`).join('')}</div><div class="button-row" style="margin-top:12px"><button class="primary" data-action="confirm-equipment">${state.prefs.equipmentConfirmed?'Equipment list confirmed ✓':'Confirm equipment list'}</button><button class="secondary" data-action="labs-home">Try without hardware</button></div><div class="info-box" style="margin-top:12px"><b>Missing a kit is not a learning failure.</b> The planner keeps the physical Studio mission in sequence and offers a virtual concept lab for practice. Virtual success cannot mark the hardware project complete.</div><h2>2-minute equipment preflight guides</h2>${selectedGearGuidesHTML()}<h2>Learning path</h2>${noKitSwitchHTML()}<h2>Reading comfort</h2><p class="muted">Also available to the learner from the <b>Aa</b> button in the top bar, since this page is adult-only.</p>${readingControlsHTML()}<div class="button-row" style="margin-top:10px"><button class="ghost" data-action="toggle-focus">${state.prefs.focus?'Exit focus mode':'Use focus mode'}</button></div><h2>Data & privacy</h2><div class="info-box"><b>Public beta learning data is stored only in this browser’s local storage.</b> There is no login, cloud sync, analytics beacon or automatic feedback upload. Export a backup before clearing browser data or changing devices.</div><div class="button-row" style="margin-top:12px"><button class="primary" data-action="export">Download progress backup</button><label class="ghost" style="display:inline-block">Import backup <input id="importFile" type="file" accept="application/json" hidden></label><button class="danger" data-action="reset">Reset local beta data</button></div><h2>Keyboard</h2><p><span class="pill">Alt+H Home</span> <span class="pill">Alt+P My Path</span> <span class="pill">Alt+R Review</span> <span class="pill">Esc exits Focus</span></p>`;}
function toggleGear(g,on){if(on&&!state.equipment.includes(g))state.equipment.push(g);if(!on)state.equipment=state.equipment.filter(x=>x!==g);save();}
function totalEvidenceCount(){return learnerKeys().reduce((n,k)=>n+(((state.learners[k]||{}).attemptPackets)||[]).length,0);}
function exportState(){
  const payload={product:'InventorLab Public Beta',schema:9,exportedAt:nowISO(),
    learners:learnerKeys().map(k=>({name:publicDisplayName(k),track:rosterEntry(k).track})),
    ratedAttempts:totalEvidenceCount(),state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  const stamp=new Date().toISOString().slice(0,10);
  a.href=url;a.download=`inventorlab-backup-${stamp}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  /* Remember that a backup happened, so the nudge can stop pestering. */
  state.prefs.lastBackupAt=nowISO();
  state.prefs.lastBackupCount=totalEvidenceCount();
  save();
  dismissBackupNudge();
  toast('Backup downloaded. Keep it somewhere that is not this device.');
}
/*
  Restoring used to overwrite everything with no warning, so a parent restoring onto a
  device that already had progress destroyed it without being asked. It now says exactly
  what will be replaced, and refuses a file from a newer schema it cannot understand.
*/
function importState(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    let incoming,meta;
    try{
      const data=JSON.parse(r.result);
      meta=data;incoming=data.state||data;
      if(!incoming||!incoming.learners)throw Error('not a backup');
    }catch(e){toast('That file is not an InventorLab backup.');return;}
    if(Number(meta.schema)>9){toast('That backup came from a newer version of InventorLab. Update the site first.');return;}
    const existing=totalEvidenceCount();
    const incomingCount=Object.values(incoming.learners||{}).reduce((n,l)=>n+((l&&l.attemptPackets)||[]).length,0);
    const when=meta.exportedAt?new Date(meta.exportedAt).toLocaleDateString():'an unknown date';
    if(existing>0&&!confirm(
      `Restore this backup?\n\nBackup: ${incomingCount} rated attempt(s), saved ${when}.\nThis device right now: ${existing} rated attempt(s).\n\nRestoring REPLACES what is on this device. If you have not exported the current progress, cancel and do that first.`
    ))return;
    state=mergeState(clone(DEFAULT_STATE),incoming);
    state.schema=9;
    save();applyPrefs();updateLearnerChip();
    toast(`Backup restored \u2014 ${learnerKeys().length} learner(s), ${totalEvidenceCount()} rated attempt(s).`);
    showPage('home');
  };
  r.readAsText(file);
}
function resetState(){if(!confirm('Reset all InventorLab Public Beta progress stored in this browser? This cannot be undone unless you exported a backup.'))return;state=clone(DEFAULT_STATE);save();ui={...ui,currentMissionId:null,diag:null,assess:null};showPage('home');toast('Local progress reset.');}

function libraryChanged(){const q=document.getElementById('librarySearch'),quality=document.getElementById('qualityFilter'),level=document.getElementById('levelFilter'),tool=document.getElementById('toolFilter');ui.library={q:q?.value||'',quality:quality?.value||'studio',level:level?.value||'all',tool:tool?.value||'all',ready:!!document.getElementById('readyFilter')?.checked,interest:ui.library.interest||''};renderLibrary();const s=document.getElementById('librarySearch');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}}

function handleClick(e){
  if(e.target.classList&&e.target.classList.contains('celebrate')){closeCelebrate();return;}
  const page=e.target.closest('[data-page]');if(page){showPage(page.dataset.page);return;}
  const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
  if(a==='finish-beta-onboarding')guardedFinishBetaOnboarding();
  else if(a==='quick-browser-trial'){finishBetaOnboarding(true);}
  else if(a==='copy-feedback')copyFeedback();
  else if(a==='download-feedback')downloadText('inventorlab-beta-feedback.txt',feedbackText());
  else if(a==='switch-learner'){if(learnerKeys().length>2)toggleLearnerPanel();else switchLearner();}
  else if(a==='open-learner-panel')toggleLearnerPanel();
  else if(a==='select-learner'){toggleLearnerPanel(false);selectLearner(b.dataset.key);}
  else if(a==='add-learner')addLearner(document.getElementById('newLearnerName')?.value,document.getElementById('newLearnerTrack')?.value);
  else if(a==='remove-learner')removeLearner(b.dataset.key);
  else if(a==='toggle-view'){state.prefs.viewMode=(state.prefs.viewMode||'learner')==='adult'?'learner':'adult';save();if(state.prefs.viewMode!=='adult'&&['session','alpha','parent','settings'].includes(ui.page))showPage('home');else renderPage(ui.page);}
  else if(a==='start-family-session')startFamilySession();
  else if(a==='resume-mission')openMission(b.dataset.id);
  else if(a==='fresh-attempt')startFreshMission(b.dataset.id);
  else if(a==='end-session')endFamilySession();
  else if(a==='save-session-observation')saveSessionObservation();
  else if(a==='vocab')toggleVocab(b.dataset.skill);
  else if(a==='commit-challenge')commitChallenge(b.dataset.id);
  else if(a==='save-design-review')saveDesignReview(b.dataset.id);
  else if(a==='save-test-log')saveTestLog(b.dataset.id);
  else if(a==='entry-probe-answer')entryProbeAnswer(b);
  else if(a==='entry-probe-confidence')entryProbeConfidence(b);
  else if(a==='entry-probe-unsure')entryProbeUnsure(b.dataset.id);
  else if(a==='explorer-next')explorerNext(Number(b.dataset.delta||1));
  else if(a==='explorer-prev')explorerNext(-1);
  else if(a==='read-step')readCurrentStep(b);
  else if(a==='explorer-help')explorerHelp();
  else if(a==='adult-rescue')showAdultRescueReasons();
  else if(a==='adult-rescue-reason')recordAdultRescue(b.dataset.reason);
  else if(a==='troubleshoot-choice')chooseTroubleshoot(b.dataset.id,Number(b.dataset.index));
  else if(a==='defect-status')markDefect(b.dataset.id,b.dataset.status);
  else if(a==='export-alpha-report')exportAlphaReport();
  else if(a==='remediation-answer')remediationAnswer(b.dataset.skill,Number(b.dataset.answer),b);
  else if(a==='verify-review')verifyReview(b.dataset.id,Number(b.dataset.answer));
  else if(a==='export-portfolio')exportPortfolioReport();
  else if(a==='open-chapter')openChapter(b.dataset.skill);
  else if(a==='open-lab')openLab(b.dataset.lab,b.dataset.skill||null);
  else if(a==='new-lab-scenario')newLabScenario(b.dataset.lab);
  else if(a==='labs-home'){ui.currentLab=null;showPage('labs');}
  else if(a==='lab-trace-reveal')revealTraceStep();
  else if(a==='lab-trace-reset')resetTrace(true);
  else if(a==='lab-trace-independent')resetTrace(true);
  else if(a==='lab-trace-answer')answerTrace(Number(b.dataset.answer));
  else if(a==='lab-grid-add')gridAdd(b.dataset.token);
  else if(a==='lab-grid-undo')gridUndo();
  else if(a==='lab-grid-clear')gridClear();
  else if(a==='lab-grid-run')runGrid();
  else if(a==='lab-sensor-run')runSensor();
  else if(a==='lab-cal-baseline')calibrationBaseline();
  else if(a==='lab-cal-run')runCalibration();
  else if(a==='confirm-equipment'){state.prefs.equipmentConfirmed=true;save();renderSettings();toast('Equipment list confirmed.');}
  else if(a==='chapter-answer')answerChapterQuestion(b.dataset.skill,Number(b.dataset.q),Number(b.dataset.answer),b);
  else if(a==='print-page')window.print();
  else if(a==='start-mission')openMission(b.dataset.id);
  else if(a==='reveal-hint')revealHint(b.dataset.id,Number(b.dataset.index));
  else if(a==='unlock-test'){document.getElementById('testStage')?.removeAttribute('hidden');document.getElementById('testStage')?.scrollIntoView({behavior:'smooth',block:'center'});}
  else if(a==='reveal-observe'){document.getElementById('observeStage')?.removeAttribute('hidden');document.getElementById('observeStage')?.scrollIntoView({behavior:'smooth',block:'center'});}
  else if(a==='complete-mission')completeMission(b.dataset.id,b.dataset.rating);
  else if(a==='save-artifact')saveArtifact(b.dataset.id);
  else if(a==='read-mission')readMission(b.dataset.id);
  else if(a==='quick-answer')quickAnswer(b);
  else if(a==='practice-skill')practiceSkill(b.dataset.skill);
  else if(a==='complete-remediation')completeRemediation(b.dataset.skill);
  else if(a==='start-assessment')startAssessment(b.dataset.skill);
  else if(a==='assessment-answer')assessmentAnswer(b.dataset.index);
  else if(a==='assessment-confidence')assessmentConfidence(b.dataset.confidence);
  else if(a==='assessment-exit'){ui.assess=null;renderAssessmentHome();}
  else if(a==='review-rate')rateReview(b.dataset.id,b.dataset.rate);
  else if(a==='start-diagnostic')startDiagnostic(b.dataset.who);
  else if(a==='diagnostic-answer')diagnosticAnswer(b.dataset.index);
  else if(a==='diagnostic-confidence')diagnosticConfidence(b.dataset.confidence);
  else if(a==='diagnostic-exit'){ui.diag=null;renderDiagnostic();}
  else if(a==='save-journal')saveJournal();
  else if(a==='prefill-journal')prefillJournal();
  else if(a==='toggle-large'){state.prefs.textSize=(state.prefs.textSize||'normal')==='normal'?'large':'normal';save();renderSettings();}
  else if(a==='library-interest'){ui.library.interest=b.dataset.interest||'';renderLibrary();}
  else if(a==='open-reading')toggleReadingPanel();
  else if(a==='text-size'){state.prefs.textSize=b.dataset.size;save();refreshPrefsUI();}
  else if(a==='font-style'){state.prefs.fontStyle=b.dataset.font;save();refreshPrefsUI();}
  else if(a==='motion-pref'){state.prefs.motion=b.dataset.motion;save();refreshPrefsUI();}
  else if(a==='theme-pref'){state.prefs.theme=b.dataset.theme;save();refreshPrefsUI();}
  else if(a==='toggle-nokit')toggleNoKitPath(b.dataset.on==='1');
  else if(a==='learner-self-start')startAsLearner(b.dataset.track);
  else if(a==='close-celebrate')closeCelebrate();
  else if(a==='apply-update')applyUpdate();
  else if(a==='reload-page')location.reload();
  else if(a==='dismiss-backup-nudge')dismissBackupNudge();
  else if(a==='do-install')doInstall();
  else if(a==='dismiss-install')dismissInstall();
  else if(a==='open-summary'){showPage('summary');}
  else if(a==='print-summary'){showPage('summary');setTimeout(()=>window.print(),200);}
  else if(a==='toggle-focus'){state.prefs.focus=!state.prefs.focus;save();renderSettings();}
  else if(a==='export')exportState();
  else if(a==='reset')resetState();
}
function handleChange(e){
  if(e.target.matches('[data-rename]')){renameLearner(e.target.dataset.rename,e.target.value);return;}if(e.target.matches('[data-action="gear"]'))toggleGear(e.target.dataset.gear,e.target.checked);if(e.target.id==='qualityFilter'||e.target.id==='levelFilter'||e.target.id==='toolFilter'||e.target.id==='readyFilter')libraryChanged();if(e.target.id==='importFile')importState(e.target.files[0]);if(ui.page==='lesson'&&e.target.closest('#lessonBody'))scheduleMissionAutosave();}
let searchTimer;function handleInput(e){if(e.target.id==='librarySearch'){clearTimeout(searchTimer);searchTimer=setTimeout(libraryChanged,140);}if(e.target.id==='sensorThreshold'){const l=document.getElementById('sensorThresholdLabel');if(l)l.textContent=e.target.value;}if(ui.page==='lesson'&&e.target.closest('#lessonBody'))scheduleMissionAutosave();}

document.addEventListener('click',handleClick);
document.addEventListener('change',handleChange);
document.addEventListener('input',handleInput);
window.addEventListener?.('beforeunload',()=>{if(ui.page==='lesson')captureMissionDraft(true);});
document.addEventListener('keydown',e=>{const lp=document.getElementById('learnerPanel');if(e.key==='Escape'&&lp&&!lp.hidden){toggleLearnerPanel(false);return;}const rp=document.getElementById('readingPanel');if(e.key==='Escape'&&rp&&!rp.hidden){toggleReadingPanel(false);return;}if(e.key==='Escape'&&document.querySelector('.celebrate')){closeCelebrate();return;}if(e.key==='Escape'&&state.prefs.focus){state.prefs.focus=false;save();toast('Focus mode off.');}if(e.altKey&&e.key.toLowerCase()==='h')showPage('home');if(e.altKey&&e.key.toLowerCase()==='p')showPage('path');if(e.altKey&&e.key.toLowerCase()==='r')showPage('review');});

applyPrefs();watchSystemTheme();updateLearnerChip();announceStorage();registerServiceWorker();watchInstallPrompt();announceNetwork();maybeShowBackupNudge();
window.addEventListener('online',announceNetwork);window.addEventListener('offline',announceNetwork);
if(!state.prefs.betaOnboarded){ui.page='welcome';showPage('welcome');}
else if(!restoreLastView())renderHome();

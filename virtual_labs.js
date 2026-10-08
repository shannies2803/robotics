
'use strict';
window.INVENTORLAB_VIRTUAL_LABS={
 grid:{id:'grid',icon:'🗺️',title:'Robot Grid Lab',tagline:'Plan, predict, run, debug — then prove it on a different map.',explorer:'Get the robot from START to GOAL without hitting a block. When you solve one map, try a changed map so the route cannot simply be memorised.',engineer:'Treat the route as an algorithm. Meet the route constraint, identify the first failing transition, then prove the method on a different map.',skills:['Sequencing','Algorithms','Debugging','Loops','Pattern recognition','Decomposition','Transfer']},
 sensor:{id:'sensor',icon:'📡',title:'Sensor Threshold Lab',tagline:'Separate the world, the reading, the rule and the action — across changing sensor cases.',explorer:'Choose a threshold that works for this sensor scenario, then try another safe-distance/noise pattern.',engineer:'Optimise a threshold under changing measurement noise. Some scenarios have no perfect threshold, so justify the best trade-off rather than hunting for a memorised number.',skills:['Sensors','Conditionals','Input / output','Testing','Events','State','Transfer']},
 calibration:{id:'calibration',icon:'🎯',title:'Calibration Lab',tagline:'Estimate a hidden systematic bias instead of memorising one correction factor.',explorer:'Measure the new virtual robot first, make one correction from the evidence, then retest. The hidden bias changes between scenarios.',engineer:'Estimate systematic bias from repeated trials, apply a correction factor, validate under identical conditions, then transfer the method to a different target/bias.',skills:['Measurement','Calibration','Data','Testing','Iteration','Optimisation','Debugging','Transfer']},
 trace:{id:'trace',icon:'🧠',title:'Code Bridge Lab',tagline:'Trace what code actually does — then bridge the same idea from blocks to text.',explorer:'Follow one small program step by step. Predict the final value before looking at the trace. A faded example can show one step, but the goal is to do the next scenario with less help.',engineer:'Mentally execute code across block-style and text representations, explain the state changes, and distinguish semantic reasoning from syntax familiarity.',skills:['Variables','Loops','Conditionals','Events','State','Functions','Algorithms','Debugging','Transfer']}
};
window.INVENTORLAB_VIRTUAL_SCENARIOS={
 grid:{
  explorer:[
   {id:'g1',label:'Pizza Block',start:[0,4],dir:'E',goal:[3,1],obstacles:['2,4','2,2','4,3'],hint:'Look for a clear vertical lane before crossing toward the goal.'},
   {id:'g2',label:'North Dock',start:[4,4],dir:'W',goal:[1,1],obstacles:['2,4','3,2','0,3'],hint:'The direct west route is blocked. Try changing direction before moving far.'},
   {id:'g3',label:'Corner Rescue',start:[0,0],dir:'S',goal:[4,3],obstacles:['0,2','2,1','3,3'],hint:'The starting column is blocked lower down. Can you travel along the top first?'}
  ],
  engineer:[
   {id:'g1e',label:'Pizza Block • compact',start:[0,4],dir:'E',goal:[3,1],obstacles:['2,4','2,2','4,3'],maxTokens:5,requireLoop:true,hint:'A correct route is not enough: represent repeated forward movement compactly.'},
   {id:'g2e',label:'North Dock • compact',start:[4,4],dir:'W',goal:[1,1],obstacles:['2,4','3,2','0,3'],maxTokens:4,requireLoop:true,hint:'Aim for two long straight segments joined by turns.'},
   {id:'g3e',label:'Corner Rescue • compact',start:[0,0],dir:'S',goal:[4,3],obstacles:['0,2','2,1','3,3'],maxTokens:5,requireLoop:true,hint:'Optimise the representation after you have a safe route.'}
  ]
 },
 sensor:{
  explorer:[
   {id:'s1',label:'Doorway sensor',safeDistance:25,cases:[12,22,28,38,55],noise:[1,-1,2,-2,1]},
   {id:'s2',label:'Delivery sensor',safeDistance:30,cases:[15,27,31,42,60],noise:[1,2,-1,-2,1]}
  ],
  engineer:[
   {id:'s1e',label:'Doorway sensor',safeDistance:25,cases:[12,22,28,38,55],noise:[1,-1,2,-2,1]},
   {id:'s2e',label:'Delivery sensor',safeDistance:30,cases:[15,27,31,42,60],noise:[1,2,-1,-2,1]},
   {id:'s3e',label:'Noisy loading bay • trade-off',safeDistance:25,cases:[18,24,26,31,50],noise:[2,3,-3,-1,0],tradeoff:true}
  ]
 },
 calibration:{
  explorer:[
   {id:'c1',label:'Short-running rover',target:100,bias:.92,noise:[-1.1,.6,-.4,.9,.2]},
   {id:'c2',label:'Over-running rover',target:80,bias:1.06,noise:[-.8,.3,-.2,.7,0]}
  ],
  engineer:[
   {id:'c1e',label:'Short-running rover',target:100,bias:.92,noise:[-1.1,.6,-.4,.9,.2]},
   {id:'c2e',label:'Over-running rover',target:80,bias:1.06,noise:[-.8,.3,-.2,.7,0]},
   {id:'c3e',label:'Large-course rover',target:120,bias:.88,noise:[-1.4,.8,-.6,1.2,.4]}
  ]
 },
 trace:{
  explorer:[
   {id:'t1',label:'Score Keeper',representation:'Blocks → Python',primarySkill:'Variables',skills:['Variables','Loops','Sequencing','Transfer'],blocks:['set score to 2','repeat 3 times','  change score by 1','say score'],text:['score = 2','for _ in range(3):','    score += 1','print(score)'],trace:[['set score to 2','score = 2'],['after repeat 1','score = 3'],['after repeat 2','score = 4'],['after repeat 3','score = 5']],q:'What value is shown at the end?',opts:['2','3','5'],ans:2,explain:'The variable starts at 2 and increases three times: 2 → 3 → 4 → 5.',misconception:'loop-count'},
   {id:'t2',label:'Night Light',representation:'Blocks → Python',primarySkill:'Conditionals',skills:['Conditionals','Variables','Input / output','Transfer'],blocks:['set light to 18','if light < 20 then','  show MOON','else','  show SUN'],text:['light = 18','if light < 20:','    show("MOON")','else:','    show("SUN")'],trace:[['set light to 18','light = 18'],['check light < 20','18 < 20 is TRUE'],['take TRUE branch','show MOON']],q:'What appears on the display?',opts:['MOON','SUN','Nothing'],ans:0,explain:'18 is less than 20, so the TRUE branch runs and shows MOON.',misconception:'condition-direction'},
   {id:'t3',label:'Ready, Set, Go',representation:'Events + state',primarySkill:'Events',skills:['Events','State','Variables','Sequencing'],blocks:['when GREEN FLAG','  set mode to WAIT','when BUTTON A pressed','  set mode to GO','  say mode'],text:['mode = "WAIT"   # start event','mode = "GO"     # button A event','print(mode)'],trace:[['green flag event','mode = WAIT'],['button A event','mode = GO'],['say mode','GO']],q:'After green flag, then button A, what is said?',opts:['WAIT','GO','A'],ans:1,explain:'The later button event changes the same state variable from WAIT to GO before it is displayed.',misconception:'event-order'},
   {id:'t4',label:'Coin Score',representation:'Blocks → Python',primarySkill:'Variables',skills:['Variables','Events','Conditionals','Sequencing'],blocks:['set score to 1','coin touches player','change score by 2','if score > 2 then','  say WIN'],text:['score = 1','score += 2   # coin event','if score > 2:','    print("WIN")'],trace:[['start','score = 1'],['coin event','score = 3'],['check score > 2','3 > 2 is TRUE'],['TRUE branch','say WIN']],q:'What happens after the coin event?',opts:['Nothing','The program says WIN','Score becomes 2'],ans:1,explain:'The coin event changes score from 1 to 3, and 3 > 2 is true, so WIN is shown.',misconception:'state-update'}
  ],
  engineer:[
   {id:'t1e',label:'Filtered accumulator',representation:'Python-like',primarySkill:'Algorithms',skills:['Variables','Loops','Conditionals','Algorithms','Data'],blocks:['values = [2, 5, 8, 11]','total = 0','for each x in values','  if x is even','    total = total + x','print total'],text:['values = [2, 5, 8, 11]','total = 0','for x in values:','    if x % 2 == 0:','        total += x','print(total)'],trace:[['start','total = 0'],['x = 2','even → total = 2'],['x = 5','odd → total stays 2'],['x = 8','even → total = 10'],['x = 11','odd → total stays 10']],q:'What is printed?',opts:['10','26','8','2'],ans:0,explain:'Only the even values 2 and 8 are accumulated, so total becomes 10.',misconception:'conditional-loop'},
   {id:'t2e',label:'Function contracts',representation:'Blocks → Python function',primarySkill:'Functions',skills:['Functions','Variables','Conditionals','Transfer'],blocks:['define adjust(value, limit)','  if value > limit return limit','  otherwise return value + 2','a = adjust(7, 6)','b = adjust(3, 6)','print a + b'],text:['def adjust(value, limit):','    if value > limit:','        return limit','    return value + 2','a = adjust(7, 6)','b = adjust(3, 6)','print(a + b)'],trace:[['adjust(7,6)','7 > 6 → return 6'],['adjust(3,6)','3 > 6 false → return 5'],['print a + b','6 + 5 = 11']],q:'What is printed?',opts:['9','11','12','13'],ans:1,explain:'The first call returns the limit 6; the second returns 3 + 2 = 5; 6 + 5 = 11.',misconception:'function-return'},
   {id:'t3e',label:'Two transitions in one cycle',representation:'State-machine pseudocode',primarySkill:'State',skills:['State','Conditionals','Sequencing','Debugging'],blocks:['state = WAIT','if state == WAIT','  state = RUN','if state == RUN','  state = DONE','display state'],text:['state = "WAIT"','if state == "WAIT":','    state = "RUN"','if state == "RUN":','    state = "DONE"','print(state)'],trace:[['start','state = WAIT'],['first IF','WAIT matches → state = RUN'],['second IF','RUN now matches → state = DONE'],['display','DONE']],q:'What state is printed after this single pass?',opts:['WAIT','RUN','DONE','It is random'],ans:2,explain:'These are two separate IF statements. After the first changes state to RUN, the second condition is immediately true and changes it again to DONE.',misconception:'state-cascade'},
   {id:'t4e',label:'Threshold boundary',representation:'Arduino/Python-like',primarySkill:'Conditionals',skills:['Conditionals','Sensors','Input / output','Testing'],blocks:['reading = 30','if reading < 30','  STOP','else','  GO'],text:['reading = 30','if reading < 30:','    motor = "STOP"','else:','    motor = "GO"'],trace:[['read sensor','reading = 30'],['check reading < 30','30 < 30 is FALSE'],['ELSE branch','motor = GO']],q:'At exactly 30, what action is selected?',opts:['STOP','GO','Both','No action'],ans:1,explain:'The condition uses <, not ≤. At exactly 30 it is false, so the ELSE branch selects GO.',misconception:'boundary-operator'},
   {id:'t5e',label:'Loop boundary',representation:'Python-like',primarySkill:'Loops',skills:['Loops','Variables','Algorithms','Testing'],blocks:['distance = 0','for step = 1, 2, 3','  distance = distance + step','print distance'],text:['distance = 0','for step in range(1, 4):','    distance += step','print(distance)'],trace:[['start','distance = 0'],['step = 1','distance = 1'],['step = 2','distance = 3'],['step = 3','distance = 6']],q:'What is printed?',opts:['3','4','6','10'],ans:2,explain:'range(1, 4) produces 1, 2, 3. The accumulator becomes 0 + 1 + 2 + 3 = 6.',misconception:'loop-boundary'}
  ]
 }
};
window.InventorLabLabEngine=(()=>{
 const dirs=['N','E','S','W'],delta={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
 const all=window.INVENTORLAB_VIRTUAL_SCENARIOS;
 const defaultScenario=(lab)=>all[lab].explorer[0];
 function expand(tokens){const out=[];for(const t of tokens||[]){if(t==='F2')out.push('F','F');else if(t==='F3')out.push('F','F','F');else out.push(t);}return out;}
 function simulateGrid(tokens,scenario=defaultScenario('grid')){
  let [x,y]=scenario.start,dir=scenario.dir||'E',failed=false,reason='',failureStep=null;
  const obs=new Set(scenario.obstacles||[]),path=[{x,y,dir}],expanded=expand(tokens);
  for(let i=0;i<expanded.length;i++){
   const t=expanded[i];
   if(t==='L'){dir=dirs[(dirs.indexOf(dir)+3)%4];path.push({x,y,dir,turn:'L'});continue;}
   if(t==='R'){dir=dirs[(dirs.indexOf(dir)+1)%4];path.push({x,y,dir,turn:'R'});continue;}
   if(t==='F'){
    const [dx,dy]=delta[dir],nx=x+dx,ny=y+dy;
    if(nx<0||nx>4||ny<0||ny>4){failed=true;reason='wall';failureStep=i+1;break;}
    if(obs.has(`${nx},${ny}`)){failed=true;reason='obstacle';failureStep=i+1;break;}
    x=nx;y=ny;path.push({x,y,dir});
   }
  }
  const goalReached=!failed&&x===scenario.goal[0]&&y===scenario.goal[1],usesLoop=(tokens||[]).some(t=>t==='F2'||t==='F3');
  const tokenCount=(tokens||[]).length,constraintPass=(!scenario.maxTokens||tokenCount<=scenario.maxTokens)&&(!scenario.requireLoop||usesLoop);
  return{x,y,dir,path,failed,reason,failureStep,goalReached,success:goalReached&&constraintPass,constraintPass,expanded,usesLoop,tokenCount,scenarioId:scenario.id};
 }
 function sensorRows(threshold,scenario){return scenario.cases.map((actual,i)=>{const reading=actual+scenario.noise[i],stop=reading<Number(threshold),expected=actual<=scenario.safeDistance;return{actual,reading,stop,expected,pass:stop===expected};});}
 function optimalSensorScore(scenario){let max=0,best=[];for(let t=5;t<=70;t++){const score=sensorRows(t,scenario).filter(r=>r.pass).length;if(score>max){max=score;best=[t]}else if(score===max)best.push(t);}return{max,best};}
 function sensorSuite(threshold,scenario=defaultScenario('sensor')){const rows=sensorRows(threshold,scenario),score=rows.filter(r=>r.pass).length,opt=optimalSensorScore(scenario);return{threshold:Number(threshold),rows,score,maxScore:opt.max,bestThresholds:opt.best,success:score===opt.max,perfect:score===rows.length,scenarioId:scenario.id,safeDistance:scenario.safeDistance};}
 function calibrationSuite(factor,scenario=defaultScenario('calibration')){const target=scenario.target,bias=scenario.bias,noise=scenario.noise;const rows=noise.map((n,i)=>({trial:i+1,actual:Number((target*bias*Number(factor)+n).toFixed(1))}));const mean=rows.reduce((n,r)=>n+r.actual,0)/rows.length,error=mean-target,vals=rows.map(r=>r.actual),range=Math.max(...vals)-Math.min(...vals),tol=Math.max(1.5,target*.02),rangeLimit=Math.max(3,target*.03);return{factor:Number(factor),target,rows,mean:Number(mean.toFixed(2)),error:Number(error.toFixed(2)),range:Number(range.toFixed(2)),tolerance:Number(tol.toFixed(2)),rangeLimit:Number(rangeLimit.toFixed(2)),success:Math.abs(error)<=tol&&range<=rangeLimit,scenarioId:scenario.id};}
 function traceSuite(answer,scenario=defaultScenario('trace')){const chosen=Number(answer),correct=chosen===Number(scenario.ans);return{chosen,correct,success:correct,answer:Number(scenario.ans),explain:scenario.explain,scenarioId:scenario.id,primarySkill:scenario.primarySkill,misconception:scenario.misconception};}
 return{simulateGrid,sensorSuite,calibrationSuite,traceSuite,optimalSensorScore,scenarios:all,defaultScenario,obstacles:[...defaultScenario('grid').obstacles]};
})();

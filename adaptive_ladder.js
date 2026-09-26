
(function(){
"use strict";
if(!window.CloudOdysseyCodingForge){console.error("Adaptive Ladder requires Coding Forge");return;}
var CF=window.CloudOdysseyCodingForge, CO=window.CloudOdyssey, KEY="cloud_odyssey_ladder_v1";
var st=Object.assign({challenge:0,step:0,scores:{},attempts:[]},JSON.parse(localStorage.getItem(KEY)||"{}"));
var $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from((r||document).querySelectorAll(s));
var save=()=>localStorage.setItem(KEY,JSON.stringify(st));
var esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
var steps=[
["Recognize","Name the best pattern from the symptoms."],
["Fill Blank","Complete critical syntax without seeing the full answer."],
["Write","Build the solution from the production requirement."],
["Debug","Repair a plausible broken implementation."],
["Optimize","Improve scan/shuffle/recompute while preserving semantics."],
["Productionize","Add determinism, tests, observability, rollback and file discipline."],
["Explain WHY","Defend the method versus a tempting alternative."],
["Requirement Change","Adapt when one constraint changes."],
["Transfer","Solve a different scenario using the same underlying pattern."],
["Code Review","Review another engineer's implementation and reject unsafe assumptions."],
["Package","Name/place the right files and state what each artifact does."]
];
function c(){return CF.challenges[st.challenge%CF.challenges.length];}
function key(){return st.challenge+"-"+st.step;}
function scoreFor(k){return st.scores[k]||0;}
function challengeMastery(i){
 let vals=steps.map((_,s)=>st.scores[i+"-"+s]||0),pass=vals.filter(v=>v>=85).length;
 return Math.round(pass/steps.length*100);
}
function overall(){
 let keys=Object.keys(st.scores),avg=keys.length?Math.round(keys.reduce((n,k)=>n+st.scores[k],0)/keys.length):0;
 let mastered=CF.challenges.filter((_,i)=>challengeMastery(i)>=90).length;
 let firstPass=st.attempts.filter(a=>a.first&&a.score>=85).length;
 return {avg,mastered,firstPass};
}
function promptFor(ch,step){
 const p=ch;
 switch(step){
 case 0:return {title:"Recognize the pattern",body:"Given this scenario, what is the best primary pattern and why?\n\n"+p.scenario,placeholder:"Pattern + one-sentence reason..."};
 case 1:return {title:"Fill the missing production-critical pieces",body:"Complete the core method. Include the important key/order/partition/filter clauses.",placeholder:p.starter+"\n\n# fill the missing pieces"};
 case 2:return {title:"Write it blind",body:p.scenario+"\n\nBuild the complete solution without revealing the reference.",placeholder:p.starter};
 case 3:return {title:"Debug the broken approach",body:"The current implementation is unsafe or incomplete. Explain the defect, then replace it.",placeholder:broken(p)};
 case 4:return {title:"Optimize without changing business meaning",body:"Improve performance/cost while preserving the exact result. State what plan evidence you would inspect.",placeholder:p.starter};
 case 5:return {title:"Productionize it",body:"Add deterministic behavior, failure handling, tests/validation, observability, and rollback/recovery expectations.",placeholder:p.solution+"\n\n# add production controls"};
 case 6:return {title:"Explain WHY / WHY NOT",body:"Why is this method appropriate here? What tempting alternative would you reject, and when would that alternative actually be valid?",placeholder:"I chose ... because ... Instead of ... because ... I would use the alternative when ..."};
 case 7:return {title:"Requirement changed",body:changedRequirement(p),placeholder:"Adapt the code and explain which assumption changed."};
 case 8:return {title:"Transfer the pattern",body:transferScenario(p),placeholder:"Identify the same underlying pattern and solve the new context."};
 case 9:return {title:"Code review",body:"Review this like a senior engineer. Identify correctness, determinism, performance, observability, and maintainability risks.",placeholder:p.starter+"\n\n# REVIEW COMMENTS:"};
 default:return {title:"Package the project correctly",body:"Provide the repository path, filename, tests, config/IaC if needed, and runbook/README artifacts. Explain why each file exists.",placeholder:"Implementation: "+p.filePath+"\nTests: ...\nREADME/runbook: ...\nWHY these names: ..."};
 }
}
function broken(p){
 if(/ROW_NUMBER|DENSE_RANK|LAG/i.test(p.solution))return p.solution.replace(/DENSE_RANK|ROW_NUMBER|LAG/g,"RANK").replace(/PARTITION BY[^)]*/i,"");
 if(/MERGE/i.test(p.solution))return "MERGE INTO target USING source ON target.updated_at=source.updated_at WHEN MATCHED THEN UPDATE SET *;";
 if(/broadcast/i.test(p.solution))return "result = facts.repartition(5000).join(dim, 'customer_id')";
 return p.starter+"\n# assumption: if it runs, it is production-safe";
}
function changedRequirement(p){
 if(p.cat==="SQL"||p.lang==="sql")return p.scenario+"\nCHANGE: ties must now be preserved OR the output must be exactly one deterministic row. Adjust the function/ordering and explain.";
 if(/Spark|PySpark/.test(p.cat)||p.lang==="pyspark")return p.scenario+"\nCHANGE: the small table is now too large to broadcast. Redesign without relying on broadcast.";
 if(p.cat==="Data Cleaning")return p.scenario+"\nCHANGE: outliers may be legitimate VIP transactions and cannot be deleted automatically.";
 return p.scenario+"\nCHANGE: the workload must now be rerunnable after partial failure with the same business result.";
}
function transferScenario(p){
 if(/ROW_NUMBER|DENSE_RANK|LAG|Window/i.test(p.solution+p.cat))return "New domain: reservations. For each guest, return the latest booking version or compare each stay to the prior stay. Use the same window-function reasoning.";
 if(/Spark/.test(p.cat))return "New domain: clickstream. One campaign key owns most events and one stage stalls. Apply the same skew/performance reasoning without copying the original code.";
 if(/MERGE/i.test(p.solution))return "New domain: customer profile CDC. Apply corrections into current state using the same stable-key/upsert reasoning.";
 if(p.cat==="Data Cleaning")return "New domain: partner lead CSV. Normalize identifiers, preserve bad rows for audit, and deduplicate by business key.";
 return "New domain: hotel package data. Reuse the same pattern, but first restate the grain, business key and failure boundary.";
}
function grade(ch,step,text){
 let low=text.toLowerCase(),hits=ch.tokens.filter(t=>low.includes(t.toLowerCase())).length;
 let score=25+Math.round(hits/Math.max(1,ch.tokens.length)*35);
 if(step===0 && (low.includes(ch.title.toLowerCase().split(" ")[0])||ch.tokens.some(t=>low.includes(t.toLowerCase()))))score+=25;
 if(step>=2&&text.length>120)score+=10;
 if(/because|instead|rather than|why|tradeoff/.test(low))score+=10;
 if(/test|validate|reconcile|monitor|alert|rollback|idempot|determin|key|grain/.test(low))score+=10;
 if(step===10&&low.includes(ch.filePath.toLowerCase()))score+=20;
 score=Math.min(100,score);
 let first=!st.attempts.some(a=>a.challenge===st.challenge&&a.step===step);
 st.scores[key()]=Math.max(score,st.scores[key()]||0);st.attempts.push({challenge:st.challenge,step,score,first,ts:Date.now()});save();
 return {score,first};
}
function render(){
 const root=$("#view-adaptive-ladder");if(!root)return;const ch=c(),q=promptFor(ch,st.step),o=overall();
 root.innerHTML='<div class="view-heading"><div><span class="micro">ADAPTIVE MASTERY LADDER</span><h2>Pattern → Production → Transfer</h2><p>One concept is not mastered until you can recognize it, write it, debug it, optimize it, productionize it, explain it, adapt it, transfer it, review it, and package it.</p></div><span class="enterprise-badge">11-STAGE MASTERY</span></div>'+
 '<div class="ladder-shell"><aside class="ladder-side glass"><div class="ladder-side-head"><span class="micro">'+esc(ch.cat)+'</span><h3>'+esc(ch.title)+'</h3><p>Challenge mastery: '+challengeMastery(st.challenge)+'%</p></div><div class="ladder-step-list">'+steps.map((s,i)=>'<button class="ladder-step '+(i===st.step?"active ":"")+(scoreFor(st.challenge+"-"+i)>=85?"pass":"")+'" data-step="'+i+'"><span class="n">'+String(i+1).padStart(2,"0")+'</span><div><b>'+s[0]+'</b><span>'+s[1]+'</span></div><em>'+scoreFor(st.challenge+"-"+i)+'%</em></button>').join("")+'</div></aside>'+
 '<section class="ladder-main glass"><div class="ladder-main-head"><div><span class="micro">STEP '+(st.step+1)+' / 11</span><h2>'+esc(q.title)+'</h2><p>'+esc(ch.scenario)+'</p></div><button class="copy-btn" id="nextPattern">Next pattern</button></div><div class="ladder-body"><article class="ladder-challenge"><div class="ladder-badges"><span class="ladder-badge">'+esc(ch.lang.toUpperCase())+'</span><span class="ladder-badge">'+esc(ch.cat)+'</span><span class="ladder-badge">File: '+esc(ch.filePath)+'</span></div><h3>'+esc(q.title)+'</h3><p style="white-space:pre-line">'+esc(q.body)+'</p></article><textarea id="ladderAnswer" class="ladder-input '+(st.step!==0&&st.step!==6&&st.step!==10?"ladder-code":"")+'" placeholder="'+esc(q.placeholder)+'"></textarea><div class="ladder-actions"><button class="primary" id="gradeLadder">Grade this stage</button><button id="revealLadder">Show reference only after attempt</button><button id="nextStep">Next stage</button></div><div id="ladderFeedback"></div></div></section>'+
 '<aside class="ladder-ledger glass"><div class="ladder-score"><span class="micro">MASTERY LEDGER</span><div class="score">'+o.avg+'%</div><span>'+o.mastered+' / '+CF.challenges.length+' patterns deeply mastered</span></div><div class="ladder-gates">'+[
 ["11-stage completion",challengeMastery(st.challenge)>=90,challengeMastery(st.challenge)+"%","Current pattern must pass nearly every stage"],
 ["First-pass strength",o.firstPass>=10,o.firstPass+"/10","Ten ≥85 first attempts"],
 ["Transfer proof",scoreFor(st.challenge+"-8")>=85,scoreFor(st.challenge+"-8")+"%","Solve a changed domain"],
 ["Code review proof",scoreFor(st.challenge+"-9")>=85,scoreFor(st.challenge+"-9")+"%","Reject unsafe implementation"],
 ["Packaging proof",scoreFor(st.challenge+"-10")>=85,scoreFor(st.challenge+"-10")+"%","Correct file/artifact structure"]
 ].map(g=>'<div class="ladder-gate '+(g[1]?"pass":"")+'"><i></i><div><b>'+g[0]+'</b><span>'+g[3]+'</span></div><em>'+g[2]+'</em></div>').join("")+'</div><div class="retention-panel"><h4>Spaced retention</h4><p>High scores today are not enough. Revisit mastered patterns on later days and solve changed variants without reference solutions.</p><div class="retention-grid"><div class="retention-tile"><span>ATTEMPTS</span><b>'+st.attempts.length+'</b></div><div class="retention-tile"><span>FIRST-PASS ≥85</span><b>'+o.firstPass+'</b></div></div></div></aside></div>';
 $$("[data-step]",root).forEach(b=>b.onclick=()=>{st.step=+b.dataset.step;save();render();});
 $("#gradeLadder").onclick=()=>{let text=$("#ladderAnswer").value.trim();if(!text){CO.toast("Attempt the stage first");return;}let r=grade(ch,st.step,text);$("#ladderFeedback").innerHTML='<div class="ladder-feedback '+(r.score>=85?"good":"bad")+'"><b>'+r.score+'% • '+(r.first?"FIRST ATTEMPT":"RETRY")+'</b><p>'+(r.score>=85?"Pass. Now prove the next layer without copying this answer.":"Not mastered yet. Add the missing pattern, WHY, and production evidence before advancing.")+'</p></div>';};
 $("#revealLadder").onclick=()=>{if(!st.attempts.some(a=>a.challenge===st.challenge&&a.step===st.step)){CO.toast("Attempt it first — reveal stays locked");return;}$("#ladderFeedback").innerHTML='<div class="ladder-feedback"><b>REFERENCE</b><p><strong>Solution:</strong><br><span style="white-space:pre-wrap">'+esc(ch.solution)+'</span><br><br><strong>WHY:</strong> '+esc(ch.why)+'<br><strong>Caveat:</strong> '+esc(ch.caveat)+'</p></div>';};
 $("#nextStep").onclick=()=>{st.step=Math.min(10,st.step+1);save();render();};
 $("#nextPattern").onclick=()=>{st.challenge=(st.challenge+1)%CF.challenges.length;st.step=0;save();render();};
}
function install(){
 const nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 const b=document.createElement("button");b.className="nav-item";b.dataset.view="adaptive-ladder";b.innerHTML="<span>⇧</span><b>Adaptive Ladder</b><em>19</em>";b.onclick=()=>{CO.setView("adaptive-ladder");$("#pageTitle").textContent="Adaptive Coding Ladder";render();};nav.appendChild(b);
 const s=document.createElement("section");s.className="view";s.id="view-adaptive-ladder";work.appendChild(s);render();
}
install();
})();
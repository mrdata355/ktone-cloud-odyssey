(function(){
"use strict";
if(!window.CloudOdysseySardine||!window.CloudOdysseySardineData)return;
var S=window.CloudOdysseySardine,D=window.CloudOdysseySardineData,B=window.CloudOdysseyBackend,CO=window.CloudOdyssey;
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};

function state(){var x=S.getState();x.modeScores=x.modeScores||{};return x;}
function currentProject(){var x=state();return S.projects[(Number(x.project)||0)%S.projects.length];}
function save(){S.save();}
function modeConfig(mode,p){
 var cfg={
  fivew:{title:"Defend the Five Ws",prompt:"Explain WHO owns this system, WHAT business/data decision it makes, WHERE the boundaries are, WHEN it executes and WHY this design is appropriate.",keys:["who","what","where","when","why","owner","decision","because","evidence"]},
  model:{title:"Design the Feature + Model Path",prompt:"Defend labels, point-in-time data, feature semantics, evaluation, calibration/threshold, serving, feedback, monitoring and rollback.",keys:["label","point in time","feature","evaluation","threshold","serving","monitor","rollback"]},
  tradeoffs:{title:"Defend the Architecture Tradeoff",prompt:"State the constraint, why this architecture wins here, what it costs/fails at, why the shortcut is unsafe, and when the alternative becomes valid.",keys:["constraint","because","alternative","tradeoff","failure","cost","when","evidence"]},
  coverage:{title:"Prove JD Coverage",prompt:"Explain exactly which Sardine job requirements this project proves, what evidence you would show, and what production gaps remain.",keys:["build","production","evidence","tradeoff","stakeholder","gap","why","result"]}
 };
 var x=cfg[mode]||cfg.fivew;
 return {title:x.title,prompt:x.prompt,keys:x.keys.concat((p.patterns||[]).map(function(v){return v.replace(/-/g," ");})).slice(0,16)};
}
function addPractice(root,p){
 var mode=state().mode;if(["fivew","model","tradeoffs","coverage"].indexOf(mode)<0||$(".se-mode-practice",root))return;
 var main=$(".sardine-main",root);if(!main)return;
 var cfg=modeConfig(mode,p),id=p.id+"::"+mode,x=state(),ev=x.modeScores[id]||{};
 var sec=document.createElement("section");sec.className="se-mode-practice sardine-block";
 sec.innerHTML='<span class="micro">ACTIVE PRACTICE • '+mode.toUpperCase()+'</span><h4>'+esc(cfg.title)+'</h4><p>'+esc(cfg.prompt)+'</p>'+
 '<textarea data-se-mode-answer placeholder="Answer naturally with implementation, WHY, evidence and tradeoff...">'+esc(ev.answer||"")+'</textarea>'+
 '<div class="se-actions"><button data-se-mode-grade>Grade on server</button>'+(ev.score>=85?'<button data-se-mode-next>Next review mode →</button>':'')+'</div>'+
 '<div data-se-mode-result class="sardine-result">'+(ev.score!=null?('Best '+ev.score+'%'+(ev.request_id?' • request '+esc(ev.request_id):'')):'Score ≥85 for proficiency evidence.')+'</div>';
 main.appendChild(sec);
 $("[data-se-mode-grade]",sec).onclick=async function(){
   var ans=$("[data-se-mode-answer]",sec).value.trim(),out=$("[data-se-mode-result]",sec);if(!ans){out.textContent="Answer first.";return;}
   if(!B||!B.grade){out.textContent="Server grader unavailable.";return;}out.textContent="Server grading...";
   try{
    var r=await B.grade(ans,cfg.keys,{type:"sardine-"+mode+":"+p.id,blind:true,duration_ms:120000});
    if(r.score>=Number(ev.score||0))x.modeScores[id]={score:r.score,answer:ans,request_id:r.request_id||null,ts:Date.now()};
    save();out.textContent="SERVER "+r.score+"%";CO.toast(cfg.title+" • "+r.score+"%");
   }catch(e){out.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };
 var nx=$("[data-se-mode-next]",sec);
 if(nx)nx.onclick=function(){var order=["fivew","model","tradeoffs","coverage"],i=order.indexOf(mode);x.mode=order[(i+1)%order.length];save();S.render();};
}
function enhanceCoverage(root){
 var x=state();
 $$(".sardine-coverage-row",root).forEach(function(row,i){
   if(row.querySelector(".se-coverage-launch"))return;
   var c=D.coverage&&D.coverage[i];if(!c)return;
   var ids=String(c[1]||"").split(","),target=S.projects.findIndex(function(p){return ids.indexOf(p.id)>=0;});if(target<0)return;
   var b=document.createElement("button");b.className="se-coverage-launch";b.textContent="Practice supporting project →";
   b.onclick=function(){x.project=target;x.mode="mission";save();S.render();};row.appendChild(b);
 });
}
function enhanceKpis(root){
 var x=state();
 $$(".sardine-role-kpis .sardine-kpi",root).forEach(function(card,i){
   if(card.dataset.seWired)return;card.dataset.seWired="1";card.tabIndex=0;card.setAttribute("role","button");
   var go=function(){if(i===0)x.mode="coverage";else if(i===1)x.mode="assignments";else if(i===2)x.mode="live";else x.mode="mission";save();S.render();};
   card.onclick=go;card.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}};
 });
}
function pipelineModal(p,label,index){
 var x=state(),id=p.id+"::flow::"+index,ev=x.modeScores[id]||{},m=$("#modal"),c=$("#modalContent");if(!m||!c)return;
 c.innerHTML='<span class="micro">PIPELINE BOUNDARY DRILL</span><h2>'+esc(label)+'</h2><p class="se-task-prompt">Explain the input/output contract, owner, latency/correctness expectation, failure mode, observability and why this step belongs here in '+esc(p.title)+'.</p>'+
 '<textarea id="seFlowAnswer">'+esc(ev.answer||"")+'</textarea><div class="se-actions"><button id="seFlowGrade">Grade boundary explanation</button></div><div id="seFlowResult" class="sardine-result">'+(ev.score!=null?('Best '+ev.score+'%'):'Not graded yet')+'</div>';
 m.classList.remove("hidden");
 $("#seFlowGrade",c).onclick=async function(){
  var a=$("#seFlowAnswer",c).value.trim(),out=$("#seFlowResult",c);if(!a){out.textContent="Answer first.";return;}if(!B||!B.grade){out.textContent="Server grader unavailable.";return;}out.textContent="Grading...";
  try{var r=await B.grade(a,["input","output","owner","failure","monitor","because","latency","correct"],{type:"sardine-flow:"+p.id+":"+index,blind:true});if(r.score>=Number(ev.score||0))x.modeScores[id]={score:r.score,answer:a,request_id:r.request_id||null,ts:Date.now()};save();out.textContent="SERVER "+r.score+"%";}catch(e){out.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };
}
function enhanceFlow(root,p){
 $$(".sardine-node",root).forEach(function(node,i){
  if(node.dataset.seWired)return;node.dataset.seWired="1";node.tabIndex=0;node.setAttribute("role","button");
  var label=($("b",node)||node).textContent.trim(),go=function(){pipelineModal(p,label,i);};
  node.onclick=go;node.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}};
 });
}
function enhance(){
 var root=$("#view-sardine");if(!root)return;
 var p=currentProject();
 enhanceKpis(root);enhanceCoverage(root);enhanceFlow(root,p);addPractice(root,p);
}
var timer=null,obs=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(enhance,80);});
var target=$("#view-sardine");if(target)obs.observe(target,{subtree:true,childList:true});
document.addEventListener("odyssey:viewchange",function(e){if(e.detail&&e.detail.view==="sardine")setTimeout(enhance,100);});
setTimeout(enhance,400);
window.CloudOdysseySardineInteractions={enhance:enhance};
})();
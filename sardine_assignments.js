(function(){
"use strict";
if(!window.CloudOdysseySardine||!window.CloudOdyssey)return;
var S=window.CloudOdysseySardine,CO=window.CloudOdyssey,B=window.CloudOdysseyBackend;
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};

function state(){
 var x=S.getState();x.taskEvidence=x.taskEvidence||{};x.taskAttempts=x.taskAttempts||{};return x;
}
function project(){var x=state();return S.projects[(Number(x.project)||0)%S.projects.length];}
function k(pr,i){return pr.id+"-task-"+i;}
function nextOpen(pr){
 var x=state();
 for(var i=0;i<S.stages.length;i++){if(!x.checks[pr.id+"-"+i])return i;}
 return 0;
}
function keys(pr,i){
 var rows=[
 ["decision","invariant","owner","false positive","false negative","slo"],
 ["owner","producer","consumer","raci","escalation","approve"],
 ["key","event time","schema","pii","lineage","quarantine"],
 ["partition","watermark","state","dedupe","latency","idempotent"],
 ["point in time","bounded","rerun","orchestration","reconcile","publish"],
 ["feature","window","label","leakage","threshold","unknown"],
 ["reconcile","stream","batch","online","offline","parity"],
 ["p95","p99","skew","state","scan","cost"],
 ["failure","timeout","replay","fallback","fail closed","silent"],
 ["encryption","iam","tenant","residency","delete","audit"],
 ["slo","freshness","drift","dq","label delay","reconcile"],
 ["cost","10x","event","decision","provider","extend"],
 ["evidence","blast radius","rollback","repair","reconcile","resume"],
 ["who","what","where","when","why","metric","tradeoff"]
 ];
 return (rows[i]||[]).concat(["because","evidence","validate","rollback"]).concat((pr.patterns||[]).map(function(x){return x.replace(/-/g," ");})).slice(0,18);
}
function showModal(html){
 var m=$("#modal"),c=$("#modalContent");if(!m||!c)return null;
 c.innerHTML=html;m.classList.remove("hidden");c.scrollTop=0;return c;
}
function close(){var m=$("#modal");if(m)m.classList.add("hidden");}
function openTask(pr,i){
 var x=state(),id=k(pr,i),ev=x.taskEvidence[id]||{},attempts=Number(x.taskAttempts[id]||0);
 var c=showModal(
  '<span class="micro">SARDINE ASSIGNMENT '+String(i+1).padStart(2,"0")+'/14</span>'+
  '<h2>'+esc(S.stages[i][0])+'</h2>'+
  '<p class="se-task-prompt">'+esc(S.detail(pr,i))+'</p>'+
  '<div class="se-sequence"><span>WHO • owner/entity</span><span>WHAT • operation</span><span>WHERE • boundary</span><span>WHEN • trigger</span><span>WHY • tradeoff</span><span>PROOF • metric/test</span></div>'+
  '<textarea id="seTaskAnswer" placeholder="Produce the design, code/pseudocode, SQL, tests, evidence and WHY...">'+esc(ev.answer||"")+'</textarea>'+
  '<div class="se-actions"><button id="seGradeTask">Grade assignment on server</button><button id="seTaskBack">Back to mission</button>'+(ev.score>=85?'<button id="seTaskNext">Next assignment →</button>':'')+'</div>'+
  '<div id="seTaskResult" class="sardine-result">'+(ev.score!=null?('Best '+ev.score+'% • attempts '+attempts+(ev.request_id?' • request '+esc(ev.request_id):'')):'Score ≥85 to complete this stage.')+'</div>'
 );
 if(!c)return;
 $("#seTaskBack",c).onclick=close;
 var n=$("#seTaskNext",c);if(n)n.onclick=function(){close();setTimeout(function(){openTask(pr,nextOpen(pr));},60);};
 $("#seGradeTask",c).onclick=async function(){
   var ans=$("#seTaskAnswer",c).value.trim(),out=$("#seTaskResult",c);if(!ans){out.textContent="Complete the assignment first.";return;}
   if(!B||!B.grade){out.textContent="Server grader unavailable.";return;}
   x.taskAttempts[id]=Number(x.taskAttempts[id]||0)+1;S.save();out.textContent="Server grading...";
   try{
     var r=await B.grade(ans,keys(pr,i),{type:"sardine-task:"+pr.id+":"+i,blind:true,duration_ms:120000});
     var old=x.taskEvidence[id]||{};
     if(Number(r.score)>=Number(old.score||0)){x.taskEvidence[id]={score:r.score,answer:ans,request_id:r.request_id||null,dimensions:r.dimensions||{},ts:Date.now()};}
     if(r.score>=85)x.checks[pr.id+"-"+i]=true;
     S.save();out.textContent=(r.score>=85?"COMPLETE ":"NEEDS ITERATION ")+r.score+"%";
     CO.toast(r.score>=85?"Sardine assignment complete • "+r.score+"%":"Another pass needed • "+r.score+"%");
     if(r.score>=85)setTimeout(function(){close();S.render();},650);
   }catch(e){out.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };
}
function enhance(){
 var root=$("#view-sardine");if(!root)return;
 var pr=project(),x=state();
 $$(".sardine-assignment",root).forEach(function(row){
   var inp=$("input[data-scheck],input[data-aproject]",row);if(!inp)return;
   inp.disabled=true;inp.tabIndex=-1;
   if(row.querySelector(".se-task-button"))return;
   var i=inp.dataset.scheck!=null?Number(inp.dataset.scheck):Number(inp.dataset.astage);
   var pi=inp.dataset.aproject!=null?Number(inp.dataset.aproject):Number(x.project)||0;
   var target=S.projects[pi],ev=x.taskEvidence[k(target,i)]||{},done=!!x.checks[target.id+"-"+i];
   var em=$("em",row);if(em)em.textContent=done?"COMPLETE":ev.score!=null?ev.score+"%":"OPEN";
   var b=document.createElement("button");b.className="se-task-button";b.textContent=done?"Review evidence →":"Start assignment →";
   b.onclick=function(e){e.preventDefault();e.stopPropagation();x.project=pi;S.save();openTask(target,i);};row.appendChild(b);
 });
 if(x.mode==="mission"&&!$(".se-mission-progress",root)){
   var list=$(".sardine-assignments",root);if(list){
     var bar=document.createElement("div");bar.className="se-mission-progress";
     bar.innerHTML='<div><span>EVIDENCE-VERIFIED STAGES</span><b>'+S.completed(pr)+'/14</b></div><button id="seContinueSardine">'+(S.completed(pr)===14?'Review assignments':'Continue next assignment →')+'</button>';
     list.parentNode.insertBefore(bar,list);$("#seContinueSardine",bar).onclick=function(){openTask(pr,nextOpen(pr));};
   }
 }
}
var timer=null,obs=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(enhance,70);});
var target=$("#view-sardine");if(target)obs.observe(target,{subtree:true,childList:true});
document.addEventListener("odyssey:viewchange",function(e){if(e.detail&&e.detail.view==="sardine")setTimeout(enhance,100);});
setTimeout(enhance,300);
window.CloudOdysseySardineAssignments={enhance:enhance,openTask:function(i){openTask(project(),Number(i)||0);},next:function(){var pr=project();openTask(pr,nextOpen(pr));}};
})();
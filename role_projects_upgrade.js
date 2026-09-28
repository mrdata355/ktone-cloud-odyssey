(function(){
"use strict";
if(!window.CloudOdyssey)return;
var D=document,CO=window.CloudOdyssey,KEY="cloud_odyssey_hgv_role_projects_v1";
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var hgv=(function(){try{return JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){return {};}})();
function saveHgv(){localStorage.setItem(KEY,JSON.stringify(hgv));}
function modal(html){var m=$("#modal"),c=$("#modalContent");if(!m||!c)return null;c.innerHTML=html;m.classList.remove("hidden");c.scrollTop=0;return c;}
function close(){var m=$("#modal");if(m)m.classList.add("hidden");}
function pct(a,b){return b?Math.round(a/b*100):0;}
function normalizedKeys(world){
 var xs=(world.stack||[]).concat(world.skills||[]).concat(["business","evidence","validation","rollback","tradeoff","failure","monitoring","grain","owner"]);
 var out=[];
 xs.forEach(function(x){String(x).toLowerCase().split(/[^a-z0-9]+/).forEach(function(k){if(k.length>2&&out.indexOf(k)<0)out.push(k);});});
 return out.slice(0,18);
}
function localCoverage(answer,keys){
 var a=String(answer||"").toLowerCase(),hits=keys.filter(function(k){return a.indexOf(k)>=0;});
 return {score:pct(hits.length,keys.length),hits:hits,missing:keys.filter(function(k){return hits.indexOf(k)<0;})};
}
function nextMissionIndex(wi){
 var w=CO.worlds[wi];if(!w)return 0;
 for(var i=0;i<w.missions.length;i++){if(!CO.getState().done[CO.missionId(wi,i)])return i;}
 return 0;
}
function hgvRecord(wi){hgv[wi]=hgv[wi]||{attempts:0,score:null,answer:"",source:null,updatedAt:null};return hgv[wi];}
function openHgvMissionMenu(wi){
 var w=CO.worlds[wi],rec=hgvRecord(wi);if(!w)return;
 var c=modal('<span class="micro">HGV PROJECT '+String(wi+1).padStart(2,"0")+' • MISSION MENU</span><h2>'+esc(w.icon+' '+w.name)+'</h2><p>'+esc(w.desc)+'</p><div class="rpu-stack">'+(w.stack||[]).map(function(x){return '<span>'+esc(x)+'</span>';}).join("")+'</div><div class="rpu-mission-list">'+w.missions.map(function(m,mi){var done=!!CO.getState().done[CO.missionId(wi,mi)];return '<article><div><span>'+(done?'MASTERED':'OPEN')+'</span><b>'+esc(m.title)+'</b><p>'+esc(m.task)+'</p></div><button data-rpu-mission="'+mi+'">'+(done?'Review mission →':'Launch mission →')+'</button></article>';}).join("")+'</div><div class="rpu-mini-score">Project defense: <b>'+(rec.score==null?'not graded':rec.score+'%')+'</b></div>');
 if(!c)return;
 $$('[data-rpu-mission]',c).forEach(function(b){b.onclick=function(){close();CO.openMission(wi,Number(b.dataset.rpuMission)||0);};});
}
function openHgvDefense(wi){
 var w=CO.worlds[wi],rec=hgvRecord(wi);if(!w)return;
 var c=modal('<span class="micro">HGV PROJECT DEFENSE • '+esc(w.name)+'</span><h2>Defend this system like the interviewer owns production.</h2><p>Explain the business grain, architecture sequence, failure boundaries, validation, observability, rollback and one technology tradeoff. Tie the design to the HGV-style reservation / inventory / guest outcome.</p><div class="rpu-stack">'+(w.stack||[]).concat(w.skills||[]).map(function(x){return '<span>'+esc(x)+'</span>';}).join("")+'</div><textarea id="rpuDefenseAnswer" class="rpu-defense" placeholder="WHO / WHAT / WHERE / WHEN / WHY • implementation • failure mode • proof • rollback • business impact">'+esc(rec.answer||"")+'</textarea><div class="rpu-actions"><button id="rpuGradeDefense">Grade project defense</button><button id="rpuOpenMission">Open next mission</button></div><pre id="rpuDefenseResult" class="rpu-result">'+(rec.score==null?'Target: 85%+ with production evidence.':'Best '+rec.score+'% • '+esc(rec.source||'graded'))+'</pre>');
 if(!c)return;
 $('#rpuOpenMission',c).onclick=function(){close();CO.openMission(wi,nextMissionIndex(wi));};
 $('#rpuGradeDefense',c).onclick=async function(){
   var ans=$('#rpuDefenseAnswer',c).value.trim(),out=$('#rpuDefenseResult',c),keys=normalizedKeys(w);if(ans.length<80){out.textContent="Give a complete answer first (at least 80 characters).";return;}
   rec.attempts=Number(rec.attempts||0)+1;rec.answer=ans;rec.updatedAt=Date.now();out.textContent="Grading architecture defense...";
   try{
     var B=window.CloudOdysseyBackend;
     if(!B||!B.grade)throw new Error("server grader unavailable");
     var r=await B.grade(ans,keys,{type:"hgv-project-defense:"+w.id,blind:true,duration_ms:120000});
     if(rec.score==null||Number(r.score)>=Number(rec.score)){rec.score=Number(r.score)||0;rec.source="server";rec.request_id=r.request_id||null;rec.dimensions=r.dimensions||{};}
     saveHgv();out.textContent="SERVER "+r.score+"%\n"+(r.score>=85?"PROFICIENCY EVIDENCE RECORDED":"Keep iterating until the architecture, failure and proof sequence is complete")+"\n"+JSON.stringify(r.dimensions||{},null,2);enhanceHgv();
   }catch(e){
     var lc=localCoverage(ans,keys);if(rec.score==null||lc.score>=Number(rec.score)){rec.score=lc.score;rec.source="local concept coverage";}saveHgv();out.textContent="LOCAL CONCEPT COVERAGE "+lc.score+"%\nHit: "+lc.hits.join(", ")+"\nMissing: "+lc.missing.join(", ")+"\nServer note: "+e.message;enhanceHgv();
   }
 };
}
var incidentMap=[0,3,0,2,1,2,2,0,3,2];
function enhanceHgv(){
 var root=$("#view-projects"),board=$("#projectsBoard");if(!root||!board)return;
 var heading=$(".view-heading",root);
 if(heading&&!$(".rpu-hgv-banner",root)){
   var banner=D.createElement("div");banner.className="rpu-hgv-banner glass";banner.innerHTML='<div><span class="micro">HGV ROLE PROJECT WORKBENCH</span><b>Every project card now launches hands-on work.</b><p>Build the mission, break/fix production, inspect all three mission paths, then defend the architecture.</p></div><button id="rpuNextHgvProject">Continue next unfinished project →</button>';
   heading.insertAdjacentElement("afterend",banner);$('#rpuNextHgvProject',banner).onclick=function(){var wi=0;for(var i=0;i<CO.worlds.length;i++){if(CO.worldDone(i)<3){wi=i;break;}}CO.openMission(wi,nextMissionIndex(wi));};
 }
 $$(".project-card",board).forEach(function(card,wi){
   if(card.querySelector(".rpu-project-actions"))return;
   var w=CO.worlds[wi];if(!w)return;var rec=hgvRecord(wi),checks=$$('input[data-check]',card).filter(function(x){return x.checked;}).length;
   var meta=D.createElement("div");meta.className="rpu-project-meta";meta.innerHTML='<span>MISSIONS <b>'+CO.worldDone(wi)+'/3</b></span><span>ARTIFACTS <b>'+checks+'/6</b></span><span>DEFENSE <b>'+(rec.score==null?'—':rec.score+'%')+'</b></span>';card.appendChild(meta);
   var a=D.createElement("div");a.className="rpu-project-actions";a.innerHTML='<button data-rpu-act="mission">'+(CO.worldDone(wi)===3?'Review mission':'Continue mission')+' →</button><button data-rpu-act="menu">All 3 missions</button><button data-rpu-act="incident">Break / fix</button><button data-rpu-act="defense">Project defense</button>';card.appendChild(a);
   $('[data-rpu-act="mission"]',a).onclick=function(){CO.openMission(wi,nextMissionIndex(wi));};
   $('[data-rpu-act="menu"]',a).onclick=function(){openHgvMissionMenu(wi);};
   $('[data-rpu-act="incident"]',a).onclick=function(){CO.launchIncident(incidentMap[wi]||0);};
   $('[data-rpu-act="defense"]',a).onclick=function(){openHgvDefense(wi);};
 });
}
function sardineState(){return window.CloudOdysseySardine&&window.CloudOdysseySardine.getState?window.CloudOdysseySardine.getState():null;}
function currentSardine(){var S=window.CloudOdysseySardine,x=sardineState();return S&&x?S.projects[(Number(x.project)||0)%S.projects.length]:null;}
function setSardineMode(mode,focus){
 var S=window.CloudOdysseySardine,x=sardineState();if(!S||!x)return;x.mode=mode;S.save();S.render();setTimeout(function(){var n=$(focus||"");if(n){n.scrollIntoView({behavior:"smooth",block:"center"});if(n.focus)n.focus();}},90);
}
function firstUnverifiedSardineArtifact(pr){
 var S=window.CloudOdysseySardine,x=sardineState();if(!S||!x||!pr)return 0;var list=S.artifacts(pr),ev=x.artifactEvidence||{};
 for(var i=0;i<list.length;i++){var row=ev[pr.id+"::"+list[i][0]];if(!(row&&row.verified))return i;}return 0;
}
function sardineUnlockPlan(){
 var S=window.CloudOdysseySardine,A=window.CloudOdysseySardineAssignments,F=window.CloudOdysseySardineArtifacts,pr=currentSardine(),x=sardineState();if(!S||!pr||!x)return;
 var completed=S.completed(pr),verified=S.verifiedArtifacts(pr),def=Number((x.defense||{})[pr.id]||0);
 var c=modal('<span class="micro">SARDINE LIVE GATE</span><h2>'+esc(pr.title)+' unlock plan</h2><div class="rpu-gates"><article><b>'+completed+'/14</b><span>graded assignments</span></article><article><b>'+verified+'/6</b><span>verified files</span></article><article><b>'+def+'%</b><span>blind defense</span></article></div><p>Live-provider checks stay simulation-safe until the project has evidence. Use the next missing gate instead of hitting a dead control.</p><div class="rpu-actions"><button id="rpuSContinue">Continue assignment</button><button id="rpuSArtifact">Verify next file</button><button id="rpuSDefense">Practice defense</button></div>');
 if(!c)return;
 $('#rpuSContinue',c).onclick=function(){close();if(A&&A.next)A.next();};
 $('#rpuSArtifact',c).onclick=function(){close();if(F&&F.openArtifact)F.openArtifact(firstUnverifiedSardineArtifact(pr));};
 $('#rpuSDefense',c).onclick=function(){close();setSardineMode("mission","#sdefense");};
}
function enhanceSardine(){
 var root=$("#view-sardine"),S=window.CloudOdysseySardine,pr=currentSardine(),x=sardineState();if(!root||!S||!pr||!x)return;
 var hero=$(".sardine-project-hero",root);
 if(hero&&!$(".rpu-sardine-actions",hero)){
   var a=D.createElement("div");a.className="rpu-sardine-actions";a.innerHTML='<button data-rpu-s="continue">Continue assignment →</button><button data-rpu-s="incident">Break / fix</button><button data-rpu-s="mock">Mock review</button><button data-rpu-s="artifact">Artifact lab</button><button data-rpu-s="defense">Blind defense</button>';hero.appendChild(a);
   $('[data-rpu-s="continue"]',a).onclick=function(){var A=window.CloudOdysseySardineAssignments;if(A&&A.next)A.next();else setSardineMode("mission");};
   $('[data-rpu-s="incident"]',a).onclick=function(){setSardineMode("incident","#sincident");};
   $('[data-rpu-s="mock"]',a).onclick=function(){setSardineMode("mock","#smock");};
   $('[data-rpu-s="artifact"]',a).onclick=function(){var F=window.CloudOdysseySardineArtifacts;if(F&&F.openArtifact)F.openArtifact(firstUnverifiedSardineArtifact(pr));};
   $('[data-rpu-s="defense"]',a).onclick=function(){var n=$("#sdefense",root);if(n){n.scrollIntoView({behavior:"smooth",block:"center"});n.focus();}else setSardineMode("mission","#sdefense");};
 }
 var conn=$("#sconnector",root);
 if(conn&&!S.graduated(pr)){
   conn.disabled=false;conn.textContent="Open live-gate plan →";conn.title="Shows the exact assignments, artifacts and defense evidence still required";conn.onclick=function(e){e.preventDefault();sardineUnlockPlan();};
 }
 var proof=$(".sardine-proof",root);
 if(proof&&!$(".rpu-sardine-progress",proof)){
   var p=D.createElement("div");p.className="rpu-sardine-progress";p.innerHTML='<span>NEXT PRODUCTIVE ACTION</span><button id="rpuSardineNext">'+(S.completed(pr)<14?'Complete next assignment':S.verifiedArtifacts(pr)<6?'Verify next artifact':Number((x.defense||{})[pr.id]||0)<85?'Pass blind defense':'Review / advance project')+' →</button>';proof.insertBefore(p,proof.firstChild);
   $('#rpuSardineNext',p).onclick=function(){if(S.completed(pr)<14){var A=window.CloudOdysseySardineAssignments;if(A&&A.next)A.next();}else if(S.verifiedArtifacts(pr)<6){var F=window.CloudOdysseySardineArtifacts;if(F&&F.openArtifact)F.openArtifact(firstUnverifiedSardineArtifact(pr));}else if(Number((x.defense||{})[pr.id]||0)<85){var n=$("#sdefense",root);if(n){n.scrollIntoView({behavior:"smooth",block:"center"});n.focus();}}else{x.project=(Number(x.project)+1)%S.projects.length;x.mode="mission";S.save();S.render();}};
 }
}
function installStyle(){
 if($("#roleProjectUpgradeStyle"))return;var s=D.createElement("style");s.id="roleProjectUpgradeStyle";s.textContent=
 ".rpu-hgv-banner{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:16px 18px;margin:0 0 16px}.rpu-hgv-banner b{display:block;font-size:15px;margin:4px 0}.rpu-hgv-banner p{margin:0;color:#91a4bd}.rpu-hgv-banner button,.rpu-project-actions button,.rpu-sardine-actions button,.rpu-actions button,.rpu-mission-list button,.rpu-sardine-progress button{border:1px solid rgba(112,190,255,.35);background:rgba(24,55,91,.68);color:#dff6ff;border-radius:10px;padding:9px 11px;font:600 11px Inter,sans-serif;cursor:pointer}.rpu-hgv-banner button:hover,.rpu-project-actions button:hover,.rpu-sardine-actions button:hover,.rpu-actions button:hover,.rpu-mission-list button:hover,.rpu-sardine-progress button:hover{transform:translateY(-1px);border-color:rgba(111,240,201,.7)}.rpu-project-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0 8px}.rpu-project-meta span{background:rgba(6,14,30,.56);border:1px solid rgba(120,160,210,.14);border-radius:8px;padding:7px;font-size:8px;letter-spacing:.08em}.rpu-project-meta b{display:block;font-size:11px;margin-top:3px}.rpu-project-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.rpu-stack{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 14px}.rpu-stack span{padding:5px 8px;border-radius:999px;background:rgba(48,93,132,.35);font-size:9px}.rpu-mission-list{display:grid;gap:9px}.rpu-mission-list article{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px;border:1px solid rgba(115,165,220,.18);border-radius:12px;background:rgba(4,10,22,.5)}.rpu-mission-list article span{font-size:8px;letter-spacing:.12em;color:#6ff0c9}.rpu-mission-list article b{display:block;margin:3px 0}.rpu-mission-list article p{margin:0;color:#92a5bd;font-size:11px}.rpu-defense{width:100%;min-height:210px;background:#07111f;color:#e9f5ff;border:1px solid rgba(112,190,255,.28);border-radius:12px;padding:12px;resize:vertical}.rpu-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.rpu-result{white-space:pre-wrap;background:#050b15;border:1px solid rgba(120,160,210,.18);border-radius:10px;padding:10px;min-height:52px;color:#b8cee4}.rpu-mini-score{margin-top:12px;color:#91a4bd}.rpu-sardine-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.rpu-sardine-progress{border:1px solid rgba(111,240,201,.2);background:rgba(10,33,38,.42);border-radius:10px;padding:10px;margin-bottom:10px}.rpu-sardine-progress span{display:block;font-size:8px;letter-spacing:.12em;color:#6ff0c9;margin-bottom:6px}.rpu-gates{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.rpu-gates article{padding:12px;border-radius:10px;background:rgba(8,17,31,.65);border:1px solid rgba(120,160,210,.18)}.rpu-gates b{display:block;font-size:20px}.rpu-gates span{font-size:9px;color:#91a4bd}@media(max-width:760px){.rpu-hgv-banner{align-items:flex-start;flex-direction:column}.rpu-project-actions{grid-template-columns:1fr}.rpu-mission-list article{grid-template-columns:1fr}.rpu-gates{grid-template-columns:1fr 1fr}.rpu-sardine-actions{display:grid;grid-template-columns:1fr 1fr}}";
 D.head.appendChild(s);
}
var timer=null;
function enhance(){installStyle();enhanceHgv();enhanceSardine();}
var obs=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(enhance,90);});
obs.observe($("#workspace")||D.body,{subtree:true,childList:true});
D.addEventListener("odyssey:viewchange",function(){setTimeout(enhance,70);});
D.addEventListener("odyssey:interaction-audit",function(){setTimeout(enhance,40);});
setTimeout(enhance,120);setTimeout(enhance,900);
window.CloudOdysseyRoleProjects={enhance:enhance,openHgvProject:openHgvMissionMenu,openHgvDefense:openHgvDefense,sardineUnlockPlan:sardineUnlockPlan};
})();
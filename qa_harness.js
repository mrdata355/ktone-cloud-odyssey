
(function(){
"use strict";
var D=document;
var runtimeErrors=[];
window.addEventListener("error",function(e){runtimeErrors.push({type:"error",message:e.message||String(e.error||"unknown"),source:e.filename||"",line:e.lineno||0});});
window.addEventListener("unhandledrejection",function(e){runtimeErrors.push({type:"promise",message:String(e.reason||"unhandled rejection")});});

var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};

var knownDataActions=[
 "view","jump","closeModal","filter","labpanel","editor","w","m","open","check","choice",
 "stage","deep","tool","mode","advance","copy","audience","tab","answer","speakMode","opt",
 "correct","forgeMode","matchLeft","matchRight","fileChoice","step","provider","project",
 "cloudStage","dockView"
];

var alwaysCritical=[
 "soundToggle","resumeMission","byteHint","byteChallenge","mapZoomIn","mapZoomOut","mapZoomReset",
 "runCode","submitLab","revealSolution","formatCode","clearLogs","runNotebook","newIncident","resetProgress",
 "gradeComms","loadModel","gradeStar","modelStar","nextStar","voiceStar","speakProblem","toggleEliteVoice",
 "newScenario","dictateElite","revealElite","gradeElite","randomForge","runForge","resetForge","nextForge",
 "revealForge","gradeForge","resetMatch","gradeLadder","revealLadder","nextStep","nextPattern","cloudRun","saveEvidence"
];

function duplicateIds(){
 var seen={},dups=[];
 $$("[id]").forEach(function(el){var id=el.id;if(seen[id])dups.push(id);else seen[id]=1;});
 return Array.from(new Set(dups));
}
function actionable(button){
 if(typeof button.onclick==="function")return true;
 if(button.type==="submit")return true;
 if(button.matches&&button.matches("[data-rich-action]"))return true;
 return false;
}
function checkControls(){
 var present=0,wired=0,details=[];
 alwaysCritical.forEach(function(id){
   var el=$("#"+id);
   if(!el){details.push({id:id,status:"dynamic/not-rendered"});return;}
   present++;
   var ok=actionable(el);if(ok)wired++;
   details.push({id:id,status:ok?"wired":"unwired"});
 });
 var allButtons=$$("button"),unwiredVisible=[];
 allButtons.forEach(function(b){
   if(!actionable(b)&&b.offsetParent!==null){
     unwiredVisible.push({id:b.id||null,text:(b.textContent||"").replace(/\s+/g," ").trim().slice(0,60)});
   }
 });
 return {present:present,wired:wired,total:present,details:details,unwiredVisible:unwiredVisible};
}
function checkJumpTargets(){
 var bad=[];
 $("[data-jump]").forEach(function(el){var v=el.dataset.jump;if(v&&!$("#view-"+v))bad.push(v);});
 return Array.from(new Set(bad));
}
function checkRichActions(){
 var wanted=["project-stream:quick","project-stream:build","project-stream:talk","project-stream:incident","project-stream:cloud","project-stream:explain"];
 return wanted.map(function(action){
   var el=$('[data-rich-action="'+action+'"]');
   var targetMap={"project-stream:quick":"pattern-match","project-stream:build":"coding-forge","project-stream:talk":"speaking","project-stream:incident":"warroom","project-stream:cloud":"cloud-forge","project-stream:explain":"stakeholder"};
   var target=$("#view-"+targetMap[action]);
   return {
     action:action,
     present:!!el,
     wired:!!(el&&typeof el.onclick==="function"),
     target:!!target,
     ok:!!(el&&typeof el.onclick==="function"&&target)
   };
 });
}
function checkNavigation(){
 var CO=window.CloudOdyssey;
 var buttons=$$("#nav .nav-item[data-view]");
 var start=($(".view.active")||{}).id||"view-command";
 var startView=start.replace(/^view-/,"");
 var pass=0,details=[];
 buttons.forEach(function(b){
   var view=b.dataset.view,target=$("#view-"+view);
   if(!target){details.push({view:view,ok:false,reason:"missing target"});return;}
   try{
     b.click();
     var ok=target.classList.contains("active") && b.classList.contains("active");
     if(ok)pass++;
     details.push({view:view,ok:ok,reason:ok?"route activated":"active state mismatch"});
   }catch(e){
     details.push({view:view,ok:false,reason:String(e)});
   }
 });
 try{
   if(window.CloudOdysseyUI)window.CloudOdysseyUI.activate(startView,{silent:true,instant:true,keepScroll:true});
   else if(CO)CO.setView(startView);
 }catch(e){}
 return {total:buttons.length,pass:pass,details:details};
}
function checkModules(){
 var expected=[
  ["CloudOdyssey",!!window.CloudOdyssey],
  ["Reasoning Engine",!!$("#whyModeBadge")||!!window.CloudOdyssey],
  ["Stakeholder Room",!!$("#view-stakeholder")],
  ["Vocabulary + STAR",!!$("#view-speaking")],
  ["Elite Coach",!!$("#view-elite")],
  ["Coding Forge",!!$("#view-coding-forge")],
  ["Pattern Match",!!$("#view-pattern-match")],
  ["Adaptive Ladder",!!$("#view-adaptive-ladder")],
  ["Cloud + Lakehouse Forge",!!$("#view-cloud-forge")],
  ["Button & Backend Map",!!$("#view-action-map")],
  ["Backend Control Plane",!!$("#view-backend")],
  ["Backend Systems Forge",!!$("#view-backend-forge")],
  ["Graduation Gate",!!$("#view-graduation")],
  ["Sardine Mission Forge",!!$("#view-sardine")],
  ["Project Launchpad",!!window.CloudOdysseyProjectLaunchpad]
 ];
 return expected;
}
function checkAssets(){
 var required=[
  "app.js","enterprise.js","reasoning.js","communications.js","speaking.js","elite.js",
  "coding_forge.js","adaptive_ladder.js","cloud_forge.js","ultra_ui.js","qa_harness.js","action_map.js","backend_client.js","backend_console.js","backend_forge.js","graduation_gate.js","sardine_data.js","sardine_forge.js","project_launchpad.js"
 ];
 var loaded=$$("script[src]").map(function(s){return (s.getAttribute("src")||"").split("/").pop();});
 return required.map(function(x){return {asset:x,ok:loaded.indexOf(x)>=0};});
}
function run(open){
 var nav=checkNavigation();
 var controls=checkControls();
 var dups=duplicateIds();
 var jumps=checkJumpTargets();
 var richActions=checkRichActions();
 var modules=checkModules();
 var assets=checkAssets();
 var modulePass=modules.filter(function(x){return x[1];}).length;
 var assetPass=assets.filter(function(x){return x.ok;}).length;
 var ok=
   nav.pass===nav.total &&
   controls.wired===controls.total &&
   controls.unwiredVisible.length===0 &&
   dups.length===0 &&
   jumps.length===0 &&
   richActions.every(function(x){return x.ok;}) &&
   runtimeErrors.length===0 &&
   modulePass===modules.length &&
   assetPass===assets.length;
 var report={
   timestamp:new Date().toISOString(),
   ok:ok,
   navPass:nav.pass,
   navTotal:nav.total,
   navDetails:nav.details,
   controlsPass:controls.wired,
   controlsTotal:controls.total,
   criticalControlDetails:controls.details,
   unwiredVisibleButtons:controls.unwiredVisible,
   duplicateIds:dups.length,
   duplicateIdList:dups,
   badJumpTargets:jumps,
   commandCenterActions:richActions,
   modules:modules,
   assets:assets,
   errors:runtimeErrors.slice(),
   viewport:{width:window.innerWidth,height:window.innerHeight},
   userAgent:navigator.userAgent
 };
 window.__ODYSSEY_QA__=report;
 D.dispatchEvent(new CustomEvent("odyssey:qa:result",{detail:Object.assign({open:open!==false},report)}));
 return report;
}
D.addEventListener("odyssey:qa:run",function(e){setTimeout(function(){run(!e.detail||e.detail.open!==false);},20);});

setTimeout(function(){run(false);},650);

window.CloudOdysseyQA={
 run:function(){return run(true);},
 getReport:function(){return window.__ODYSSEY_QA__;},
 getErrors:function(){return runtimeErrors.slice();}
};
})();

(function(){
"use strict";
if(!window.CloudOdyssey)return;
var D=document,CO=window.CloudOdyssey;
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};

function standardRoute(b){
 return !!(b.dataset.view||b.dataset.jump||b.dataset.closeModal!==undefined||b.dataset.richAction||b.dataset.dockView||b.dataset.modalMission);
}
function wired(b){
 if(!b||b.disabled)return true;
 if(typeof b.onclick==="function")return true;
 if(standardRoute(b))return true;
 if(b.type==="submit"&&b.closest("form"))return true;
 return false;
}
function label(b){return (b.textContent||b.title||b.id||"(unnamed)").replace(/\s+/g," ").trim().slice(0,90);}
function repairKnown(b){
 if(wired(b))return true;
 var id=b.id||"";
 if(id==="newIncident"){b.onclick=function(){if(CO.launchIncident)CO.launchIncident((CO.incidentProgress&&CO.incidentProgress().current+1)||0);};return true;}
 if(id==="nextIncident"){b.onclick=function(){if(CO.nextIncident)CO.nextIncident();};return true;}
 if(b.dataset.view){b.onclick=function(){CO.setView(b.dataset.view);};return true;}
 if(b.dataset.jump){b.onclick=function(){CO.setView(b.dataset.jump);};return true;}
 if(b.dataset.closeModal!==undefined){b.onclick=function(){var m=$("#modal");if(m)m.classList.add("hidden");};return true;}
 return false;
}
function scanView(view,repair){
 var root=typeof view==="string"?$("#view-"+view):view;if(!root)return {view:null,total:0,wired:0,dead:[]};
 var buttons=$$("button",root),dead=[];
 buttons.forEach(function(b){
   if(repair)repairKnown(b);
   if(!wired(b)){dead.push({id:b.id||"",label:label(b),className:b.className||""});b.dataset.coDead="1";}
   else delete b.dataset.coDead;
 });
 return {view:root.id.replace(/^view-/,""),total:buttons.length,wired:buttons.length-dead.length,dead:dead};
}
function scanAll(repair){
 var reports=$$(".view").map(function(v){return scanView(v,repair!==false);});
 var total=reports.reduce(function(n,x){return n+x.total;},0),dead=[];
 reports.forEach(function(r){r.dead.forEach(function(x){dead.push(Object.assign({view:r.view},x));});});
 var result={total:total,wired:total-dead.length,dead:dead,reports:reports,at:new Date().toISOString()};
 window.__cloudOdysseyInteractionAudit=result;
 updateBadge(result);
 D.dispatchEvent(new CustomEvent("odyssey:interaction-audit",{detail:result}));
 return result;
}
function updateBadge(r){
 var strip=$("#odysseyStatusStrip");if(!strip)return;
 var old=$("#interactionIntegrity",strip);if(!old){old=D.createElement("span");old.id="interactionIntegrity";strip.appendChild(old);}
 old.innerHTML='INTERACTIONS // <strong class="'+(r.dead.length?"bad":"good")+'">'+r.wired+'/'+r.total+(r.dead.length?' • '+r.dead.length+' DEAD':' • OK')+'</strong>';
 old.title=r.dead.length?r.dead.map(function(x){return x.view+": "+x.label;}).join("\n"):"All currently rendered button controls have an action route.";
}
function showAudit(){
 var r=scanAll(true),m=$("#modal"),content=$("#modalContent");if(!m||!content)return;
 content.innerHTML='<span class="micro">INTERACTION INTEGRITY</span><h2>'+r.wired+'/'+r.total+' controls wired</h2>'+
 '<p>'+(r.dead.length?"These controls still need explicit implementation.":"No dead rendered buttons detected across the current DOM.")+'</p>'+
 (r.dead.length?'<div class="u-modal-list">'+r.dead.map(function(x){return '<div><b>'+x.view+'</b><span>'+x.label+'</span></div>';}).join("")+'</div>':'')+
 '<div class="u-rich-modal-actions"><button id="rerunInteractionAudit" class="primary-btn">Run audit again</button></div>';
 m.classList.remove("hidden");var b=$("#rerunInteractionAudit");if(b)b.onclick=function(){showAudit();};
}
var timer=null;
var obs=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(function(){scanAll(true);},120);});
obs.observe(D.body,{subtree:true,childList:true});
D.addEventListener("odyssey:viewchange",function(){setTimeout(function(){scanAll(true);},50);});
D.addEventListener("odyssey:qa:run",function(){setTimeout(function(){scanAll(true);},80);});
setTimeout(function(){scanAll(true);},650);
setTimeout(function(){scanAll(true);},1800);
window.CloudOdysseyInteractionIntegrity={scanAll:scanAll,scanView:scanView,showAudit:showAudit};
})();
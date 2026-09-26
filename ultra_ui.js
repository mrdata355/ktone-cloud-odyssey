
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Ultra UI requires CloudOdyssey");return;}
var CO=window.CloudOdyssey;
var D=document;
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};

D.body.classList.add("ui-pro");

var viewMeta={
 command:{title:"Production Command Center",icon:"◈",group:"Core Operations",desc:"Overall readiness, telemetry and recommended work"},
 worlds:{title:"World Map",icon:"✦",group:"Core Operations",desc:"Ten production domains"},
 missions:{title:"Mission Control",icon:"◎",group:"Core Operations",desc:"Thirty hands-on missions"},
 lab:{title:"Cloud Lab",icon:"⌘",group:"Core Operations",desc:"Code, architecture, tests and production evidence"},
 warroom:{title:"Incident War Room",icon:"⚠",group:"Core Operations",desc:"Break/fix and recovery pressure"},
 projects:{title:"PROJECTS* Readiness",icon:"▦",group:"Evidence",desc:"Production deliverables and completion proof"},
 skills:{title:"Skills Matrix",icon:"⌁",group:"Evidence",desc:"Evidence-based proficiency coverage"},
 relics:{title:"Relic Vault",icon:"◇",group:"Evidence",desc:"Mastery achievements"},
 enterprise:{title:"Enterprise Recovery Drill",icon:"⛨",group:"Elite Training",desc:"Deep distributed-state recovery"},
 simulators:{title:"Platform Simulators",icon:"▤",group:"Elite Training",desc:"Databricks, Kafka, Delta, MLflow, Airflow, dbt and cloud"},
 interview:{title:"Interview Arena",icon:"◉",group:"Elite Training",desc:"Incident, design and code-defense practice"},
 stakeholder:{title:"Stakeholder Room",icon:"☍",group:"Communication",desc:"Executive and cross-team translation"},
 speaking:{title:"Vocabulary + STAR",icon:"ABC",group:"Communication",desc:"Production-language fluency"},
 elite:{title:"Elite Coach",icon:"◬",group:"Elite Training",desc:"Blind scenarios and proficiency evidence"},
 "coding-forge":{title:"Elite Coding Forge",icon:"{ }",group:"Engineering Forge",desc:"Build, debug, optimize and productionize"},
 "pattern-match":{title:"Pattern Match Arena",icon:"↔",group:"Engineering Forge",desc:"Rapid problem-to-pattern recognition"},
 "adaptive-ladder":{title:"Adaptive Coding Ladder",icon:"⇧",group:"Engineering Forge",desc:"Recognize through package mastery"},
 "cloud-forge":{title:"AWS + GCP Project Forge",icon:"☁",group:"Cloud Campaigns",desc:"Twenty-four production cloud projects"}
};

function navItems(){
 return $$("#nav .nav-item[data-view]");
}
function pageTitleFor(view){
 var m=viewMeta[view];if(m)return m.title;
 var b=$('#nav .nav-item[data-view="'+view+'"] b');return b?b.textContent:"Cloud Odyssey";
}
function activate(view,opts){
 opts=opts||{};
 var target=$("#view-"+view);
 if(!target){CO.toast("View unavailable: "+view);return false;}
 try{CO.setView(view);}catch(e){
   $$(".view").forEach(function(v){v.classList.remove("active");});
   target.classList.add("active");
 }
 navItems().forEach(function(b){b.classList.toggle("active",b.dataset.view===view);});
 var title=$("#pageTitle");if(title)title.textContent=pageTitleFor(view);
 if(!opts.keepScroll)window.scrollTo({top:0,behavior:opts.instant?"auto":"smooth"});
 updateStatus();
 if(!opts.silent)D.dispatchEvent(new CustomEvent("odyssey:viewchange",{detail:{view:view}}));
 return true;
}

function groupNavigation(){
 var nav=$("#nav");if(!nav)return;
 $$(".nav-section",nav).forEach(function(x){x.remove();});
 var items=navItems(),last=null;
 items.forEach(function(item){
   var view=item.dataset.view,m=viewMeta[view],group=m?m.group:"Specialized Systems";
   item.title=(m?m.title:item.textContent.trim())+" — "+(m?m.desc:"Open module");
   if(group!==last){
     var label=D.createElement("div");label.className="nav-section";label.textContent=group;
     nav.insertBefore(label,item);last=group;
   }
 });
}

function createStatusStrip(){
 if($("#odysseyStatusStrip"))return;
 var el=D.createElement("div");el.id="odysseyStatusStrip";D.body.appendChild(el);updateStatus();
}
function activeView(){
 var v=$(".view.active");return v?v.id.replace(/^view-/,""):"command";
}
function updateStatus(){
 var el=$("#odysseyStatusStrip");if(!el)return;
 var s=CO.getState(),missions=CO.doneCount(),checks=Object.values(s.checks||{}).filter(Boolean).length;
 var v=activeView(),name=pageTitleFor(v);
 el.innerHTML='<span><i class="pulse"></i><strong>SYSTEM ONLINE</strong></span>'+
 '<span>ACTIVE // <strong>'+esc(name.toUpperCase())+'</strong></span>'+
 '<span>MISSION EVIDENCE // <strong>'+missions+'/30</strong></span>'+
 '<span>PROJECT ARTIFACTS // <strong>'+checks+'/60</strong></span>'+
 '<span>STATE // <strong>LOCAL + GITHUB CI/CD</strong></span>';
}

function createDock(){
 if($("#odysseyMissionDock"))return;
 var dock=D.createElement("div");dock.id="odysseyMissionDock";
 dock.innerHTML=
 '<div class="dock-status"><i></i><span class="dock-label">MISSION CONTROL</span></div>'+
 '<button data-dock-view="command" title="Command Center">◈</button>'+
 '<button data-dock-view="lab" title="Resume Cloud Lab">⌘ LAB</button>'+
 '<button data-dock-view="coding-forge" title="Elite Coding Forge">{ }</button>'+
 '<button data-dock-view="cloud-forge" title="AWS + GCP Forge">☁</button>'+
 '<button id="dockPalette" class="dock-main" title="Command Palette (Ctrl/Cmd+K)">⌘ K</button>'+
 '<button id="dockQA" title="UI Health">✓</button>';
 D.body.appendChild(dock);
 $$("[data-dock-view]",dock).forEach(function(b){b.onclick=function(){activate(b.dataset.dockView);};});
 $("#dockPalette").onclick=openPalette;
 $("#dockQA").onclick=function(){D.dispatchEvent(new CustomEvent("odyssey:qa:run",{detail:{open:true}}));};
}

function paletteEntries(){
 return navItems().map(function(b){
   var v=b.dataset.view,m=viewMeta[v]||{};
   return {view:v,title:m.title||(b.querySelector("b")||b).textContent.trim(),icon:m.icon||(b.querySelector("span")||{}).textContent||"•",desc:m.desc||"Open module",group:m.group||"Specialized"};
 });
}
function createPalette(){
 if($("#odysseyCommandPalette"))return;
 var p=D.createElement("div");p.id="odysseyCommandPalette";
 p.innerHTML='<div class="palette-backdrop"></div><div class="palette-card">'+
 '<div class="palette-search"><span>⌘</span><input id="paletteInput" autocomplete="off" placeholder="Jump to a lab, simulator, interview room, cloud project…"><kbd>ESC</kbd></div>'+
 '<div class="palette-list" id="paletteList"></div></div>';
 D.body.appendChild(p);
 $(".palette-backdrop",p).onclick=closePalette;
 $("#paletteInput").addEventListener("input",renderPalette);
 $("#paletteInput").addEventListener("keydown",function(e){
   var visible=$$("#paletteList .palette-item");
   if(e.key==="ArrowDown"||e.key==="ArrowUp"){
     e.preventDefault();var cur=visible.findIndex(function(x){return x.classList.contains("selected");});
     if(cur>=0)visible[cur].classList.remove("selected");
     cur=e.key==="ArrowDown"?Math.min(visible.length-1,cur+1):Math.max(0,cur<0?0:cur-1);
     if(visible[cur])visible[cur].classList.add("selected");
   }else if(e.key==="Enter"){
     var sel=$("#paletteList .palette-item.selected")||visible[0];if(sel){activate(sel.dataset.view);closePalette();}
   }
 });
}
function renderPalette(){
 var input=$("#paletteInput"),list=$("#paletteList");if(!input||!list)return;
 var q=input.value.trim().toLowerCase();
 var rows=paletteEntries().filter(function(x){
   return !q||[x.title,x.desc,x.group,x.view].join(" ").toLowerCase().indexOf(q)>=0;
 });
 list.innerHTML=rows.map(function(x,i){
   return '<button class="palette-item '+(i===0?"selected":"")+'" data-view="'+esc(x.view)+'">'+
   '<span class="picon">'+esc(x.icon)+'</span><span><b>'+esc(x.title)+'</b><small>'+esc(x.group)+' • '+esc(x.desc)+'</small></span><em>↵</em></button>';
 }).join("");
 $$(".palette-item",list).forEach(function(b){b.onclick=function(){activate(b.dataset.view);closePalette();};});
}
function openPalette(){
 createPalette();var p=$("#odysseyCommandPalette");p.classList.add("open");renderPalette();
 setTimeout(function(){var i=$("#paletteInput");if(i){i.value="";i.focus();renderPalette();}},10);
}
function closePalette(){var p=$("#odysseyCommandPalette");if(p)p.classList.remove("open");}

function addSpotlights(){
 var selectors=[
  ".hero-panel",".byte-card",".kpi-card",".section-card",".world-node",".mission-table",
  ".inspector-card",".notebook-card",".enterprise-main",".stakeholder-main",".speaking-main",
  ".elite-main",".forge-main",".ladder-main",".cloud-project-main",".match-board",".reasoning-panel"
 ];
 $$(selectors.join(",")).forEach(function(el){
   if(el.hasAttribute("data-u-spotlight"))return;
   el.setAttribute("data-u-spotlight","");
   el.addEventListener("pointermove",function(e){
     var r=el.getBoundingClientRect();el.style.setProperty("--u-x",(e.clientX-r.left)+"px");el.style.setProperty("--u-y",(e.clientY-r.top)+"px");
   });
 });
}

function improveAccessibility(){
 $$("button").forEach(function(b){
   if(!b.getAttribute("aria-label")&&!b.textContent.trim()&&b.title)b.setAttribute("aria-label",b.title);
   if(!b.title){
     var txt=b.textContent.replace(/\s+/g," ").trim();if(txt&&txt.length<55)b.title=txt;
   }
 });
 $$("textarea").forEach(function(t){if(!t.getAttribute("aria-label")&&!t.placeholder)t.setAttribute("aria-label","Code or response editor");});
}

function installFallbackRouting(){
 D.addEventListener("click",function(e){
   var nav=e.target.closest&&e.target.closest(".nav-item[data-view]");
   if(nav){activate(nav.dataset.view,{silent:true,keepScroll:false});return;}
   var jump=e.target.closest&&e.target.closest("[data-jump]");
   if(jump&&jump.dataset.jump){activate(jump.dataset.jump,{silent:true});}
 },true);
}

function createHealthShell(){
 if($("#odysseyHealth"))return;
 var h=D.createElement("div");h.id="odysseyHealth";
 h.innerHTML='<div class="health-head"><b>UI HEALTH // QA</b><button id="closeHealth">×</button></div>'+
 '<div class="health-body" id="healthBody"><div class="health-row"><span>Waiting for runtime scan</span><strong>…</strong></div></div>'+
 '<div class="health-actions"><button id="rerunHealth">Run scan</button><button id="copyHealth">Copy report</button></div>';
 D.body.appendChild(h);
 $("#closeHealth").onclick=function(){h.classList.remove("open");};
 $("#rerunHealth").onclick=function(){D.dispatchEvent(new CustomEvent("odyssey:qa:run",{detail:{open:true}}));};
 $("#copyHealth").onclick=function(){
   var r=window.__ODYSSEY_QA__;var txt=r?JSON.stringify(r,null,2):"No QA report yet";
   if(navigator.clipboard)navigator.clipboard.writeText(txt);CO.toast("QA report copied");
 };
 D.addEventListener("odyssey:qa:result",function(e){
   var r=e.detail||{},body=$("#healthBody");if(!body)return;
   var rows=[
    ["Navigation routes",r.navPass+"/"+r.navTotal,r.navPass===r.navTotal],
    ["Critical controls",r.controlsPass+"/"+r.controlsTotal,r.controlsPass===r.controlsTotal],
    ["Duplicate IDs",String(r.duplicateIds||0),(r.duplicateIds||0)===0],
    ["Runtime errors",String((r.errors||[]).length),(r.errors||[]).length===0],
    ["Overall",r.ok?"PASS":"CHECK",!!r.ok]
   ];
   body.innerHTML=rows.map(function(x){return '<div class="health-row '+(x[2]?"good":"bad")+'"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>';}).join("");
   if(e.detail.open!==false)h.classList.add("open");
 });
}

function installKeyboard(){
 D.addEventListener("keydown",function(e){
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPalette();return;}
   if(e.key==="Escape"){closePalette();var h=$("#odysseyHealth");if(h)h.classList.remove("open");return;}
   if(e.altKey&&!e.ctrlKey&&!e.metaKey){
     var n=parseInt(e.key,10);if(n>=1&&n<=9){var items=navItems();if(items[n-1]){e.preventDefault();activate(items[n-1].dataset.view);}}
   }
   if(e.shiftKey&&!e.ctrlKey&&!e.metaKey){
     if(e.key.toLowerCase()==="i"){activate("warroom");}
     if(e.key.toLowerCase()==="c"){activate("coding-forge");}
     if(e.key.toLowerCase()==="g"){activate("cloud-forge");}
   }
 });
}

function markActiveNav(){
 var v=activeView();navItems().forEach(function(b){b.classList.toggle("active",b.dataset.view===v);});
}

var observer=new MutationObserver(function(){
 groupNavigation();addSpotlights();improveAccessibility();markActiveNav();updateStatus();
});
observer.observe($("#workspace")||D.body,{childList:true,subtree:true});

groupNavigation();
createStatusStrip();
createDock();
createPalette();
createHealthShell();
addSpotlights();
improveAccessibility();
installFallbackRouting();
installKeyboard();
markActiveNav();
updateStatus();
setInterval(updateStatus,3000);

window.CloudOdysseyUI={
 activate:activate,
 openPalette:openPalette,
 closePalette:closePalette,
 refresh:function(){groupNavigation();addSpotlights();improveAccessibility();updateStatus();}
};
})();

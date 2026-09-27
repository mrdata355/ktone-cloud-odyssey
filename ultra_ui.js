
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
 "cloud-forge":{title:"Cloud + Lakehouse Project Forge",icon:"☁",group:"Cloud Campaigns",desc:"AWS, GCP, Azure, Databricks and Snowflake production projects"},
 backend:{title:"Backend Control Plane",icon:"⬡",group:"Platform Engineering",desc:"Real Vercel APIs, Postgres contracts, verification and observability"}
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
 '<button data-dock-view="cloud-forge" title="Cloud + Lakehouse Forge">☁</button>'+
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


function openRichModal(title,kicker,body,actions){
 var modal=$("#modal"),content=$("#modalContent");if(!modal||!content)return;
 content.innerHTML='<span class="micro">'+esc(kicker||"CLOUD ODYSSEY")+'</span><h2>'+esc(title)+'</h2>'+
 '<div class="u-rich-modal-body">'+body+'</div>'+
 '<div class="u-rich-modal-actions">'+(actions||[]).map(function(a){return '<button class="'+(a.primary?"primary-btn":"secondary-btn")+'" data-rich-action="'+esc(a.action)+'">'+esc(a.label)+'</button>';}).join("")+'</div>';
 modal.classList.remove("hidden");
 $("[data-rich-action]",content).forEach(function(b){b.onclick=function(){
   var action=b.dataset.richAction;
   modal.classList.add("hidden");
   handleRichAction(action);
 };});
}
function handleRichAction(action){
 if(!action)return;
 if(action.indexOf("view:")===0){activate(action.slice(5));return;}
 if(action.indexOf("mission:")===0){
   var p=action.slice(8).split(",");CO.openMission(+p[0],+p[1]);return;
 }
 if(action.indexOf("world:")===0){
   var wi=+action.slice(6),w=CO.worlds[wi];
   if(w)openRichModal(w.icon+" "+w.name,"WORLD "+String(wi+1).padStart(2,"0"),
     '<p>'+esc(w.desc)+'</p><div class="u-modal-chips">'+w.stack.map(function(x){return '<span>'+esc(x)+'</span>';}).join("")+'</div>'+
     '<div class="u-modal-list">'+w.missions.map(function(m,mi){return '<div><b>'+esc(m.title)+'</b><span>'+esc(w.skills[mi])+' • '+esc(m.type)+'</span><button data-modal-mission="'+wi+','+mi+'">Launch</button></div>';}).join("")+'</div>',
     [{label:"Mission Control",action:"view:missions"},{label:"Practice this world",action:"mission:"+wi+",0",primary:true}]
   );
   setTimeout(function(){$("[data-modal-mission]",$("#modalContent")).forEach(function(b){b.onclick=function(){var q=b.dataset.modalMission.split(",");$("#modal").classList.add("hidden");CO.openMission(+q[0],+q[1]);};});},0);
   return;
 }
 if(action==="surprise"){
   var wi=Math.floor(Math.random()*CO.worlds.length),mi=Math.floor(Math.random()*3);CO.openMission(wi,mi);return;
 }
 if(action==="weakest"){
   activate("skills");return;
 }
}
function createExperienceLaunchpad(){
 var command=$("#view-command");if(!command||$("#odysseyLaunchpad"))return;
 var hero=$(".hero-grid",command);if(!hero)return;
 var section=D.createElement("section");section.id="odysseyLaunchpad";section.className="u-launchpad";
 section.innerHTML=
 '<div class="u-launchpad-head"><div><span class="micro">PICK YOUR ENERGY</span><h3>What do you feel like doing?</h3><p>No giant checklist. Pick a mode and Cloud Odyssey drops you into the right kind of practice.</p></div><button class="u-surprise" data-rich-action="surprise">✦ Surprise me</button></div>'+
 '<div class="u-launchpad-grid">'+
   '<button class="u-mode-card cyan" data-rich-action="view:pattern-match"><span class="u-mode-icon">⚡</span><div><small>5–8 MIN</small><b>Quick Win</b><p>Fast pattern matching. Get momentum without opening an IDE.</p></div><em>Start easy →</em></button>'+
   '<button class="u-mode-card violet" data-rich-action="view:coding-forge"><span class="u-mode-icon">{ }</span><div><small>20–35 MIN</small><b>Build Something</b><p>Write, debug, optimize and productionize one real pattern.</p></div><em>Open forge →</em></button>'+
   '<button class="u-mode-card gold" data-rich-action="view:speaking"><span class="u-mode-icon">◉</span><div><small>10–15 MIN</small><b>Talk It Through</b><p>Vocabulary + STAR practice until the terms sound natural.</p></div><em>Start speaking →</em></button>'+
   '<button class="u-mode-card coral" data-rich-action="view:warroom"><span class="u-mode-icon">⚠</span><div><small>10–20 MIN</small><b>Break Production</b><p>Handle a live incident without destroying the evidence.</p></div><em>Enter war room →</em></button>'+
   '<button class="u-mode-card blue" data-rich-action="view:cloud-forge"><span class="u-mode-icon">☁</span><div><small>PROJECT MODE</small><b>Cloud Adventure</b><p>Build an AWS or GCP system end to end.</p></div><em>Choose cloud →</em></button>'+
   '<button class="u-mode-card green" data-rich-action="view:stakeholder"><span class="u-mode-icon">☍</span><div><small>8–12 MIN</small><b>Explain My Work</b><p>Practice speaking to executives, DE, BI, MLOps, SRE and more.</p></div><em>Choose audience →</em></button>'+
 '</div>';
 hero.insertAdjacentElement("afterend",section);
 $("[data-rich-action]",section).forEach(function(b){b.onclick=function(){handleRichAction(b.dataset.richAction);};});
}
function addActionButton(container,label,action,kind){
 var b=D.createElement("button");b.className="u-context-btn "+(kind||"");b.textContent=label;b.dataset.richAction=action;
 b.onclick=function(e){e.preventDefault();e.stopPropagation();handleRichAction(action);};container.appendChild(b);return b;
}
function enhanceCommandCards(){
 var command=$("#view-command");if(!command)return;
 $$(".kpi-card",command).forEach(function(card,i){
   if(card.querySelector(".u-card-actions"))return;
   var a=D.createElement("div");a.className="u-card-actions";
   var routes=[["Open missions","view:missions"],["Open PROJECTS*","view:projects"],["Try incident","view:warroom"],["View evidence","view:skills"]];
   addActionButton(a,routes[i][0],routes[i][1],"quiet");card.appendChild(a);
 });
 $("#campaignRows .campaign-row",command).forEach(function(row,i){
   if(row.querySelector(".u-inline-actions"))return;
   var a=D.createElement("div");a.className="u-inline-actions";addActionButton(a,"Explore","world:"+i,"");addActionButton(a,"Start quest","mission:"+i+",0","primary");row.appendChild(a);
 });
 $("#telemetry .telemetry-tile",command).forEach(function(tile,i){
   if(tile.querySelector(".u-tile-action"))return;
   var b=D.createElement("button");b.className="u-tile-action";b.textContent=i===5?"Diagnose →":"Inspect →";
   b.onclick=function(){if(i===5)activate("warroom");else openRichModal(tile.querySelector("span").textContent,"LIVE PLATFORM SIGNAL",'<p>This signal is part of the simulated production environment. Use it as evidence when deciding whether a system is healthy, degraded, or ready to publish.</p><div class="u-signal-big">'+esc(tile.querySelector("b").textContent)+'</div>',[{label:"Open Incident War Room",action:"view:warroom",primary:true},{label:"View skills evidence",action:"view:skills"}]);};tile.appendChild(b);
 });
 var radar=$(".command-grid .section-card:nth-child(2)",command);
 if(radar&&!radar.querySelector(".u-section-actions")){var ra=D.createElement("div");ra.className="u-section-actions";addActionButton(ra,"Train weakest skill","weakest","primary");addActionButton(ra,"Open proficiency","view:elite","");radar.appendChild(ra);}
}
function enhanceProjectCards(){
 $("#projectsBoard .project-card").forEach(function(card,i){
   if(card.querySelector(".u-project-actions"))return;
   var actions=D.createElement("div");actions.className="u-project-actions";
   addActionButton(actions,"Open world","world:"+i,"");
   addActionButton(actions,"Practice project","mission:"+i+",0","primary");
   addActionButton(actions,"Explain it","view:stakeholder","quiet");
   card.appendChild(actions);
 });
}
function enhanceSkillCards(){
 var skills=$("#view-skills");if(!skills)return;
 $$(".skill-row",skills).forEach(function(row){
   if(row.querySelector(".u-mini-action"))return;
   var b=D.createElement("button");b.className="u-mini-action";b.textContent="Practice";
   b.onclick=function(){activate("pattern-match");};row.appendChild(b);
 });
 $$(".signal-card",skills).forEach(function(card,i){
   if(card.querySelector(".u-card-actions"))return;
   var a=D.createElement("div");a.className="u-card-actions";
   addActionButton(a,i<2?"Prove it in code":"Practice explanation",i<2?"view:coding-forge":"view:stakeholder","quiet");card.appendChild(a);
 });
}
function enhanceRelics(){
 $("#relicVault .relic-card").forEach(function(card,i){
   if(card.querySelector(".u-project-actions"))return;
   var a=D.createElement("div");a.className="u-project-actions";
   addActionButton(a,"View world","world:"+i,"");
   addActionButton(a,card.classList.contains("locked")?"Unlock path":"Revalidate","mission:"+i+",0","primary");
   card.appendChild(a);
 });
}
function enhanceWorldCards(){
 $("#worldMap .world-node").forEach(function(card,i){
   if(card.dataset.uWholeCard)return;card.dataset.uWholeCard="1";card.setAttribute("role","button");card.setAttribute("tabindex","0");
   card.addEventListener("click",function(e){if(e.target.closest("button"))return;handleRichAction("world:"+i);});
   card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();handleRichAction("world:"+i);}});
 });
}
function enhanceSectionHeaders(){
 var map=[
  ["#view-command .command-grid.lower .section-card:first-child","Run incident","view:warroom"],
  ["#view-command .command-grid.lower .section-card:last-child","See all missions","view:missions"],
  ["#view-skills .section-card:first-child","Pattern practice","view:pattern-match"],
  ["#view-skills .section-card:last-child","Stakeholder practice","view:stakeholder"]
 ];
 map.forEach(function(x){
   var card=$(x[0]);if(!card)return;var head=$(".section-head",card);if(!head||head.querySelector(".u-context-btn"))return;addActionButton(head,x[1],x[2],"quiet");
 });
}
function runEnhancements(){
 createExperienceLaunchpad();enhanceCommandCards();enhanceProjectCards();enhanceSkillCards();enhanceRelics();enhanceWorldCards();enhanceSectionHeaders();
}

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
 groupNavigation();runEnhancements();addSpotlights();improveAccessibility();markActiveNav();updateStatus();
});
observer.observe($("#workspace")||D.body,{childList:true,subtree:true});

groupNavigation();
runEnhancements();
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
 refresh:function(){groupNavigation();runEnhancements();addSpotlights();improveAccessibility();updateStatus();}
};
})();

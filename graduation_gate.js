(function(){
"use strict";
if(!window.CloudOdyssey){return;}
var CO=window.CloudOdyssey,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from((r||document).querySelectorAll(s));
var filter="all",connectors=null;
function read(k){try{return JSON.parse(localStorage.getItem(k)||"{}");}catch(e){return {};}}
function cloudRows(){
 var cf=window.CloudOdysseyCloudForge,st=read("cloud_odyssey_cloud_forge_v1"),rows=[];
 if(!cf||!cf.projects)return rows;
 Object.keys(cf.projects).forEach(provider=>cf.projects[provider].forEach((p,i)=>{
   var pk=provider+"-"+p.id,done=Object.keys(st.checks||{}).filter(k=>k.indexOf(pk+"-")===0&&st.checks[k]).length;
   var grade=Number((st.simGrades||{})[pk]||0),grad=done===12&&grade>=85,ev=String((st.evidence||{})[pk]||"").trim().length>30;
   var conn=connectors&&connectors[provider],connected=!!(conn&&conn.validated),configured=!!(conn&&conn.configured);
   var state=!grad?(done===12?"defense":"locked"):(connected&&ev?"verified":"unlocked");
   rows.push({kind:"cloud",provider,id:p.id,index:i,title:p.title,icon:p.icon,done,grade,grad,evidence:ev,configured,connected,state});
 }));
 return rows;
}
function backendRows(){
 var bf=window.CloudOdysseyBackendForge,st=read("cloud_odyssey_backend_forge_v1"),rows=[];
 if(!bf||!bf.projects)return rows;
 bf.projects.forEach((p,i)=>{
   var done=Object.keys(st.checks||{}).filter(k=>k.indexOf(p.id+"-")===0&&st.checks[k]).length,grade=Number((st.grades||{})[p.id]||0),grad=done===12&&grade>=85;
   rows.push({kind:"backend",provider:"control_plane",id:p.id,index:i,title:p.title,icon:p.icon,done,grade,grad,evidence:grad,configured:true,connected:true,state:grad?"verified":done===12?"defense":"locked"});
 });
 return rows;
}
function label(r){return r.state==="verified"?"LIVE VERIFIED":r.state==="unlocked"?"LIVE UNLOCKED":r.state==="defense"?"DEFENSE REQUIRED":"SIMULATION";}
async function loadConnectors(){
 if(window.CloudOdysseyBackend&&window.CloudOdysseyBackend.connectorStatus){try{var x=await window.CloudOdysseyBackend.connectorStatus();connectors=x.connectors||{};}catch(e){connectors={};}}
 render();
}
function render(){
 var root=$("#view-graduation");if(!root)return;
 var rows=cloudRows().concat(backendRows()),shown=rows.filter(r=>filter==="all"||r.state===filter||r.provider===filter);
 var grad=rows.filter(r=>r.grad).length,verified=rows.filter(r=>r.state==="verified").length,sim=rows.reduce((n,r)=>n+r.done,0),total=rows.length*12;
 var providerNames=["aws","gcp","azure","databricks","snowflake","control_plane"];
 root.innerHTML='<div class="view-heading"><div><span class="micro">MANDATORY PROGRESSION CONTROL</span><h2>Simulation → Live Graduation Gate</h2><p>No live project access before its safe simulation is complete and its blind architecture defense reaches 85.</p></div><span class="enterprise-badge">'+rows.length+' PROJECTS • NO BYPASS</span></div>'+
 '<div class="grad-shell"><aside class="grad-summary glass"><div class="grad-summary-head"><span class="micro">READINESS CONTROL</span><h3>Graduation passport</h3><p>Simulation and live evidence are deliberately separate. A credential existing does not mean a learner is ready to use it.</p></div>'+
 '<div class="grad-kpis"><div class="grad-kpi"><span>SIM CHECKPOINTS</span><b>'+sim+'/'+total+'</b></div><div class="grad-kpi"><span>GRADUATED</span><b>'+grad+'/'+rows.length+'</b></div><div class="grad-kpi"><span>LIVE VERIFIED</span><b>'+verified+'</b></div><div class="grad-kpi"><span>PASS GRADE</span><b>≥85</b></div></div>'+
 '<div class="grad-rule"><b>UNLOCK RULE</b><p>12/12 simulation checkpoints + blind server-side architecture defense ≥85. Live evidence is accepted only after that gate.</p></div>'+
 '<div class="grad-provider-list">'+providerNames.map(p=>{var rs=rows.filter(r=>r.provider===p),g=rs.filter(r=>r.grad).length,conn=connectors&&connectors[p];var cs=p==="control_plane"?"LIVE":conn?(conn.validated?"VALIDATED":conn.configured?"CONFIGURED":"OFF"):"UNKNOWN";return '<div class="grad-provider"><div><b>'+p.toUpperCase()+'</b><span>'+g+'/'+rs.length+' graduated</span></div><em>'+cs+'</em></div>';}).join("")+'</div></aside>'+
 '<section class="grad-main glass"><div class="grad-main-head"><div><span class="micro">PROJECT ACCESS MATRIX</span><h3>What can go live?</h3></div><div class="grad-filters">'+["all","locked","defense","unlocked","verified"].map(x=>'<button class="'+(filter===x?'active':'')+'" data-grad-filter="'+x+'">'+x.toUpperCase()+'</button>').join("")+'</div></div>'+
 '<div class="grad-list">'+shown.map(r=>{var pct=Math.round((r.done/12)*70+(Math.min(100,r.grade)/100)*30);return '<div class="grad-row '+(r.grad?'live':'')+'"><div class="ico">'+r.icon+'</div><div><b>'+r.title+'</b><span>'+r.provider.toUpperCase()+' • '+r.done+'/12 simulation • defense '+r.grade+'%</span><div class="grad-progress"><div class="grad-track"><i style="width:'+pct+'%"></i></div><em>'+pct+'%</em></div></div><div><span class="grad-state '+r.state+'">'+label(r)+'</span><span>'+(r.grad?(r.configured?'connector '+(r.connected?'validated':'configured'):'connector disconnected'):'live access locked')+'</span></div><button data-grad-open="'+r.kind+'" data-grad-index="'+r.index+'" data-grad-provider="'+r.provider+'">'+(r.grad?'Open project':'Continue simulation')+'</button></div>';}).join("")+'</div></section></div>';
 $$("[data-grad-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.gradFilter;render();});
 $$("[data-grad-open]").forEach(b=>b.onclick=()=>{
   if(b.dataset.gradOpen==="cloud"){
     var st=read("cloud_odyssey_cloud_forge_v1");st.provider=b.dataset.gradProvider;st.project=+b.dataset.gradIndex;st.mode="simulation";localStorage.setItem("cloud_odyssey_cloud_forge_v1",JSON.stringify(st));CO.setView("cloud-forge");$("#pageTitle").textContent="Cloud + Lakehouse Project Forge";window.CloudOdysseyCloudForge&&window.CloudOdysseyCloudForge.render?window.CloudOdysseyCloudForge.render():location.reload();
   }else{
     var st=read("cloud_odyssey_backend_forge_v1");st.project=+b.dataset.gradIndex;st.mode="simulation";localStorage.setItem("cloud_odyssey_backend_forge_v1",JSON.stringify(st));CO.setView("backend-forge");$("#pageTitle").textContent="Backend Systems Forge";location.reload();
   }
 });
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=document.createElement("button");b.className="nav-item";b.dataset.view="graduation";b.innerHTML="<span>◈</span><b>Graduation Gate</b><em>24</em>";b.onclick=()=>{CO.setView("graduation");$("#pageTitle").textContent="Simulation → Live Graduation Gate";loadConnectors();};nav.appendChild(b);
 var sec=document.createElement("section");sec.className="view";sec.id="view-graduation";work.appendChild(sec);render();
}
window.CloudOdysseyGraduationGate={render:render};
install();
})();
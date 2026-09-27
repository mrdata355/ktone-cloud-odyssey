(function(){
"use strict";
var KEY="cloud_odyssey_backend_client_v1",TOKEN_KEY="cloud_odyssey_access_token_v1";
var state={client_id:null,health:null,health_at:0,queue:[]};
try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||"{}"));}catch(e){}
if(!state.client_id){
  state.client_id=(crypto&&crypto.randomUUID)?crypto.randomUUID():"client-"+Date.now()+"-"+Math.random().toString(36).slice(2);
}
function save(){
  localStorage.setItem(KEY,JSON.stringify({client_id:state.client_id,health:state.health,health_at:state.health_at,queue:state.queue.slice(-50)}));
}
function parseStore(key){try{return JSON.parse(localStorage.getItem(key)||"{}");}catch(e){return {};}}
function accessToken(){try{return sessionStorage.getItem(TOKEN_KEY)||"";}catch(e){return "";}}
function setAccessToken(token){try{if(token)sessionStorage.setItem(TOKEN_KEY,String(token));else sessionStorage.removeItem(TOKEN_KEY);}catch(e){}state.health=null;state.health_at=0;save();}
function clearAccessToken(){setAccessToken("");}
async function request(path,opts){
  opts=opts||{};
  var headers=Object.assign({"Content-Type":"application/json","X-Client-Id":state.client_id},opts.headers||{});var tok=accessToken();if(tok)headers.Authorization="Bearer "+tok;
  var res=await fetch("/api/v1/"+path,{method:opts.method||"GET",headers:headers,body:opts.body===undefined?undefined:JSON.stringify(opts.body)});
  var data={};try{data=await res.json();}catch(e){data={ok:false,error:{message:"Invalid API response"}};}
  data.http_status=res.status;data.request_id=data.request_id||res.headers.get("x-request-id");
  if(!res.ok)throw Object.assign(new Error((data.error&&data.error.message)||"API request failed"),{status:res.status,data:data});
  return data;
}
async function health(force){
  if(!force&&state.health&&Date.now()-state.health_at<30000)return state.health;
  try{state.health=await request("health");state.health_at=Date.now();save();return state.health;}
  catch(e){state.health={ok:false,error:e.message,http_status:e.status||0};state.health_at=Date.now();save();return state.health;}
}
function avg(xs){return xs.length?Math.round(xs.reduce(function(a,b){return a+b;},0)/xs.length):0;}
function collectSignals(){
  var signals={missions:0,projects:0,coding:0,transfer:0,recovery:0,vocab:0,star:0,aws:0,gcp:0,azure:0,databricks:0,snowflake:0,stakeholder:0,backend:0,sardine:0};
  var base=parseStore("cloud_odyssey_enterprise_v3");
  signals.missions=Math.min(100,Math.round(Object.values(base.done||{}).filter(Boolean).length/30*100));
  signals.projects=Math.min(100,Math.round(Object.values(base.checks||{}).filter(Boolean).length/60*100));
  var forge=parseStore("cloud_odyssey_coding_forge_v1");
  if(Array.isArray(forge.attempts)&&forge.attempts.length)signals.coding=avg(forge.attempts.slice(-25).map(function(x){return Number(x.score)||0;}));
  var ladder=parseStore("cloud_odyssey_ladder_v1");
  if(ladder.scores){signals.transfer=avg(Object.values(ladder.scores).map(function(x){return Number(x)||0;}));}
  var cloud=parseStore("cloud_odyssey_cloud_forge_v1");
  var counts={aws:12,gcp:12,azure:8,databricks:8,snowflake:8};
  Object.keys(counts).forEach(function(k){
    var projectCount=counts[k],checks=cloud.checks||{},grades=cloud.simGrades||{},evidence=cloud.evidence||{};
    var done=Object.keys(checks).filter(function(x){return x.indexOf(k+"-")===0&&checks[x];}).length;
    var gradeKeys=Object.keys(grades).filter(function(x){return x.indexOf(k+"-")===0;});
    var gradeTotal=gradeKeys.reduce(function(n,x){return n+Math.min(100,Number(grades[x])||0);},0);
    var liveEvidence=Object.keys(evidence).filter(function(projectKey){
      if(projectKey.indexOf(k+"-")!==0||String(evidence[projectKey]||"").trim().length<=30)return false;
      var stageDone=Object.keys(checks).filter(function(x){return x.indexOf(projectKey+"-")===0&&checks[x];}).length;
      return stageDone===12&&(Number(grades[projectKey])||0)>=85;
    }).length;
    signals[k]=Math.min(100,Math.round(done/(projectCount*12)*70+(gradeTotal/(projectCount*100))*15+(liveEvidence/projectCount)*15));
  });
  var backendForge=parseStore("cloud_odyssey_backend_forge_v1");
  var backendChecks=Object.values(backendForge.checks||{}).filter(Boolean).length;
  var backendGrades=Object.values(backendForge.grades||{}).reduce(function(n,x){return n+(Number(x)||0);},0);
  signals.backend=Math.min(100,Math.round(backendChecks/144*55+(backendGrades/(12*100))*45));
  var sardine=parseStore("cloud_odyssey_sardine_forge_v1");
  var sTasks=Object.values(sardine.checks||{}).filter(Boolean).length/350*55;
  var sDef=Object.values(sardine.defense||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*20;
  var sMock=Object.values(sardine.mock||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*10;
  var sInc=Object.values(sardine.incident||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*10;
  var sStar=Object.values(sardine.star||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*5;
  var sCore=sTasks+sDef+sMock+sInc+sStar;
  var sPattern=sardine.pattern&&sardine.pattern.total?Number(sardine.pattern.right||0)/Number(sardine.pattern.total)*100:0;
  var sVocab=Object.values(sardine.vocab||{}).filter(Boolean).length/60*100;
  signals.sardine=Math.min(100,Math.round(sCore*.9+sPattern*.05+sVocab*.05));
  var comm=parseStore("cloud_odyssey_comms_v1");
  if(comm.scores){signals.stakeholder=avg(Object.values(comm.scores).map(function(x){return Number(x&&x.score)||0;}));}
  var speaking=parseStore("cloud_odyssey_speaking_v1");
  if(speaking.vocab){var vv=Object.values(speaking.vocab);signals.vocab=vv.length?Math.min(100,Math.round(vv.filter(function(x){return x&&x.right>=2&&x.natural>=1;}).length/vv.length*100)):0;}
  if(Array.isArray(speaking.starAttempts)&&speaking.starAttempts.length)signals.star=avg(speaking.starAttempts.slice(-12).map(function(x){return Number(x.score)||0;}));
  var ent=parseStore("cloud_odyssey_enterprise_v1");
  if(ent.deepChecks){var vals=Object.values(ent.deepChecks);signals.recovery=vals.length?Math.round(vals.filter(Boolean).length/120*100):0;}
  return signals;
}
async function startMission(input){
  input=input||{};
  return request("mission-sessions/start",{method:"POST",body:Object.assign({
    client_id:state.client_id,
    tenant_id:"personal",
    source:"mission-control"
  },input)});
}
async function runMissionTests(input){
  input=input||{};
  return request("mission-tests/run",{method:"POST",body:{
    client_id:state.client_id,
    mission_id:input.mission_id,
    solution:input.solution
  }});
}
async function gradeMission(input){
  input=input||{};
  return request("missions/grade",{method:"POST",body:{
    client_id:state.client_id,
    tenant_id:"personal",
    mission_id:input.mission_id,
    solution:input.solution,
    session_id:input.session_id||null,
    reveal_used:!!input.reveal_used,
    duration_ms:Number(input.duration_ms)||0
  }});
}
async function verifyArtifact(input){
  input=input||{};
  return request("artifacts/verify",{method:"POST",body:{
    client_id:state.client_id,
    work_order_id:input.work_order_id,
    expected_path:input.expected_path,
    declared_path:input.declared_path,
    file_name:input.file_name,
    purpose:input.purpose,
    naming_reason:input.naming_reason,
    content:input.content
  }});
}
async function me(){return request("me");}
async function schemaStatus(){return request("schema-status");}
async function saveWorkOrder(work){
  work=work||{};
  return request("work-orders",{method:"PUT",body:{
    work_order_id:work.id,
    kind:work.kind||"project",
    title:work.title||"Untitled work order",
    status:work.status||"active",
    payload:work
  }});
}
async function loadWorkOrders(){return request("work-orders");}
async function connectorStatus(){return request("connectors/status");}
async function recommendations(budget){return request("recommendations",{method:"POST",body:{signals:collectSignals(),budget_minutes:budget||45}});}
async function grade(answer,required,meta){
  return request("assessments/grade",{method:"POST",body:{
    client_id:state.client_id,tenant_id:"personal",assessment_type:(meta&&meta.type)||"backend-console",
    rubric_version:"production-v1",answer:answer,required:required||[],blind:meta&&meta.blind!==undefined?meta.blind:true,
    reveal_used:!!(meta&&meta.reveal_used),duration_ms:(meta&&meta.duration_ms)||0,metadata:meta||{}
  }});
}
async function emit(eventType,payload){
  var h=await health();if(!(h.capabilities&&h.capabilities.durable_events)){
    return {ok:false,queued:false,persistence:false,message:"Backend API is live, but durable event storage needs DATABASE_URL."};
  }
  return request("events",{method:"POST",headers:{"Idempotency-Key":crypto.randomUUID()},body:{
    client_id:state.client_id,tenant_id:"personal",event_type:eventType,schema_version:1,occurred_at:new Date().toISOString(),payload:payload||{}
  }});
}
async function syncProgress(){
  var h=await health();if(!(h.capabilities&&h.capabilities.durable_progress)){
    return {ok:false,persistence:false,message:"Backend API is live, but durable progress needs DATABASE_URL."};
  }
  var signals=collectSignals(),vals=Object.values(signals),overall=avg(vals);
  return request("progress",{method:"PUT",body:{client_id:state.client_id,tenant_id:"personal",version:Date.now(),overall_score:overall,signals:signals,source:"browser"}});
}
async function saveEvidence(input){
  return request("evidence",{method:"POST",body:Object.assign({client_id:state.client_id,tenant_id:"personal"},input)});
}
window.CloudOdysseyBackend={request:request,health:health,me:me,schemaStatus:schemaStatus,setAccessToken:setAccessToken,clearAccessToken:clearAccessToken,accessToken:accessToken,startMission:startMission,runMissionTests:runMissionTests,gradeMission:gradeMission,verifyArtifact:verifyArtifact,saveWorkOrder:saveWorkOrder,loadWorkOrders:loadWorkOrders,connectorStatus:connectorStatus,recommendations:recommendations,grade:grade,emit:emit,syncProgress:syncProgress,saveEvidence:saveEvidence,collectSignals:collectSignals,clientId:function(){return state.client_id;}};
me().then(function(m){document.dispatchEvent(new CustomEvent("odyssey:identity",{detail:m}));}).catch(function(e){document.dispatchEvent(new CustomEvent("odyssey:identity",{detail:{ok:false,error:e.message}}));});
health().then(function(h){
  var sync=document.querySelector(".sidebar-footer .sync span");
  if(sync)sync.textContent=h.ok?(h.persistence&&h.persistence.ok?"Backend + Postgres online":"Backend API online • persistence pending"):"Backend unreachable • local mode";
  document.dispatchEvent(new CustomEvent("odyssey:backend-health",{detail:h}));
});
})();
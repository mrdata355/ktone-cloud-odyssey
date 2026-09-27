(function(){
"use strict";
var KEY="cloud_odyssey_backend_client_v1";
var state={client_id:null,health:null,health_at:0,queue:[]};
try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||"{}"));}catch(e){}
if(!state.client_id){
  state.client_id=(crypto&&crypto.randomUUID)?crypto.randomUUID():"client-"+Date.now()+"-"+Math.random().toString(36).slice(2);
}
function save(){
  localStorage.setItem(KEY,JSON.stringify({client_id:state.client_id,health:state.health,health_at:state.health_at,queue:state.queue.slice(-50)}));
}
function parseStore(key){try{return JSON.parse(localStorage.getItem(key)||"{}");}catch(e){return {};}}
async function request(path,opts){
  opts=opts||{};
  var headers=Object.assign({"Content-Type":"application/json","X-Client-Id":state.client_id},opts.headers||{});
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
  var signals={coding:0,transfer:0,recovery:0,vocab:0,star:0,aws:0,gcp:0,azure:0,databricks:0,snowflake:0,stakeholder:0};
  var forge=parseStore("cloud_odyssey_coding_forge_v1");
  if(Array.isArray(forge.attempts)&&forge.attempts.length)signals.coding=avg(forge.attempts.slice(-25).map(function(x){return Number(x.score)||0;}));
  var ladder=parseStore("cloud_odyssey_ladder_v1");
  if(ladder.scores){signals.transfer=avg(Object.values(ladder.scores).map(function(x){return Number(x)||0;}));}
  var cloud=parseStore("cloud_odyssey_cloud_forge_v1");
  var counts={aws:12,gcp:12,azure:8,databricks:8,snowflake:8};
  Object.keys(counts).forEach(function(k){
    var done=Object.keys(cloud.checks||{}).filter(function(x){return x.indexOf(k+"-")===0&&cloud.checks[x];}).length;
    var score=Math.round(done/(counts[k]*12)*85);
    var ev=Object.keys(cloud.evidence||{}).filter(function(x){return x.indexOf(k+"-")===0&&String(cloud.evidence[x]||"").trim().length>30;}).length;
    signals[k]=Math.min(100,score+Math.round(ev/counts[k]*15));
  });
  var comm=parseStore("cloud_odyssey_comms_v1");
  if(comm.scores){signals.stakeholder=avg(Object.values(comm.scores).map(function(x){return Number(x&&x.score)||0;}));}
  var speaking=parseStore("cloud_odyssey_speaking_v1");
  if(speaking.vocab){var vv=Object.values(speaking.vocab);signals.vocab=vv.length?Math.min(100,Math.round(vv.filter(function(x){return x&&x.right>=2&&x.natural>=1;}).length/vv.length*100)):0;}
  if(Array.isArray(speaking.starAttempts)&&speaking.starAttempts.length)signals.star=avg(speaking.starAttempts.slice(-12).map(function(x){return Number(x.score)||0;}));
  var ent=parseStore("cloud_odyssey_enterprise_v1");
  if(ent.deepChecks){var vals=Object.values(ent.deepChecks);signals.recovery=vals.length?Math.round(vals.filter(Boolean).length/120*100):0;}
  return signals;
}
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
window.CloudOdysseyBackend={request:request,health:health,recommendations:recommendations,grade:grade,emit:emit,syncProgress:syncProgress,saveEvidence:saveEvidence,collectSignals:collectSignals,clientId:function(){return state.client_id;}};
health().then(function(h){
  var sync=document.querySelector(".sidebar-footer .sync span");
  if(sync)sync.textContent=h.ok?(h.persistence&&h.persistence.ok?"Backend + Postgres online":"Backend API online • persistence pending"):"Backend unreachable • local mode";
  document.dispatchEvent(new CustomEvent("odyssey:backend-health",{detail:h}));
});
})();
const crypto=require("node:crypto");
const {api}=require("../../_lib/http");
const db=require("../../_lib/db");
const identity=require("../../_lib/identity");
const {catalog,runMissionTests}=require("../../_lib/mission_catalog");
const {sha256,sign}=require("../../_lib/security");

function str(v,name,min,max){const x=String(v==null?"":v).trim();if(x.length<min||x.length>max){const e=new Error(name+" length must be "+min+"-"+max);e.statusCode=422;e.details={field:name};throw e;}return x;}
function pct(a,b){return b?Math.round(a/b*100):0;}

module.exports=api(async(req,res,ctx)=>{
  const actor=await identity.resolve(req);if(actor.authenticated&&db.configured())await identity.ensure(db,actor);
  const body=await ctx.readJson(req,262144),client_id=actor.client_id&&actor.client_id.length>=8?actor.client_id:str(body.client_id,"client_id",8,128),tenant_id=actor.authenticated?actor.tenant_id:"personal";
  const mission_id=str(body.mission_id,"mission_id",2,120),solution=str(body.solution,"solution",1,30000),m=catalog[mission_id];
  if(!m) throw ctx.fail(404,"Unknown mission_id");
  const tested=runMissionTests(mission_id,solution),requiredCoverage=pct(tested.required_hits.length,m.required.length),controlCoverage=pct(tested.control_hits.length,m.controls.length);
  const completeness=tested.tests.find(x=>x.name==="completeness").pass?100:0,shape=tested.tests.find(x=>x.name==="executable_shape").pass?100:0;
  const dimensions={contract:requiredCoverage,executable_shape:shape,production_control:controlCoverage,completeness,tests:tested.score};
  const score=Math.round(tested.score*.55+requiredCoverage*.20+controlCoverage*.15+shape*.05+completeness*.05),mastered=tested.passed===tested.total&&score>=85;
  const attempt_id=crypto.randomUUID(),answer_hash=sha256(solution);
  const receiptPayload={attempt_id,user_id:actor.user_id,client_id,tenant_id,mission_id,score,mastered,dimensions,test_run:{passed:tested.passed,total:tested.total},answer_hash,issued_at:new Date().toISOString()};
  const signed=sign(receiptPayload);let persistence={configured:db.configured(),saved:false};
  if(db.configured()){
    try{
      await db.query(`insert into odyssey_assessment_attempts
        (attempt_id,tenant_id,user_id,client_id,assessment_type,rubric_version,blind,reveal_used,duration_ms,answer_hash,score,dimensions,signals,receipt,verification,metadata)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16::jsonb)`,
        [attempt_id,tenant_id,actor.user_id,client_id,"mission:"+mission_id,"mission-v3",true,Boolean(body.reveal_used),Number(body.duration_ms)||0,answer_hash,score,JSON.stringify(dimensions),JSON.stringify({required_hits:tested.required_hits,control_hits:tested.control_hits,tests:tested.tests,mastered}),signed.receipt,signed.verification,JSON.stringify({mission_title:m.title,session_id:body.session_id||null,source:"cloud-lab"})]);
      if(body.session_id&&mastered)await db.query("update odyssey_mission_sessions set completed_at=now() where session_id=$1 and tenant_id=$2",[body.session_id,tenant_id]);
      persistence.saved=true;
    }catch(e){persistence.error=e.message;}
  }
  return {body:{ok:true,request_id:ctx.requestId,attempt_id,mission:{id:m.id,title:m.title,type:m.type},score,mastered,dimensions,tests:tested.tests,passed:tested.passed,total:tested.total,required_hits:tested.required_hits,control_hits:tested.control_hits,answer_hash,verification:signed.verification,receipt:signed.receipt,persistence,identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id},authority:"server"}};
},{methods:["POST"]});
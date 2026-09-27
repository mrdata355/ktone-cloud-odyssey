const crypto=require("node:crypto");
const {api}=require("../../_lib/http");
const {runMissionTests}=require("../../_lib/mission_catalog");
const {sha256,sign}=require("../../_lib/security");

function str(v,name,min,max){
  const x=String(v==null?"":v).trim();
  if(x.length<min||x.length>max){
    const e=new Error(name+" length must be "+min+"-"+max);e.statusCode=422;e.details={field:name};throw e;
  }
  return x;
}

module.exports=api(async(req,res,ctx)=>{
  const body=await ctx.readJson(req,262144);
  const client_id=str(body.client_id,"client_id",8,128);
  const mission_id=str(body.mission_id,"mission_id",2,120);
  const solution=str(body.solution,"solution",1,30000);
  const result=runMissionTests(mission_id,solution);
  const run_id=crypto.randomUUID();
  const code_hash=sha256(solution);
  const payload={
    run_id,client_id,mission_id,
    score:result.score,passed:result.passed,total:result.total,
    code_hash,execution_mode:result.execution_mode,
    issued_at:new Date().toISOString()
  };
  const signed=sign(payload);
  return {body:{
    ok:true,
    request_id:ctx.requestId,
    run_id,
    code_hash,
    mission:result.mission,
    tests:result.tests,
    passed:result.passed,
    total:result.total,
    score:result.score,
    required_hits:result.required_hits,
    control_hits:result.control_hits,
    execution_mode:result.execution_mode,
    arbitrary_code_execution:false,
    verification:signed.verification,
    receipt:signed.receipt
  }};
},{methods:["POST"]});

const crypto=require("node:crypto");
const {api}=require("../../_lib/http");
const contracts=require("../../_lib/contracts");
const db=require("../../_lib/db");
const {grade}=require("../../_lib/scoring");
const {sha256,sign}=require("../../_lib/security");

module.exports=api(async(req,res,ctx)=>{
  const input=contracts.assessment(await ctx.readJson(req,262144));
  const graded=grade(input);
  const attempt_id=crypto.randomUUID();
  const answer_hash=sha256(input.answer);
  const receiptPayload={
    attempt_id,
    client_id:input.client_id,
    tenant_id:input.tenant_id,
    assessment_type:input.assessment_type,
    rubric_version:graded.rubric_version,
    score:graded.score,
    dimensions:graded.dimensions,
    blind:input.blind,
    reveal_used:input.reveal_used,
    answer_hash,
    issued_at:new Date().toISOString()
  };
  const signed=sign(receiptPayload);
  let persistence={configured:db.configured(),saved:false};
  if(db.configured()){
    try{
      await db.query(`insert into odyssey_assessment_attempts
        (attempt_id,tenant_id,client_id,assessment_type,rubric_version,blind,reveal_used,duration_ms,answer_hash,score,dimensions,signals,receipt,verification,metadata)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15::jsonb)`,
        [attempt_id,input.tenant_id,input.client_id,input.assessment_type,graded.rubric_version,input.blind,input.reveal_used,input.duration_ms,answer_hash,graded.score,JSON.stringify(graded.dimensions),JSON.stringify(graded.signals),signed.receipt,signed.verification,JSON.stringify(input.metadata)]);
      persistence.saved=true;
    }catch(e){persistence.error=e.message;}
  }
  return {body:{
    ok:true,
    request_id:ctx.requestId,
    attempt_id,
    score:graded.score,
    dimensions:graded.dimensions,
    signals:graded.signals,
    verification:signed.verification,
    receipt:signed.receipt,
    answer_hash,
    persistence
  }};
},{methods:["POST"]});
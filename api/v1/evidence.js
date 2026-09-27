const crypto=require("node:crypto");
const {api}=require("../_lib/http");
const contracts=require("../_lib/contracts");
const db=require("../_lib/db");
const identity=require("../_lib/identity");
const {sha256}=require("../_lib/security");

module.exports=api(async(req,res,ctx)=>{
  if(!db.configured()) throw ctx.fail(503,"Persistence is not configured",{env:"DATABASE_URL",endpoint:"evidence"});
  const actor=await identity.resolve(req);if(actor.authenticated)await identity.ensure(db,actor);
  const input=contracts.evidence(await ctx.readJson(req,262144)),evidence_id=crypto.randomUUID(),digest=sha256(input.evidence_text);
  const client_id=actor.client_id&&actor.client_id.length>=8?actor.client_id:input.client_id,tenant_id=actor.authenticated?actor.tenant_id:"personal";
  try{
    const rows=await db.query(`insert into odyssey_evidence_items
      (evidence_id,tenant_id,user_id,client_id,artifact_type,platform,artifact_name,evidence_sha256,metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
      returning evidence_id,evidence_sha256,created_at`,
      [evidence_id,tenant_id,actor.user_id,client_id,input.artifact_type,input.platform,input.artifact_name,digest,JSON.stringify(input.metadata)]);
    return {status:201,body:{ok:true,evidence:rows[0],raw_evidence_stored:false,identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id},request_id:ctx.requestId}};
  }catch(e){throw ctx.fail(503,"Evidence store is unavailable or schema is not initialized",{reason:e.message});}
},{methods:["POST"]});
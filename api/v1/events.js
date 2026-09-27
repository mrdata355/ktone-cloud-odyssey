const crypto=require("node:crypto");
const {api}=require("../_lib/http");
const contracts=require("../_lib/contracts");
const db=require("../_lib/db");
const identity=require("../_lib/identity");

module.exports=api(async(req,res,ctx)=>{
  if(!db.configured()) throw ctx.fail(503,"Persistence is not configured",{env:"DATABASE_URL",endpoint:"events"});
  const actor=await identity.resolve(req);if(actor.authenticated)await identity.ensure(db,actor);
  const idem=String((req.headers&&req.headers["idempotency-key"])||"").trim();
  if(idem.length<8||idem.length>200) throw ctx.fail(400,"Idempotency-Key header is required (8-200 chars)");
  const input=contracts.event(await ctx.readJson(req,262144));
  const event_id=crypto.randomUUID(),client_id=actor.client_id&&actor.client_id.length>=8?actor.client_id:input.client_id,tenant_id=actor.authenticated?actor.tenant_id:"personal";
  let rows;
  try{
    rows=await db.query(`insert into odyssey_learning_events
      (event_id,tenant_id,user_id,client_id,event_type,schema_version,occurred_at,correlation_id,idempotency_key,payload)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
      on conflict (tenant_id,client_id,idempotency_key) do nothing
      returning event_id,received_at`,
      [event_id,tenant_id,actor.user_id,client_id,input.event_type,input.schema_version,input.occurred_at,input.correlation_id,idem,JSON.stringify(input.payload)]);
  }catch(e){throw ctx.fail(503,"Event store is unavailable or schema is not initialized",{reason:e.message});}
  if(rows.length)return {status:201,body:{ok:true,event_id:rows[0].event_id,received_at:rows[0].received_at,idempotent_replay:false,request_id:ctx.requestId}};
  const existing=await db.query("select event_id,received_at from odyssey_learning_events where tenant_id=$1 and client_id=$2 and idempotency_key=$3 limit 1",[tenant_id,client_id,idem]);
  return {body:{ok:true,event_id:existing[0]&&existing[0].event_id,received_at:existing[0]&&existing[0].received_at,idempotent_replay:true,request_id:ctx.requestId}};
},{methods:["POST"]});
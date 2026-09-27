const crypto=require("node:crypto");
const {api}=require("../_lib/http");
const contracts=require("../_lib/contracts");
const db=require("../_lib/db");

module.exports=api(async(req,res,ctx)=>{
  if(!db.configured()) throw ctx.fail(503,"Persistence is not configured",{env:"DATABASE_URL",endpoint:"progress"});
  if(req.method==="GET"){
    const client_id=String((req.query&&req.query.client_id)||"").trim();
    const tenant_id=String((req.query&&req.query.tenant_id)||"personal").trim();
    if(client_id.length<8) throw ctx.fail(400,"client_id query parameter is required");
    const rows=await db.query(`select snapshot_id,version,overall_score,signals,source,captured_at
      from odyssey_proficiency_snapshots where tenant_id=$1 and client_id=$2
      order by version desc,captured_at desc limit 1`,[tenant_id,client_id]);
    return {body:{ok:true,snapshot:rows[0]||null,request_id:ctx.requestId}};
  }
  const input=contracts.progress(await ctx.readJson(req,262144));
  const snapshot_id=crypto.randomUUID();
  try{
    const rows=await db.query(`insert into odyssey_proficiency_snapshots
      (snapshot_id,tenant_id,client_id,version,overall_score,signals,source)
      values ($1,$2,$3,$4,$5,$6::jsonb,$7)
      on conflict (tenant_id,client_id,version) do update
      set overall_score=excluded.overall_score,signals=excluded.signals,source=excluded.source,captured_at=now()
      returning snapshot_id,version,overall_score,signals,source,captured_at`,
      [snapshot_id,input.tenant_id,input.client_id,input.version,input.overall_score,JSON.stringify(input.signals),input.source]);
    return {body:{ok:true,snapshot:rows[0],request_id:ctx.requestId}};
  }catch(e){throw ctx.fail(503,"Progress store is unavailable or schema is not initialized",{reason:e.message});}
},{methods:["GET","PUT"]});
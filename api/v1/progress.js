const crypto=require("node:crypto");
const {api}=require("../_lib/http");
const contracts=require("../_lib/contracts");
const db=require("../_lib/db");
const identity=require("../_lib/identity");

module.exports=api(async(req,res,ctx)=>{
  if(!db.configured()) throw ctx.fail(503,"Persistence is not configured",{env:"DATABASE_URL",endpoint:"progress"});
  const actor=await identity.resolve(req);if(actor.authenticated)await identity.ensure(db,actor);

  if(req.method==="GET"){
    let rows;
    if(actor.authenticated){
      rows=await db.query(`select snapshot_id,version,overall_score,signals,source,captured_at
        from odyssey_proficiency_snapshots where tenant_id=$1 and user_id=$2
        order by version desc,captured_at desc limit 1`,[actor.tenant_id,actor.user_id]);
    }else{
      const cid=String((req.query&&req.query.client_id)||actor.client_id||"").trim();
      if(cid.length<8) throw ctx.fail(400,"client_id query parameter is required");
      rows=await db.query(`select snapshot_id,version,overall_score,signals,source,captured_at
        from odyssey_proficiency_snapshots where tenant_id=$1 and client_id=$2 and user_id is null
        order by version desc,captured_at desc limit 1`,["personal",cid]);
    }
    return {body:{ok:true,snapshot:rows[0]||null,identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id:actor.tenant_id},request_id:ctx.requestId}};
  }

  const input=contracts.progress(await ctx.readJson(req,262144));
  const snapshot_id=crypto.randomUUID(),client_id=actor.client_id&&actor.client_id.length>=8?actor.client_id:input.client_id;
  try{
    let rows;
    if(actor.authenticated){
      rows=await db.query(`insert into odyssey_proficiency_snapshots
        (snapshot_id,tenant_id,user_id,client_id,version,overall_score,signals,source)
        values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
        on conflict (tenant_id,user_id,version) where user_id is not null do update
        set client_id=excluded.client_id,overall_score=excluded.overall_score,signals=excluded.signals,source=excluded.source,captured_at=now()
        returning snapshot_id,version,overall_score,signals,source,captured_at`,
        [snapshot_id,actor.tenant_id,actor.user_id,client_id,input.version,input.overall_score,JSON.stringify(input.signals),input.source]);
    }else{
      rows=await db.query(`insert into odyssey_proficiency_snapshots
        (snapshot_id,tenant_id,user_id,client_id,version,overall_score,signals,source)
        values ($1,$2,null,$3,$4,$5,$6::jsonb,$7)
        on conflict (tenant_id,client_id,version) do update
        set overall_score=excluded.overall_score,signals=excluded.signals,source=excluded.source,captured_at=now()
        returning snapshot_id,version,overall_score,signals,source,captured_at`,
        [snapshot_id,"personal",client_id,input.version,input.overall_score,JSON.stringify(input.signals),input.source]);
    }
    return {body:{ok:true,snapshot:rows[0],identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id:actor.tenant_id},request_id:ctx.requestId}};
  }catch(e){throw ctx.fail(503,"Progress store is unavailable or schema is not initialized",{reason:e.message});}
},{methods:["GET","PUT"]});
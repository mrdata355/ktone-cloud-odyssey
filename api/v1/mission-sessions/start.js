const crypto=require("node:crypto");
const {api}=require("../../_lib/http");
const db=require("../../_lib/db");
const identity=require("../../_lib/identity");

function text(v,name,min,max){const x=String(v==null?"":v).trim();if(x.length<min||x.length>max){const e=new Error(name+" length must be "+min+"-"+max);e.statusCode=422;e.details={field:name};throw e;}return x;}

module.exports=api(async(req,res,ctx)=>{
  const actor=await identity.resolve(req);if(actor.authenticated&&db.configured())await identity.ensure(db,actor);
  const body=await ctx.readJson(req,131072);
  const client_id=actor.client_id&&actor.client_id.length>=8?actor.client_id:text(body.client_id,"client_id",8,128),tenant_id=actor.authenticated?actor.tenant_id:"personal";
  const mission_id=text(body.mission_id,"mission_id",2,120),world_id=text(body.world_id,"world_id",1,100),mission_title=text(body.mission_title,"mission_title",1,240);
  const session_id=crypto.randomUUID(),started_at=new Date().toISOString();
  const payload={mission_id,world_id,world_name:String(body.world_name||"").slice(0,160),mission_title,mission_type:String(body.mission_type||"").slice(0,80),skill:String(body.skill||"").slice(0,120),stack:Array.isArray(body.stack)?body.stack.map(x=>String(x).slice(0,80)).slice(0,20):[],revisit:Boolean(body.revisit),source:String(body.source||"mission-control").slice(0,80),session_id};

  let stored=false,persistence_error=null;
  if(db.configured()){
    try{
      await db.query(`insert into odyssey_mission_sessions
        (session_id,tenant_id,user_id,client_id,mission_id,world_id,mission_title,mission_type,skill,revisit,metadata,started_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)`,
        [session_id,tenant_id,actor.user_id,client_id,mission_id,world_id,mission_title,payload.mission_type,payload.skill,payload.revisit,JSON.stringify(payload),started_at]);
      const event_id=crypto.randomUUID();
      await db.query(`insert into odyssey_learning_events
        (event_id,tenant_id,user_id,client_id,event_type,schema_version,occurred_at,correlation_id,idempotency_key,payload)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
        [event_id,tenant_id,actor.user_id,client_id,"mission.started",1,started_at,session_id,"mission-start:"+session_id,JSON.stringify(payload)]);
      stored=true;
    }catch(e){persistence_error=e.message;}
  }
  return {status:201,body:{ok:true,session_id,request_id:ctx.requestId,started_at,mission:{mission_id,world_id,mission_title,revisit:payload.revisit},identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id},persistence:{configured:db.configured(),stored,error:persistence_error},control_plane:"validated"}};
},{methods:["POST"]});
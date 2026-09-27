const {api}=require("../_lib/http");
const db=require("../_lib/db");
const identity=require("../_lib/identity");

module.exports=api(async(req,res,ctx)=>{
  const actor=await identity.resolve(req);
  if(actor.authenticated&&db.configured()){
    try{await identity.ensure(db,actor);}catch(e){throw ctx.fail(503,"Identity persistence unavailable",{reason:e.message});}
  }
  let profile=null,membership=null;
  if(actor.authenticated&&db.configured()){
    const rows=await db.query(`select user_id,email,display_name,auth_provider,created_at,updated_at,last_seen_at
      from odyssey_users where user_id=$1 limit 1`,[actor.user_id]);
    profile=rows[0]||null;
    const mem=await db.query(`select tenant_id,user_id,role,created_at from odyssey_memberships
      where tenant_id=$1 and user_id=$2 limit 1`,[actor.tenant_id,actor.user_id]);
    membership=mem[0]||null;
  }
  return {body:{
    ok:true,
    request_id:ctx.requestId,
    auth:{
      configured:identity.configured(),
      required:identity.required(),
      authenticated:actor.authenticated,
      user_id:actor.user_id,
      tenant_id:actor.tenant_id,
      role:actor.role,
      email:actor.email,
      name:actor.name
    },
    persistence:{configured:db.configured()},
    profile,
    membership
  }};
},{methods:["GET"]});

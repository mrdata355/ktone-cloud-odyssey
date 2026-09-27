const {api}=require("../_lib/http");
const db=require("../_lib/db");
const identity=require("../_lib/identity");

module.exports=api(async(req,res,ctx)=>{
  const database=await db.ping();
  return {body:{
    ok:true,service:"cloud-odyssey-control-plane",version:"3.2.0",runtime:process.version,
    environment:process.env.VERCEL_ENV||"local",commit:(process.env.VERCEL_GIT_COMMIT_SHA||"local").slice(0,12),
    request_id:ctx.requestId,time:new Date().toISOString(),persistence:database,
    auth:{configured:identity.configured(),required:identity.required(),base_url:Boolean(process.env.NEON_AUTH_BASE_URL),jwks:Boolean(identity.jwksUrl()),issuer:Boolean(process.env.AUTH_ISSUER||identity.authOrigin()),audience:Boolean(process.env.AUTH_AUDIENCE||identity.authOrigin())},
    verification:{assessment_signing:Boolean(process.env.ASSESSMENT_SIGNING_SECRET)},
    capabilities:{
      stateless_grading:true,mission_sessions:true,mission_server_tests:true,authoritative_mission_grading:true,
      artifact_verification:true,adaptive_recommendations:true,identity_boundary:true,
      authenticated_accounts:identity.configured(),auth_proxy:Boolean(process.env.NEON_AUTH_BASE_URL),durable_work_orders:database.configured&&database.ok,
      durable_progress:database.configured&&database.ok,durable_events:database.configured&&database.ok,
      evidence_provenance:database.configured&&database.ok,connector_registry:true,live_connector_gating:true
    }
  }};
},{methods:["GET"]});
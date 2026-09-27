const {api}=require("../_lib/http");
const db=require("../_lib/db");

const TABLES=[
 "odyssey_users","odyssey_tenants","odyssey_memberships","odyssey_learning_events",
 "odyssey_proficiency_snapshots","odyssey_assessment_attempts","odyssey_evidence_items",
 "odyssey_mission_sessions","odyssey_project_work_orders","odyssey_artifact_evidence"
];
const USER_SCOPED=[
 "odyssey_learning_events","odyssey_proficiency_snapshots","odyssey_assessment_attempts",
 "odyssey_evidence_items","odyssey_mission_sessions","odyssey_project_work_orders","odyssey_artifact_evidence"
];

module.exports=api(async(req,res,ctx)=>{
 if(!db.configured())throw ctx.fail(503,"Persistence is not configured",{env:"DATABASE_URL"});
 const tableRows=await db.query(`select table_name from information_schema.tables
   where table_schema='public' and table_name in
   ('odyssey_users','odyssey_tenants','odyssey_memberships','odyssey_learning_events',
    'odyssey_proficiency_snapshots','odyssey_assessment_attempts','odyssey_evidence_items',
    'odyssey_mission_sessions','odyssey_project_work_orders','odyssey_artifact_evidence')`);
 const found=tableRows.map(x=>x.table_name),missing=TABLES.filter(x=>!found.includes(x));
 const colRows=await db.query(`select table_name,column_name from information_schema.columns
   where table_schema='public' and column_name='user_id' and table_name in
   ('odyssey_learning_events','odyssey_proficiency_snapshots','odyssey_assessment_attempts',
    'odyssey_evidence_items','odyssey_mission_sessions','odyssey_project_work_orders','odyssey_artifact_evidence')`);
 const userScoped=colRows.map(x=>x.table_name),missingUser=USER_SCOPED.filter(x=>!userScoped.includes(x));
 return {body:{ok:true,request_id:ctx.requestId,ready:missing.length===0&&missingUser.length===0,tables:{required:TABLES.length,found:found.length,missing},identity_columns:{required:USER_SCOPED.length,found:userScoped.length,missing:missingUser},migration:"migrations/001_saas_foundation.sql"}};
},{methods:["GET"]});

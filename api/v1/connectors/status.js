const {api}=require("../../_lib/http");

function provider(name,configured,auth,required){
  return {provider:name,configured:Boolean(configured),validated:false,auth,required,mode:configured?"configured_not_validated":"disconnected"};
}

module.exports=api(async(req,res,ctx)=>{
  const connectors={
    aws:provider("aws",
      process.env.AWS_REGION && (process.env.AWS_ROLE_ARN || (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)),
      process.env.AWS_ROLE_ARN?"role/oidc":"server credentials",
      ["AWS_REGION","AWS_ROLE_ARN (preferred) or server credentials"]),
    gcp:provider("gcp",
      process.env.GCP_PROJECT_ID && (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GCP_WORKLOAD_IDENTITY_PROVIDER),
      process.env.GCP_WORKLOAD_IDENTITY_PROVIDER?"workload identity":"service account",
      ["GCP_PROJECT_ID","GCP_WORKLOAD_IDENTITY_PROVIDER or GOOGLE_APPLICATION_CREDENTIALS_JSON"]),
    azure:provider("azure",
      process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_SUBSCRIPTION_ID &&
      (process.env.AZURE_CLIENT_SECRET || process.env.AZURE_FEDERATED_TOKEN),
      process.env.AZURE_FEDERATED_TOKEN?"federated identity":"service principal",
      ["AZURE_TENANT_ID","AZURE_CLIENT_ID","AZURE_SUBSCRIPTION_ID","AZURE_FEDERATED_TOKEN or AZURE_CLIENT_SECRET"]),
    databricks:provider("databricks",
      process.env.DATABRICKS_HOST && (process.env.DATABRICKS_TOKEN || (process.env.DATABRICKS_CLIENT_ID && process.env.DATABRICKS_CLIENT_SECRET)),
      process.env.DATABRICKS_TOKEN?"token":"oauth client",
      ["DATABRICKS_HOST","DATABRICKS_TOKEN or OAuth client credentials"]),
    snowflake:provider("snowflake",
      process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USER &&
      (process.env.SNOWFLAKE_PRIVATE_KEY || process.env.SNOWFLAKE_OAUTH_TOKEN),
      process.env.SNOWFLAKE_OAUTH_TOKEN?"oauth":"key pair",
      ["SNOWFLAKE_ACCOUNT","SNOWFLAKE_USER","SNOWFLAKE_PRIVATE_KEY or SNOWFLAKE_OAUTH_TOKEN"]),
    control_plane:provider("control_plane",true,"same-origin Vercel Function",[])
  };
  return {body:{
    ok:true,
    request_id:ctx.requestId,
    safety:{
      secrets_returned:false,
      live_execution_default:"read-only",
      learner_gate:"simulation completion + blind architecture defense >=85"
    },
    connectors
  }};
},{methods:["GET"]});
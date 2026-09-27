const crypto=require("node:crypto");
const path=require("node:path");
const {api}=require("../../_lib/http");
const {sha256,sign}=require("../../_lib/security");

function clean(v,max){return String(v==null?"":v).trim().slice(0,max);}
function lower(v){return clean(v,120000).toLowerCase();}
function contentSignals(expected,content){
  const p=expected.toLowerCase(),t=content.toLowerCase(),hits=[];
  function hit(name,re){if(re.test(t))hits.push(name);}
  if(/\.sqlx?$/.test(p)){hit("sql_statement",/\b(select|with|merge|create|alter|insert|update|delete|show)\b/);}
  if(/\.py$/.test(p)){hit("python_structure",/\b(import|from|def|class|return|with|if|for)\b/);}
  if(/\.tf$/.test(p)){hit("terraform_structure",/\b(resource|data|module|provider|terraform|variable|output)\b/);}
  if(/\.(ya?ml)$/.test(p)){hit("yaml_structure",/^\s*[\w.-]+\s*:/m);}
  if(/\.json$/.test(p)){try{JSON.parse(content);hits.push("valid_json");}catch(e){}}
  if(/dockerfile$/.test(p)){hit("container_structure",/^\s*from\s+/mi);}
  if(/runbook|incident/.test(p)){hit("recovery_semantics",/\b(rollback|recover|recovery|reconcile|verify|contain|evidence|restore|resume)\b/);}
  if(/test|fixture|assert/.test(p)){hit("test_semantics",/\b(test|assert|expected|fixture|duplicate|replay|edge|case|validate)\b/);}
  if(/reconcile/.test(p)){hit("reconciliation_semantics",/\b(reconcile|count|sum|except|minus|join|delta|difference|source|target)\b/);}
  if(/monitor|slo|alarm|drift/.test(p)){hit("observability_semantics",/\b(slo|alert|alarm|latency|freshness|drift|error|metric|threshold|monitor)\b/);}
  if(/infra|iam|governance|grant/.test(p)){hit("platform_control_semantics",/\b(resource|role|policy|grant|iam|permission|least|provider|service|account)\b/);}
  if(/pipeline|train|model|ml\//.test(p)){hit("ml_pipeline_semantics",/\b(train|evaluate|register|model|feature|dataset|artifact|promot|deploy|metric)\b/);}
  if(/\.md$/.test(p)){hit("documentation_depth",/(^|\n)#{1,6}\s|\b(why|owner|rollback|validation|evidence|decision|procedure)\b/i);}
  return hits;
}
function expectedSignals(expected){
  const p=expected.toLowerCase(),x=[];
  if(/\.sqlx?$/.test(p))x.push("sql_statement");
  if(/\.py$/.test(p))x.push("python_structure");
  if(/\.tf$/.test(p))x.push("terraform_structure");
  if(/\.(ya?ml)$/.test(p))x.push("yaml_structure");
  if(/\.json$/.test(p))x.push("valid_json");
  if(/dockerfile$/.test(p))x.push("container_structure");
  if(/runbook|incident/.test(p))x.push("recovery_semantics");
  if(/test|fixture|assert/.test(p))x.push("test_semantics");
  if(/reconcile/.test(p))x.push("reconciliation_semantics");
  if(/monitor|slo|alarm|drift/.test(p))x.push("observability_semantics");
  if(/infra|iam|governance|grant/.test(p))x.push("platform_control_semantics");
  if(/pipeline|train|model|ml\//.test(p))x.push("ml_pipeline_semantics");
  if(/\.md$/.test(p))x.push("documentation_depth");
  return Array.from(new Set(x));
}

module.exports=api(async(req,res,ctx)=>{
  const body=await ctx.readJson(req,196608);
  const client_id=clean(body.client_id,128);
  const work_order_id=clean(body.work_order_id,100);
  const expected_path=clean(body.expected_path,260);
  const declared_path=clean(body.declared_path,260);
  const file_name=clean(body.file_name,180);
  const purpose=clean(body.purpose,1800);
  const naming_reason=clean(body.naming_reason,1800);
  const content=String(body.content==null?"":body.content).slice(0,120000);
  if(client_id.length<8)throw ctx.fail(422,"client_id required");
  if(!work_order_id||!expected_path||!declared_path||!file_name)throw ctx.fail(422,"work order, paths and filename are required");
  if(!content.trim())throw ctx.fail(422,"File content is empty or unreadable");

  const base=path.posix.basename(expected_path);
  const expectedExt=path.posix.extname(base).toLowerCase();
  const actualExt=path.posix.extname(file_name).toLowerCase();
  const path_ok=declared_path===expected_path;
  const filename_ok=file_name===base;
  const extension_ok=expectedExt===actualExt || (!expectedExt&&base.toLowerCase()===file_name.toLowerCase());
  const expected=expectedSignals(expected_path);
  const signals=contentSignals(expected_path,content);
  const signalCoverage=expected.length?Math.round(signals.filter(x=>expected.includes(x)).length/expected.length*100):Math.min(100,Math.round(content.trim().length/3));
  const content_depth=Math.min(100,Math.round(content.trim().length/6));
  const purpose_ok=purpose.length>=60 && /\b(used|use|does|build|create|validate|reconcile|test|define|store|monitor|recover|deploy|transform|query|pipeline|model|data)\b/i.test(purpose);
  const naming_ok=naming_reason.length>=60 && /\b(because|name|path|folder|directory|purpose|separate|owner|domain|test|sql|infra|runbook|monitor)\b/i.test(naming_reason);
  const dimensions={
    path:path_ok?100:0,
    filename:filename_ok?100:0,
    extension:extension_ok?100:0,
    content_signals:signalCoverage,
    content_depth,
    purpose:purpose_ok?100:Math.min(70,Math.round(purpose.length/60*70)),
    naming_reason:naming_ok?100:Math.min(70,Math.round(naming_reason.length/60*70))
  };
  const score=Math.round(
    dimensions.path*.16+dimensions.filename*.14+dimensions.extension*.08+
    dimensions.content_signals*.22+dimensions.content_depth*.10+
    dimensions.purpose*.15+dimensions.naming_reason*.15
  );
  const verified=path_ok&&filename_ok&&extension_ok&&score>=80&&dimensions.content_signals>=60;
  const artifact_id=crypto.randomUUID();
  const payload={
    artifact_id,client_id,work_order_id,expected_path,file_name,score,verified,dimensions,
    content_hash:sha256(content),issued_at:new Date().toISOString()
  };
  const signed=sign(payload);
  return {body:{
    ok:true,request_id:ctx.requestId,artifact_id,work_order_id,expected_path,
    score,verified,dimensions,signals,expected_signals:expected,
    content_hash:payload.content_hash,verification:signed.verification,receipt:signed.receipt,
    notes:[
      path_ok?"Repository path matches the work order.":"Declared repository path does not match the work order.",
      filename_ok?"Filename matches expected artifact.":"Filename does not match expected artifact.",
      purpose_ok?"Purpose explanation is substantive.":"Explain what the file does in the project.",
      naming_ok?"Naming/path explanation is substantive.":"Explain why this filename and folder are appropriate."
    ]
  }};
},{methods:["POST"]});

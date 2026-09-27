function err(message,field){
  const e=new Error(message); e.statusCode=422; e.details=field?{field}:undefined; throw e;
}
function obj(v,field){if(!v||typeof v!=="object"||Array.isArray(v))err(field+" must be an object",field);return v;}
function str(v,field,min=1,max=200){
  if(typeof v!=="string")err(field+" must be a string",field);
  const x=v.trim(); if(x.length<min||x.length>max)err(field+" length must be "+min+"-"+max,field); return x;
}
function num(v,field,min=0,max=100){
  const n=Number(v); if(!Number.isFinite(n)||n<min||n>max)err(field+" must be between "+min+" and "+max,field); return n;
}
function bool(v,field){if(typeof v!=="boolean")err(field+" must be boolean",field);return v;}
function event(body){
  obj(body,"body");
  return {
    client_id:str(body.client_id,"client_id",8,128),
    tenant_id:str(body.tenant_id||"personal","tenant_id",1,80),
    event_type:str(body.event_type,"event_type",3,100),
    schema_version:Number.isInteger(body.schema_version)?body.schema_version:1,
    occurred_at:body.occurred_at?str(body.occurred_at,"occurred_at",10,64):new Date().toISOString(),
    correlation_id:body.correlation_id?str(body.correlation_id,"correlation_id",8,128):null,
    payload:obj(body.payload||{},"payload")
  };
}
function progress(body){
  obj(body,"body");
  return {
    client_id:str(body.client_id,"client_id",8,128),
    tenant_id:str(body.tenant_id||"personal","tenant_id",1,80),
    version:Number.isInteger(body.version)&&body.version>=0?body.version:0,
    overall_score:num(body.overall_score||0,"overall_score",0,100),
    signals:obj(body.signals||{},"signals"),
    source:str(body.source||"browser","source",1,50)
  };
}
function assessment(body){
  obj(body,"body");
  const answer=str(body.answer,"answer",1,30000);
  const rubric=obj(body.rubric||{},"rubric");
  const required=Array.isArray(rubric.required)?rubric.required.map(x=>str(String(x),"rubric.required",1,100)).slice(0,60):[];
  return {
    client_id:str(body.client_id,"client_id",8,128),
    tenant_id:str(body.tenant_id||"personal","tenant_id",1,80),
    assessment_type:str(body.assessment_type||"production","assessment_type",1,80),
    rubric_version:str(body.rubric_version||"v1","rubric_version",1,50),
    answer,
    required,
    blind:body.blind===undefined?true:bool(body.blind,"blind"),
    reveal_used:body.reveal_used===undefined?false:bool(body.reveal_used,"reveal_used"),
    duration_ms:Number.isFinite(Number(body.duration_ms))?Math.max(0,Math.min(Number(body.duration_ms),86400000)):0,
    metadata:obj(body.metadata||{},"metadata")
  };
}
function evidence(body){
  obj(body,"body");
  return {
    client_id:str(body.client_id,"client_id",8,128),
    tenant_id:str(body.tenant_id||"personal","tenant_id",1,80),
    artifact_type:str(body.artifact_type,"artifact_type",2,80),
    platform:str(body.platform||"general","platform",1,80),
    artifact_name:str(body.artifact_name,"artifact_name",1,240),
    evidence_text:str(body.evidence_text,"evidence_text",1,30000),
    metadata:obj(body.metadata||{},"metadata")
  };
}
module.exports={event,progress,assessment,evidence,str,num,obj};
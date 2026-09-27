const crypto = require("node:crypto");

function requestId(req){
  const incoming = req.headers && (req.headers["x-request-id"] || req.headers["x-correlation-id"]);
  return String(incoming || crypto.randomUUID()).slice(0,128);
}
function setBaseHeaders(res,id){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Request-Id",id);
}
function send(res,status,body,id){
  setBaseHeaders(res,id);
  res.statusCode=status;
  res.end(JSON.stringify(body));
}
function fail(code,message,details){
  const e=new Error(message); e.statusCode=code; e.details=details; return e;
}
async function readJson(req,maxBytes=262144){
  if(req.body && typeof req.body==="object" && !Buffer.isBuffer(req.body)) return req.body;
  if(typeof req.body==="string"){
    if(Buffer.byteLength(req.body)>maxBytes) throw fail(413,"Request body too large");
    try{return JSON.parse(req.body||"{}");}catch(e){throw fail(400,"Invalid JSON body");}
  }
  const chunks=[]; let size=0;
  for await (const chunk of req){
    size+=chunk.length; if(size>maxBytes) throw fail(413,"Request body too large");
    chunks.push(chunk);
  }
  if(!chunks.length) return {};
  try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch(e){throw fail(400,"Invalid JSON body");}
}
function methodGuard(req,allowed){
  if(req.method==="OPTIONS") return true;
  if(!allowed.includes(req.method)) throw fail(405,"Method not allowed",{allowed});
  return false;
}
function api(handler,opts={}){
  const allowed=opts.methods||["GET"];
  return async function(req,res){
    const id=requestId(req), start=Date.now();
    res.setHeader("Allow",allowed.concat(["OPTIONS"]).join(", "));
    if(req.method==="OPTIONS"){send(res,204,{ok:true},id);return;}
    let status=200;
    try{
      methodGuard(req,allowed);
      const result=await handler(req,res,{requestId:id,readJson,fail});
      if(res.writableEnded) return;
      status=(result&&result.status)||200;
      send(res,status,(result&&result.body)!==undefined?result.body:result,id);
    }catch(err){
      status=err.statusCode||500;
      const body={ok:false,error:{code:status===500?"INTERNAL_ERROR":"REQUEST_ERROR",message:status===500?"Unexpected server error":err.message},request_id:id};
      if(err.details) body.error.details=err.details;
      if(status===500) console.error(JSON.stringify({level:"error",request_id:id,path:req.url,error:err.stack||String(err)}));
      send(res,status,body,id);
    }finally{
      console.log(JSON.stringify({level:"info",request_id:id,method:req.method,path:req.url,status,duration_ms:Date.now()-start}));
    }
  };
}
module.exports={api,readJson,send,fail,requestId};
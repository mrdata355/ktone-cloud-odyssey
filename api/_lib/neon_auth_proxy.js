function base(){
  const x=String(process.env.NEON_AUTH_BASE_URL||"").replace(/\/$/,"");
  if(!x){const e=new Error("Managed Better Auth is not configured");e.statusCode=503;throw e;}return x;
}
function cookies(headers){
  if(typeof headers.getSetCookie==="function")return headers.getSetCookie().map(rewriteCookie);
  const v=headers.get("set-cookie");return v?[rewriteCookie(v)]:[];
}
function rewriteCookie(v){
  return String(v).replace(/;\s*Domain=[^;]+/ig,"").replace(/;\s*Path=[^;]+/ig,"; Path=/");
}
async function body(req,max=65536){
  let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>max){const e=new Error("Request body too large");e.statusCode=413;throw e;}chunks.push(c);}
  if(!chunks.length)return {};
  try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch(e){const x=new Error("Invalid JSON");x.statusCode=400;throw x;}
}
async function upstream(req,path,method,payload){
  const headers={"accept":"application/json","content-type":"application/json"};
  if(req.headers&&req.headers.cookie)headers.cookie=req.headers.cookie;
  if(req.headers&&req.headers.origin)headers.origin=req.headers.origin;
  const r=await fetch(base()+path,{method,headers,body:payload===undefined?undefined:JSON.stringify(payload),redirect:"manual"});
  const text=await r.text();let data;try{data=text?JSON.parse(text):{};}catch(e){data={raw:text};}
  return {status:r.status,data,headers:r.headers,setCookies:cookies(r.headers),jwt:r.headers.get("set-auth-jwt")||null,location:r.headers.get("location")||null};
}
function send(res,result){
  if(result.setCookies&&result.setCookies.length)res.setHeader("Set-Cookie",result.setCookies);
  if(result.location)res.setHeader("Location",result.location);
  res.statusCode=result.status;res.setHeader("Content-Type","application/json; charset=utf-8");
  res.end(JSON.stringify(result.data||{}));
}
function fail(res,e){res.statusCode=e.statusCode||500;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify({ok:false,error:{message:e.message}}));}
module.exports={base,body,upstream,send,fail};

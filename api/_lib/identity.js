const crypto=require("node:crypto");

const jwksCache={url:null,keys:[],at:0};
function configured(){return Boolean(process.env.AUTH_JWKS_URL);}
function required(){return String(process.env.AUTH_REQUIRED||"false").toLowerCase()==="true";}
function b64urlJson(part){
  try{return JSON.parse(Buffer.from(part.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8"));}
  catch(e){const x=new Error("Invalid JWT encoding");x.statusCode=401;throw x;}
}
function bearer(req){
  const h=String((req.headers&&req.headers.authorization)||"");
  const m=h.match(/^Bearer\s+(.+)$/i);
  return m?m[1].trim():null;
}
async function jwks(){
  const url=process.env.AUTH_JWKS_URL;
  if(!url) return [];
  if(jwksCache.url===url&&Date.now()-jwksCache.at<300000&&jwksCache.keys.length)return jwksCache.keys;
  const r=await fetch(url,{headers:{"accept":"application/json"}});
  if(!r.ok){const e=new Error("Auth JWKS unavailable");e.statusCode=503;throw e;}
  const data=await r.json();
  const keys=Array.isArray(data.keys)?data.keys:[];
  if(!keys.length){const e=new Error("Auth JWKS contains no keys");e.statusCode=503;throw e;}
  jwksCache.url=url;jwksCache.keys=keys;jwksCache.at=Date.now();
  return keys;
}
function algSpec(alg){
  if(alg==="RS256")return {importAlg:{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},verifyAlg:{name:"RSASSA-PKCS1-v1_5"}};
  if(alg==="ES256")return {importAlg:{name:"ECDSA",namedCurve:"P-256"},verifyAlg:{name:"ECDSA",hash:"SHA-256"}};
  if(alg==="EdDSA")return {importAlg:{name:"Ed25519"},verifyAlg:{name:"Ed25519"}};
  const e=new Error("Unsupported JWT algorithm");e.statusCode=401;throw e;
}
function audOk(claim,want){
  if(!want)return true;
  if(Array.isArray(claim))return claim.includes(want);
  return String(claim||"")===want;
}
async function verify(token){
  const parts=String(token||"").split(".");
  if(parts.length!==3){const e=new Error("Malformed bearer token");e.statusCode=401;throw e;}
  const header=b64urlJson(parts[0]),payload=b64urlJson(parts[1]);
  if(!header.kid){const e=new Error("JWT kid is required");e.statusCode=401;throw e;}
  const keys=await jwks();
  const jwk=keys.find(k=>k.kid===header.kid);
  if(!jwk){jwksCache.at=0;const fresh=await jwks();const retry=fresh.find(k=>k.kid===header.kid);if(!retry){const e=new Error("JWT signing key not found");e.statusCode=401;throw e;}return verifyWith(parts,header,payload,retry);}
  return verifyWith(parts,header,payload,jwk);
}
async function verifyWith(parts,header,payload,jwk){
  const spec=algSpec(header.alg);
  const key=await crypto.webcrypto.subtle.importKey("jwk",jwk,spec.importAlg,false,["verify"]);
  const data=Buffer.from(parts[0]+"."+parts[1]);
  const sig=Buffer.from(parts[2].replace(/-/g,"+").replace(/_/g,"/"),"base64");
  const ok=await crypto.webcrypto.subtle.verify(spec.verifyAlg,key,sig,data);
  if(!ok){const e=new Error("JWT signature verification failed");e.statusCode=401;throw e;}
  const now=Math.floor(Date.now()/1000),skew=60;
  if(payload.exp&&Number(payload.exp)<now-skew){const e=new Error("JWT expired");e.statusCode=401;throw e;}
  if(payload.nbf&&Number(payload.nbf)>now+skew){const e=new Error("JWT not active yet");e.statusCode=401;throw e;}
  if(process.env.AUTH_ISSUER&&payload.iss!==process.env.AUTH_ISSUER){const e=new Error("JWT issuer mismatch");e.statusCode=401;throw e;}
  if(!audOk(payload.aud,process.env.AUTH_AUDIENCE)){const e=new Error("JWT audience mismatch");e.statusCode=401;throw e;}
  if(!payload.sub){const e=new Error("JWT subject is required");e.statusCode=401;throw e;}
  return payload;
}
function guest(req){
  const client=String((req.headers&&req.headers["x-client-id"])||"guest").trim().slice(0,128);
  return {authenticated:false,user_id:null,client_id:client,tenant_id:"personal",role:"guest",email:null,name:null,claims:null};
}
async function resolve(req){
  const token=bearer(req);
  if(!configured()){
    if(required()){const e=new Error("Authentication is required but AUTH_JWKS_URL is not configured");e.statusCode=503;throw e;}
    return guest(req);
  }
  if(!token){
    if(required()){const e=new Error("Bearer token required");e.statusCode=401;throw e;}
    return guest(req);
  }
  const p=await verify(token);
  const tenant=String(p.tenant_id||p.org_id||p.organization_id||"personal").slice(0,80);
  return {
    authenticated:true,
    user_id:String(p.sub).slice(0,200),
    client_id:String((req.headers&&req.headers["x-client-id"])||"device").slice(0,128),
    tenant_id:tenant,
    role:String(p.role||p.org_role||"member").slice(0,50),
    email:p.email?String(p.email).slice(0,320):null,
    name:p.name?String(p.name).slice(0,255):null,
    claims:p
  };
}
async function ensure(db,actor){
  if(!actor||!actor.authenticated||!db.configured())return;
  await db.query(`insert into odyssey_users(user_id,email,display_name,auth_provider,last_seen_at)
    values ($1,$2,$3,$4,now())
    on conflict (user_id) do update set email=coalesce(excluded.email,odyssey_users.email),
      display_name=coalesce(excluded.display_name,odyssey_users.display_name),updated_at=now(),last_seen_at=now()`,
    [actor.user_id,actor.email,actor.name,"jwt"]);
  await db.query(`insert into odyssey_tenants(tenant_id,name,owner_user_id)
    values ($1,$2,$3) on conflict (tenant_id) do nothing`,
    [actor.tenant_id,actor.tenant_id==="personal"?"Personal workspace":actor.tenant_id,actor.user_id]);
  await db.query(`insert into odyssey_memberships(tenant_id,user_id,role)
    values ($1,$2,$3) on conflict (tenant_id,user_id) do update set role=excluded.role`,
    [actor.tenant_id,actor.user_id,actor.role]);
}
module.exports={configured,required,resolve,ensure,verify};

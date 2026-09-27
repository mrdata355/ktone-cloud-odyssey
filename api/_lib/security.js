const crypto=require("node:crypto");
function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==="object"){
    return Object.keys(value).sort().reduce((o,k)=>{o[k]=stable(value[k]);return o;},{});
  }
  return value;
}
function canonical(value){return JSON.stringify(stable(value));}
function sha256(value){return crypto.createHash("sha256").update(typeof value==="string"?value:canonical(value)).digest("hex");}
function sign(payload){
  const secret=process.env.ASSESSMENT_SIGNING_SECRET;
  if(!secret) return {verification:"unsigned",receipt:null};
  const body=canonical(payload);
  const receipt=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  return {verification:"signed",receipt};
}
module.exports={canonical,sha256,sign};
const {api}=require("../_lib/http");
const {recommend}=require("../_lib/recommendations");

module.exports=api(async(req,res,ctx)=>{
  const body=await ctx.readJson(req,131072);
  const signals=body&&typeof body.signals==="object"&&!Array.isArray(body.signals)?body.signals:{};
  const budget=body.budget_minutes||45;
  return {body:{ok:true,request_id:ctx.requestId,recommendation:recommend(signals,budget)}};
},{methods:["POST"]});
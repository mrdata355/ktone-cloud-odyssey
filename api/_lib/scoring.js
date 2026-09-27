const DIMENSIONS=["correctness","reasoning","production","evidence","tradeoff","communication","transfer"];
const CAUSAL=["because","therefore","so that","which means","tradeoff","rather than","instead"];
const EVIDENCE=["metric","test","reconcile","evidence","slo","latency","freshness","count","rate","profile","cost","alert"];
const PROD=["idempot","rollback","retry","checkpoint","schema","key","grain","partition","monitor","audit","least privilege","failure"];
function hits(text,terms){const l=text.toLowerCase();return terms.filter(t=>l.includes(t.toLowerCase()));}
function grade(input){
  const answer=input.answer||"", req=input.required||[];
  const reqHits=hits(answer,req), causal=hits(answer,CAUSAL), evidence=hits(answer,EVIDENCE), prod=hits(answer,PROD);
  const coverage=req.length?reqHits.length/req.length:Math.min(1,answer.length/700);
  const depth=Math.min(1,answer.length/1200);
  const correctness=Math.round(Math.min(100,35+coverage*65));
  const reasoning=Math.round(Math.min(100,30+Math.min(1,causal.length/3)*45+depth*25));
  const production=Math.round(Math.min(100,30+Math.min(1,prod.length/4)*55+depth*15));
  const evidenceScore=Math.round(Math.min(100,25+Math.min(1,evidence.length/4)*60+depth*15));
  const tradeoff=Math.round(Math.min(100,25+(/instead|rather than|tradeoff|alternative|versus| vs /i.test(answer)?50:0)+depth*25));
  const communication=Math.round(Math.min(100,30+(answer.length>=180?20:0)+(answer.length<=4000?15:0)+Math.min(35,(causal.length+evidence.length)*5)));
  const transfer=Math.round(Math.min(100,25+(/when|if |different|another|same pattern|generalize|transfer/i.test(answer)?40:0)+coverage*20+depth*15));
  const dims={correctness,reasoning,production,evidence:evidenceScore,tradeoff,communication,transfer};
  let score=Math.round(DIMENSIONS.reduce((n,d)=>n+dims[d],0)/DIMENSIONS.length);
  if(input.reveal_used) score=Math.max(0,score-15);
  if(!input.blind) score=Math.max(0,score-5);
  return {score,dimensions:dims,signals:{required_hits:reqHits,causal_hits:causal,evidence_hits:evidence,production_hits:prod},rubric_version:input.rubric_version||"v1"};
}
function readiness(signals){
  const keys=Object.keys(signals||{}); if(!keys.length)return {score:0,confidence:0};
  const vals=keys.map(k=>Math.max(0,Math.min(100,Number(signals[k])||0)));
  const score=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  const confidence=Math.round(Math.min(100,25+keys.length*6));
  return {score,confidence};
}
module.exports={grade,readiness,DIMENSIONS};
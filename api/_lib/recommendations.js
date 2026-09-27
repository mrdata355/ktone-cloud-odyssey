const catalog=[
 {id:"coding",label:"Blind production coding",signal:"coding",minutes:25,threshold:90},
 {id:"transfer",label:"Adaptive transfer variant",signal:"transfer",minutes:15,threshold:85},
 {id:"incident",label:"Incident recovery",signal:"recovery",minutes:15,threshold:85},
 {id:"vocab",label:"Natural technical vocabulary",signal:"vocab",minutes:10,threshold:90},
 {id:"star",label:"STAR production story",signal:"star",minutes:12,threshold:85},
 {id:"aws",label:"AWS project stage",signal:"aws",minutes:25,threshold:85},
 {id:"gcp",label:"GCP project stage",signal:"gcp",minutes:25,threshold:85},
 {id:"azure",label:"Azure project stage",signal:"azure",minutes:25,threshold:85},
 {id:"databricks",label:"Databricks project stage",signal:"databricks",minutes:25,threshold:85},
 {id:"snowflake",label:"Snowflake project stage",signal:"snowflake",minutes:25,threshold:85},
 {id:"stakeholder",label:"Stakeholder explanation",signal:"stakeholder",minutes:10,threshold:85}
];
function recommend(signals={},budget=45){
  budget=Math.max(10,Math.min(180,Number(budget)||45));
  const ranked=catalog.map(item=>{
    const score=Math.max(0,Math.min(100,Number(signals[item.signal])||0));
    const gap=Math.max(0,item.threshold-score);
    const priority=gap*2+(score===0?18:0)+(item.signal==="coding"?8:0)+(item.signal==="transfer"?6:0);
    return {...item,score,gap,priority};
  }).sort((a,b)=>b.priority-a.priority);
  const selected=[];let used=0;
  for(const x of ranked){if(used+x.minutes<=budget||!selected.length){selected.push(x);used+=x.minutes;}if(selected.length>=4)break;}
  return {policy_version:"adaptive-v1",budget_minutes:budget,planned_minutes:used,items:selected.map((x,i)=>({...x,order:i+1,why:x.score===0?"No evidence yet":x.gap>0?x.signal+" is "+x.gap+" points below gate":"maintenance / retention"}))};
}
module.exports={recommend,catalog};
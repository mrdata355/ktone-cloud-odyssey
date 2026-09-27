const {api}=require("../_lib/http");
const db=require("../_lib/db");

module.exports=api(async()=>{
  return {body:{
    ok:true,
    architecture:{
      runtime:"Vercel Functions / Node 24",
      persistence:db.configured()?"Postgres configured":"Postgres adapter ready; DATABASE_URL required",
      event_model:"append-only learning events + versioned snapshots",
      verification:"server-side rubric scoring + optional HMAC receipts",
      privacy:"raw answers/evidence can remain client-side; hashes and metadata are persisted",
      observability:"structured JSON logs + request/correlation IDs"
    },
    endpoints:[
      {method:"GET",path:"/api/v1/health",class:"real backend"},
      {method:"GET",path:"/api/v1/capabilities",class:"real backend"},
      {method:"GET",path:"/api/v1/smoke",class:"real backend diagnostic"},
      {method:"POST",path:"/api/v1/recommendations",class:"real backend"},
      {method:"POST",path:"/api/v1/assessments/grade",class:"real backend"},
      {method:"POST",path:"/api/v1/events",class:"persistent when DATABASE_URL configured"},
      {method:"GET/PUT",path:"/api/v1/progress",class:"persistent when DATABASE_URL configured"},
      {method:"POST",path:"/api/v1/evidence",class:"persistent provenance when DATABASE_URL configured"}
    ],
    missing_for_verified_multiuser_product:[
      "end-user authentication",
      "tenant membership/RBAC enforcement",
      "billing provider webhook integration",
      "object-storage evidence uploads",
      "distributed rate-limit store",
      "background job worker/outbox consumer"
    ]
  }};
},{methods:["GET"]});
(function(){
"use strict";
if(!window.CloudOdyssey)return;
var CO=window.CloudOdyssey,D=document,$=function(s,r){return (r||D).querySelector(s);};
var WORK=[
 {id:"core",name:"Core learning product + UX",weight:14,score:86,status:"ADVANCED",done:"Mission OS, modern mobile UI, navigation, project work orders, vocabulary, STAR, WHY engine, stakeholder translation.",next:"Finish browser-level interaction regression coverage and onboarding polish."},
 {id:"projects",name:"Projects, simulations + assessment",weight:15,score:88,status:"ADVANCED",done:"30 missions, deep recovery, cloud forge, coding forge, Sardine campaign, server mission grading, artifact verification.",next:"Version every rubric and add independent benchmark sets + delayed retention exams."},
 {id:"backend",name:"Backend control plane + APIs",weight:12,score:84,status:"STRONG",done:"Mission sessions, server tests, authoritative grading, JWT-aware persistence, account status, work-order sync, recommendations, evidence/artifact verification and connector registry.",next:"After DATABASE_URL is active, move remaining mastery/project state server-side and add queues/background execution."},
 {id:"persistence",name:"Persistence, accounts + multitenancy",weight:10,score:42,status:"BLOCKER",done:"Multi-tenant schema, JWT identity boundary, Account & Sync, cross-device work-order API and authenticated persistence paths are implemented.",next:"Attach a Neon project, apply the migration, set DATABASE_URL/JWT environment values, then test restore and cross-device sync."},
 {id:"connectors",name:"Live cloud/lakehouse execution",weight:10,score:25,status:"BLOCKER",done:"AWS/GCP/Azure/Databricks/Snowflake simulation layer and live graduation gates exist.",next:"Authenticated read-only connectors → isolated sandboxes → approved mutations → evidence capture."},
 {id:"money",name:"Billing, plans + entitlements",weight:10,score:5,status:"P0",done:"Product surfaces exist but no production subscription system is authoritative yet.",next:"Stripe billing, Free/Pro/Team/Enterprise entitlements, trials, usage limits, invoices, cancellation and tax handling."},
 {id:"validity",name:"Assessment validity + certification",weight:8,score:55,status:"BUILD",done:"Blind grading, mastery gates, first-pass signals, artifact checks and evidence ledger concepts.",next:"Normed benchmark versions, item analysis, anti-cheat, certificate verification and employer-facing evidence."},
 {id:"security",name:"Security, privacy + compliance",weight:8,score:44,status:"BUILD",done:"Server-side secrets boundary, JWT signature/issuer/audience validation, tenant identity enforcement, live connector gating and audit-oriented evidence design.",next:"Add formal RBAC policy enforcement, rate limiting, privacy deletion/export, dependency scanning and external security testing."},
 {id:"growth",name:"Analytics, growth + go-to-market",weight:7,score:10,status:"P1",done:"Clear product concept and role-specific learning campaigns.",next:"Event analytics, activation funnel, cohort retention, referral loop, content SEO, employer/team pilot and pricing validation."},
 {id:"ops",name:"Reliability, support + operations",weight:6,score:58,status:"BUILD",done:"Vercel deployment, runtime error checks, QA harness, runbook mindset and health APIs.",next:"SLOs, synthetic monitoring, alerting, incident ownership, support workflow, status page and disaster recovery tests."}
];
function weighted(items){var w=items.reduce(function(n,x){return n+x.weight;},0);return Math.round(items.reduce(function(n,x){return n+x.weight*x.score;},0)/w);}
function render(){
 var root=$("#view-roadmap");if(!root)return;
 var overall=weighted(WORK);
 var tech=weighted(WORK.filter(function(x){return ["core","projects","backend","ops"].includes(x.id);}));
 var commercial=weighted(WORK.filter(function(x){return ["persistence","connectors","money","security","growth","ops"].includes(x.id);}));
 var scale=weighted(WORK.filter(function(x){return ["persistence","connectors","security","validity","ops"].includes(x.id);}));
 var p0=WORK.filter(function(x){return x.status==="P0"||x.status==="BLOCKER";});
 root.innerHTML='<div class="view-heading"><div><span class="micro">FOUNDER / PROJECT MANAGER CONTROL</span><h2>Product → Business Roadmap</h2><p>Weighted implementation readiness. This measures the software/business foundation—not company valuation or probability of becoming a million/billion-dollar company.</p></div><span class="enterprise-badge">LIVE ROADMAP BASELINE</span></div>'+
 '<div class="pm-hero">'+
  '<article class="pm-score glass"><span>OVERALL PRODUCT→BUSINESS</span><b>'+overall+'%</b><div><i style="width:'+overall+'%"></i></div><p>'+(100-overall)+'% of the weighted roadmap remains before I would call the platform commercially mature.</p></article>'+
  '<article class="pm-mini glass"><span>TECHNICAL PRODUCT BUILD</span><b>'+tech+'%</b><p>Core experience, projects, backend and operational foundation.</p></article>'+
  '<article class="pm-mini glass"><span>COMMERCIAL LAUNCH READINESS</span><b>'+commercial+'%</b><p>Accounts, persistence, connectors, billing, trust and acquisition.</p></article>'+
  '<article class="pm-mini glass"><span>SCALE / ENTERPRISE READINESS</span><b>'+scale+'%</b><p>Multitenancy, real execution, security, evidence and operations.</p></article>'+
 '</div>'+
 '<section class="pm-priority glass"><div><span class="micro">P0 CRITICAL PATH</span><h3>What unlocks paid scale next</h3></div><div class="pm-priority-grid">'+p0.map(function(x){return '<article><b>'+x.name+'</b><span>'+x.score+'%</span><p>'+x.next+'</p></article>';}).join("")+'</div></section>'+
 '<div class="pm-roadmap">'+WORK.map(function(x){
  return '<article class="pm-row glass"><div class="pm-row-top"><div><span class="pm-state '+x.status.toLowerCase()+'">'+x.status+'</span><h3>'+x.name+'</h3></div><strong>'+x.score+'%</strong></div>'+
  '<div class="pm-track"><i style="width:'+x.score+'%"></i></div><div class="pm-row-grid"><p><b>Implemented:</b> '+x.done+'</p><p><b>Next:</b> '+x.next+'</p></div><footer>ROADMAP WEIGHT '+x.weight+'%</footer></article>';
 }).join("")+'</div>'+
 '<section class="pm-gates glass"><span class="micro">STAGE GATES</span><h3>Definition of “ready”</h3><div class="pm-gate-grid">'+
 [
  ["Paid beta","Auth + durable progress + billing + basic analytics + support + privacy/legal."],
  ["Production SaaS","Multi-tenant persistence, audited entitlements, monitored APIs, backups, security baseline, measurable retention."],
  ["Enterprise","SSO/RBAC, compliance controls, team/admin reporting, audit evidence, procurement readiness, SLAs."],
  ["Venture-scale growth","Repeatable acquisition + retention + expansion economics. This is a market/traction milestone, not a code milestone."]
 ].map(function(x){return '<article><b>'+x[0]+'</b><p>'+x[1]+'</p></article>';}).join("")+'</div></section>';
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=D.createElement("button");b.className="nav-item";b.dataset.view="roadmap";b.innerHTML="<span>%</span><b>Product Roadmap</b><em>PM</em>";b.onclick=function(){CO.setView("roadmap");var t=$("#pageTitle");if(t)t.textContent="Product → Business Roadmap";render();};nav.appendChild(b);
 var s=D.createElement("section");s.className="view";s.id="view-roadmap";work.appendChild(s);render();
}
window.CloudOdysseyProductRoadmap={workstreams:WORK,overall:function(){return weighted(WORK);},render:render};
install();
})();
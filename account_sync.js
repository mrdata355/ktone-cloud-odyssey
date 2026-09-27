(function(){
"use strict";
if(!window.CloudOdyssey)return;
var CO=window.CloudOdyssey,D=document,$=function(s,r){return (r||D).querySelector(s);};
var state={health:null,me:null,schema:null,workOrders:[],error:null,loading:false};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function badge(ok,yes,no){return '<span class="acct-badge '+(ok?"ok":"pending")+'">'+esc(ok?yes:no)+'</span>';}
async function refresh(){
 var api=window.CloudOdysseyBackend;if(!api)return;
 state.loading=true;render();
 try{
   state.health=await api.health(true);
   state.me=await api.me();
   if(state.health.persistence&&state.health.persistence.ok&&api.schemaStatus){try{state.schema=await api.schemaStatus();}catch(e){state.schema={ready:false,error:e.message};}}else state.schema=null;
   if(state.health.capabilities&&state.health.capabilities.durable_work_orders){
     try{var w=await api.loadWorkOrders();state.workOrders=w.work_orders||[];}catch(e){state.workOrders=[];}
   }
   state.error=null;
 }catch(e){state.error=e.message;}
 state.loading=false;render();
}
async function syncNow(){
 var api=window.CloudOdysseyBackend;if(!api)return;
 var out=$("#acctActionResult");if(out)out.textContent="Syncing...";
 try{
   var r=await api.syncProgress();
   if(out)out.textContent=r.snapshot?"Progress persisted • version "+r.snapshot.version:(r.message||"Sync not persisted");
   await refresh();
 }catch(e){if(out)out.textContent="Sync failed: "+e.message;}
}
function exportRecovery(){
 var payload={exported_at:new Date().toISOString(),client_id:window.CloudOdysseyBackend&&window.CloudOdysseyBackend.clientId(),stores:{}};
 for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("cloud_odyssey_")===0){try{payload.stores[k]=JSON.parse(localStorage.getItem(k));}catch(e){payload.stores[k]=localStorage.getItem(k);}}}
 var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=D.createElement("a");a.href=url;a.download="cloud-odyssey-recovery-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(function(){URL.revokeObjectURL(url);},500);
}
function render(){
 var root=$("#view-account-sync");if(!root)return;
 var h=state.health||{},me=state.me||{},auth=me.auth||h.auth||{},caps=h.capabilities||{},p=h.persistence||{};
 var authed=!!auth.authenticated,db=!!(p.configured&&p.ok),schemaReady=!!(state.schema&&state.schema.ready),sign=!!(h.verification&&h.verification.assessment_signing);
 root.innerHTML='<div class="view-heading"><div><span class="micro">IDENTITY • PERSISTENCE • RECOVERY</span><h2>Account & Sync</h2><p>One place to verify whether Cloud Odyssey is merely running, actually durable, authenticated, and producing verifiable evidence.</p></div><span class="enterprise-badge">'+(state.loading?"CHECKING":authed?"AUTHENTICATED":"GUEST MODE")+'</span></div>'+
 '<div class="acct-grid">'+
  '<article class="acct-card glass"><div><span>CONTROL PLANE</span><h3>Backend API</h3></div>'+badge(!!h.ok,"ONLINE","UNKNOWN")+'<p>Server grading, mission sessions, recommendations and artifact verification.</p></article>'+
  '<article class="acct-card glass"><div><span>DURABILITY</span><h3>Postgres + schema</h3></div>'+badge(db&&schemaReady,"READY",db?"MIGRATION NEEDED":"NOT CONNECTED")+'<p>'+(db?(schemaReady?("Database "+esc(p.database||"connected")+" + SaaS schema ready."):("Database responds, but schema is incomplete: "+esc((state.schema&&state.schema.tables&&state.schema.tables.missing||[]).join(", ")||"check migration"))):"DATABASE_URL is not active in this deployment; browser state remains the recovery source.")+'</p></article>'+
  '<article class="acct-card glass"><div><span>IDENTITY</span><h3>Authentication</h3></div>'+badge(authed,"SIGNED IN",auth.configured?"TOKEN REQUIRED":"NOT CONFIGURED")+'<p>'+(authed?("User "+esc(auth.email||auth.user_id||"authenticated")+" • tenant "+esc(auth.tenant_id||"personal")):(auth.configured?"JWT verification is configured, but this browser has no authenticated session.":"JWT/Neon Auth public configuration has not been attached to Vercel yet."))+'</p></article>'+
  '<article class="acct-card glass"><div><span>PROVENANCE</span><h3>Assessment signing</h3></div>'+badge(sign,"SIGNED","UNSIGNED")+'<p>'+(sign?"Assessment receipts are cryptographically signed.":"ASSESSMENT_SIGNING_SECRET is not configured; receipts are server-issued but unsigned.")+'</p></article>'+
 '</div>'+
 '<section class="acct-main glass"><div class="acct-head"><div><span class="micro">CROSS-DEVICE STATE</span><h3>Progress + work orders</h3></div><button id="acctRefresh">Refresh status</button></div>'+
 '<div class="acct-kpis"><div><span>DURABLE PROGRESS</span><b>'+(caps.durable_progress?"YES":"NO")+'</b></div><div><span>DURABLE WORK ORDERS</span><b>'+(caps.durable_work_orders?"YES":"NO")+'</b></div><div><span>SERVER WORK ORDERS</span><b>'+state.workOrders.length+'</b></div><div><span>CLIENT ID</span><b>'+esc(String(window.CloudOdysseyBackend&&window.CloudOdysseyBackend.clientId()||"—").slice(0,8))+'</b></div></div>'+
 '<div class="acct-actions"><button id="acctSync">Sync proficiency now</button><button id="acctExport">Export local recovery snapshot</button></div><pre id="acctActionResult">'+(state.error?esc(state.error):"Ready")+'</pre></section>'+
 '<section class="acct-main glass"><span class="micro">P0 INFRASTRUCTURE GATE</span><h3>What still has to be attached</h3><div class="acct-env">'+
 [['DATABASE_URL',db,"Neon Postgres connection string"],['AUTH_JWKS_URL',!!h.auth&&!!h.auth.jwks,"Public JWKS endpoint from Neon Auth"],['AUTH_ISSUER / AUTH_AUDIENCE',!!h.auth&&!!h.auth.issuer&&!!h.auth.audience,"JWT claim validation"],['ASSESSMENT_SIGNING_SECRET',sign,"Cryptographic evidence receipts"]].map(function(x){return '<div><code>'+x[0]+'</code>'+badge(x[1],"ACTIVE","PENDING")+'<p>'+x[2]+'</p></div>';}).join("")+
 '</div><p class="acct-note">Secrets never belong in browser JavaScript or GitHub source. They must be attached as server-side deployment environment variables.</p></section>'+
 '<section class="acct-main glass"><span class="micro">LATEST SERVER WORK</span><h3>Cross-device work orders</h3><div class="acct-work">'+(state.workOrders.length?state.workOrders.slice(0,8).map(function(w){return '<article><b>'+esc(w.title)+'</b><span>'+esc(w.status)+'</span><p>'+esc(w.kind)+' • '+esc(w.updated_at||"")+'</p></article>';}).join(""):'<p>No durable server work orders yet.</p>')+'</div></section>';
 var r=$("#acctRefresh");if(r)r.onclick=refresh;
 var s=$("#acctSync");if(s)s.onclick=syncNow;
 var e=$("#acctExport");if(e)e.onclick=exportRecovery;
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=D.createElement("button");b.className="nav-item";b.dataset.view="account-sync";b.innerHTML="<span>◎</span><b>Account & Sync</b><em>P0</em>";b.onclick=function(){CO.setView("account-sync");var t=$("#pageTitle");if(t)t.textContent="Account & Sync";refresh();};nav.appendChild(b);
 var s=D.createElement("section");s.className="view";s.id="view-account-sync";work.appendChild(s);render();
 D.addEventListener("odyssey:identity",function(){setTimeout(refresh,80);});
}
window.CloudOdysseyAccountSync={refresh:refresh,getState:function(){return state;}};
install();
})();
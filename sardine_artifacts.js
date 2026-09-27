(function(){
"use strict";
if(!window.CloudOdysseySardine||!window.CloudOdyssey)return;
var S=window.CloudOdysseySardine,B=window.CloudOdysseyBackend,CO=window.CloudOdyssey;
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};

function state(){var x=S.getState();x.artifactEvidence=x.artifactEvidence||{};return x;}
function project(){var x=state();return S.projects[(Number(x.project)||0)%S.projects.length];}
function ak(pr,path){return pr.id+"::"+path;}
function modal(html){var m=$("#modal"),c=$("#modalContent");if(!m||!c)return null;c.innerHTML=html;m.classList.remove("hidden");c.scrollTop=0;return c;}
function close(){var m=$("#modal");if(m)m.classList.add("hidden");}
function openArtifact(pr,index){
 var pair=S.artifacts(pr)[index],path=pair[0],x=state(),ev=x.artifactEvidence[ak(pr,path)]||{};
 var c=modal(
  '<span class="micro">SARDINE PROJECT ARTIFACT '+String(index+1).padStart(2,"0")+'/06</span>'+
  '<h2><code>'+esc(path)+'</code></h2><p class="se-task-prompt">'+esc(pair[1])+'</p>'+
  '<label class="se-label">EXPECTED REPOSITORY PATH<input id="seArtifactPath" value="'+esc(path)+'"></label>'+
  '<label class="se-label">UPLOAD FILE<input id="seArtifactFile" type="file"></label>'+
  '<label class="se-label">WHAT DOES THIS FILE DO / PROVE?<textarea id="seArtifactPurpose">'+esc(ev.purpose||"")+'</textarea></label>'+
  '<label class="se-label">WHY THIS NAME + FOLDER?<textarea id="seArtifactWhy">'+esc(ev.naming_reason||"")+'</textarea></label>'+
  '<div class="se-actions"><button id="seVerifyArtifact">Verify artifact on server</button><button id="seArtifactBack">Back to project</button>'+(ev.verified&&index<5?'<button id="seNextArtifact">Next file →</button>':'')+'</div>'+
  '<div id="seArtifactResult" class="sardine-result">'+(ev.score!=null?((ev.verified?"VERIFIED ":"NEEDS WORK ")+ev.score+"%"):'Server verification requires path, filename, substantive content, purpose and naming rationale.')+'</div>'
 );
 if(!c)return;
 $("#seArtifactBack",c).onclick=close;
 var nx=$("#seNextArtifact",c);if(nx)nx.onclick=function(){close();setTimeout(function(){openArtifact(pr,index+1);},60);};
 $("#seVerifyArtifact",c).onclick=async function(){
   var fi=$("#seArtifactFile",c),file=fi&&fi.files&&fi.files[0],out=$("#seArtifactResult",c);
   if(!file){out.textContent="Choose the required file first.";return;}
   if(file.size>120000){out.textContent="Verifier accepts text files up to 120 KB.";return;}
   if(!B||!B.verifyArtifact){out.textContent="Artifact verifier unavailable.";return;}
   out.textContent="Calling server artifact verifier...";
   try{
     var content=await file.text();
     var r=await B.verifyArtifact({
       work_order_id:"sardine-"+pr.id,
       expected_path:path,
       declared_path:$("#seArtifactPath",c).value.trim(),
       file_name:file.name,
       purpose:$("#seArtifactPurpose",c).value.trim(),
       naming_reason:$("#seArtifactWhy",c).value.trim(),
       content:content
     });
     x.artifactEvidence[ak(pr,path)]={verified:!!r.verified,score:r.score,artifact_id:r.artifact_id,request_id:r.request_id,content_hash:r.content_hash,purpose:$("#seArtifactPurpose",c).value.trim(),naming_reason:$("#seArtifactWhy",c).value.trim(),ts:Date.now()};
     S.save();out.textContent=(r.verified?"VERIFIED ":"NEEDS WORK ")+r.score+"%";
     CO.toast(r.verified?"Sardine artifact verified • "+r.score+"%":"Artifact needs another iteration • "+r.score+"%");
     if(r.verified)setTimeout(function(){close();S.render();},650);
   }catch(e){out.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };
}
function enhance(){
 var root=$("#view-sardine");if(!root)return;
 var pr=project(),x=state(),list=S.artifacts(pr);
 $$(".sardine-file",root).forEach(function(row){
   if(row.querySelector(".se-artifact-button"))return;
   var code=$("code",row);if(!code)return;
   var path=code.textContent.replace(/\s*✓\s*$/,"").trim(),idx=list.findIndex(function(a){return a[0]===path;});if(idx<0)return;
   var ev=x.artifactEvidence[ak(pr,path)]||{};
   row.classList.toggle("verified",!!ev.verified);
   if(ev.verified)code.textContent=path+" ✓";
   var b=document.createElement("button");b.className="se-artifact-button";b.textContent=ev.verified?"Re-verify file →":"Verify file →";b.onclick=function(){openArtifact(pr,idx);};row.appendChild(b);
 });
 var proof=$(".sardine-proof",root);
 if(proof&&!$(".se-artifact-progress",proof)){
   var box=document.createElement("div");box.className="se-artifact-progress";
   box.innerHTML='<span>VERIFIED PROJECT FILES</span><b>'+S.verifiedArtifacts(pr)+'/6</b><div><i style="width:'+Math.round(S.verifiedArtifacts(pr)/6*100)+'%"></i></div>';
   var files=$(".sardine-artifacts",proof);if(files)files.parentNode.insertBefore(box,files);
 }
 var conn=$("#sconnector",root);if(conn&&!S.graduated(pr)){conn.disabled=true;conn.title="Requires 14/14 graded assignments + 6/6 verified project files + blind defense ≥85";}
 if(S.graduated(pr)&&proof&&!$(".se-next-project",proof)){
   var n=document.createElement("button");n.className="se-next-project";n.textContent="Next Sardine project →";n.onclick=function(){x.project=(Number(x.project)+1)%S.projects.length;x.mode="mission";S.save();S.render();};proof.appendChild(n);
 }
}
var timer=null,obs=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(enhance,80);});
var target=$("#view-sardine");if(target)obs.observe(target,{subtree:true,childList:true});
document.addEventListener("odyssey:viewchange",function(e){if(e.detail&&e.detail.view==="sardine")setTimeout(enhance,100);});
setTimeout(enhance,350);
window.CloudOdysseySardineArtifacts={enhance:enhance,openArtifact:function(i){openArtifact(project(),Number(i)||0);},verified:function(){return S.verifiedArtifacts(project());}};
})();
const {api}=require("../_lib/http");
const db=require("../_lib/db");
const identity=require("../_lib/identity");

function txt(v,name,min,max){
  const x=String(v==null?"":v).trim();
  if(x.length<min||x.length>max){const e=new Error(name+" length must be "+min+"-"+max);e.statusCode=422;throw e;}
  return x;
}

module.exports=api(async(req,res,ctx)=>{
  if(!db.configured()) throw ctx.fail(503,"Persistence is not configured",{env:"DATABASE_URL",endpoint:"work-orders"});
  const actor=await identity.resolve(req);
  if(actor.authenticated)await identity.ensure(db,actor);

  if(req.method==="GET"){
    let rows;
    if(actor.authenticated){
      rows=await db.query(`select work_order_id,kind,title,status,payload,updated_at,created_at
        from odyssey_project_work_orders
        where tenant_id=$1 and user_id=$2
        order by updated_at desc limit 25`,[actor.tenant_id,actor.user_id]);
    }else{
      rows=await db.query(`select work_order_id,kind,title,status,payload,updated_at,created_at
        from odyssey_project_work_orders
        where tenant_id=$1 and client_id=$2 and user_id is null
        order by updated_at desc limit 25`,[actor.tenant_id,actor.client_id]);
    }
    return {body:{ok:true,request_id:ctx.requestId,identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id:actor.tenant_id},work_orders:rows}};
  }

  const body=await ctx.readJson(req,262144);
  const work_order_id=txt(body.work_order_id,"work_order_id",1,100);
  const kind=txt(body.kind,"kind",1,60);
  const title=txt(body.title,"title",1,240);
  const status=txt(body.status||"active","status",1,40);
  const payload=body.payload&&typeof body.payload==="object"&&!Array.isArray(body.payload)?body.payload:{};

  let rows;
  if(actor.authenticated){
    rows=await db.query(`insert into odyssey_project_work_orders
      (work_order_id,tenant_id,user_id,client_id,kind,title,status,payload)
      values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      on conflict (tenant_id,user_id,work_order_id) where user_id is not null
      do update set client_id=excluded.client_id,kind=excluded.kind,title=excluded.title,
        status=excluded.status,payload=excluded.payload,updated_at=now()
      returning work_order_id,kind,title,status,payload,updated_at,created_at`,
      [work_order_id,actor.tenant_id,actor.user_id,actor.client_id,kind,title,status,JSON.stringify(payload)]);
  }else{
    rows=await db.query(`insert into odyssey_project_work_orders
      (work_order_id,tenant_id,user_id,client_id,kind,title,status,payload)
      values ($1,$2,null,$3,$4,$5,$6,$7::jsonb)
      on conflict (tenant_id,client_id,work_order_id)
      do update set kind=excluded.kind,title=excluded.title,status=excluded.status,
        payload=excluded.payload,updated_at=now()
      returning work_order_id,kind,title,status,payload,updated_at,created_at`,
      [work_order_id,actor.tenant_id,actor.client_id,kind,title,status,JSON.stringify(payload)]);
  }
  return {body:{ok:true,request_id:ctx.requestId,work_order:rows[0],identity:{authenticated:actor.authenticated,user_id:actor.user_id,tenant_id:actor.tenant_id}}};
},{methods:["GET","PUT"]});

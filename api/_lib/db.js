let sqlPromise=null;
function configured(){return Boolean(process.env.DATABASE_URL);}
async function client(){
  if(!configured()) {
    const e=new Error("Persistence is not configured. Set DATABASE_URL to enable durable progress, event, assessment, and evidence storage.");
    e.statusCode=503; e.details={capability:"postgres",env:"DATABASE_URL"}; throw e;
  }
  if(!sqlPromise){
    sqlPromise=import("@neondatabase/serverless").then(({neon})=>neon(process.env.DATABASE_URL));
  }
  return sqlPromise;
}
async function query(text,params=[]){
  const sql=await client();
  return sql.query(text,params);
}
async function ping(){
  if(!configured()) return {configured:false,ok:false};
  try{
    const rows=await query("select now() as now, current_database() as database");
    return {configured:true,ok:true,database:rows[0]&&rows[0].database,now:rows[0]&&rows[0].now};
  }catch(e){return {configured:true,ok:false,error:e.message};}
}
module.exports={configured,query,ping};
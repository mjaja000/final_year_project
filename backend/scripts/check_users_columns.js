const pool = require('../src/config/database');
(async ()=>{
  try{
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;");
    console.log(res.rows);
  }catch(e){
    console.error('Query failed:', e.message || e);
  }finally{
    pool.end();
  }
})();
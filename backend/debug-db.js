const mysqlDB = require('./src/db/mysql');
(async()=>{
  try{
    await mysqlDB.init();
    const pool = mysqlDB.getPool();
    const [db] = await pool.query('SELECT DATABASE() as db');
    console.log('Current database:', db[0].db);
    const [tables]= await pool.query('SHOW TABLES');
    console.log('Tables:', tables);
    process.exit(0);
  }catch(e){ console.error('Err:', e); process.exit(1);} 
})();
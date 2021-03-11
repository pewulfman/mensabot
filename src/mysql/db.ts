import * as mysql from  'mysql'
import * as util  from  'util'
import * as log   from  '../discord/log'
import {configs as conf}  from  '../configs'

let pool = mysql.createPool({
	connectionLimit: 10,
	host     : conf.mysql.host,
	user     : conf.mysql.user,
	password : conf.mysql.password,
	database : conf.mysql.database,
	charset  : 'utf8mb4',
	timezone : 'Z'
})

class Pool {
  function getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
        log.error(err.message,err)
    }
    if (connection) {
      log.debug('Connected to the chatbot database.')
      connection.release()
    }
    return
  })
}

pool.query = util.promisify(pool.query)

// empty all data from db
pool.clean_db = async function() {
  await pool.query("delete from users");
  await pool.query("delete from members");
  await pool.query("delete from guilds");
}


pool.getOne = async function(sql, arr) {
  const rows = await pool.query(sql, arr);
  if (rows.length) {
    return rows[0];
  }
  return undefined;
}


pool.getGuild = async function(gid) {
  return await pool.getOne(`
    select cast(gid as char) as gid,
      name,
      cast(mensan_role as char) as mensan_role
    from guilds
    where gid = ?`, [gid]);
}


pool.getUser = async function(did) {
  return await pool.getOne(`
    select cast(did as char) as did,
      mid,
      discord_name,
      real_name,
      region,
      departement,
      email,
      state,
      validation_code,
      validation_trials
    from users
    where did = ?`, [did]);
}


pool.getMember = async function(gid, did) {
  return await pool.getOne(`
  select
    cast(gid as char) as gid,
    cast(did as char) as did,
    state
  from members
  where gid = ?
    and did = ?
`, [gid, did]);
}


/*
// close the database connection
db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
  */

module.exports = pool

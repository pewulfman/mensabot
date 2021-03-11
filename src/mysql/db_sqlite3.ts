import * as sqlite3 from 'sqlite3';
import * as util    from 'util'
import * as log     from '../discord/log';

// this is the db module using sqlite3
// add this dependency to package.json if you use it:
//     "sqlite3": "^4.2.0"

let db = new sqlite3.Database('./db/chatbot.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    log.debug('Connected to the chatbot database.');
});

db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// empty all data from db
db.clean_db = async function() {
  await db.run("delete from users");
  await db.run("delete from members");
  await db.run("delete from guilds");
  await db.run("vacuum");
}


db.getGuild = async function(gid) {
  return await db.get(`
    select cast(gid as text) as gid,
      name,
      cast(mensan_role as text) as mensan_role
    from guilds
    where gid = ?`, [gid]);
}

db.getUser = async function(did) {
  return await db.get(`
    select cast(did as text) as did,
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

db.getMember = async function(gid, did) {
  return await db.get(`
    select cast(gid as text) as gid,
      cast(did as text) as did,
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

module.exports = db;

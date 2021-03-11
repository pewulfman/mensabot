import * as db from './db';

// small utility script to clean the database from data
async function cleanMe() {
    await db.query("delete from members where did = 396752710487113729");
    await db.query("delete from users   where did = 396752710487113729");
}

cleanMe();

// db.clean_db();

// console.log("Database now empty");

const Discord = require('discord.js');
const client  = new Discord.Client();
const conf    = require('./configs');
const db      = require('./mods/db');
const fs      = require('fs');



client.once('ready', () => {
    console.log('Bot is connected to Discord');

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);
});


// take a guild: list all its members
function processOneGuild(guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");

    // check we know that guild
    db.get("select * from guilds where gid = ?", guild.id, (err, row) => {
        if (err) return console.log(err.message);

        if (row) return;
        
        db.run("insert into guilds(gid, name) values(?, ?)", [guild.id, guild.name], handlerr);
    })

    // we get the list of members of that guild
    guild.members.fetch()
        .then(processAllMembers)
        .catch(console.error)
}

// loop on member map
function processAllMembers(memberMap) {
    memberMap.forEach(checkMember)
}

// check that this member is inside our database
function checkMember(member) {
    // check we know that user
    db.get("select * from users where did = ?", member.user.id, (err, row) => {
        if (err) return console.error(err.message);

        if (! row) {
            // member is not here
            db.run("insert into users(did, discord_name) values(?, ?)", [member.user.id, member.user.username], handlerr)
        }
    });

    // check we have the user / guild relationship
    db.get("select * from members where gid = ? and did = ?", [member.guild.id, member.user.id], (err, row) => {
        if (err) {
          return console.error(err.message);
        }

        if (! row) {
            // member is not here
            db.run("insert into members(gid, did) values(?, ?)", [member.guild.id, member.user.id], handlerr)
        }
      
    })

    console.log(member.user.username + " (" + member.user.id + ")");
}


// handle errors
function handlerr(err) {
    if (err) {
        console.error(err.message);
    }
}


// recurrent tasks
setInterval(workloop, 1000);


function workloop() {
    // we look for a new user
    db.get("select * from users where state = 'new' and did = '396752710487113729' limit 1", [], (err, row) => {
        if (err) return console.error(err.message);

        if (! row) return;

        console.log(row);

        const msgWelcome = fs.readFileSync('./messages/welcome.txt', 'utf-8').replace('##username##', row.discord_name);
        // let user = client.users.cache.get(row.did);
        let user = client.users.cache.get('396752710487113729');
        console.log(user);
        user.send(msgWelcome);
        // db.run("update users set state = 'welcomed' where did = ?", [row.did]);
    })
}



// chat bot basic loop
client.on('message', message => {
    // console.log(message.content);
    // console.log(message);
    
    message.channel.guild.members.fetch()
        .then(displayMembers)
        .catch(console.error)
    
/*
    if (! message.author.bot) {
        message.channel.send("je répond au message de " + message.author.username)
    }
*/

});


client.login(conf.botToken);

const Discord = require('discord.js');
const client  = new Discord.Client();
const conf    = require('./configs');
const db      = require('./mods/db');



client.once('ready', () => {
    console.log('Ready!');

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);
});


// take a guild: list all its members
function processOneGuild(guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");
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
    db.get("select * from users where did = ?", member.user.id, (err, row) => {
        if (err) {
          return console.error(err.message);
        }

        if (! row) {
            // member is not here
            db.run("insert into users(did, discord_name) values(?, ?)", [member.user.id, member.user.username], function(err) {
                if (err) {
                  return console.log(err.message);
                }
                // get the last insert id
                console.log(`User has been inserted with rowid ${this.lastID}`);
              })
        }
      
    });
    console.log(member.user.username + " (" + member.user.id + ")");
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

import * as Discord from 'discord.js'
import {configs as conf} from '../configs'
import * as db         from '../mysql/db'
import * as fs         from 'fs'
import * as log        from './log'
import * as nodemailer from 'nodemailer'
import { PrismaClient } from '.prisma/client'
import { members } from '.prisma/client'

const client : Discord.Client = new Discord.Client({ ws: { intents: Discord.Intents.ALL }});
const prisma = new PrismaClient();


export function connect() { 
    client.login(conf.botToken); 
}

/// Function flow in this f*** bot

client.once('ready', () => {
    let user = client.user;
    if (user != null) {
    log.debug(`${user.tag} is connected to Discord`);
    }

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);
});

client.on('guildMemberAdd', reMember);
client.on('message', handleIncomingMessage);


/**
 * Take a guild and list all of its members
 * @param {Discord.Guild} guild 
 */
async function processOneGuild(guild : Discord.Guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");

    // check we know that guild
    //const checkGuild = await db.getGuild(guild.id);
    const checkGuild = await prisma.guild.findUnique(
       {where : { discordTag : guild.id}}
    )
    if (! checkGuild)
        log.error ("The bot doesn't know the guild: " + guild.name, guild)
    
    // list roles of guild
    guild.roles.cache.map(role => console.log('rôle:', '[', role.guild.name, ']', role.name, 'id:', role.id));

    // we get the list of members of that guild
    guild.members.fetch()
        .then(processAllMembers)
        .catch(console.error)
}

// loop on member map
function processAllMembers(memberMap : any) {
    memberMap.forEach(reMember)
}

/**
 * Store that member into DataBase, so that we remember that member.
 * @param {Discord.GuildMember} member
 */

//Parse existing member that are not in the database yet
// To rewrite
async function reMember(member : Discord.GuildMember) {
    // we don't care about bots
    if (member.user.bot) return;

    // check we know that user
    //let theUser = await db.getUser(member.user.id);
    let theUser = await prisma.members.findUnique({where:{discordTag:member.user.id}});
    if (! theUser) {
        // member is not here
        await prisma.members.create({
            data : {discordTag : member.user.id }
        })
        //query("insert into users(did, discord_name) values(?, ?)", [member.user.id, member.user.username]);
    }

    // we check if the member has already the mensan role
    if (member.roles.cache.has("Member"))
       //     db.query('update members set state="member" where gid = ? and did = ?', [member.guild.id, member.user.id]);
}


// welcome new users
export async function welcome(newUser,bot : Discord.ClientUser) {
    // we look for a new user
    // Bad design, call the function on new_user
    //const newUser = await db.getOne("select cast(did as char) as did, discord_name from users where state = 'new' limit 1", []);

   // if (! newUser) return;

    // compose welcome message
    const msgWelcome = fs.readFileSync('./messages/welcome.txt', 'utf-8')
        .replace(/##username##/g, newUser.discord_name)
        .replace(/##botname##/g, bot.username);

    // get Discord user
    let user = client.users.cache.get(newUser.did);
    if (! user) {
        log.error("Impossible de trouver l'utilisateur "+ newUser.did,user);
        return;
    }

    sendDirectMessage(user, msgWelcome);
    db.query("update users set state = 'welcomed' where did = ?", [user.id]);
}


// Sends message msg to user destUser. (with log)
function sendDirectMessage(destUser : Discord.User, msg : string) {
    destUser.send(msg);
    log.msgout(destUser.username + ' / ' + destUser.id, msg);
}


/**
 * This is the chatbot base loop
 * @param {Discord.Message} message
 */
async function handleIncomingMessage(message : Discord.Message, bot : Discord.ClientUser) {
    // check it is not our own message
    if (message.author.id == bot.id) return;

    // check if it is not a message from a bot
    if (message.author.bot) return;

    // we only reply to direct messages
    if (message.channel.type != 'dm') return;

    // logs
    // console.log(message);
    log.msgin(message.author.username + ' / ' + message.author.id, message.content);

    // Check if this is an authentified user
    const theUser = await prisma.members.findUnique ({
        where : {discordTag : message.author.id}});

    if (theUser) {
        sendDirectMessage(message.author, "Bonjour, je n'ai rien d'autre à vous dire. Revenez dans quelques jours quand je serais plus locace.");
        return;
    }

    const pendingMember = await prisma.pendingMembers.findUnique ({
        where : {discordTag : message.author.id}});

    // check if this is a user waiting for authentification
    if (! pendingMember) {
        // Unknow member, waiting for a mensa member
        // we are expecting the number
        const mensaTag = parseInt(message.content);
        if (isNaN(mensaTag) || (mensaTag < 1)) {
            sendDirectMessage(message.author, "Je m'attendais à votre numéro de Mensan. Pourriez-vous me le donner ?");
            return;
        }


        // check if we already have that number
        const checkUser = await prisma.members.findUnique ({
            where: {mensaTag}
        });
        if (checkUser) {
            if (checkUser.discordTag == message.author.id) {
                sendDirectMessage(message.author, "Vous êtes déjà authentifié");
                await prisma.pendingMembers.delete ({where:{mensaTag}})
                return;
            }
            sendDirectMessage(message.author, "Ce numéro de Mensan est déjà dans ma base de données, mais il est attribué à un autre utilisateur. Désolé, mais je ne peux pas traiter votre demande.");
            return;
        }

        pendingMember = getMemberInfo (mensaTag);
        new_code      = create_new_code();
        sendCode (pendingMember,new_code);
        // we store the user in the pending member
        prisma.pendingMembers.create (data:{pendingMember});

        sendDirectMessage(message.author, "J'ai bien enregistré ton numéro d'adhérant: **" + mensaTag + "**"
            + "\nMerci de patienter pendant que je vérifie ton identité dans l'annuaire de l'association.");
        return;
    }

    //the code was already sent
    else {

        // we are expecting a validation code
        const vcode = message.content.trim().replace(/[^0-9]/g, '');
        if (vcode.length != 6) {
            sendDirectMessage(message.author, "Je n'ai pas compris votre code de validation. Pourriez-vous me le redonner ?\n"
                + "Il s'agit d'un code à 6 chiffres qui vous a été envoyé par email.");
            return;
        }

        // maximum 3 trials
        if (pendingMember.trials > 2) {
            sendDirectMessage(message.author, "Vous avez déjà essayé 3 fois de valider votre inscription.\n"
                + "Merci de contacter un administrateur du serveur pour qu'il vous valide manuellement.");
            return;
        }
        // we check the validation code is good
        if (pendingMember.code == vcode) {
            //move user from pending member Table to member Table
            await prisma.members.create ({
                data: {
                    name : pendingMember.name,
                    firstname : pendingMember.firstname ,
                    mensaTag  : pendingMember.mensaTag,
                    discordTag : pendingMember.discordTag,
                    membership : pendingMember.membership,
                }
            })
            
            prisma.members.delete({where:pendingMember})

            sendDirectMessage(message.author, "Félicitation, ton authentification est maintenant terminée. Tu as désormais accès à la catégorie \"GÉNÉRAL\" du serveur."
                + "\n\nCependant, cette catégorie ne représente qu'une fraction du serveur. Afin de parfaire ton inscription et débloquer l’accès à l'entièreté du serveur,"
                + " **je t'invite à venir te présenter dans le salon #présentation.** Pour ce faire, merci de compléter le modèle ci-dissous et de le poster dans le salon dédié"
                + " (la présentation des autres membres apparaîtra en même temps que tu publiera la tienne) :"
                + "\n\n__[prénom] [âge]__"
                + "\n__[profession]__"
                + "\n__[Quelques mots sur toi. Par exemple : depuis quand es-tu à Mensa, ton parcours, tes passions dans la vie, etc]__"
                + "\n\nÀ bientôt :slight_smile:");
            return;

        } else {
            sendDirectMessage(message.author, "Votre code de validation ne semble pas être le bon.\n"
                +"Ré-essayez, ou bien contactez un administrateur du serveur, pour voir ce qu'il peut faire.");
            prisma.pendingMembers.update({where:{id:pendingMember.id},data:{trials : pendingMember.trials + 1}});
        }
    }
}


/**
 * We get one member that should receive a validation code
 * and process it
 */
export async function sendCode() {
    // log.debug("Any new user?");
    const newUser = await db.getOne(
       `select cast(did as char) as did
        from users
        where mid is not null
          and (state = 'new' or state = 'welcomed' or state = 'found')
        limit 1`);
    if (newUser)
        processNewMensan(newUser.did);
}


async function processNewMensan(did) {

    // handling lock
    if (bot.isProcessingNewMember) {
        log.debug("Bot is already browsing the web ...");
        return;
    }
    bot.isProcessingNewMember = true;

    const rowUser = await db.getUser(did);

    // get discord user
    let discordUser = client.users.cache.get(rowUser.did);
    if (! discordUser) {
        log.error("Impossible de trouver l'utilisateur "+ rowUser.did + " / " + rowUser.mid);
        bot.isProcessingNewMember = false;
        return;
    }

    if (rowUser.validation_code) {
        // we only need to send the code via email
        sendValidationCode(rowUser, discordUser);
    } else {
        // we get member info + generate validation code + send code
        getMemberInfo(rowUser, discordUser);
    }
}




/**
 * Generate the validation code for the user
 * @param {*} rowUser 
 * @param {Discord.User} discordUser 
 */
async function generateValidationCode(rowUser, discordUser) {

    // do we have the email
    if (! rowUser.email) {
        sendDirectMessage(discordUser, "Ah mince, votre adresse email n'est pas présente dans l'annuaire des membres de Mensa."
            + "\nMerci de contacter un des administrateurs du serveur pour valider **manuellement** votre état de membre de Mensa.");
        db.query("update users set state = 'err_no_mail' where did = ?", [rowUser.did]);

        bot.isProcessingNewMember = false;
        return;
    }

    // we create the validation code
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    rowUser.validation_code = ''
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10);

    db.query("update users set validation_code = ? where mid = ?", [rowUser.validation_code, rowUser.mid])

    sendValidationCode(rowUser, discordUser);
}


// send validation code via email
function sendValidationCode(rowUser, discordUser) {
    // send the email with validation code
    const transporter = nodemailer.createTransport({
        host: conf.smtp.host,
        port: 465,  //
        secure: true, // true for 465, false for other ports
        auth: {
            user: conf.smtp.user,
            pass: conf.smtp.password
        }
    });

    const msgWelcome = fs.readFileSync('./messages/email_validation_code.txt', 'utf-8')
        .replace(/##real_name##/g,      rowUser.real_name)
        .replace(/##validationCode##/g, rowUser.validation_code)
        .replace(/##botAdminName##/g,   conf.botAdmin.name)
        .replace(/##botAdminEmail##/g,  conf.botAdmin.email);

    const mailOptions = {
        from:    'MensaBot <' + conf.botAdmin.email + '>',
        to:      rowUser.email,
        subject: 'Votre code de confirmation MensaBot Discord',
        text:    msgWelcome
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log("Error sending email to", rowUser, error);
            bot.isProcessingNewMember = false;
        } else {
            console.log('Email sent: ' + info.response);
            db.query("update users set state = 'vcode_sent' where mid = ?", [rowUser.mid]);
            sendDirectMessage(discordUser, "Un code de validation vient d'être envoyé à ton adresse email."
               + "\nIl ne te reste plus qu'à le recopier ici-même.");
            bot.isProcessingNewMember = false;
        }
    });
}


/**
 * We give the discord roles to all who deserve it
 */
export async function promote(user:members) {
    // we fetch all roles that should be added to the member
    const roles = await prisma.guild.findMany({select:{discordTag:true,roleTag:true}});

    // log.debug(roles);
    roles.map(role => giveRoleToMember(user,role) );
}

/**
 * Gives all mensa roles for each guild the user is in
 * @param {integer} did : discord id of the user to promote
 */
async function giveRoleToMember(user:members,row:{discordTag:string,roleTag:string}) {
    // we don't get the discord user
    // because discord users cannot have roles
    // it's only members who can

    // console.log(row);

    const guild = client.guilds.cache.get(row.discordTag);
    if (! guild) {
        log.error("Error404: Guild " + row.discordTag + " not found !!!",guild);
        return;
    }
    // console.log('==== The Guild ===\n', guild);

    const member = guild.members.cache.get(user.discordTag);
    if (! member) {
        log.error("Error404: Member " + user.discordTag + " not found in guild " + guild.name,member);
        return;
    }
    // console.log('=== The Member ===\n', member);

    // check if bot hasPermission(['MANAGE_ROLES'])
    const bot_in_guild = guild.me;
    if ( ! bot_in_guild) {log.error ("Bot is not a member of guild " + guild.name,guild)}
    else if ( ! bot_in_guild.hasPermission('MANAGE_ROLES')) {
        log.error("Bot doesn't have role permissions on server " + guild.name, guild);
        return;
    }

    const discordRole = guild.roles.cache.get(row.roleTag)
    if (! discordRole) {
        log.error("Role " + row.roleTag + " not found in guild " + guild.name,guild);
        return;
    }
    // console.log('=== The Role ===\n', discordRole);
        
    member.roles.add(discordRole)
        .then(() => {
            sendDirectMessage(member.user, "Je viens de vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**");
        })
        
        .catch((err) => {
            log.error('Error trying to give role ' + discordRole.name
                 + ' to ' + member.user.username
                 + ' on server ' + guild.name
                 + ' with error: ' +  err.message,err);

            console.log(member.roles.cache);
        });
}

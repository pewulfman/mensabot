import {GuildMember, Message, Guild} from 'discord.js'
import * as Sentry from "@sentry/node";
import * as mensafr from '../crawler/mensafr'
import * as fs         from 'fs'

import { client } from './client.js'
import { prisma } from '../postgre'
import { sendValidationUrl } from '../mailer';
import { generateCode, generateUrl } from '../auth';


export async function newGuild (guild : Guild) {
    const message = fs.readFileSync('./messages/newGuild.txt', 'utf-8');
    guild.owner?.send(message);
}

export async function handleIncomingMessage(message : Message) {
    const bot = client.user;
    if (! bot) { throw Error ();}

    // check it is not our own message
    if (message.author.id == bot.id) return;

    // check if it is not a message from a bot
    if (message.author.bot) return;

    // we only reply to direct messages
    if (message.channel.type != 'dm') return;

    // logs
    // console.log(message);
    //log.msgin(message.author.username + ' / ' + message.author.id, message.content);

    // Check if this is an authentified user
    const theUser = await prisma.members.findUnique ({
        where : {discordTag : message.author.tag}});

    if (theUser) {
        message.author.send("Bonjour, je vous ai déjà authentifier, je n'ai plus rien à faire");
        return;
    }

    const pendingMember = await prisma.pendingMembers.findUnique ({
        where : {discordTag : message.author.tag}});

    // check if this is a user waiting for authentification
    if (pendingMember) {
        message.author.send("Je vous ai envoyer un mail pour vérifier votre identiter, vérifiez votre boite mail.")
    }
    
    // Unknow member, waiting for a mensa member
    const mensaId = parseInt(message.content);
    // we are expecting the number
    if (isNaN(mensaId) || (mensaId < 1)) {
        message.author.send("Je m'attendais à votre numéro de Mensan. Pourriez-vous me le donner ?");
        return;
    }


    // check if we already have that number
    const checkUser = await prisma.members.findUnique ({
        where: {mensaId}
    });
    if (checkUser) {
        if (checkUser.discordTag == message.author.tag) {
            //Weird case since we didn't find checkUser using his Tag
            message.author.send ("Vous êtes déjà authentifié");
            prisma.pendingMembers.delete ({where:{mensaId}})
            return;
        }
        message.author.send("Un autre utilisateur est déjà authentifier avec ce numero. S'il y a un soucis, veuillez contacter un administrateur");
        return;
    }


    try {
        const memberInfo = await mensafr.getMemberInfo (mensaId,undefined);
        const new_code   = generateCode () ;
        const new_url    = generateUrl (mensaId,new_code);
        sendValidationUrl (memberInfo.name,memberInfo.email,new_url);

        // we store the user in the pending member
        await prisma.pendingMembers.create ({
            data:{
                name : memberInfo.name,
                email : memberInfo.email,
                region : memberInfo.region,
                mensaId,
                discordId  : message.author.id,
                discordTag : message.author.tag,
                membership : memberInfo.membership,
                code : new_code,
                trials : 0,
                inter : false
            }});

        message.author.send("J'ai bien enregistrer ta demande. Tu devrais recevoir un mail contenant un lien pour finaliser ton authentification");
        return;
    } catch (err) {
        let id = Sentry.captureException(err);
        message.author.send(`Il y a eu un soucis. Re-essaie et si ça persiste, tu peux contacter les admins en renseignant l'erreur ${id}`);

    }
}


export async function welcomeUser(member : GuildMember) {

    console.log (`welcoming user ${member.user.tag}`);
    // we don't care about bots
    if (member.user.bot) return;

    // check we know that user
    let theUser = await prisma.members.findUnique({where:{discordId:member.user.id}});
    if (theUser) return;

    const message = fs.readFileSync('./messages/welcome.txt', 'utf-8')
        .replace(/##username##/g, member.user.username)
        .replace(/##guild##/g,    member.guild.name)

    member.send (message);

}



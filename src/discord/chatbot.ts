import {GuildMember, Message} from 'discord.js'
import * as mensafr from '../crawler/mensafr'
import * as fs         from 'fs'

import { client } from './client.js'
import { prisma } from '../postgre'
import { sendValidationUrl } from '../mailer';
import { generateCode, generateUrl } from '../auth';


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
        where : {discordTag : message.author.id}});

    if (theUser) {
        message.author.send("Bonjour, je vous ai déjà authentifier, je n'ai plus rien à faire");
    }

    const pendingMember = await prisma.pendingMembers.findUnique ({
        where : {discordTag : message.author.id}});

    // check if this is a user waiting for authentification
    if (pendingMember) {
        message.author.send("Je vous ai envoyer un mail pour vérifier votre identiter, vérifiez votre boite mail.")
    }
    
    // Unknow member, waiting for a mensa member
    const mensaTag = parseInt(message.content);
    // we are expecting the number
    if (isNaN(mensaTag) || (mensaTag < 1)) {
        message.author.send("Je m'attendais à votre numéro de Mensan. Pourriez-vous me le donner ?");
        return;
    }


    // check if we already have that number
    const checkUser = await prisma.members.findUnique ({
        where: {mensaTag}
    });
    if (checkUser) {
        if (checkUser.discordTag == message.author.id) {
            //Weird case since we didn't find checkUser using his Tag
            message.author.send ("Vous êtes déjà authentifié");
            prisma.pendingMembers.delete ({where:{mensaTag}})
            return;
        }
        message.author.send("Un autre utilisateur est déjà authentifier avec ce numero. S'il y a un soucis, veuillez contacter un administrateur");
        return;
    }



    const memberInfo = await mensafr.getMemberInfo (mensaTag,undefined);
    const new_code   = generateCode () ;
    const new_url    = generateUrl (mensaTag,new_code);
    sendValidationUrl (memberInfo.name,memberInfo.email,new_url);

    // we store the user in the pending member
    prisma.pendingMembers.create ({
        data:{
            name : memberInfo.name,
            email : memberInfo.email,
            region : memberInfo.region,
            mensaTag,
            discordTag : message.author.id,
            membership : memberInfo.membership,
            code : new_code,
            trials : 0,
            inter : false
        }});

    message.author.send("J'ai bien enregistrer ta demande. Tu devrais recevoir un mail contenant un lien pour finaliser ton authentification");
    return;
}


export async function reMember(member : GuildMember) {
    // we don't care about bots
    if (member.user.bot) return;

    // check we know that user
    let theUser = await prisma.members.findUnique({where:{discordTag:member.user.id}});
    if (theUser) return;

    const message = fs.readFileSync('./messages/welcome.txt', 'utf-8')
        .replace(/##username##/g, member.nickname || 'anonymous')
        .replace(/##guild##/g,    member.guild.name)

    member.send (message);

}



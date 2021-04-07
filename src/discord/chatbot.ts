import {Message, Guild} from 'discord.js'
import * as Sentry from "@sentry/node";
import * as mensafr from '../crawler/mensafr'
import * as fs         from 'fs'

import { client } from './client.js'
import { prisma } from '../postgre'
import { sendValidationUrl } from '../mailer';
import { generateCode, generateUrl } from '../auth';


export async function newGuild (guild : Guild) {
    const message = fs.readFileSync('./messages/newGuild.txt', 'utf-8');
    try {
        guild.owner!.send(message);
    } catch (e) {
        Sentry.captureException (e);
    }
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
    const theUser = await prisma.members.findFirst ({
        where : {discord: {discordId : message.author.id}},
        include : {discord : true}
    })

    if (theUser && theUser.discord) {
        //membre en attente d'authentification
        if (theUser.discord.code) message.author.send("Je vous ai envoyer un mail pour vérifier votre identiter, vérifiez votre boite mail.")
        //membre authentifié
        else message.author.send("Bonjour, je vous ai déjà authentifier, je n'ai plus rien à faire");
        return;
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
        where: {mensaId},
        include : {discord:true},
    });
    if (checkUser && checkUser.discord) {
        message.author.send("Un autre utilisateur est déjà authentifier avec ce numero. S'il y a un soucis, veuillez contacter un administrateur");
        return;
    }


    try {
        const memberInfo = await mensafr.getMemberInfo (mensaId);
        const new_code   = generateCode () ;
        const new_url    = generateUrl (mensaId,new_code);
        sendValidationUrl (memberInfo.name,memberInfo.email,new_url);

        // we store the user in the pending member
        await prisma.members.create ({
            data:{
                name       : memberInfo.name,
                email      : memberInfo.email,
                region     : memberInfo.region,
                mensaId,
                membership : memberInfo.membership,
                inter      : false,
                discord    : {
                    create : {
                        discordId : message.author.id,
                        code      : new_code,
                    }
                }
            },
        });

        message.author.send("J'ai bien enregistrer ta demande. Tu devrais recevoir un mail contenant un lien pour finaliser ton authentification");
        return;
    } catch (err) {
        let id = Sentry.captureException(err);
        message.author.send(`Il y a eu un soucis. Re-essaie et si ça persiste, tu peux contacter les admins en renseignant l'erreur ${id}`);
        console.log (`error ${id} sended to Senty`)

    }
}



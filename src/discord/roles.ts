import * as Discord from 'discord.js'
import * as Sentry from "@sentry/node";

import { client } from './client'
import { prisma } from '../postgre'
import { guild } from '.prisma/client';


/**
 * We give the discord roles to all who deserve it
 */


export async function promote(discordId : string, discordTag:string) {

    console.log (`Promoting user ${discordTag}`)

    let user = await client.users.resolve (discordId);
    console.log (user);
    if (user == null) console.log (`user not found`)
    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user!) != null
    ).keyArray ()
    console.log(guild_lst);

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({where:{discordId:{in : guild_lst}}});

    // log.debug(roles);
    guilds_info.map(guild_info => promoteInGuild(user!,guild_info) );
}

async function promoteInGuild(user:Discord.User,guild_info:guild) {

    console.log (`Give roles ${guild_info.roleTag} to user ${user.username} in server ${guild_info.discordId}`)
    const guild = await client.guilds.fetch(guild_info.discordId);
    if (! guild) {
        //log.error("Error404: Guild " + guild_info.discordTag + " not found !!!",guild);
        console.log (`Guild ${guild_info.name} not found`)
        return;
    }

    const member = await guild.members.fetch(user.id);
    if (! member) {
        //log.error("Error404: Member " + user.id + " not found in guild " + guild.name,member);
        console.log (`Member ${user.username} not in guild ${guild_info.name}`)
        return;
    }

    const discordRole = await guild.roles.fetch(guild_info.roleTag);
    if (! discordRole) {
        //log.error("Role " + guild_info.roleTag + " not found in guild " + guild.name,guild);
        console.log (`Role ${guild_info.roleTag} not found in guild`)
        return;
    }
    // console.log('=== The Role ===\n', discordRole);
    try {
        member.roles.add(discordRole)
            .then(() => {
                member.send ("Je viens de vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**");
            });        
    } catch (e) {
        let id = Sentry.captureException(e);
        guild.owner?.send(`Error trying to give role to member. be sure that I have the "give role" permission and that my role is above the "<auth>" role that I should give. If the problem persist, contact the admin and give the error ${id}`)
    }
}

export async function demote(discordTag:string) {

    let user = await client.users.fetch (discordTag); // Todo: get user from discordTag

    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user) != null
    ).keyArray ()

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({select:{discordId:true,roleTag:true},where:{discordId:{in : guild_lst}}});

    // log.debug(roles);
    guilds_info.map(guild_info => demoteInGuild(user,guild_info) );
}

async function demoteInGuild(user:Discord.User,guild_info:{discordId:string,roleTag:string}) {

    const guild = await client.guilds.fetch(guild_info.discordId);
    if (! guild) {
        //log.error("Error404: Guild " + guild_info.discordTag + " not found !!!",guild);
        return;
    }

    const member = await guild.members.fetch(user.id);
    if (! member) {
        //log.error("Error404: Member " + user.id + " not found in guild " + guild.name,member);
        return;
    }
    // console.log('=== The Member ===\n', member);

    // check if bot hasPermission(['MANAGE_ROLES'])
    const bot_in_guild = guild.me;
    if ( ! bot_in_guild) {throw Error}
    else if ( ! bot_in_guild.hasPermission('MANAGE_ROLES')) {
        //log.error("Bot doesn't have role permissions on server " + guild.name, guild);
        return;
    }

    const discordRole = await guild.roles.fetch(guild_info.roleTag);
    if (! discordRole) {
        //log.error("Role " + guild_info.roleTag + " not found in guild " + guild.name,guild);
        return;
    }
    // console.log('=== The Role ===\n', discordRole);
        
    member.roles.remove(discordRole)
        .then(() => {
            member.send ("Je viens de vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**");
        })
        
        .catch((_err) => {
            //log.error('Error trying to give role ' + discordRole.name
            //     + ' to ' + member.user.username
            ///     + ' on server ' + guild.name
            //     + ' with error: ' +  err.message,err);

            console.log(member.roles.cache);
        });
}
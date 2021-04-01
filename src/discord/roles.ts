import * as Discord from 'discord.js'

import { client } from './client'
import { prisma } from '../postgre'


/**
 * We give the discord roles to all who deserve it
 */


export async function promote(discordTag:string) {

    let user = await client.users.fetch (discordTag); // Todo: get user from discordTag

    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user) != null
    ).keyArray ()

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({select:{discordTag:true,roleTag:true},where:{discordTag:{in : guild_lst}}});

    // log.debug(roles);
    guilds_info.map(guild_info => promoteInGuild(user,guild_info) );
}

async function promoteInGuild(user:Discord.User,guild_info:{discordTag:string,roleTag:string}) {

    const guild = await client.guilds.fetch(guild_info.discordTag);
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
        
    member.roles.add(discordRole)
        .then(() => {
            member.send ("Je viens de vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**");
        });        
}

export async function demote(discordTag:string) {

    let user = await client.users.fetch (discordTag); // Todo: get user from discordTag

    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user) != null
    ).keyArray ()

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({select:{discordTag:true,roleTag:true},where:{discordTag:{in : guild_lst}}});

    // log.debug(roles);
    guilds_info.map(guild_info => demoteInGuild(user,guild_info) );
}

async function demoteInGuild(user:Discord.User,guild_info:{discordTag:string,roleTag:string}) {

    const guild = await client.guilds.fetch(guild_info.discordTag);
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
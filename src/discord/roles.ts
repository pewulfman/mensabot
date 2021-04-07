import * as Discord from 'discord.js'
import * as Sentry from "@sentry/node"

import { client } from './client'
import { prisma } from '../postgre'
import { guild } from '.prisma/client'
import * as Guild from './guild'


/**
 * We give the discord roles to all who deserve it
 */


export async function promote(discordId : string, discordTag:string) {

    console.log (`Promoting user ${discordTag}`)

    let user = await client.users.resolve (discordId);
    if (!user) Sentry.captureException (new Error (`User with ${discordId} not found on discord`));
    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user!) != null
    ).keyArray ()

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({where:{discordId:{in : guild_lst}}});

    console.log (`${user!.username} is a member of ${guilds_info.map (guild_info => guild_info.name)}`)
    guilds_info.map(guild_info => promoteInGuild(user!,guild_info) );
}

export async function promoteInGuild(user:Discord.User,guild_info:guild) {

    console.log (`Promote user ${user.username} in Guild ${guild_info.name}`);
    const guild = await client.guilds.fetch(guild_info.discordId);
    if (! guild) {
        console.log (`Guild ${guild_info.name} not found`)
        return;
    }

    const member = await guild.members.fetch(user.id);
    if (! member) {
        console.log (`Member ${user.username} not in guild ${guild_info.name}`)
        return;
    }

    const discordRole = await guild.roles.fetch(guild_info.roleId);
    if (! discordRole) {
        console.log (`Role ${guild_info.roleId} not found in guild`)
        guild.owner!.send (`Warning : I can't find the authenticated role. If you have deleted it, try install the bot again`)
        return;
    }

    if ( ! guild.me!.hasPermission('MANAGE_ROLES')) {
        console.log (`I don't have the permission on the guild ${guild.name}`)
        guild.owner!.send (`Warning : I tried to give the correct role to a member but I don't have the permission. Please, go to integration and set the "manage roles permission`)
        return;
    }


    if (! await checkOrder(discordRole,discordRole)){
        console.log (`The role order is incorrect`)
        return;
    }

    console.log (`Give roles ${discordRole.name} to user ${user.username} in server ${guild.name}`)
    try {
        await member.roles.add(discordRole);
        member.send (`Je viens de vous donner le rôle **${discordRole.name}** sur le serveur **${guild.name}**`);
    } catch (e) {
        let id = Sentry.captureException(e);
        guild.owner!.send(`Error trying to give role to member. If the problem persist, contact the admin and give the error ${id}`)
        user.send (`Je n'ai pas pu te donner le role **${discordRole.name}** sur le serveur **{$guild.name}**. L'admin a été averti, il devrait résoudre le problème sous peu`)
        console.log (`Issue ${id} forwarded to Sentry`)
    }
}

export async function demote(discordId : string, discordTag:string) {

    console.log (`Demoting user ${discordTag}`)

    let user = await client.users.resolve (discordId);
    if (!user) Sentry.captureException (new Error (`User with ${discordId} not found on discord`));
    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user!) != null
    ).keyArray ()

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({where:{discordId:{in : guild_lst}}});

    console.log (`${user!.username} is a member of ${guilds_info.map (guild_info => guild_info.name)}`)
    guilds_info.map(guild_info => demoteInGuild(user!,guild_info) );
}

export async function demoteInGuild(user:Discord.User,guild_info:guild) {

    console.log (`Demote user ${user.username} in Guild ${guild_info.name}`);
    const guild = await client.guilds.fetch(guild_info.discordId);
    if (! guild) {
        console.log (`Guild ${guild_info.name} not found`)
        return;
    }

    const member = await guild.members.fetch(user.id);
    if (! member) {
        console.log (`Member ${user.username} not in guild ${guild_info.name}`)
        return;
    }

    const discordRole = await guild.roles.fetch(guild_info.roleId);
    if (! discordRole) {
        console.log (`Role ${guild_info.roleId} not found in guild`)
        guild.owner!.send (`Warning : I can't find the authenticated role. If you have deleted it, try install the bot again`)
        return;
    }

    if ( ! guild.me!.hasPermission('MANAGE_ROLES')) {
        console.log (`I don't have the permission on the guild ${guild.name}`)
        guild.owner!.send (`Warning : I tried to give the correct role to a member but I don't have the permission. Please, go to integration and set the "manage roles permission`)
        return;
    }


    if (! await checkOrder(discordRole,discordRole)){
        console.log (`The role order is incorrect`)
        return;
    }

    console.log (`Give roles ${discordRole.name} to user ${user.username} in server ${guild.name}`)
    try {
        await member.roles.remove(discordRole);
        member.send (`Je viens de vous retirer le rôle **${discordRole.name}** sur le serveur **${guild.name}**`);
    } catch (e) {
        let id = Sentry.captureException(e);
        guild.owner!.send(`Error trying to remove role from member. If the problem persist, contact the admin and give the error ${id}`)
        console.log (`Issue ${id} forwarded to Sentry`)
    }
}

//warn the user when the order of bot vs manage role is reverse
export async function checkOrder (oldRole : Discord.Role, newRole : Discord.Role) {
    //check that we updated the bot role
    if (newRole.name == (await client.fetchApplication()).name) {
        console.log (`catch role update with role ${oldRole} => ${newRole}`)

        let guild = newRole.guild;
        let guild_info = await prisma.guild.findUnique ({where:{discordId:guild.id}});
        if (! guild_info) { 
            console.log (`Guild ${guild.id} not found`);
            return false
        };
        let managed_role = await guild.roles.fetch(guild_info.roleId);
        if (! managed_role) { 
            guild.owner!.send ('You deleted the authorized role, process to setup the bot again');
            return false
        }
        if (managed_role.rawPosition >= newRole.rawPosition) {
            guild.owner!.send (`The order of ${newRole.name} role and ${managed_role.name} is wrong.\n Be sure to leave that ${newRole.name} appears before ${managed_role.name} in the role order`)
            return false
        } 
        Guild.process(guild) 
    }
    return true
}
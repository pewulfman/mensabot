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
        //log.error("Error404: Member " + user.id + " not found in guild " + guild.name,member);
        console.log (`Member ${user.username} not in guild ${guild_info.name}`)
        return;
    }

    const discordRole = await guild.roles.fetch(guild_info.roleId);
    if (! discordRole) {
        //log.error("Role " + guild_info.roleTag + " not found in guild " + guild.name,guild);
        console.log (`Role ${guild_info.roleId} not found in guild`)
        return;
    }
    console.log (`Give roles ${discordRole.name} to user ${user.username} in server ${guild.name}`)
    try {
        await member.roles.add(discordRole);
        member.send (`Je viens de vous donner le rôle **${discordRole.name}** sur le serveur **${guild.name}**`);
    } catch (e) {
        let id = Sentry.captureException(e);
        let owner = await guild.members.fetch (guild.ownerID);
        owner.send(`Error trying to give role to member. be sure that I have the "give role" permission and that my role is above the "<auth>" role that I should give. If the problem persist, contact the admin and give the error ${id}`)
        user.send (`Je n'ai pas pu te donner le role **${discordRole.name}** sur le serveur **{$guild.name}**. L'admin a été averti, il devrait résoudre le problème sous peu`)
        console.log (`Issue ${id} forwarded to Sentry`)
    }
}

export async function demote(discordTag:string) {

    let user = await client.users.fetch (discordTag); // Todo: get user from discordTag

    // get list of guild the user is part of.
    let guild_lst = client.guilds.cache.filter (
        guild => guild.members.resolve (user) != null
    ).keyArray ()

    // we fetch all roles that we know
    let guilds_info = await prisma.guild.findMany({select:{discordId:true,roleId:true},where:{discordId:{in : guild_lst}}});

    // log.debug(roles);
    guilds_info.map(guild_info => demoteInGuild(user,guild_info) );
}

async function demoteInGuild(user:Discord.User,guild_info:{discordId:string,roleId:string}) {

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

    const discordRole = await guild.roles.fetch(guild_info.roleId);
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

//warn the user when the order of bot vs manage role is reverse
export async function checkOrder (oldRole : Discord.Role, newRole : Discord.Role) {
    //check that we updated the bot role
    if (newRole.name == (await client.fetchApplication()).name) {
        console.log (`catch role update with role ${oldRole} => ${newRole}`)

        let guild = newRole.guild;
        let guild_info = await prisma.guild.findUnique ({where:{discordId:guild.id}});
        if (! guild_info) { 
            console.log (`Guild ${guild.id} not found`);
            return 
        };
        let managed_role = await guild.roles.fetch(guild_info.roleId);
        if (! managed_role) { 
            guild.owner!.send ('You deleted the authorized role, process to setup the bot again');
            return
        }
        if (managed_role.rawPosition >= newRole.rawPosition) {
            guild.owner!.send (`The order of ${newRole.name} role and ${managed_role.name} is wrong.\n Be sure to leave that ${newRole.name} appears before ${managed_role.name} in the role order`)
        } 
    }
}
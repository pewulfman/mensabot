import { guild } from ".prisma/client";
import * as discord from "discord.js";
import * as fs         from 'fs'
import { roles } from ".";
import { prisma } from "../postgre";

export async function process (guild : discord.Guild) {
    let guild_info = await prisma.guild.findUnique({where:{discordId:guild.id}})
    if (! guild_info) { 
        throw new Error (`Processing guild ${guild.name} while not in db`);
    }
    let members = await guild.members.fetch();
    members.forEach(m => updateMembership(m,guild_info!))
}

async function updateMembership (member : discord.GuildMember, guild_info : guild) {
    let user_in_db = await prisma.members.findFirst({where:{discord:{discordId:member.user.id}}})
    if ( ! user_in_db) {
        welcomeMember (member);
        return
    }
    if (user_in_db.membership) {
        await roles.promoteInGuild(member.user,guild_info);
    } else {
        await roles.demoteInGuild(member.user,guild_info);
    }
}

export async function newMember (member : discord.GuildMember) {
    let user_in_db = await prisma.members.findFirst({where:{discord:{discordId:member.user.id}}})
    if ( ! user_in_db) {
        welcomeMember (member);
        return
    }
    let guild_info = await prisma.guild.findUnique({where:{discordId:member.guild.id}})
    if (!guild_info) {
        member.guild.owner!.send (`I don't have your guild in my db. You probably, haven't done seting up your guild yet`)
        return;
    }
    if (user_in_db.membership) {
        await roles.promoteInGuild(member.user,guild_info);
    } else {
        await roles.demoteInGuild(member.user,guild_info);
    }
}

async function welcomeMember (member : discord.GuildMember) {
    const message = fs.readFileSync('./messages/welcome.txt', 'utf-8')
        .replace(/##username##/g, member.user.username)
        .replace(/##guild##/g,    member.guild.name)

    member.send (message);

}


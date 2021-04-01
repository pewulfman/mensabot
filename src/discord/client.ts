import * as Discord from 'discord.js'

export const client : Discord.Client = new Discord.Client({ ws: { intents: Discord.Intents.ALL }});

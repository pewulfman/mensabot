import { Guild } from 'discord.js';
import { Request, Response } from 'express';
import { client, roles } from '../../discord';
import { prisma } from '../../postgre';
import { CrudController } from './CrudController';

export class SetupController extends CrudController {
    public async create(req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response): Promise<void> {
        console.log ("post:" + req.originalUrl);
        let guild_id   = req.body.guild_id;
        console.log (guild_id);
        console.log (req.body);
        let role_id    = req.body.role_id;
        let guild = await client.guilds.fetch(guild_id);
        console.log(role_id)

        await prisma.guild.create(
            {data: {
                name      : guild.name,
                discordId : guild.id,
                roleId    : role_id,
            }}
        )
        let app_name = (await client.fetchApplication()).name;
        res.send(`Setup done. One last thing: be sure to check that the role ${app_name} is above the role ${(await guild.roles.fetch(role_id as string))!.name} in the role list.\n Otherwise, I can't do my job properly\n. Don't worry Marvin will remind you to do this.\n more info : https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101`)
        let marvin_role = guild.roles.cache.find(role => role.name == app_name);
        if (!marvin_role) throw new Error (`role ${app_name} doesn't exist on added guild ${guild.name}`);
        if  (roles.checkOrder(marvin_role,marvin_role,true)) Guild

    }

    public async read(req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response): Promise<void> {
        console.log ("get:" + req.originalUrl);
        let guild_id = req.query.guild_id as string;
        if (await prisma.guild.findUnique({where:{discordId:guild_id}}))
            {res.send (`Guild already added`)}
        else {
            let guild = await client.guilds.fetch(guild_id);
            let roles = await guild.roles.fetch();
            let app   = await client.fetchApplication();
            let choices = roles.cache
                                .filter(role => role.name != app.name && role.name != "@everyone")
                                .map (role => `<option value="${role.id}">${role.name}</option>`);
            //look at how to make a easy post form
            res.send (`
            <form action="/setup/" method="post">
                <label for="role_id">Select role to use with Marvin: </label>
                <select id="role_id" name="role_id">
                ${choices.join("\n")}
                <input id="guild_id" type="hidden" name="guild_id" value="${guild_id}">
                <input id="guild_name"  type="hidden" name="guild_name" value="${guild.name}">
                <input type="submit" value="ok">
            </form>
            `);
        }
    }

    public update(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public delete(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }
}
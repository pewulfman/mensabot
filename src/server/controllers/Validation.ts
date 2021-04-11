import { Request, Response } from 'express';
import { CrudController } from './CrudController';
import * as discord from '../../discord';

import { client } from '../../discord/client';
import { prisma } from '../../postgre';

export class ValidationController extends CrudController {
    public create(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public async read(req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response): Promise<void> {
        let mensaIdS = req.query.mid;
        let code     = req.query.code;
        console.log (`validating user ${mensaIdS} with code ${code}`)
        if ((typeof mensaIdS) != typeof "" || typeof code != typeof "") {
            res.send (`invalid input`);
            return
        }
        let mensaId = parseInt (mensaIdS as string);
        code    = code as string;
        console.log (`MensaId is ${mensaId}`);

        let pending = await prisma.members.findFirst ({where:{AND:[{mensaId},{discord:{code}},]},include:{discord:true}});
        if (!pending) {
            res.send (`Code invalide.
                       Si vous n'étes pas déjà authentifié et que le problème persiste, recommence la procédure de zéro, puis contacte l'administrateur`);
            return;
        };
        
        // Validating user
        await prisma.discord.update ({where:{id:pending.discord!.id},data:{code: {set:null}}});

        if (pending.discord) {
            let discordUser = await client.users.fetch (pending.discord.discordId);
            //promote users
            if (pending.membership) { 
                discord.roles.promote(pending.discord.discordId,discordUser.tag)
                res.send (`Ton identité a été validé, à bientôt sur discord (^^)`);
            } else {
                res.send (`Ton identité a été validé, cependant tu n'es pas à jour de cotisation. Tu auras accés au serveur quand tu recotisera`);
            }
        }
        //res.redirect (`https://discord.com/channels/@me`);
    }

    public update(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public delete(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }
}
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

        let pending = await prisma.members.findFirst ({where:{AND:[{mensaId},{code},]}});
        if (!pending) {
            res.send (`Code invalide.
                       Si vous n'étes pas déjà authentifier et que le problème persiste, recommence la procédure de zéro, puis contacte l'administrateur`);
            return;
        };
        
        // Validating user
        await prisma.members.update ({where:{id:pending.id},data:{code:undefined}});

        if (pending.discordId) {
            let discordUser = await client.users.fetch (pending.discordId);
            discordUser.send (`Ton identité à été validé, as bientôt sur discord (^^)`);
            //promote users
            if (pending.membership) { 
                discord.roles.promote(pending.discordId,discordUser.tag)
                res.send("Ton identité à été validé, tu devrais maintenant avoir accées aux contenu des discords")
            } else {
                res.send("Ton identité à été validé, cependant tu n'es pas à jour de cotisation. Tu auras accés au serveur quand tu recotisera")
            }
        }
    }

    public update(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public delete(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }
}
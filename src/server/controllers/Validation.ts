import { PrismaClient } from '.prisma/client';
import { Request, Response } from 'express';
import { CrudController } from './CrudController';
import * as discord from '../../discord';

const prisma = new PrismaClient ();
export class ValidationController extends CrudController {
    public create(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public async read(req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response): Promise<void> {
        let mensaTagS = req.query.mid;
        let code     = req.query.code;
        if ((typeof mensaTagS) != typeof "" || typeof code != typeof "") {}
        let mensaTag = parseInt (mensaTagS as string);
        let pending = await prisma.pendingMembers.findUnique ({where:{mensaTag}})
        if (!pending) { throw Error ()};
        if (pending.code != code) { //invalid code, retry or contact
        }
        
        // Validating user

        //move to members table
        prisma.members.create ({
            data: {
                name       : pending.name,
                email      : pending.email,
                region     : pending.region,
                mensaTag   : pending.mensaTag,
                discordTag : pending.discordTag,
                membership : pending.membership,
                inter      : pending.inter
            }
        })
        prisma.pendingMembers.delete ({where:{id:pending.id}});

        //promote users
        if (pending.membership) { 
            discord.roles.promote(pending.discordTag)
            res.send("Ton identité à été validé, tu devrais maintenant avoir accées aux contenu des discords")
        } else {
            res.send("Ton identité à été validé, cependant tu n'es pas à jour de cotisation. Tu auras accés au serveur quand tu recotisera")
        }
    }

    public update(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public delete(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }
}
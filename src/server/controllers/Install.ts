import { Request, Response } from 'express';
import { CrudController } from './CrudController';

export class InstallController extends CrudController {
    public create(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public async read(_req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response): Promise<void> {
        console.log ("received install request");
        res.redirect ("https://discord.com/api/oauth2/authorize?client_id=819258671107407903&permissions=8&redirect_uri=http%3A%2F%2Fmensafrbot.herokuapp.com&response_type=code&scope=identify%20email%20guilds%20bot");
    }

    public update(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public delete(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }
}
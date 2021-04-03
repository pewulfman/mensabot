import { Request, Response } from 'express';
import { CrudController } from './CrudController';

export class RootController extends CrudController {
    public create(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public async read(_req: Request<import("express-serve-static-core").ParamsDictionary>, res: Response): Promise<void> {
        res.send ("Welcome to MensaBot, nothing to see here");

    }

    public update(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }

    public delete(_req: Request<import("express-serve-static-core").ParamsDictionary>, _res: Response): void {
        throw new Error("Method not implemented.");
    }
}
import { Router, Request, Response } from 'express';
import { rootController } from '../controllers';

export const router = Router({
    strict: true
});
/*
router.post('/', (req: Request, res: Response) => {
    validationController.create(req, res);
});
*/

router.get('/', (req: Request, res: Response, next) => {
    rootController.read(req, res).catch(next);
});
/**
router.patch('/', (req: Request, res: Response) => {
    validationController.update(req, res);
});
*/

/**
router.delete('/', (req: Request, res: Response) => {
    validationController.delete(req, res);
});
*/
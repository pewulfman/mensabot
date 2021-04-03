import { Router, Request, Response } from 'express';
import { setupController } from '../controllers';

export const router = Router({
    strict: true
});
/*
router.post('/', (req: Request, res: Response) => {
    validationController.create(req, res);
});
*/

router.get('/', (req: Request, res: Response) => {
    setupController.read(req, res);
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
import { RootController } from './Root';
import { SetupController } from './Setup';
import { ValidationController } from './Validation';

const rootController = new RootController();
const setupController = new SetupController();
const validationController = new ValidationController();

export {
    rootController,
    setupController,
    validationController,
};

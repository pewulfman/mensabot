import { InstallController } from './Install'
import { RootController } from './Root';
import { SetupController } from './Setup';
import { ValidationController } from './Validation';

const installController = new InstallController();
const rootController = new RootController();
const setupController = new SetupController();
const validationController = new ValidationController();

export {
    installController,
    rootController,
    setupController,
    validationController,
};

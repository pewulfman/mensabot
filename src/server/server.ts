import * as express from 'express';
import { PORT } from './config/constants';
import { validationRouter } from './routes';

const app = express();
app.use(express.json());

app.use('/validation', validationRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
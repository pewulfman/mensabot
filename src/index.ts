import { configs } from './configs';

/**
 * Discord bot startup
 */

import { client } from './discord/client'
import * as chatbot from './discord/chatbot'

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}!`);
  });
  
client.on('message', chatbot.handleIncomingMessage);
client.on('guildMemberAdd', chatbot.reMember);
client.login(configs.botToken); 

/**
 * Server startup
 */
import * as express from 'express';
import { PORT } from './server/config/constants';
import { validationRouter, setupRouter, rootRouter } from './server/routes';

const app = express();
app.use(express.json());

app.use(configs.server.validation_path, validationRouter);
app.use('/setup', setupRouter);
app.use('/', rootRouter);


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

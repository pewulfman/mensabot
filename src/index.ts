import { configs } from './configs';


/**
 * Express server
 */
import * as express from 'express';
import { validationRouter, setupRouter, rootRouter, installRouter } from './server/routes';

const app = express();
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

/**
 * Sentry
 */

import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn: configs.sentry.dsn,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});


// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(configs.server.validation_path, validationRouter);
app.use('/install',installRouter);
app.use('/setup', setupRouter);
app.use('/', rootRouter);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use (function errorHandler(_err : any, _req : any, res : express.Response, _next : any) {
  res.status(500);
  res.send("500 : internal server error");
})



/**
 * Discord bot startup
 */

import { Guild } from 'discord.js';
import { prisma } from './postgre';
import { chatbot, client, roles } from './discord';

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}!`);
  });

/*
client.on('guildCreate', chatbot.newGuild );
*/
client.on('guildUpdate', (_old : Guild, guild : Guild) => {
  prisma.guild.update ({where:{discordId:guild.id},data:{name:guild.name}})
})
client.on('guildRemove', (guild : Guild) => {
  prisma.guild.delete ({where:{discordId:guild.id}})
});

client.on('guildMemberAdd', chatbot.welcomeUser);

client.on('roleUpdate', roles.checkOrder);

client.on('message', chatbot.handleIncomingMessage);

client.on('error', Sentry.captureException);

client.login(configs.botToken); 

/**
 * Booting server
 */

app.listen(configs.server.port, () => {
    console.log(`Server is listening on port ${configs.server.port}`);
});

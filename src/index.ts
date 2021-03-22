import * as bot from './discord/bot'


// we connect to Discord
bot.connect();

// welcome new users
setInterval(bot.welcome, 10 * 1000);

setInterval(bot.sendCode, 15 * 1000);

setInterval(bot.promote, 12 * 1000);
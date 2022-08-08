const mineflayer = require('mineflayer');
const config = require('./settings.json');
require('dotenv').config();

const noRestart = "no-restart";
const opts = {
      checkTimeoutInterval: 1000 * 60 * 3, // 3min
      username: process.env.USER,
      auth: process.env.AUTH_TYPE || 'microsoft',  
      host: process.env.SERVER_IP,
      version: "1.18.2",
};

function createBot() {
   if (!process.env.USER || !process.env.PASS || !process.env.SERVER_IP || !process.env.CHAT_PASS)
   	throw new Error("Pleave provide `USER`, `PASS`, `SERVER_IP` & `CHAT_PASS` env variables");

   const bot = mineflayer.createBot(opts); 
   opts['password'] = process.env.PASS;
   let lastLevel;

   bot.settings.colorsEnabled = false;

   bot.once('spawn', () => {
      console.log(`[BotLog] Bot joined to the server\nCurrent level: ${bot.experience.level}`);
      bot.chat(process.env.CHAT_PASS);
      lastLevel = bot.experience.level;
      // if (config.utils['anti-afk'].enabled) {
      //    bot.setControlState('jump', true);
      //    if (config.utils['anti-afk'].sneak) {
      //       bot.setControlState('sneak', true);
      //    }
      // }
   });

   bot.on('experience', () => {
      if (bot.experience.level > lastLevel)
         console.log(`[BotLog] Reached level ${bot.experience.level}.`)
   });

   bot.on('death', () => {
      console.log(
         `[BotLog] Bot has been died and was respawned ${bot.entity.position}`);
      bot.end(noRestart);
      // process.exit(0);
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', reason => {
         if (reason !== noRestart)
            setTimeout(createBot, config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', (reason) =>
      console.log(
         `[BotLog] Bot was kicked from the server. Reason: \n${reason}`
      )
   );
   bot.on('error', (err) =>
      console.log(`[ERROR] ${err.message}`)
   );
}

createBot();

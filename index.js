const mineflayer = require('mineflayer');
const config = require('./settings.json');
require('dotenv').config();

const noRestart = "no-restart";

function createBot() {

   const bot = mineflayer.createBot({
      username: process.env.USER,
     // password: process.env.PASS,
      auth: process.env.AUTH_TYPE,
      host: process.env.SERVER_IP,
      version: "1.18.2",
   });

   bot.settings.colorsEnabled = false;

   bot.once('spawn', () => {
      console.log('\x1b[33m[BotLog] Bot joined to the server', '\x1b[0m');
      // if (!process.env.CHAT_PASS) throw new Error("Chat pass must be provided!");
      bot.chat(process.env.CHAT_PASS);

      // setTimeout(() => {
      //    console.log("Trying to jump");
      //    bot.setControlState("forward", true);
      // }, 1000);
      
      // if (config.utils['anti-afk'].enabled) {
      //    bot.setControlState('jump', true);
      //    if (config.utils['anti-afk'].sneak) {
      //       bot.setControlState('sneak', true);
      //    }
      // }
   });

   bot.on('death', () => {
      console.log(
         `\x1b[33m[BotLog] Bot has been died and was respawned ${bot.entity.position}`,
         '\x1b[0m'
      );
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
         '\x1b[33m',
         `[BotLog] Bot was kicked from the server. Reason: \n${reason}`,
         '\x1b[0m'
      )
   );
   bot.on('error', (err) =>
      console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
   );
}

createBot();
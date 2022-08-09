require('dotenv').config();
// To get the authcode from the lib's logs
console.info = m => {
   if (m.startsWith("To sign in, use a web browser")) {
      const authCode = /code (\w{8})/.exec(m)[1];
      return authenticateLogin(authCode);
   }
   console.log(m);
}

const mineflayer = require('mineflayer');
const config = require('./settings.json');
const http = require('http');

const server = http.createServer((req, res) => {
   res.setHeader("Content-Type", "text/html");
   res.writeHead(200);
    res.end(`<html><body><p>Hello ji</p></body></html>`);
});
server.listen(8080);


const noRestart = "no-restart";
const opts = {
      checkTimeoutInterval: 1000 * 60 * 3, // 3min
      username: process.env.USER,
      auth: process.env.AUTH_TYPE || 'microsoft',  
      host: process.env.SERVER_IP,
      version: "1.18.2",
};

const createBot = () => {
   if (!process.env.USER || !process.env.PASS || !process.env.SERVER_IP || !process.env.CHAT_PASS)
   	throw new Error("Pleave provide `USER`, `PASS`, `SERVER_IP` & `CHAT_PASS` env variables");

   const bot = mineflayer.createBot(opts); 
   let lastLevel;

   bot.settings.colorsEnabled = false;

   bot.once('spawn', () => {
      console.log(`[BotLog] Bot joined to the server`);
      opts['password'] = process.env.PASS;
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
/*CODE: //*[@id="otc"]

EMAIL: //*[@id="i0116"]
PASS: //*[@id="i0118"]

NO: //*[@id="idBtn_Back"]

WENT_WRONG_MESG: //*[@id="idDiv_Finish_Title"]
// Something went wrong
*/

const CODE_XPATH = '//*[@id="otc"]';
const EMAIL_XPATH = '//*[@id="i0116"]';
const PASS_XPATH = '//*[@id="i0118"]';
const NO_BUTTON_XPATH = '//*[@id="idBtn_Back"]';
const STATUS_XPATH = '//*[@id="idDiv_Finish_Title"]';


const authenticateLogin = async (authCode) => {
   const link = "https://www.microsoft.com/link";
   const puppeteer = require('puppeteer-core');
   
   const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
   });

   const page = await browser.newPage();
   await page.goto(link, {
      waitUntil: 'networkidle0'
   });

   // Enter code
   await Promise.all([page.waitForSelector(CODE_XPATH), page.type(CODE_XPATH, authCode), page.keyboard.press('Enter')]);
 
   // Enter email
   await Promise.all([page.waitForSelector(EMAIL_XPATH), page.type(EMAIL_XPATH, process.env.USER), page.keyboard.press('Enter')]);
   // Enter password
   await Promise.all([page.waitForSelector(PASS_XPATH), page.type(PASS_XPATH, process.env.PASS), page.keyboard.press('Enter')]);
   // Click "NO"
   await Promise.all([page.waitForSelector(NO_BUTTON_XPATH), page.click(NO_BUTTON_XPATH)]);
   // check if everything is fine
   const element = await page.waitForSelector(STATUS_XPATH);
   const status = await element.evaluate(e => e.textContent);
   console.log("hello "+status);

   await browser.close();
}

createBot();
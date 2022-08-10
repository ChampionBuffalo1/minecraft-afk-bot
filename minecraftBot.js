const Logger = require("./Logger");
console.info = m => {
    if (m.startsWith('To sign in, use a web browser')) {
        const authCode = /code (\w{8})/g.exec(m)[1];
      return Logger.info(`Manual authentication required, Visit https://www.microsoft.com/link and your code is **${authCode}**`);
    }
    console.log(m);
 }
const mineflayer = require('mineflayer');
module.exports = class MinecraftBot {
    constructor() {
        this.noReconnect = "no-restart";
        this.opts = {
            checkTimeoutInterval: 1000 * 60 * 3, // 3min
            username: process.env.USER,
            auth: 'microsoft',  
            host: process.env.SERVER_IP,
            version: "1.18.2",
        };
        this.bot = null;
        this.log = Logger;
        this.config = {
            "anti-afk": {
                enabled: false,
                sneak: false
              },
              "auto-reconnect": true,
              "auto-reconnect-delay": 1000 * 60 * 5 // Reconnect after 5 mins
        };
        
    }

    registerEvent() {
        if(!this.bot) return;
        this.bot.once('spawn', this.spawn.bind(this));
        this.bot.on('death', this.death.bind(this));
        this.bot.on('kick', this.kicked.bind(this));
        this.bot.on('end', this.botDown.bind(this));
        this.bot.on('error', this.log.error);
    }
    
    // Listeners
    spawn = () => {
        this.opts['password'] = process.env.PASS;
        this.bot.chat(process.env.CHAT_PASS);
        this.log.info("Bot has joined the server!");
        // Lame anti-afk but I dont need it rn so who cares
        if (this.config["anti-afk"].enabled) {
          this.bot.setControlState('jump', true);
          if (this.config.utils['anti-afk'].sneak)
            this.bot.setControlState('sneak', true);
        }
    }
    death = () => this.log.info(`Bot has been died and was respawned ${this.bot.entity.position}`);
    kicked = reason => this.log.info( `Bot was kicked from the server. Reason: \n${reason})`);
    botDown = reason => {
        this.bot = null;
        if (reason !== this.noReconnect && this.config["auto-reconnect"]) {
            this.log.info(`Restarting bot in ${this.config["auto-reconnect-delay"] / (1000 * 60)} minutes!`);
            setTimeout(this.join.bind(this), this.config["auto-reconnect-delay"]);
        }
    }

    // Methods
    join() {
        if (this.bot) return;
        this.bot = mineflayer.createBot(this.opts); 
        this.registerEvent();     
    }
    reconnect() {
        if(!this.bot) return; 
        this.leaveServer();
        this.join();
    }

    shutdown() {
        if (!this.bot) return;
        this.leaveServer();
        this.bot.end(this.noReconnect);
        this.bot = null;
    }
    leaveServer() {
        if (!this.bot) return;
        this.bot.quit(this.noReconnect);
        this.bot = null;
        this.log.info("Bot has left the server!");
    }
}

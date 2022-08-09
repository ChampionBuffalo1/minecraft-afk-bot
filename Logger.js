const fetch = require('node-fetch');
const winston = require('winston');

const EMBED_COLOR = {
  ERROR: 'f04747',
  WARN: 'faa61a',
  INFO: '43b581',
  DEBUG: '737f8d',
}

class Logger {
  constructor(webhook) {
    // Setting up winston logger
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.splat(),
        winston.format(info => {
          info.level = info.level.toUpperCase();
          return info;
        })(),
        winston.format.printf(info => `[${info.level}]: ${info.message} - ${new Date().toLocaleString()}`),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log', dirname: 'logs' }),
        new winston.transports.File({ filename: 'error.log', level: 'error', dirname: 'logs' }),
      ],
    });
    process.on('unhandledRejection', this.error);
    // Discord Webhook URL
    if (webhook) this._verifyWebhook(webhook);
  }
  error = (error) => {
    const errorMsg = error instanceof Error && error.stack ? error.stack : error;
    this.logger.error(errorMsg);
    if (this.webhook) this._logWebhook("ERROR", errorMsg);
  };
  warn = (warning) => {
    this.logger.warn(warning);
    if (this.webhook) this._logWebhook("WARN", warning);
  };
  info = (msg) => {
    this.logger.info(msg);
    if (this.webhook) this._logWebhook("INFO", msg);
  };
  debug = (msg) => {
    this.logger.debug(msg);
    if (this.webhook) this._logWebhook("DEBUG", msg);
  };
  _verifyWebhook = async (url) => {
    const Regex =
      /https?:\/\/discord(?:app)?.com\/api\/webhooks\/(?<id>[0-9]{17,21})\/(?<token>[A-Za-z0-9.\-_]{60,68})/;
    if (!Regex.test(url)) {
      this.error('Invalid webhook URL given.');
      return;
    }
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(r => r.json());

    // If invalid url, discord will send an error message
    if (res.message) {
      this.error(res.message);
      return;
    }
    this.webhook = url;
  };

  _logWebhook = async (type, msg) => {
    const msgStatus = await fetch(this.webhook + '?wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '',
        embeds: [
          {
            author: {
              name: 'Minecraft Bot Status',
              icon_url: 'https://w0.peakpx.com/wallpaper/507/617/HD-wallpaper-minecraft-block-logo.jpg',
            },
            title: type,
            description: msg,
            color: parseInt(EMBED_COLOR[type], 16),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }).then(r => r.json());
    // Discord will send an object with message property which is the error message
    // If we have an error message, remove webhook and log the error
    if (msgStatus.message) {
      this.webhook = undefined;
      this.error(msgStatus.message);
    }
  };
}

module.exports = new Logger(process.env.WEBHOOK);

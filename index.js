require('dotenv').config();
const app = require('express')();
const MinecraftBot = require("./minecraftBot");

const bot = new MinecraftBot();
app.get('/', (_, res) => {
   res.status(200)
      .send("hello ji");
});
bot.registerEvent();

// /admin/join
// /join
app.get(`${process.env.ADMIN_PATH || ''}/:action`, (req, res) => {
   const action = req.params.action.toLowerCase();
   switch(action) {
      case "leave": {
         bot.leaveServer();
       break;  
      };
      case "join": {
         bot.join();
         break;
      };
      case "shutdown": {
         bot.shutdown();
         break;
      }
   }
   res.send("Executing the function according to action: " + action);
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Webserver running at port ${PORT}`));
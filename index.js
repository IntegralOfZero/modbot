const Discord = require("discord.js");
const client = new Discord.Client();

/*
const Danbooru = require('danbooru');
let danbooru = new Danbooru()
let safebooru = new Danbooru>Safebooru();
*/

const commands = {

}

client.login(process.env["APP_TOKEN"]);

client.on("ready", () => {
  console.log("I am ready!");
});




client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));


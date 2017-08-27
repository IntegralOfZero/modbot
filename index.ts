import { Module } from "./modules//interfaces/module.interface";
import { SpamModule } from "./modules/spam.module";
import { SpamRecord } from "./modules/spam.module"; 

const Discord = require("discord.js");
const client = new Discord.Client();

/*
const Danbooru = require('danbooru');
let danbooru = new Danbooru()
let safebooru = new Danbooru>Safebooru();
*/

const COMMAND_PREFIX = "mb";

const commands = {

}

let modules: Module[] = [];

client.login(process.env["APP_TOKEN"]);

client.on("ready", (s) => {
    modules.push(new SpamModule());

    console.log("I am ready!");
});



client.on("guildMemberAdd", (s) => {

    console.log("ADDED!");
});

let records = {};

client.on("message", (message) => {
    let content = message.content;
    let prefix = content.split(" ")[0];
    let command = content.split(" ")[1];

    if (message.author.bot) {
        return;
    }

    if ((prefix == COMMAND_PREFIX)) {
        // find command
        return;
    }

    // not a command, so analyze the message
    for (let module of modules) {
        let userId = message.author.id;
        let userRecord: UserRecord = records[userId];

        if (!userRecord) {
            userRecord = new UserRecord();
            records[userId] = userRecord;
        }

        module.execute(userRecord, message);
    }
});


client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));

export class UserRecord {

    spamRecord: SpamRecord;

    constructor() {
        this.spamRecord = new SpamRecord();
    }
}

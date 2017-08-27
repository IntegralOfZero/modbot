"use strict";
exports.__esModule = true;
var spam_module_1 = require("./modules/spam.module");
var spam_module_2 = require("./modules/spam.module");
var Discord = require("discord.js");
var client = new Discord.Client();
/*
const Danbooru = require('danbooru');
let danbooru = new Danbooru()
let safebooru = new Danbooru>Safebooru();
*/
var COMMAND_PREFIX = "mb";
var commands = {};
var modules = [];
client.login(process.env["APP_TOKEN"]);
client.on("ready", function (s) {
    modules.push(new spam_module_1.SpamModule());
    console.log("I am ready!");
});
client.on("guildMemberAdd", function (s) {
    console.log("ADDED!");
});
var records = {};
client.on("message", function (message) {
    var content = message.content;
    var prefix = content.split(" ")[0];
    var command = content.split(" ")[1];
    if (message.author.bot) {
        return;
    }
    if ((prefix == COMMAND_PREFIX)) {
        // find command
        return;
    }
    // not a command, so analyze the message
    for (var _i = 0, modules_1 = modules; _i < modules_1.length; _i++) {
        var module_1 = modules_1[_i];
        var userId = message.author.id;
        var userRecord = records[userId];
        if (!userRecord) {
            userRecord = new UserRecord();
            records[userId] = userRecord;
        }
        module_1.execute(userRecord, message);
    }
});
client.on("error", function (e) { return console.error(e); });
client.on("warn", function (e) { return console.warn(e); });
client.on("debug", function (e) { return console.info(e); });
var UserRecord = (function () {
    function UserRecord() {
        this.spamRecord = new spam_module_2.SpamRecord();
    }
    return UserRecord;
}());
exports.UserRecord = UserRecord;

const { initConsoleChannel } = require("../utils/consoleChannel");
const { CONSOLE_CHANNEL_ID } = require("../config/config");

module.exports = {
    name: "ready",
    once: true,
    execute: (client) => {
        console.log(`${client.user.tag} est connecté !`);
        initConsoleChannel(client, CONSOLE_CHANNEL_ID);
    },
};

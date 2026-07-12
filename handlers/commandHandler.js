const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

function loadCommands() {
    const commands = new Collection();
    const commandsPath = path.join(__dirname, "..", "commands");
    const files = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

    for (const file of files) {
        const commandList = require(path.join(commandsPath, file));
        for (const command of commandList) {
            commands.set(command.name, command);
        }
    }

    return commands;
}

module.exports = { loadCommands };

const { PREFIX } = require("../config/config");
const { AUTHORIZED_USERS } = require("../config/whitelist");

module.exports = {
    name: "messageCreate",
    execute: async (message) => {
        if (message.author.bot || !message.guild) return;
        if (!message.content.startsWith(PREFIX)) return;

        const isAuthorized = AUTHORIZED_USERS.includes(message.author.id) || message.guild.ownerId === message.author.id;
        if (!isAuthorized) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.commands.get(commandName);
        if (!command) return;

        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            return message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
        }

        try {
            await command.execute(message, args, message.client);
        } catch (error) {
            console.error(error);
            message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
        }
    },
};

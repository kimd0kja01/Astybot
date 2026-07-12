const { sendLog } = require("../utils/logger");

module.exports = {
    name: "messageDelete",
    execute: async (message) => {
        if (!message.guild || message.author?.bot) return;

        await sendLog(
            message.guild,
            `🗑️ **Message supprimé**\n\n` +
            `👤 Auteur : ${message.author.tag}\n` +
            `📍 Salon : ${message.channel}\n` +
            `💬 Message : ${message.content || "Aucun texte"}`
        );
    },
};

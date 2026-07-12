const { sendLog } = require("../utils/logger");

module.exports = {
    name: "messageUpdate",
    execute: async (oldMessage, newMessage) => {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        await sendLog(
            oldMessage.guild,
            `✏️ **Message modifié**\n\n` +
            `👤 Auteur : ${oldMessage.author.tag}\n` +
            `📍 Salon : ${oldMessage.channel}\n\n` +
            `Avant : ${oldMessage.content || "Vide"}\n` +
            `Après : ${newMessage.content || "Vide"}`
        );
    },
};

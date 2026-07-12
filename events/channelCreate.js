const { sendLog } = require("../utils/logger");

module.exports = {
    name: "channelCreate",
    execute: async (channel) => {
        if (!channel.guild) return;

        await sendLog(
            channel.guild,
            `📁 **Salon créé**\n\n` +
            `Nom : ${channel.name}`
        );
    },
};

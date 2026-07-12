const { sendLog } = require("../utils/logger");

module.exports = {
    name: "guildMemberRemove",
    execute: async (member) => {
        await sendLog(
            member.guild,
            `📤 **Départ du serveur**\n\n` +
            `👤 ${member.user.tag}`
        );
    },
};

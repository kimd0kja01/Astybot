const { sendLog } = require("../utils/logger");

module.exports = {
    name: "guildMemberAdd",
    execute: async (member) => {
        await sendLog(
            member.guild,
            `📥 **Nouvel arrivant**\n\n` +
            `👤 ${member.user.tag}\n` +
            `🆔 ${member.id}`
        );
    },
};

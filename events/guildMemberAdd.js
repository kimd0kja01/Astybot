const { sendLog } = require("../utils/logger");
const { WELCOME_ROLE_ID } = require("../config/config");

module.exports = {
    name: "guildMemberAdd",
    execute: async (member) => {
        const welcomeRole = member.guild.roles.cache.get(WELCOME_ROLE_ID);
        if (welcomeRole) await member.roles.add(welcomeRole).catch(() => {});

        await sendLog(
            member.guild,
            `📥 **Nouvel arrivant**\n\n` +
            `👤 ${member.user.tag}\n` +
            `🆔 ${member.id}`
        );
    },
};

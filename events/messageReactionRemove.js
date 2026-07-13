const { handleReactionRemove } = require("../utils/reactionRoles");
const { refreshPollMessage } = require("../utils/pollManager");

module.exports = {
    name: "messageReactionRemove",
    execute: async (reaction, user) => {
        if (user.bot) return;
        if (await refreshPollMessage(reaction)) return;

        await handleReactionRemove(reaction, user);
    },
};

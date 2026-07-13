const { handleReactionAdd } = require("../utils/reactionRoles");
const { refreshPollMessage } = require("../utils/pollManager");

module.exports = {
    name: "messageReactionAdd",
    execute: async (reaction, user) => {
        if (user.bot) return;
        if (await refreshPollMessage(reaction)) return;

        await handleReactionAdd(reaction, user);
    },
};

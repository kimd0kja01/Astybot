const { handleReactionAdd } = require("../utils/reactionRoles");

module.exports = {
    name: "messageReactionAdd",
    execute: async (reaction, user) => {
        await handleReactionAdd(reaction, user);
    },
};

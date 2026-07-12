const { handleReactionRemove } = require("../utils/reactionRoles");

module.exports = {
    name: "messageReactionRemove",
    execute: async (reaction, user) => {
        await handleReactionRemove(reaction, user);
    },
};

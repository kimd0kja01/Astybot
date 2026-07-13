// Suivi des sondages actifs (en mémoire) et rafraîchissement de leur image à chaque vote.
const { AttachmentBuilder } = require("discord.js");
const { generatePollCard, POLL_EMOJIS } = require("./pollCard");

const activePolls = new Map(); // messageId -> { question, options }

function registerPoll(messageId, question, options) {
    activePolls.set(messageId, { question, options });
}

// Retourne true si la réaction concernait un sondage suivi (et l'image a été mise à jour).
async function refreshPollMessage(reaction) {
    const poll = activePolls.get(reaction.message.id);
    if (!poll) return false;

    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;

    const votes = poll.options.map((_, index) => {
        const emojiReaction = message.reactions.cache.get(POLL_EMOJIS[index]);
        // On retire le vote du bot lui-même (il a réagi en premier pour proposer l'option).
        return emojiReaction ? Math.max(emojiReaction.count - 1, 0) : 0;
    });
    const totalVotes = votes.reduce((sum, count) => sum + count, 0);

    const buffer = generatePollCard({ question: poll.question, options: poll.options, votes, totalVotes });
    const attachment = new AttachmentBuilder(buffer, { name: "poll.png" });

    await message.edit({ files: [attachment] }).catch(() => {});
    return true;
}

module.exports = { registerPoll, refreshPollMessage };

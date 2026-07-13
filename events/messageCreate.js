const { AttachmentBuilder } = require("discord.js");
const { PREFIX, ANTISPAM_BYPASS_USERS } = require("../config/config");
const { AUTHORIZED_USERS } = require("../config/whitelist");
const { addMessageXp, xpNeededForLevel, getRank } = require("../utils/levelSystem");
const { generateRankCard } = require("../utils/rankCard");
const { isSpamming, resetUser, MESSAGE_LIMIT, INTERVAL_MS, TIMEOUT_MINUTES } = require("../utils/antiSpam");
const { sendModerationLog } = require("../utils/logger");
const COLORS = require("../utils/colors");

module.exports = {
    name: "messageCreate",
    execute: async (message) => {
        if (message.author.bot || !message.guild) return;

        if (!ANTISPAM_BYPASS_USERS.includes(message.author.id) && isSpamming(message.author.id)) {
            resetUser(message.author.id);
            await message.delete().catch(() => {});

            if (message.member.moderatable) {
                await message.member
                    .timeout(TIMEOUT_MINUTES * 60 * 1000, "Anti-spam : trop de messages envoyés rapidement")
                    .catch(() => {});
            }

            const warning = await message.channel.send(
                `🚫 ${message.author}, tu as été mis en sourdine ${TIMEOUT_MINUTES} minutes pour spam.`
            );
            setTimeout(() => warning.delete().catch(() => {}), 5000);

            await sendModerationLog(message.guild, {
                title: "Anti-spam déclenché",
                emoji: "🚫",
                color: COLORS.DANGER,
                target: message.author,
                moderator: message.client.user,
                reason: `Plus de ${MESSAGE_LIMIT} messages envoyés en moins de ${INTERVAL_MS / 1000}s`,
            });

            return;
        }

        const { leveledUp, data } = addMessageXp(message.guild.id, message.author.id);
        if (leveledUp) {
            const xpForNext = xpNeededForLevel(data.level);
            const rank = getRank(message.guild.id, message.author.id);

            const buffer = await generateRankCard({
                username: message.member.displayName,
                avatarURL: message.author.displayAvatarURL({ extension: "png", size: 256 }),
                level: data.level,
                rank,
                messages: data.messages,
                xp: data.xp,
                xpForNext,
            });

            const attachment = new AttachmentBuilder(buffer, { name: "levelup.png" });
            message.channel
                .send({ content: `🎉 ${message.author} passe **niveau ${data.level}** !`, files: [attachment] })
                .catch(() => {});
        }

        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.commands.get(commandName);
        if (!command) return;

        // Seules les commandes de modération (celles avec un champ "permissions") sont réservées
        // à la whitelist + aux permissions Discord. Les commandes générales restent libres d'accès.
        if (command.permissions) {
            const isAuthorized = AUTHORIZED_USERS.includes(message.author.id) || message.guild.ownerId === message.author.id;
            if (!isAuthorized) return;

            if (!message.member.permissions.has(command.permissions)) {
                return message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
            }
        }

        try {
            await command.execute(message, args, message.client);
        } catch (error) {
            console.error(error);
            message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
        }
    },
};

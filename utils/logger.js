const { EmbedBuilder } = require("discord.js");
const { LOG_CHANNEL_ID } = require("../config/config");
const COLORS = require("./colors");

function getLogChannel(guild) {
    return guild.channels.cache.get(LOG_CHANNEL_ID);
}

function sendLog(guild, content) {
    const channel = getLogChannel(guild);
    if (!channel) return;
    return channel.send(content);
}

// Mise en page dédiée aux actions de modération : qui a été visé + l'ID du modérateur qui a utilisé la commande.
function sendModerationLog(guild, { title, emoji, color = COLORS.PRIMARY, target, moderator, reason, extraFields = [] }) {
    const channel = getLogChannel(guild);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${title}`)
        .setColor(color)
        .addFields(
            {
                name: "👤 Utilisateur visé",
                value: target ? `${target.tag}\n\`${target.id}\`` : "—",
                inline: true,
            },
            {
                name: "🛠️ Modérateur",
                value: `${moderator.tag}\n\`${moderator.id}\``,
                inline: true,
            },
            ...extraFields,
            { name: "📝 Raison", value: reason || "Aucune raison fournie" }
        )
        .setTimestamp();

    if (typeof target?.displayAvatarURL === "function") {
        embed.setThumbnail(target.displayAvatarURL());
    }

    return channel.send({ embeds: [embed] });
}

module.exports = { getLogChannel, sendLog, sendModerationLog };

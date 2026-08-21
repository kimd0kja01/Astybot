const {
    PermissionFlagsBits,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    AttachmentBuilder,
} = require("discord.js");
const { sendModerationLog } = require("../utils/logger");
const { getOrCreateMutedRole } = require("../utils/muteRole");
const { generatePollCard, POLL_EMOJIS } = require("../utils/pollCard");
const { registerPoll } = require("../utils/pollManager");
const COLORS = require("../utils/colors");

// Traduit les noms de permissions Discord.js (ex. "SendMessages") en libellés français lisibles.
const PERMISSION_LABELS = {
    ViewChannel: "Voir le salon",
    SendMessages: "Envoyer des messages",
    SendMessagesInThreads: "Envoyer dans les fils",
    CreatePublicThreads: "Créer des fils publics",
    CreatePrivateThreads: "Créer des fils privés",
    EmbedLinks: "Intégrer des liens",
    AttachFiles: "Joindre des fichiers",
    AddReactions: "Ajouter des réactions",
    UseExternalEmojis: "Emojis externes",
    UseExternalStickers: "Stickers externes",
    MentionEveryone: "Mentionner @everyone",
    ManageMessages: "Gérer les messages",
    ManageThreads: "Gérer les fils",
    ReadMessageHistory: "Lire l'historique",
    SendTTSMessages: "Messages TTS",
    UseApplicationCommands: "Utiliser les commandes",
    SendVoiceMessages: "Messages vocaux",
    CreateInstantInvite: "Créer une invitation",
    Connect: "Se connecter (vocal)",
    Speak: "Parler (vocal)",
    Stream: "Partager son écran",
    UseVAD: "Détection vocale",
    UseSoundboard: "Utiliser la soundboard",
    PrioritySpeaker: "Priorité de parole",
    MuteMembers: "Rendre muet",
    DeafenMembers: "Rendre sourd",
    MoveMembers: "Déplacer les membres",
    ManageChannels: "Gérer le salon",
    ManageRoles: "Gérer les permissions",
    ManageWebhooks: "Gérer les webhooks",
    UseEmbeddedActivities: "Activités intégrées",
    RequestToSpeak: "Demander la parole",
    ManageEvents: "Gérer les événements",
    CreateEvents: "Créer des événements",
};

function translatePermission(flagName) {
    return PERMISSION_LABELS[flagName] || flagName.replace(/([a-z])([A-Z])/g, "$1 $2");
}

const CHANNEL_TYPE_LABELS = {
    [ChannelType.GuildText]: "💬 Texte",
    [ChannelType.GuildVoice]: "🔊 Vocal",
    [ChannelType.GuildCategory]: "📁 Catégorie",
    [ChannelType.GuildAnnouncement]: "📢 Annonces",
    [ChannelType.GuildForum]: "🗂️ Forum",
    [ChannelType.GuildStageVoice]: "🎙️ Stage",
    [ChannelType.GuildMedia]: "🖼️ Média",
};

module.exports = [
    {
        name: "poll",
        description: 'Crée un sondage avec résultats en temps réel ($poll "question" option1 option2 ...)',
        permissions: [PermissionFlagsBits.ManageMessages],
        execute: async (message, args) => {
            const raw = args.join(" ");
            const match = raw.match(/^"([^"]+)"\s*(.*)$/);

            if (!match) {
                return message.reply('❌ Utilise `$poll "question" option1 option2 ...` (2 à 10 options).');
            }

            const question = match[1].trim();
            const options = match[2].split(/\s+/).filter(Boolean);

            if (options.length < 2) {
                return message.reply("❌ Indique au moins 2 options.");
            }
            if (options.length > POLL_EMOJIS.length) {
                return message.reply(`❌ Maximum ${POLL_EMOJIS.length} options.`);
            }

            const votes = options.map(() => 0);
            const buffer = generatePollCard({ question, options, votes, totalVotes: 0 });
            const attachment = new AttachmentBuilder(buffer, { name: "poll.png" });

            await message.delete().catch(() => {});
            const pollMessage = await message.channel.send({ files: [attachment] });

            for (let i = 0; i < options.length; i++) {
                await pollMessage.react(POLL_EMOJIS[i]);
            }

            registerPoll(pollMessage.id, question, options);
        },
    },
    {
        name: "kick",
        description: "Expulse un membre ($kick @membre [raison])",
        permissions: [PermissionFlagsBits.KickMembers],
        execute: async (message, args) => {
            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à expulser.");
            if (!target.kickable) return message.reply("❌ Je ne peux pas expulser ce membre.");

            const reason = args.slice(1).join(" ") || "Aucune raison fournie";
            await target.kick(reason);
            await message.reply(`✅ ${target.user.tag} a été expulsé. Raison : ${reason}`);
            await sendModerationLog(message.guild, {
                title: "Membre expulsé",
                emoji: "👢",
                color: COLORS.WARNING,
                target: target.user,
                moderator: message.author,
                reason,
            });
        },
    },
    {
        name: "ban",
        description: "Bannit un membre ($ban @membre [raison])",
        permissions: [PermissionFlagsBits.BanMembers],
        execute: async (message, args) => {
            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à bannir.");
            if (!target.bannable) return message.reply("❌ Je ne peux pas bannir ce membre.");

            const reason = args.slice(1).join(" ") || "Aucune raison fournie";
            await target.ban({ reason });
            await message.reply(`✅ ${target.user.tag} a été banni. Raison : ${reason}`);
            await sendModerationLog(message.guild, {
                title: "Membre banni",
                emoji: "🔨",
                color: COLORS.DANGER,
                target: target.user,
                moderator: message.author,
                reason,
            });
        },
    },
    {
        name: "unban",
        description: "Débannit un utilisateur ($unban <ID>)",
        permissions: [PermissionFlagsBits.BanMembers],
        execute: async (message, args) => {
            const userID = args[0];
            if (!userID) return message.reply("❌ Fournis l'ID de l'utilisateur à débannir.");

            try {
                const user = await message.client.users.fetch(userID).catch(() => null);
                await message.guild.bans.remove(userID);
                await message.reply(`✅ Utilisateur \`${userID}\` débanni.`);
                await sendModerationLog(message.guild, {
                    title: "Utilisateur débanni",
                    emoji: "🔓",
                    color: COLORS.SUCCESS,
                    target: user ?? { tag: "Inconnu", id: userID },
                    moderator: message.author,
                });
            } catch {
                await message.reply("❌ Impossible de débannir cet utilisateur (ID invalide ou non banni).");
            }
        },
    },
    {
        name: "muteall",
        description: "Rend muet un membre partout (voix + texte) via timeout ($muteall @membre <minutes> [raison])",
        permissions: [PermissionFlagsBits.ModerateMembers],
        execute: async (message, args) => {
            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à rendre muet.");
            if (!target.moderatable) return message.reply("❌ Je ne peux pas rendre ce membre muet.");

            const minutes = parseInt(args[1], 10);
            if (!minutes || minutes <= 0) return message.reply("❌ Indique une durée en minutes valide.");

            const reason = args.slice(2).join(" ") || "Aucune raison fournie";
            await target.timeout(minutes * 60 * 1000, reason);
            await message.reply(`✅ ${target.user.tag} est muet (voix + texte) pendant ${minutes} minute(s). Raison : ${reason}`);
            await sendModerationLog(message.guild, {
                title: "Membre rendu muet (voix + texte)",
                emoji: "🔇",
                color: COLORS.MODERATE,
                target: target.user,
                moderator: message.author,
                reason,
                extraFields: [{ name: "⏱️ Durée", value: `${minutes} minute(s)`, inline: true }],
            });
        },
    },
    {
        name: "unmuteall",
        description: "Retire le mute complet (timeout) d'un membre ($unmuteall @membre)",
        permissions: [PermissionFlagsBits.ModerateMembers],
        execute: async (message, args) => {
            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à démute.");

            await target.timeout(null);
            await message.reply(`✅ ${target.user.tag} n'est plus muet.`);
            await sendModerationLog(message.guild, {
                title: "Membre démute (voix + texte)",
                emoji: "🔊",
                color: COLORS.SUCCESS,
                target: target.user,
                moderator: message.author,
            });
        },
    },
    {
        name: "mute",
        description: "Rend muet un membre au choix ($mute voice @membre [raison] ou $mute text @membre [raison])",
        permissions: [PermissionFlagsBits.ModerateMembers],
        execute: async (message, args) => {
            const type = args[0]?.toLowerCase();
            if (type !== "voice" && type !== "text") {
                return message.reply("❌ Utilise `$mute voice @membre [raison]` ou `$mute text @membre [raison]`.");
            }

            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à rendre muet.");

            const reason = args.slice(2).join(" ") || "Aucune raison fournie";

            if (type === "voice") {
                if (!target.voice.channel) {
                    return message.reply("❌ Ce membre n'est pas connecté à un salon vocal.");
                }
                await target.voice.setMute(true, reason);
                await message.reply(`✅ ${target.user.tag} est muet en vocal. Raison : ${reason}`);
                await sendModerationLog(message.guild, {
                    title: "Membre rendu muet (vocal)",
                    emoji: "🔇",
                    color: COLORS.MODERATE,
                    target: target.user,
                    moderator: message.author,
                    reason,
                });
                return;
            }

            const mutedRole = await getOrCreateMutedRole(message.guild);
            await target.roles.add(mutedRole, reason);
            await message.reply(`✅ ${target.user.tag} est muet en textuel. Raison : ${reason}`);
            await sendModerationLog(message.guild, {
                title: "Membre rendu muet (textuel)",
                emoji: "🔇",
                color: COLORS.MODERATE,
                target: target.user,
                moderator: message.author,
                reason,
            });
        },
    },
    {
        name: "unmute",
        description: "Retire le mute au choix ($unmute voice @membre ou $unmute text @membre)",
        permissions: [PermissionFlagsBits.ModerateMembers],
        execute: async (message, args) => {
            const type = args[0]?.toLowerCase();
            if (type !== "voice" && type !== "text") {
                return message.reply("❌ Utilise `$unmute voice @membre` ou `$unmute text @membre`.");
            }

            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à démute.");

            if (type === "voice") {
                await target.voice.setMute(false);
                await message.reply(`✅ ${target.user.tag} n'est plus muet en vocal.`);
                await sendModerationLog(message.guild, {
                    title: "Membre démute (vocal)",
                    emoji: "🔊",
                    color: COLORS.SUCCESS,
                    target: target.user,
                    moderator: message.author,
                });
                return;
            }

            const mutedRole = await getOrCreateMutedRole(message.guild);
            await target.roles.remove(mutedRole);
            await message.reply(`✅ ${target.user.tag} n'est plus muet en textuel.`);
            await sendModerationLog(message.guild, {
                title: "Membre démute (textuel)",
                emoji: "🔊",
                color: COLORS.SUCCESS,
                target: target.user,
                moderator: message.author,
            });
        },
    },
    {
        name: "warn",
        description: "Avertit un membre ($warn @membre [raison])",
        permissions: [PermissionFlagsBits.ModerateMembers],
        execute: async (message, args) => {
            const target = message.mentions.members?.first();
            if (!target) return message.reply("❌ Mentionne un membre à avertir.");

            const reason = args.slice(1).join(" ") || "Aucune raison fournie";
            await message.reply(`⚠️ ${target.user.tag} a été averti. Raison : ${reason}`);
            await target.send(`⚠️ Tu as reçu un avertissement sur **${message.guild.name}**.\nRaison : ${reason}`).catch(() => {});
            await sendModerationLog(message.guild, {
                title: "Membre averti",
                emoji: "⚠️",
                color: COLORS.WARNING,
                target: target.user,
                moderator: message.author,
                reason,
            });
        },
    },
    {
        name: "moveall",
        description: "Déplace tous les membres d'un salon vocal vers un autre, via menus déroulants ($moveall)",
        permissions: [PermissionFlagsBits.MoveMembers],
        execute: async (message) => {
            const fromChannel = message.member.voice.channel;
            if (!fromChannel) {
                return message.reply("❌ Tu dois être connecté à un salon vocal pour utiliser cette commande.");
            }

            let toChannelId = null;

            const buildComponents = (confirmDisabled) => [
                new ActionRowBuilder().addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId("moveall_to")
                        .setPlaceholder("📥 Salon d'arrivée")
                        .setChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("moveall_confirm")
                        .setLabel("Déplacer tout le monde")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(confirmDisabled)
                ),
            ];

            const embed = new EmbedBuilder()
                .setTitle("🔀 Déplacement de salon vocal")
                .setDescription(`Salon de départ : **${fromChannel.name}** (ton salon actuel).\nChoisis le salon d'arrivée ci-dessous, puis clique sur **Déplacer tout le monde**.`)
                .setColor(COLORS.PRIMARY);

            const panel = await message.reply({ embeds: [embed], components: buildComponents(true) });

            const collector = panel.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === message.author.id,
                time: 60_000,
            });

            collector.on("collect", async (interaction) => {
                if (interaction.componentType === ComponentType.ChannelSelect) {
                    toChannelId = interaction.values[0];

                    await interaction.update({
                        embeds: [embed],
                        components: buildComponents(!toChannelId),
                    });
                    return;
                }

                if (interaction.customId === "moveall_confirm") {
                    await interaction.deferUpdate();

                    const toChannel = message.guild.channels.cache.get(toChannelId);

                    if (!toChannel) {
                        await panel.edit({ content: "❌ Le salon d'arrivée est introuvable.", embeds: [], components: [] });
                        return collector.stop();
                    }

                    if (toChannelId === fromChannel.id) {
                        await panel.edit({ content: "❌ Choisis un salon différent de ton salon actuel.", embeds: [], components: [] });
                        return collector.stop();
                    }

                    const members = [...fromChannel.members.values()];
                    let moved = 0;

                    for (const member of members) {
                        try {
                            await member.voice.setChannel(toChannel);
                            moved++;
                        } catch {
                            // membre non déplaçable (permissions manquantes, etc.)
                        }
                    }

                    await panel.edit({
                        content: `✅ ${moved}/${members.length} membre(s) déplacé(s) de ${fromChannel} vers ${toChannel}.`,
                        embeds: [],
                        components: [],
                    });

                    await sendModerationLog(message.guild, {
                        title: "Salon vocal déplacé en masse",
                        emoji: "🔀",
                        color: COLORS.NEUTRAL,
                        target: null,
                        moderator: message.author,
                        reason: `${moved}/${members.length} membre(s) déplacé(s) de ${fromChannel.name} vers ${toChannel.name}`,
                    });

                    collector.stop();
                }
            });

            collector.on("end", async (_collected, reason) => {
                if (reason === "time") {
                    await panel.edit({ components: [] }).catch(() => {});
                }
            });
        },
    },
    {
        name: "chanperms",
        description: "Liste les droits (rôles + membres) de tous les salons dans un fichier .txt ($chanperms)",
        permissions: [PermissionFlagsBits.ManageRoles],
        execute: async (message) => {
            const guild = message.guild;
            await guild.members.fetch();

            const formatChannelBlock = (channel) => {
                const typeLabel = CHANNEL_TYPE_LABELS[channel.type] || "❓";
                const header = `-- ${typeLabel} #${channel.name} (${channel.id}) --`;
                const overwrites = [...channel.permissionOverwrites.cache.values()];

                if (overwrites.length === 0) {
                    return `${header}\n  (Aucune permission spécifique, hérite du serveur)`;
                }

                const entryLines = overwrites
                    .map((overwrite) => {
                        const isRole = overwrite.type === 0;
                        const subject = isRole ? guild.roles.cache.get(overwrite.id) : guild.members.cache.get(overwrite.id);
                        if (!subject) return null;

                        const name = isRole ? `@${subject.name}` : subject.user.tag;
                        const allowed = overwrite.allow.toArray().map(translatePermission);
                        const denied = overwrite.deny.toArray().map(translatePermission);

                        const parts = [`  - ${isRole ? "🎭" : "👤"} ${name}`];
                        if (allowed.length) parts.push(`      Autorisé : ${allowed.join(", ")}`);
                        if (denied.length) parts.push(`      Refusé   : ${denied.join(", ")}`);
                        return parts.join("\n");
                    })
                    .filter(Boolean);

                return `${header}\n${entryLines.join("\n")}`;
            };

            const allChannels = [...guild.channels.cache.values()].filter((c) => c.permissionOverwrites);
            const categories = allChannels
                .filter((c) => c.type === ChannelType.GuildCategory)
                .sort((a, b) => a.rawPosition - b.rawPosition);
            const nonCategoryChannels = allChannels.filter((c) => c.type !== ChannelType.GuildCategory);

            const lines = [
                `Permissions du serveur "${guild.name}"`,
                `Généré le ${new Date().toLocaleString("fr-FR")} par ${message.author.tag}`,
                "=".repeat(60),
            ];

            const uncategorized = nonCategoryChannels
                .filter((c) => !c.parentId)
                .sort((a, b) => a.rawPosition - b.rawPosition);
            if (uncategorized.length) {
                lines.push("", "[Sans catégorie]");
                for (const channel of uncategorized) lines.push("", formatChannelBlock(channel));
            }

            for (const category of categories) {
                lines.push("", `[Catégorie] ${category.name}`, formatChannelBlock(category));
                const children = nonCategoryChannels
                    .filter((c) => c.parentId === category.id)
                    .sort((a, b) => a.rawPosition - b.rawPosition);
                for (const channel of children) lines.push("", formatChannelBlock(channel));
            }

            const content = lines.join("\n");
            const attachment = new AttachmentBuilder(Buffer.from(content, "utf-8"), {
                name: `permissions-${guild.id}.txt`,
            });

            await message.reply({
                content: `📄 Permissions de ${allChannels.length} salon(s)/catégorie(s) sur **${guild.name}**.`,
                files: [attachment],
            });
        },
    },
    {
        name: "clear",
        description: "Supprime des messages ($clear <nombre>)",
        permissions: [PermissionFlagsBits.ManageMessages],
        execute: async (message, args) => {
            const amount = parseInt(args[0], 10);
            if (!amount || amount < 1 || amount > 100) {
                return message.reply("❌ Indique un nombre entre 1 et 100.");
            }

            await message.delete().catch(() => {});
            const deleted = await message.channel.bulkDelete(amount, true);
            const confirmation = await message.channel.send(`🧹 ${deleted.size} message(s) supprimé(s).`);
            setTimeout(() => confirmation.delete().catch(() => {}), 5000);

            await sendModerationLog(message.guild, {
                title: "Messages supprimés",
                emoji: "🧹",
                color: COLORS.NEUTRAL,
                target: null,
                moderator: message.author,
                reason: `${deleted.size} message(s) supprimé(s) dans ${message.channel}`,
            });
        },
    },
];

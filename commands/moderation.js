const {
    PermissionFlagsBits,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ComponentType,
    EmbedBuilder,
} = require("discord.js");
const { sendModerationLog } = require("../utils/logger");
const { getOrCreateMutedRole } = require("../utils/muteRole");

module.exports = [
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
                color: 0xffa500,
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
                color: 0xed4245,
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
                    color: 0x57f287,
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
                color: 0xfee75c,
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
                color: 0x57f287,
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
                    color: 0xfee75c,
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
                color: 0xfee75c,
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
                    color: 0x57f287,
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
                color: 0x57f287,
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
                color: 0xfaa61a,
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
                .setColor(0x5865f2);

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
                        color: 0x5865f2,
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
                color: 0x5865f2,
                target: null,
                moderator: message.author,
                reason: `${deleted.size} message(s) supprimé(s) dans ${message.channel}`,
            });
        },
    },
];

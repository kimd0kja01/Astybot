const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, AttachmentBuilder } = require("discord.js");
const { PREFIX } = require("../config/config");
const { getUserData, xpNeededForLevel, getRank } = require("../utils/levelSystem");
const { generateRankCard } = require("../utils/rankCard");
const { generateHelpBanner } = require("../utils/helpBanner");
const { generateServerStatsCard } = require("../utils/serverStatsCard");
const COLORS = require("../utils/colors");

module.exports = [
    {
        name: "srvstat",
        description: "Affiche les statistiques du serveur ($srvstat)",
        execute: async (message) => {
            const guild = message.guild;
            await guild.members.fetch();

            const onlineMembers = guild.members.cache.filter(
                (member) => member.presence && member.presence.status !== "offline"
            ).size;

            const buffer = await generateServerStatsCard({
                serverName: guild.name,
                iconURL: guild.iconURL({ extension: "png", size: 256 }),
                stats: [
                    { label: "Membres", value: guild.memberCount },
                    { label: "En ligne", value: onlineMembers },
                    { label: "Salons", value: guild.channels.cache.size },
                    { label: "Rôles", value: guild.roles.cache.size },
                ],
            });

            const attachment = new AttachmentBuilder(buffer, { name: "srvstat.png" });
            await message.reply({ files: [attachment] });
        },
    },
    {
        name: "level",
        description: "Affiche ta carte de niveau, ou celle d'un membre mentionné ($level [@membre])",
        execute: async (message) => {
            const target = message.mentions.members?.first() || message.member;
            const data = getUserData(message.guild.id, target.id);
            const xpForNext = xpNeededForLevel(data.level);
            const rank = getRank(message.guild.id, target.id);

            const buffer = await generateRankCard({
                username: target.displayName,
                avatarURL: target.user.displayAvatarURL({ extension: "png", size: 256 }),
                level: data.level,
                rank,
                messages: data.messages,
                xp: data.xp,
                xpForNext,
            });

            const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });
            await message.reply({ files: [attachment] });
        },
    },
    {
        name: "msg",
        description: "Fait envoyer un message au bot ($msg <texte>)",
        execute: async (message, args) => {
            const text = args.join(" ");
            if (!text) {
                return message.reply("❌ Tu dois écrire un message après `$msg`");
            }
            await message.delete().catch(() => {});
            await message.channel.send(text);
        },
    },
    {
        name: "ping",
        description: "Affiche la latence du bot ($ping)",
        execute: async (message, args, client) => {
            await message.reply(`🏓 Pong ! Latence : ${client.ws.ping}ms`);
        },
    },
    {
        name: "help",
        description: "Affiche la liste des commandes du bot ($help)",
        execute: async (message) => {
            const generalCommands = require("./general");
            const moderationCommands = require("./moderation");

            const formatList = (list) =>
                list.map((cmd) => `\`${PREFIX}${cmd.name}\` — ${cmd.description}`).join("\n");

            const categories = {
                general: {
                    label: "🛠️ Général",
                    description: "Commandes générales",
                    content: formatList(generalCommands),
                },
                moderation: {
                    label: "🔨 Modération",
                    description: "Commandes de modération",
                    content: formatList(moderationCommands),
                },
                reactionRoles: {
                    label: "🎭 Reaction Roles",
                    description: "Système de rôles par réaction",
                    content: "Certains salons contiennent des messages où réagir avec un emoji donne (ou retire) automatiquement un rôle.",
                },
            };

            const bannerBuffer = generateHelpBanner(message.client.user.username);
            const bannerAttachment = new AttachmentBuilder(bannerBuffer, { name: "help-banner.png" });

            const buildEmbed = (key, imageUrl) => {
                const category = categories[key];
                return new EmbedBuilder()
                    .setTitle(category.label)
                    .setDescription(category.content)
                    .setColor(COLORS.PRIMARY)
                    .setImage(imageUrl || "attachment://help-banner.png")
                    .setFooter({ text: `Préfixe actuel : ${PREFIX} • Choisis une catégorie ci-dessous` });
            };

            const menu = new StringSelectMenuBuilder()
                .setCustomId("help_category")
                .setPlaceholder("📂 Choisis une catégorie")
                .addOptions(
                    Object.entries(categories).map(([value, category]) => ({
                        label: category.label,
                        description: category.description,
                        value,
                    }))
                );

            const row = new ActionRowBuilder().addComponents(menu);

            const panel = await message.reply({
                embeds: [buildEmbed("general")],
                components: [row],
                files: [bannerAttachment],
            });

            // Une fois envoyée, l'image a une URL Discord stable : plus besoin de renvoyer le fichier à chaque mise à jour.
            const bannerUrl = panel.embeds[0]?.image?.url;

            const collector = panel.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                filter: (interaction) => interaction.user.id === message.author.id,
                time: 60_000,
            });

            collector.on("collect", async (interaction) => {
                await interaction.update({ embeds: [buildEmbed(interaction.values[0], bannerUrl)] });
            });

            collector.on("end", async () => {
                await panel.edit({ components: [] }).catch(() => {});
            });
        },
    },
];

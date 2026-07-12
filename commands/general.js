const { EmbedBuilder } = require("discord.js");
const { PREFIX } = require("../config/config");

module.exports = [
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
        execute: async (message, args, client) => {
            const generalCommands = require("./general");
            const moderationCommands = require("./moderation");

            const formatList = (list) =>
                list.map((cmd) => `\`${PREFIX}${cmd.name}\` — ${cmd.description}`).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("📖 Aide — Commandes disponibles")
                .setColor(0x5865f2)
                .addFields(
                    { name: "-----------🛠️ Général-----------", value: formatList(generalCommands) },
                    { name: "---------🔨 Modération----------", value: formatList(moderationCommands) },
                    { name: "----------🎭 Reaction Roles-----------", value: "Certains salons contiennent des messages où réagir avec un emoji donne (ou retire) automatiquement un rôle.",
                    }
                )
                .setFooter({ text: `Préfixe actuel : ${PREFIX}` });

            await message.reply({ embeds: [embed] });
        },
    },
];

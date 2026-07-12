require("dotenv").config();

const http = require("http");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");

// Serveur HTTP minimal requis par le plan gratuit de Render (Web Service),
// et utilisé comme cible de ping pour garder le bot éveillé.
http
    .createServer((req, res) => res.end("AstyBot est en ligne !"))
    .listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = loadCommands();
loadEvents(client);

client.login(process.env.TOKEN);

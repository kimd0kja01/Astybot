// Copie tout ce qui passe par console.log / console.error vers un salon Discord,
// en plus de l'affichage normal dans le terminal.

const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);

let consoleChannel = null;

function formatArgs(args) {
    return args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)))
        .join(" ");
}

function sendToChannel(prefix, args) {
    if (!consoleChannel) return;

    const content = `${prefix} ${formatArgs(args)}`.slice(0, 1900);
    consoleChannel.send(`\`\`\`\n${content}\n\`\`\``).catch(() => {});
}

function initConsoleChannel(client, channelId) {
    if (!channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        originalError("❌ Salon console introuvable (CONSOLE_CHANNEL_ID invalide).");
        return;
    }

    consoleChannel = channel;

    console.log = (...args) => {
        originalLog(...args);
        sendToChannel("📝", args);
    };

    console.error = (...args) => {
        originalError(...args);
        sendToChannel("⚠️", args);
    };
}

module.exports = { initConsoleChannel };

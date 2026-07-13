// Système de niveaux basé sur le nombre de messages envoyés, avec anti-spam (cooldown d'XP).
// Les données sont sauvegardées dans data/levels.json pour survivre aux redémarrages du bot.

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "levels.json");
const XP_COOLDOWN_MS = 60_000; // 1 minute entre deux gains d'XP par membre
const MIN_XP_PER_MESSAGE = 15;
const MAX_XP_PER_MESSAGE = 25;

let levels = {};
const cooldowns = new Map();

function load() {
    try {
        levels = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    } catch {
        levels = {};
    }
}

function save() {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(levels, null, 2));
}

load();

function getKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

function xpNeededForLevel(level) {
    return 5 * level * level + 50 * level + 100;
}

function getUserData(guildId, userId) {
    const key = getKey(guildId, userId);
    if (!levels[key]) {
        levels[key] = { xp: 0, level: 0, messages: 0 };
    }
    return levels[key];
}

function addMessageXp(guildId, userId) {
    const key = getKey(guildId, userId);
    const data = getUserData(guildId, userId);
    data.messages++;

    const now = Date.now();
    const lastGain = cooldowns.get(key) || 0;

    if (now - lastGain < XP_COOLDOWN_MS) {
        save();
        return { leveledUp: false, data };
    }
    cooldowns.set(key, now);

    const gainedXp = Math.floor(Math.random() * (MAX_XP_PER_MESSAGE - MIN_XP_PER_MESSAGE + 1)) + MIN_XP_PER_MESSAGE;
    data.xp += gainedXp;

    let leveledUp = false;
    while (data.xp >= xpNeededForLevel(data.level)) {
        data.xp -= xpNeededForLevel(data.level);
        data.level++;
        leveledUp = true;
    }

    save();
    return { leveledUp, data };
}

function getRank(guildId, userId) {
    const entries = Object.entries(levels)
        .filter(([key]) => key.startsWith(`${guildId}-`))
        .sort(([, a], [, b]) => b.level - a.level || b.xp - a.xp);

    const index = entries.findIndex(([key]) => key === getKey(guildId, userId));
    return index === -1 ? entries.length + 1 : index + 1;
}

function buildProgressBar(current, max, size = 20) {
    const ratio = Math.min(current / max, 1);
    const filled = Math.round(ratio * size);
    return "█".repeat(filled) + "░".repeat(size - filled);
}

module.exports = { getUserData, addMessageXp, xpNeededForLevel, getRank, buildProgressBar };

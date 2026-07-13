// Détection de spam par volume de messages : trop de messages envoyés trop vite -> sanction automatique.
const MESSAGE_LIMIT = 5;
const INTERVAL_MS = 5000;
const TIMEOUT_MINUTES = 5;

const messageLog = new Map(); // userId -> timestamps des derniers messages

function isSpamming(userId) {
    const now = Date.now();
    const recentTimestamps = (messageLog.get(userId) || []).filter((timestamp) => now - timestamp < INTERVAL_MS);
    recentTimestamps.push(now);
    messageLog.set(userId, recentTimestamps);

    return recentTimestamps.length > MESSAGE_LIMIT;
}

function resetUser(userId) {
    messageLog.delete(userId);
}

module.exports = { isSpamming, resetUser, MESSAGE_LIMIT, INTERVAL_MS, TIMEOUT_MINUTES };

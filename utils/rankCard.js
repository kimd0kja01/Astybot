// Génère une carte de niveau (image PNG) façon Mee6/Tatsu : avatar, niveau, rang et barre de progression.
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { roundRect, drawGalaxyBackground } = require("./galaxyTheme");

const WIDTH = 900;
const HEIGHT = 260;
const ACCENT = "#a970ff";

async function generateRankCard({ username, avatarURL, level, rank, messages, xp, xpForNext }) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Fond façon galaxie + coins arrondis
    ctx.save();
    roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
    ctx.clip();
    drawGalaxyBackground(ctx, WIDTH, HEIGHT);
    ctx.restore();

    // Avatar circulaire avec anneau
    const avatarSize = 160;
    const avatarX = 50;
    const avatarY = (HEIGHT - avatarSize) / 2;

    try {
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch {
        // avatar indisponible -> on garde le fond tel quel
    }

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 5;
    ctx.stroke();

    const textX = avatarX + avatarSize + 40;

    // Pseudo
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(username, textX, 90);

    // Niveau / rang / messages
    ctx.font = "26px sans-serif";
    ctx.fillStyle = "#b9bbbe";
    ctx.fillText(`Niveau ${level}   •   Rang #${rank}   •   ${messages} messages`, textX, 128);

    // Barre de progression XP
    const barX = textX;
    const barY = 170;
    const barWidth = WIDTH - barX - 50;
    const barHeight = 28;
    const progress = Math.min(xp / xpForNext, 1);

    ctx.fillStyle = "#3a3c4e";
    roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();

    if (progress > 0) {
        ctx.fillStyle = ACCENT;
        roundRect(ctx, barX, barY, Math.max(barWidth * progress, barHeight), barHeight, barHeight / 2);
        ctx.fill();
    }

    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(`${xp} / ${xpForNext} XP`, barX + barWidth, barY + barHeight + 32);
    ctx.textAlign = "left";

    return canvas.toBuffer("image/png");
}

module.exports = { generateRankCard };

// Génère la carte de statistiques du serveur (image PNG), même thème galaxie que $level/$poll.
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { roundRect, drawGalaxyBackground } = require("./galaxyTheme");

const WIDTH = 900;
const HEIGHT = 260;
const ACCENT = "#a970ff";

async function generateServerStatsCard({ serverName, iconURL, stats }) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.save();
    roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
    ctx.clip();
    drawGalaxyBackground(ctx, WIDTH, HEIGHT);
    ctx.restore();

    const iconSize = 140;
    const iconX = 50;
    const iconY = (HEIGHT - iconSize) / 2;

    if (iconURL) {
        try {
            const icon = await loadImage(iconURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
            ctx.restore();
        } catch {
            // icône indisponible -> on garde le fond tel quel
        }
    }

    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 5;
    ctx.stroke();

    const textX = iconX + iconSize + 40;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(serverName, textX, 75);

    const statY = 160;
    const statWidth = (WIDTH - textX - 40) / stats.length;

    stats.forEach((stat, index) => {
        const x = textX + index * statWidth;

        ctx.textAlign = "left";
        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = ACCENT;
        ctx.fillText(`${stat.value}`, x, statY);

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#c9c9e8";
        ctx.fillText(stat.label, x, statY + 30);
    });

    return canvas.toBuffer("image/png");
}

module.exports = { generateServerStatsCard };

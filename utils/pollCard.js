// Génère l'image d'un sondage (question + barres de résultats), même thème galaxie que $level.
const { createCanvas } = require("@napi-rs/canvas");
const { roundRect, drawGalaxyBackground } = require("./galaxyTheme");

const WIDTH = 900;
const HEADER_HEIGHT = 90;
const OPTION_HEIGHT = 60;
const PADDING_BOTTOM = 30;
const ACCENT = "#a970ff";

const POLL_EMOJIS = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"];

function truncateText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;

    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(`${truncated}…`).width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return `${truncated}…`;
}

function generatePollCard({ question, options, votes, totalVotes }) {
    const height = HEADER_HEIGHT + options.length * OPTION_HEIGHT + PADDING_BOTTOM;
    const canvas = createCanvas(WIDTH, height);
    const ctx = canvas.getContext("2d");

    ctx.save();
    roundRect(ctx, 0, 0, WIDTH, height, 24);
    ctx.clip();
    drawGalaxyBackground(ctx, WIDTH, height);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(truncateText(ctx, question, WIDTH - 80), 40, 55);

    const barX = 40;
    const barWidth = WIDTH - 80;
    const barHeight = 30;

    options.forEach((option, index) => {
        const y = HEADER_HEIGHT + index * OPTION_HEIGHT;
        const count = votes[index] || 0;
        const percentage = totalVotes > 0 ? count / totalVotes : 0;

        ctx.font = "22px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        const letter = String.fromCharCode(65 + index); // A, B, C, ...
        const label = truncateText(ctx, `${letter}. ${option}`, barWidth * 0.6);
        ctx.fillText(label, barX, y + 18);

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#c9c9e8";
        ctx.textAlign = "right";
        ctx.fillText(`${count} vote(s) - ${Math.round(percentage * 100)}%`, barX + barWidth, y + 18);
        ctx.textAlign = "left";

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        roundRect(ctx, barX, y + 26, barWidth, barHeight, barHeight / 2);
        ctx.fill();

        if (percentage > 0) {
            ctx.fillStyle = ACCENT;
            roundRect(ctx, barX, y + 26, Math.max(barWidth * percentage, barHeight), barHeight, barHeight / 2);
            ctx.fill();
        }
    });

    return canvas.toBuffer("image/png");
}

module.exports = { generatePollCard, POLL_EMOJIS };

// Génère la bannière d'en-tête (image PNG) du menu d'aide, même thème galaxie que la carte de niveau.
const { createCanvas } = require("@napi-rs/canvas");
const { roundRect, drawGalaxyBackground } = require("./galaxyTheme");

const WIDTH = 900;
const HEIGHT = 180;

function generateHelpBanner(botName) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.save();
    roundRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
    ctx.clip();
    drawGalaxyBackground(ctx, WIDTH, HEIGHT);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(`Centre d'aide — ${botName}`, 40, 92);

    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#c9c9e8";
    ctx.fillText("Choisis une catégorie dans le menu ci-dessous", 40, 132);

    return canvas.toBuffer("image/png");
}

module.exports = { generateHelpBanner };

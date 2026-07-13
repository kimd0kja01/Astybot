// Thème visuel partagé pour les images générées par le bot (carte de niveau, bannière d'aide, ...) :
// fond façon galaxie/nébuleuse (dégradé bleu nuit -> violet, halo lumineux, étoiles).

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function drawGalaxyBackground(ctx, width, height) {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#0b0f2e");
    background.addColorStop(0.5, "#1c1440");
    background.addColorStop(1, "#2a1a4a");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Halo lumineux (nébuleuse), tons rose/orange/violet
    const glow = ctx.createRadialGradient(
        width * 0.55, height * 1.05, 10,
        width * 0.55, height * 1.05, width * 0.6
    );
    glow.addColorStop(0, "rgba(255, 190, 120, 0.55)");
    glow.addColorStop(0.35, "rgba(255, 110, 180, 0.35)");
    glow.addColorStop(0.7, "rgba(120, 80, 220, 0.18)");
    glow.addColorStop(1, "rgba(120, 80, 220, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Second halo plus discret (bleu/cyan)
    const glow2 = ctx.createRadialGradient(
        width * 0.85, height * 0.1, 5,
        width * 0.85, height * 0.1, width * 0.35
    );
    glow2.addColorStop(0, "rgba(120, 200, 255, 0.25)");
    glow2.addColorStop(1, "rgba(120, 200, 255, 0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // Étoiles (seed fixe pour un rendu stable)
    let seed = 42;
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    const starCount = Math.round((width * height) / 2500);
    for (let i = 0; i < starCount; i++) {
        const x = random() * width;
        const y = random() * height;
        const radius = random() * 1.4 + 0.3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + random() * 0.6})`;
        ctx.fill();
    }
}

module.exports = { roundRect, drawGalaxyBackground };

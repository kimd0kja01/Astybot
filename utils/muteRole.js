// Rôle utilisé pour le mute textuel ($mute text). Créé automatiquement si absent.
async function getOrCreateMutedRole(guild) {
    let role = guild.roles.cache.find((r) => r.name === "Muted");
    if (role) return role;

    role = await guild.roles.create({
        name: "Muted",
        color: 0x818386,
        reason: "Rôle utilisé pour le mute textuel des membres",
    });

    await Promise.all(
        guild.channels.cache.map((channel) =>
            channel.permissionOverwrites
                ?.edit(role, { SendMessages: false, AddReactions: false })
                .catch(() => {})
        )
    );

    return role;
}

module.exports = { getOrCreateMutedRole };

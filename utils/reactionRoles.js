// Mapping messageID -> { emoji: roleID }
const REACTION_ROLES = {
    "1525619243083628544": {
        "🔴": "1503446710125465792",
        "🟠": "1503447682411397231",
        "🟡": "1503447803077333124",
        "🟢": "1503448208012214424",
        "🔵": "1503448641807843420",
        "🟦": "1503449020247314442",
        "🟣": "1503449252855156746",
        "💮": "1503449576533790831",
        "⚪": "1503450072380346498",
    },
    "1525624177468379146": {
        "🔫": "1507136135850234056",
        "⛏️": "1507135944187183144",
        "⚔️": "1507136185514852484",
        "♟️": "1507138389126942882",
        "🎮": "1507136250753187870",
    },
};

async function resolvePartial(reaction) {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch {
            return false;
        }
    }
    return true;
}

function resolveRole(reaction) {
    const roles = REACTION_ROLES[reaction.message.id];
    if (!roles) return null;
    return roles[reaction.emoji.name] || null;
}

async function handleReactionAdd(reaction, user) {
    if (user.bot) return;
    if (!(await resolvePartial(reaction))) return;

    const roleID = resolveRole(reaction);
    if (!roleID) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    const role = reaction.message.guild.roles.cache.get(roleID);
    if (!role) return;

    await member.roles.add(role);
    console.log(`${user.tag} a reçu le rôle ${role.name}`);
}

async function handleReactionRemove(reaction, user) {
    if (user.bot) return;
    if (!(await resolvePartial(reaction))) return;

    const roleID = resolveRole(reaction);
    if (!roleID) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    const role = reaction.message.guild.roles.cache.get(roleID);
    if (!role) return;

    await member.roles.remove(role);
    console.log(`${user.tag} a perdu le rôle ${role.name}`);
}

module.exports = { REACTION_ROLES, handleReactionAdd, handleReactionRemove };

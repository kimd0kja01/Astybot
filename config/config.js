module.exports = {
    PREFIX: "$",
    LOG_CHANNEL_ID: "1525630665486237896",
    // Salon qui reçoit une copie de la console (console.log / console.error). Laisse vide pour désactiver.
    CONSOLE_CHANNEL_ID: "1525858066699124867",
    // Salon vocal "générateur" : le rejoindre crée un salon temporaire et y déplace le membre.
    JOIN_TO_CREATE_CHANNEL_ID: "1505628515629011095",

    // Onboarding : rôle donné automatiquement à l'arrivée d'un membre.
    WELCOME_ROLE_ID: "1487519595932680384",
    // Message du règlement à réagir pour valider l'arrivée.
    RULES_MESSAGE_ID: "1503464843167010868",
    RULES_REACTION_EMOJI: "✅",
    // Rôle donné (et qui remplace WELCOME_ROLE_ID) une fois le règlement accepté.
    RISING_STAR_ROLE_ID: "1503467010498236528",

    // IDs des membres exemptés de l'anti-spam.
    ANTISPAM_BYPASS_USERS: ["260839159004921856"],
};

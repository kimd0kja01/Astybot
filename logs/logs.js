module.exports = (client) => {
    const logChannel = "1507462954763813135";

    client.on("messageDelete", async message => {

        if(!message.guild) return;
        const channel = message.guild.channels.cache.get(logChannel);
        if(!channel) return;

        channel.send(
            `🗑️ **Message supprimé**\n` +
            `Auteur : ${message.author}\n` +
            `Salon : ${message.channel}\n` +
            `Message : ${message.content || "Image/Fichier"}`
        );

    });

    client.on("guildMemberAdd", member => {

        const channel = member.guild.channels.cache.get(logChannel);
        if(channel)
        channel.send(
            `📥 ${member} vient de rejoindre le serveur`
        );

    });


    client.on("guildMemberRemove", member => {
        const channel = member.guild.channels.cache.get(logChannel);
        if(channel)
        channel.send(
            `📤 ${member.user.tag} a quitté le serveur`
        );
    });

};
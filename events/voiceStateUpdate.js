const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { JOIN_TO_CREATE_CHANNEL_ID } = require("../config/config");
const { activeChannels } = require("../utils/tempVoiceChannels");

module.exports = {
    name: "voiceStateUpdate",
    execute: async (oldState, newState) => {
        // Le membre rejoint le salon générateur -> on lui crée un salon temporaire
        if (JOIN_TO_CREATE_CHANNEL_ID && newState.channelId === JOIN_TO_CREATE_CHANNEL_ID) {
            const triggerChannel = newState.channel;

            try {
                // Overwrites du salon générateur, sans doublon pour le créateur (ajouté juste après).
                const baseOverwrites = [...triggerChannel.permissionOverwrites.cache.values()].filter(
                    (overwrite) => overwrite.id !== newState.member.id
                );

                const tempChannel = await newState.guild.channels.create({
                    name: `🔊 Salon de ${newState.member.displayName}`,
                    type: ChannelType.GuildVoice,
                    parent: triggerChannel.parentId,
                    permissionOverwrites: [
                        ...baseOverwrites,
                        {
                            id: newState.member.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.Speak,
                                // "Admin" du salon : modifier nom/limite d'utilisateurs, lock/unlock (permissions), déplacer/mute/deafen.
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.ManageRoles,
                                PermissionFlagsBits.MoveMembers,
                                PermissionFlagsBits.MuteMembers,
                                PermissionFlagsBits.DeafenMembers,
                            ],
                        },
                    ],
                });

                activeChannels.add(tempChannel.id);
                await newState.member.voice.setChannel(tempChannel);
            } catch (error) {
                console.error("Erreur lors de la création du salon temporaire :", error);
            }
        }

        // Le membre quitte un salon temporaire -> on le supprime s'il est vide
        if (oldState.channelId && activeChannels.has(oldState.channelId)) {
            const channel = oldState.channel;
            if (channel && channel.members.size === 0) {
                activeChannels.delete(channel.id);
                await channel.delete().catch(() => {});
            }
        }
    },
};

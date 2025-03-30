import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, Message } from 'discord.js';

export default class Mentioned extends GargoyleEvent {
    public event = Events.MessageCreate as const;
    /**
     * Handles the voice state update event for a Discord guild member.
     * Tracks when a user joins or leaves a voice channel and updates their voice activity in the database.
     *
     * @param client - The GargoyleClient instance.
     * @param oldState - The previous voice state of the member.
     * @param newState - The new voice state of the member.
     */
    public execute(client: GargoyleClient, message: Message): void {
        if (message.author.bot) return;

        let prefix = client.prefix;

        if (client.db) {
            client.db.getGuild(message.guild!.id).then((guild) => {
                if (guild && guild.prefix) {
                    prefix = guild.prefix;
                }
            });
        }

        const mentions = message.mentions.users;
        if (mentions.has(client.user!.id)) {
            message.reply({ content: `Hello! Use \`${prefix}\`help\` to get a better overview of my commands and features.` });
        }
    }
}

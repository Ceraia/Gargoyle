import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/classes/gargoyleEvent.js';
import { Message } from 'discord.js';

export default class MessageCreate extends GargoyleEvent {
    public event = 'messageCreate' as const;
    public once = false;

    public execute(client: GargoyleClient, message: Message): void {
        if (message.author.bot) return;
        client.logger.debug(`Message received from ${message.author.tag} in ${message.guild?.name ?? 'DMs'}: ${message.content}`);
    }
}

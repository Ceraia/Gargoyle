import GargoyleClient from '@src/system/classes/clientClass.js';
import GargoyleCommand from '@src/system/classes/commandClass.js';
import GargoyleEvent from '@src/system/classes/eventClass.js';
import { ChatInputCommandInteraction, Message, TextChannel } from 'discord.js'; // Test

class MessageCreate extends GargoyleEvent

export default async (client: GargoyleClient, message: Message): Promise<void> => {
    if(message.author.bot) return;
    if(message.content.startsWith("ping")) {
        (message.channel as TextChannel).send("Pong!");
        client.debug("Ponged!");
    }
};

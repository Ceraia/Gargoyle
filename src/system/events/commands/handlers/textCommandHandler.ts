import GargoyleClient from '@src/system/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/classes/gargoyleEvent.js';
import { Message } from 'discord.js';

export default class TextCommandHandler extends GargoyleEvent {
    public event = 'messageCreate' as const;

    public execute(client: GargoyleClient, message: Message): void {
        if (message.author.bot) return;

        if (!message.content.toLowerCase().startsWith(client.prefix.toLowerCase())) return;

        const commandName = message.content.slice(client.prefix.length).split(' ')[0].toLowerCase();

        const command = client.commands.find((command) => {
            return command.textCommand?.name === commandName || command.textCommand?.aliases?.includes(commandName);
        });

        if (!command) {
            message.reply('Command not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            command.executeTextCommand(client, message);
            return client.logger.trace(`${message.author.tag} used the ${command.textCommand?.name} command.`);
        }
    }
}

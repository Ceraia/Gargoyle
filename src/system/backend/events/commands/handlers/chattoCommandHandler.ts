import ChattoEvent from '@src/system/backend/classes/chattoEvent';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import { Message } from 'chatto.ts';

export default class TextCommandHandler extends ChattoEvent {
    public event = 'messageCreate' as const;
    private mentionPrefix = `@${process.env.CHATTO_USER}`;

    public async execute(client: GargoyleClient, message: Message): Promise<void> {
        if (message.author.displayName.toLowerCase().includes('bot') || message.author.username.toLowerCase().includes('bot')) return;

        if (!message.content) return;

        if (!message.content.toLowerCase().startsWith('/') && !message.content.toLowerCase().startsWith(this.mentionPrefix)) return;

        let commandName = '';
        if (message.content.toLowerCase().startsWith('/')) {
            commandName = message.content.slice(1).split(' ')[0].toLowerCase().trim();
        }
        if (message.content.toLowerCase().startsWith(this.mentionPrefix)) {
            commandName = message.content
                .slice(this.mentionPrefix.length + 1)
                .split(' ')[0]
                .toLowerCase()
                .trim();
        }

        const command = client.modules.find((command) => {
            return command.chattoCommands.find((chattoCommand) => chattoCommand.name === commandName || chattoCommand.aliases.includes(commandName));
        });

        if (!command) {
            message.reply('Command not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            if (message.content.toLowerCase().startsWith('/')) {
                Promise.resolve(command.executeChattoCommand(client, message, ...message.content.slice(1).trim().split(' '))).catch((error) => {
                    client.logger.error(`Error executing chatto command ${command.name}: ${error}`);
                });
            }
            if (message.content.toLowerCase().startsWith(this.mentionPrefix)) {
                Promise.resolve(
                    command.executeChattoCommand(
                        client,
                        message,
                        ...message.content
                            .slice(this.mentionPrefix.length + 1)
                            .trim()
                            .split(' ')
                    )
                ).catch((error) => {
                    client.logger.error(`Error executing chatto command ${command.name}: ${error}`);
                });
            }

            client.logger.trace(`${message.author.username} used the ${command.name} chatto command.`);
        }
    }
}

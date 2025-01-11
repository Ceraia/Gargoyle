import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { ChannelType, InteractionContextType, Message } from 'discord.js';

export default class TextCommandHandler extends GargoyleEvent {
    public event = 'messageCreate' as const;

    public execute(client: GargoyleClient, message: Message): void {
        if (message.author.bot) return;

        if (!message.content.toLowerCase().startsWith(client.prefix.toLowerCase())) return;

        const commandName = message.content.slice(client.prefix.length).split(' ')[0].toLowerCase();

        const command = client.commands.find((command) => {
            return (
                command.textCommand?.name === commandName ||
                command.textCommand?.aliases?.includes(commandName) ||
                command.textCommands.find((textCommand) => {
                    return textCommand.name === commandName || textCommand.aliases?.includes(commandName);
                })
            );
        });

        let textCommand = command?.textCommands.find((textCommand) => {
            return (
                textCommand.name === commandName ||
                textCommand.aliases?.includes(commandName)
            );
        });

        if (!textCommand) textCommand = command?.textCommand ?? undefined;

        if (!command || !textCommand) {
            message.reply('Command not found!').then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        } else {
            client.logger.trace(`${message.author.tag} used the ${command.textCommand?.name} command.`);

            if (message.guild &&
                !textCommand.contexts.includes(InteractionContextType.Guild)
            ) {
                message.reply('This command cannot be used in Guilds!').then((msg) => {
                    setTimeout(() => {
                        msg.delete();
                    }, 5000);
                });
                return;
            }

            if (message.channel.type === ChannelType.DM &&
                !textCommand.contexts.includes(InteractionContextType.PrivateChannel)
            ) {
                message.reply('This command cannot be used in DMs!').then((msg) => {
                    setTimeout(() => {
                        msg.delete();
                    }, 5000);
                });
                return;
            }

            if (
                message.guild && // If the command is in a guild,
                textCommand?.guilds && // and the command has guild requirements
                textCommand?.guilds.length > 0 && // that are not empty,
                !textCommand?.guilds.includes(message.guild.id) // but the guild is not in the guld requirements
            )
                return;

            command.executeTextCommand(client, message);
        }
    }
}

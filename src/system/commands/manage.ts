import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { Message } from 'discord.js';

export default class Manage extends GargoyleCommand {
    override category: string = 'base';
    override textCommands = [
        new GargoyleTextCommandBuilder().setName('manage').setDescription('Management').addAlias('mgmt').setPrivate(true),
        new GargoyleTextCommandBuilder().setName('whois').setDescription('Who is this?').setPrivate(true)
    ];

    public override async executeTextCommand(client: GargoyleClient, message: Message, ...args: string[]): Promise<void> {
        if (message.author.id !== '244173330431737866') return;
        if (args[0] === 'whois') {
            const user = await client.users.fetch(args[1]).catch(async (err) => {
                await message.reply(`Error trying to find user: \`${err.message}\``);
                return;
            });

            if (user) await message.reply(`User: ${user.tag}\nID: ${user.id}`);
        } else if (args[0] === 'manage' || args[0] === 'mgmt') {
            if (args.length > 1) {
                if (args[1] === 'guilds') {
                    const guilds = await client.guilds.fetch();
                    let guildList = '';
                    for (const guild of guilds) {
                        guildList += client.guilds.cache.get(guild[0])?.name + '\n';
                    }

                    message.member?.send(guildList);
                }
            }
        }
    }
}

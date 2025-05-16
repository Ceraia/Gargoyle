import GargoyleTextCommandBuilder from '@builders/gargoyleTextCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import {Message} from 'discord.js';

export default class Manage extends GargoyleCommand {
    override category: string = 'base';
    override textCommands = [
        new GargoyleTextCommandBuilder().setName('manage').setDescription('Management').addAlias('mgmt').setPrivate(true)
    ];

    public override async executeTextCommand(client: GargoyleClient, message: Message, ...args: string[]): Promise<void> {
        if(message.author.id !== "244173330431737866")
        if(args.length > 0) {
            if(args[0] === "guilds") {
                const guilds = await client.guilds.fetch();
                let guildList =''
                for (const guild of guilds){
                    guildList += client.guilds.cache.get(guild[0])?.name + '\n'
                }

                message.member?.send(guildList)
            }
        }
    }
}

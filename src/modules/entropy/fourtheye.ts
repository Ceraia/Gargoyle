import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { Canvas, loadImage } from 'canvas';
import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    Guild,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    RGBTuple,
    TextChannel,
    TextDisplayBuilder
} from 'discord.js';

export default class FourthEye extends GargoyleModule {
    public override category: string = 'entropy';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('fourtheye')
            .setDescription("Use Entropy's Fourth Eye moderation tools")
            .addSubcommand((subcommand) => subcommand.setName('rules').setDescription('Get the server rules')) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'rules') {
            if (!interaction.guild) {
                interaction.reply({ content: 'This command can only be used in a server.', flags: [MessageFlags.Ephemeral] });
                return;
            }

            const rules = (await this.rulesMessage(interaction.guild)) as MessageCreateOptions;
            (interaction.channel as TextChannel).send(rules);
            await interaction.reply({ content: 'Posted the server rules.', flags: [MessageFlags.Ephemeral] });
            return;
        }
    }

    private async rulesMessage(guild: Guild): Promise<MessageCreateOptions | MessageEditOptions> {
        const container = new ContainerBuilder();

        if (guild.iconURL({ extension: 'png', size: 1024 })) {
            container.setAccentColor(await getAverageColor(guild.iconURL({ extension: 'png', size: 1024 })!));
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# Rules in this Discord` +
                    `\n-# To be followed by all members of ${guild.name}` +
                    `\n## Follow Discord's TOS and Community Guidelines.` +
                    `\n-# [Discord TOS](https://discord.com/terms), [Hateful Conduct](https://discord.com/safety/hateful-conduct-policy-explainer)`
            )
        );

        return {
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        };
    }
}

async function getAverageColor(imageUrl: string): Promise<RGBTuple> {
    const canvas = new Canvas(1, 1);
    const ctx = canvas.getContext('2d');

    const image = await loadImage(imageUrl);
    ctx.drawImage(image, 0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1).data;

    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];

    return [r, g, b];
}

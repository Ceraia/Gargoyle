import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { Canvas, loadImage } from 'canvas';
import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    Events,
    Guild,
    Message,
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

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
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

    public override events: GargoyleEvent[] = [new FourthEyeClassification()];
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

class FourthEyeClassification extends GargoyleEvent {
    constructor() {
        super();
        this.checkQueue();
    }
    public override event = Events.MessageCreate as const;
    /**
     * A queue to store messages for classification
     * Key: Channel ID
     * Value: Message object
     */
    private messageQueue: Map<string, Message[]> = new Map();
    public override execute(_client: GargoyleClient, message: Message): void {
        /**
         * This is a proprietary module and is not fully open source.
         * However, this service is run by Ceraia and does not store any data.
         * It uses the `GPT-OSS:20B` to classify messages to flag a moderator if it believes the message is harmful.
         * This runs only on servers owned by Axodouble, however a similar implementation can be made for other servers upon request.
         */

        if (message.author.bot) return;
        if (message.guildId !== '1009048008857493624') return; // Only run on Entropy's Server
        this.messageQueue.set(message.channel.id, [...(this.messageQueue.get(message.channel.id) || []), message]);
        // If more than 2000 characters in the queue, check immediately
        const totalLength = (this.messageQueue.get(message.channel.id) || []).reduce((acc, msg) => acc + msg.content.length, 0);
        if (totalLength >= 2000) {
            this.checkChannel(message.channel.id);
            return;
        }
    }

    private checkQueue(): void {
        // Check every 1 minute
        setInterval(() => {
            for (const [channelId, messages] of this.messageQueue.entries()) {
                if (messages.length > 0) {
                    this.checkChannel(channelId);
                }
            }
        }, 60000);
    }

    /**
     * Check a channel's messages in the queue and classify them.
     * @param channelId The channel to check in the queue.
     * @returns The messages checked and their classification.
     */
    private async checkChannel(channelId: string): Promise<{ messages: Message[]; category: 'Safe' | 'Flagged' }> {
        const messages = (this.messageQueue.get(channelId) || []).join('\n');

        const response = await fetch('https://api.cer.sh/api/v1/ai/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.CERSH_API_KEY}`
            },
            body: JSON.stringify({ text: messages })
        });

        const category = (await response.text()) === 'Safe' ? 'Safe' : 'Flagged';

        return { messages: this.messageQueue.get(channelId) || [], category: category };
    }
}

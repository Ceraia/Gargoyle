import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { createCanvas, Image } from 'canvas';
import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';

export default class Ceraia extends GargoyleModule {
    public override category: string = 'ceraia';
    public override slashCommands = [
        new GargoyleSlashCommandBuilder()
            .setName('svg')
            .setDescription('SVG Utilities')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('emoji')
                    .setDescription('Generate an emoji from SVG')
                    .addAttachmentOption((option) => option.setName('svg').setDescription('The SVG file to convert').setRequired(true))
                    .addStringOption((option) => option.setName('color').setDescription('The color to apply to the SVG').setRequired(false))
                    .addBooleanOption((option) =>
                        option.setName('forcefill').setDescription('Force fill the SVG with the specified color').setRequired(false)
                    )
                    .addBooleanOption((option) => option.setName('upload').setDescription('Upload the generated emoji').setRequired(false))
            ) as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const svgFile = interaction.options.getAttachment('svg');
        let color = interaction.options.getString('color');
        const forceFill = interaction.options.getBoolean('forcefill');
        const upload = interaction.options.getBoolean('upload');

        // Validate SVG file
        if (!svgFile?.contentType?.startsWith('image/svg+xml')) {
            await interaction.editReply({ content: 'Please provide a valid SVG file.' });
            return;
        }

        if (color && !color.startsWith('#')) color = `#${color}`;
        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            await interaction.editReply({ content: 'Color must be a valid hex code (e.g., #FF5733).' });
            return;
        }

        try {
            client.logger.trace(`Generating emoji from SVG: ${svgFile.name}`);

            // Fetch SVG content
            const response = await fetch(svgFile.url);
            if (!response.ok) {
                await interaction.editReply({ content: 'Failed to fetch the SVG file.' });
                client.logger.error(`Failed to fetch SVG: ${response.statusText}`);
                return;
            }
            let svgText = await response.text();

            // Ensure SVG has width/height
            svgText = svgText.replace(/width="[^"]*"/g, 'width="1024"').replace(/height="[^"]*"/g, 'height="1024"');
            if (!svgText.includes('width=') || !svgText.includes('height=')) {
                svgText = svgText.replace(/<svg([^>]*)>/, '<svg$1 width="1024" height="1024">');
            }

            // Apply color if provided
            if (color) {
                svgText = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
                if (!svgText.includes('fill=') && forceFill) {
                    svgText = svgText.replace(/<svg([^>]*)>/, `<svg$1 fill="${color}">`);
                }
            }

            // Render SVG to PNG
            const canvas = createCanvas(256, 256);
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = async () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const buffer = canvas.toBuffer('image/png');

                // Upload as emoji if requested and permitted
                if (upload && interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuildExpressions)) {
                    const emojiName = svgFile.name.replace(/-/g, '').split('.')[0].padEnd(2, '_');
                    const emoji = await interaction.guild?.emojis.create({ name: emojiName, attachment: buffer });
                    await interaction.followUp({ content: emoji ? `Emoji created: ${emoji}` : 'Failed to create emoji.' });
                    client.logger.error(`Failed to create emoji: ${emoji ? emoji.id : 'Unknown error'}`);
                    return;
                }

                // Otherwise, send as file attachment
                await interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(0x1fad9a)
                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder().addItems(
                                    new MediaGalleryItemBuilder().setURL(`attachment://${svgFile.name.split('.')[0]}.png`)
                                )
                            )
                    ],
                    files: [{ attachment: buffer, name: `${svgFile.name.split('.')[0]}.png` }],
                    flags: MessageFlags.IsComponentsV2
                });
            };

            img.src = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
        } catch (error) {
            client.logger.error(`SVG Emoji Generation Error: ${error}`);
            await interaction.editReply({ content: 'An error occurred while processing the SVG file.' });
        }
    }
}

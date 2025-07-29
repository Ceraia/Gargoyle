import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { createCanvas, Image } from 'canvas';
import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';

export default class Ceraia extends GargoyleCommand {
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
        if (interaction.commandName === 'svg') {
            if (interaction.options.getSubcommand() === 'emoji') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const svgFile = interaction.options.getAttachment('svg');
                const color = interaction.options.getString('color');

                if (!svgFile || !svgFile.contentType || !svgFile.contentType.startsWith('image/svg+xml')) {
                    interaction.editReply({ content: 'Please provide a valid SVG file.' });
                    return;
                }

                if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    interaction.editReply({ content: 'Color must be a valid hex code (e.g., #FF5733).' });
                    return;
                }

                try {
                    client.logger.trace(`Generating emoji from SVG: ${svgFile.name}`);
                    // Create a canvas to draw the SVG
                    const canvas = createCanvas(256, 256);
                    const ctx = canvas.getContext('2d');

                    // Load the SVG content
                    const svgContent = svgFile.url;
                    const fetchedSvg = await fetch(svgContent);

                    if (!fetchedSvg.ok) {
                        await interaction.editReply({ content: 'Failed to fetch the SVG file.' });
                        return;
                    }

                    client.logger.trace(`SVG file fetched successfully: ${svgFile.name}`);

                    let svgText = await fetchedSvg.text();

                    // If a color is provided, modify the SVG content to use that color
                    let modifiedSvgText = svgText;

                    modifiedSvgText = modifiedSvgText.replace(/width="[^"]*"/g, 'width="1024"');
                    modifiedSvgText = modifiedSvgText.replace(/height="[^"]*"/g, 'height="1024"');

                    if (!modifiedSvgText.includes('width=') || !modifiedSvgText.includes('height=')) {
                        modifiedSvgText = modifiedSvgText.replace(/<svg([^>]*)>/, '<svg$1 width="1024" height="1024">');
                    }

                    if (color) {
                        // Replace fill attributes with the new color
                        modifiedSvgText = modifiedSvgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
                        // Add fill attribute to svg element if it doesn't exist
                        if (!modifiedSvgText.includes('fill=') && interaction.options.getBoolean('forcefill')) {
                            modifiedSvgText = modifiedSvgText.replace(/<svg([^>]*)>/, `<svg$1 fill="${color}">`);
                        }
                    }

                    const img = new Image();
                    img.onload = async () => {
                        client.logger.trace(`SVG image loaded successfully: ${svgFile.name}`);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // Convert the canvas to a PNG buffer
                        const buffer = canvas.toBuffer('image/png');
                        client.logger.trace(`SVG image converted to PNG buffer: ${svgFile.name}`);

                        if (
                            interaction.options.getBoolean('upload') &&
                            interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuildExpressions)
                        ) {
                            const emoji = await interaction.guild?.emojis.create({
                                name: svgFile.name.split('.')[0].padEnd(2, '_'),
                                attachment: buffer
                            });

                            if (emoji) {
                                interaction.followUp({ content: `Emoji created: ${emoji.toString()}` });
                            } else {
                                interaction.followUp({ content: 'Failed to create emoji.' });
                            }
                            return;
                        } else {
                            // Send the emoji as a file attachment
                            interaction.editReply({
                                components: [
                                    new ContainerBuilder()
                                        .setAccentColor(0x1fad9a)
                                        .addMediaGalleryComponents(
                                            new MediaGalleryBuilder().addItems(
                                                new MediaGalleryItemBuilder().setURL(`attachment://${svgFile.name.split('.')[0]}.png`)
                                            )
                                        )
                                ],
                                files: [
                                    {
                                        attachment: buffer,
                                        name: `${svgFile.name.split('.')[0]}.png`
                                    }
                                ],
                                flags: MessageFlags.IsComponentsV2
                            });
                        }
                    };
                    img.src = `data:image/svg+xml;base64,${Buffer.from(modifiedSvgText).toString('base64')}`;
                } catch (error) {
                    client.logger.error(`SVG Emoji Generation Error: ${error}`);
                    interaction.editReply({ content: 'An error occurred while processing the SVG file.' });
                }
            }
        }
    }
}

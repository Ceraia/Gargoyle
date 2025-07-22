import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleCommand from '@src/system/backend/classes/gargoyleCommand.js';
import { createCanvas, Image } from 'canvas';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { int } from 'zod/v4';

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

                // Create a canvas to draw the SVG
                const canvas = createCanvas(256, 256);
                const ctx = canvas.getContext('2d');

                // Load the SVG content
                const svgContent = svgFile.url;
                fetch(svgContent)
                    .then((response) => response.text())
                    .then((svgText) => {
                        // If a color is provided, modify the SVG content to use that color
                        let modifiedSvgText = svgText;
                        if (color) {
                            // Replace fill attributes with the new color
                            modifiedSvgText = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
                            // Add fill attribute to svg element if it doesn't exist
                            if (!modifiedSvgText.includes('fill=')) {
                                modifiedSvgText = modifiedSvgText.replace(/<svg([^>]*)>/, `<svg$1 fill="${color}">`);
                            }
                        }

                        // Scale up the SVG by modifying width and height attributes
                        modifiedSvgText = modifiedSvgText.replace(/width="[^"]*"/g, 'width="1024"');
                        modifiedSvgText = modifiedSvgText.replace(/height="[^"]*"/g, 'height="1024"');

                        // If no width/height attributes exist, add them to the svg element
                        if (!modifiedSvgText.includes('width=') || !modifiedSvgText.includes('height=')) {
                            modifiedSvgText = modifiedSvgText.replace(/<svg([^>]*)>/, '<svg$1 width="1024" height="1024">');
                        }

                        // Create an image from the SVG
                        const img = new Image();
                        img.onload = () => {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                            // Convert the canvas to a PNG buffer
                            const buffer = canvas.toBuffer('image/png');

                            // Send the emoji as a file attachment
                            interaction.editReply({
                                files: [
                                    {
                                        attachment: buffer,
                                        name: `emoji.png`
                                    }
                                ]
                            });
                        };
                        img.src = `data:image/svg+xml;base64,${Buffer.from(modifiedSvgText).toString('base64')}`;
                    })
                    .catch((err) => {
                        console.error(err);
                        interaction.reply({ content: 'Failed to process the SVG file.' });
                    });
            }
        }
    }
}

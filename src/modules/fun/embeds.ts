import GargoyleModalBuilder from '@src/system/backend/builders/gargoyleModalBuilder.js';
import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    LabelBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputStyle
} from 'discord.js';

export default class Embeds extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [
        new GargoyleSlashCommandBuilder()
            .setName('embed')
            .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
            .setIntegrationTypes(ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall)
            .setDescription('Returns a link to an embed you can post') as GargoyleSlashCommandBuilder
    ];

    public override async executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'embed') {
            await interaction.showModal(
                new GargoyleModalBuilder(this).setTitle('Embed Builder').addLabelComponents(
                    new LabelBuilder()
                        .setLabel('Title')
                        .setTextInputComponent((component) => component.setCustomId('title').setStyle(TextInputStyle.Short).setRequired(false)),
                    new LabelBuilder()
                        .setLabel('Description')
                        .setTextInputComponent((component) =>
                            component.setCustomId('description').setStyle(TextInputStyle.Paragraph).setRequired(false)
                        ),
                    new LabelBuilder()
                        .setLabel('Color')
                        .setTextInputComponent((component) =>
                            component.setCustomId('color').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('#ff0000')
                        ),
                    new LabelBuilder()
                        .setLabel('Image')
                        .setFileUploadComponent((component) => component.setCustomId('image').setMinValues(0).setMaxValues(1).setRequired(false))
                )
            );
            return;
        }
        const title = interaction.options.getString('title') ?? undefined;
        const description = interaction.options.getString('description') ?? undefined;
        const color = interaction.options.getString('color') ?? undefined;
        const url = interaction.options.getString('url') ?? undefined;
        const footer = interaction.options.getString('footer') ?? undefined;
        const image = interaction.options.getString('image') ?? undefined;
        const thumbnail = interaction.options.getString('thumbnail') ?? undefined;
        const author = interaction.options.getString('author') ?? undefined;

        const params = new URLSearchParams();
        if (title) params.set('title', title);
        if (description) params.set('description', description);
        if (color) params.set('color', color);
        if (url) params.set('url', url);
        if (footer) params.set('footer', footer);
        if (image) params.set('image', image);
        if (thumbnail) params.set('thumbnail', thumbnail);
        if (author) params.set('author', author);

        await interaction.reply({
            content: `https://gargoyle.axodouble.com/api/embeds/?${params.toString()}`
        });
    }

    private escapeHtml(unsafe: string): string {
        return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    private isValidHexColor(color: string): boolean {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    public override executeModalCommand(client: GargoyleClient, interaction: ModalSubmitInteraction, ...args: string[]): void {
        const title = interaction.fields.getTextInputValue('title') || undefined;
        const description = interaction.fields.getTextInputValue('description') || undefined;
        const color = interaction.fields.getTextInputValue('color') || undefined;
        const imageAttachment = interaction.fields.getUploadedFiles('image', false);
        const image = imageAttachment && imageAttachment.size > 0 ? imageAttachment.first()?.url : undefined;

        const params = new URLSearchParams();
        if (title) params.set('title', title);
        if (description) params.set('description', description);
        if (color) params.set('color', color);
        if (image) params.set('image', image);

        interaction.reply({
            content: `https://gargoyle.axodouble.com/api/embeds/?${params.toString()}`
        });
    }

    public override executeApiRequest(_client: GargoyleClient, request: Request): Promise<Response> {
        // https://gargoyle.axodouble.com/api/embeds/?title=&description=&color=&url=&footer=&image=&thumbnail=&author=
        const url = new URL(request.url);
        const params = url.searchParams;

        let title = this.escapeHtml(params.get('title') ?? '');
        let description = this.escapeHtml(params.get('description') ?? '');
        let color = this.isValidHexColor(this.escapeHtml(params.get('color') ?? '')) ? this.escapeHtml(params.get('color') ?? '') : undefined;
        let embedUrl = this.escapeHtml(params.get('url') ?? '');
        let footer = this.escapeHtml(params.get('footer') ?? '');
        let image = this.escapeHtml(params.get('image') ?? '');
        let thumbnail = this.escapeHtml(params.get('thumbnail') ?? '');
        let author = this.escapeHtml(params.get('author') ?? '');

        if (embedUrl && !this.isValidUrl(embedUrl)) embedUrl = '';
        if (image && !this.isValidUrl(image)) image = '';
        if (thumbnail && !this.isValidUrl(thumbnail)) thumbnail = '';

        if (color && !this.isValidHexColor(color)) color = '';

        let metaTags = '';

        if (title) metaTags += `<meta property="og:title" content="${title}">\n<meta name="twitter:title" content="${title}">\n`;
        if (description)
            metaTags += `<meta property="og:description" content="${description}">\n<meta name="twitter:description" content="${description}">\n`;
        if (embedUrl) metaTags += `<meta property="og:url" content="${embedUrl}">\n`;
        if (image)
            metaTags += `<meta property="og:image" content="${image}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image:src" content="${image}">\n`;
        if (thumbnail) metaTags += `<meta property="og:image" content="${thumbnail}">\n`;
        if (color) metaTags += `<meta name="theme-color" content="${color}">\n`;
        if (author) metaTags += `<meta name="author" content="${author}">\n`;
        if (footer) metaTags += `<meta name="footer" content="${footer}">\n`;

        const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
        ${metaTags}
        <title>${title || 'Embed'}</title>
        <script>
            setTimeout(function() {
            window.location.href = "https://ceraia.com";
            }, 2000);
        </script>
        </head>
        <body>
        <p>This page is for generating Discord embeds.</p>
        </body>
        </html>`;

        return Promise.resolve(
            new Response(html, {
                headers: { 'Content-Type': 'text/html' }
            })
        );
    }
}

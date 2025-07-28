import { CanvasGradient, CanvasPattern, CanvasTextAlign, CanvasTextBaseline, createCanvas } from 'canvas';
import { AttachmentBuilder } from 'discord.js';

enum FontWeight {
    Thin = '100',
    ExtraLight = '200',
    Light = '300',
    Medium = '500',
    SemiBold = '600',
    Bold = '700',
    ExtraBold = '800',
    Black = '900',
    Regular = '400',
    Normal = '400'
}

async function createBanner(
    text: string,
    options?: {
        fillStyle?: string | CanvasGradient | CanvasPattern;
        textStyle?: string | CanvasGradient | CanvasPattern;
        width?: number;
        height?: number;
        fontSize?: number;
        fontWeight?: FontWeight;
        textAlign?: CanvasTextAlign;
        textBaseline?: CanvasTextBaseline;
        fileName?: string;
        bannerStyle?: 'underline' | 'slash' | 'filled';
    }
): Promise<AttachmentBuilder> {
    const {
        fillStyle = '#0fad9a',
        textStyle = '#ffffff',
        height = 56,
        width = 1080,
        fontSize = 48,
        fontWeight = FontWeight.Medium,
        textAlign = 'center',
        textBaseline = 'middle',
        fileName,
        bannerStyle = 'slash'
    } = options ?? {};

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (bannerStyle === 'slash') {
        // Make slash shape on the left
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width / 20, 0);
        ctx.lineTo(width / 20 + height / Math.tan(Math.PI / 2.5), height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Make underline
        ctx.fillStyle = fillStyle;
        ctx.fillRect(0, height - 4, width, height);
    } else if (bannerStyle === 'filled') {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(0, 0, width, height);
    } else if (bannerStyle === 'underline') {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(0, height - 4, width, height);
    }

    // Set text properties and add text
    ctx.fillStyle = textStyle;
    ctx.font = `${fontWeight} ${fontSize}px Montserrat`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.fillText(text, width / 2, height / 2);

    // Create an attachment from the canvas
    return new AttachmentBuilder(canvas.toBuffer(), {
        name: fileName ? `${fileName}.png` : `${text.toLowerCase().replaceAll(' ', '_')}.png`
    });
}

export { createBanner, FontWeight };

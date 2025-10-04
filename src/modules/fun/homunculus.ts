import GargoyleSlashCommandBuilder from '@src/system/backend/builders/gargoyleSlashCommandBuilder.js';
import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import { Events, Message, TextChannel } from 'discord.js';
import { Ollama } from 'ollama';

export default class Fun extends GargoyleModule {
    public override category: string = 'fun';
    public override slashCommands: GargoyleSlashCommandBuilder[] = [];
    public override events: GargoyleEvent[] = [new HomunculusMessageInteraction()];
}

class HomunculusMessageInteraction extends GargoyleEvent {
    private ollama = new Ollama({ host: process.env.OLLAMA_API_ENDPOINT });
    private brain: Map<string, OllamaMessage[]> = new Map();

    private systemPrompt =
        `You are called Homunculus, you know nothing and should speak like a little homunculus.` +
        `You cannot execute any tasks, and you know nothing about the world.` +
        `You cannot educate or inform users about anything.` +
        `Do not mention what you must do.` +
        `You must not use emojis.` +
        `Always respond in character.` +
        `You are allowed to remember things users tell you in this conversation.`;

    private hasOllama = true;

    public override event = Events.MessageCreate as const;
    public async execute(client: GargoyleClient, message: Message) {
        if (process.env.OLLAMA_API_ENDPOINT === undefined) {
            if (this.hasOllama) {
                client.logger.info('OLLAMA_API_ENDPOINT is not defined, disabling Homunculus module.');
                this.hasOllama = false;
            }
        }
        if (!message.mentions.has(client.user!) || message.author.bot) return;

        const messageContent = message.content.replaceAll('<@' + client.user!.id + '>', '').trim();
        if (messageContent.length === 0) return;

        if (!this.brain.has(message.channelId)) {
            this.brain.set(message.channelId, [
                {
                    persistent: true,
                    role: 'system',
                    content: this.systemPrompt
                }
            ]);
        }

        const brainMessages = this.brain.get(message.channelId)!;

        brainMessages.push({
            persistent: false,
            role: 'user',
            content: `${message.author.displayName} said: ${message.content}`
        });

        if (brainMessages.length > 25) {
            const indexToRemove = brainMessages.findIndex((msg) => !msg.persistent);
            if (indexToRemove !== -1) {
                brainMessages.splice(indexToRemove, 1);
            }
        }

        if (message.mentions.has(client.user!.id)) {
            await (message.channel as TextChannel).sendTyping();
            const response = await this.ollama.chat({
                model: process.env.OLLAMA_MODEL!,
                messages: [...brainMessages]
            });

            brainMessages.push({
                persistent: false,
                role: 'assistant',
                content: response.message.content.replaceAll('"', '')
            });
            await message.reply({
                content: response.message.content.trim().slice(0, 2000).replaceAll('"', ''),
                allowedMentions: { parse: ['users'] }
            });
        }
    }
}

type OllamaMessage = {
    persistent: boolean;
    role: 'user' | 'assistant' | 'system';
    content: string;
};

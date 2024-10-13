import GargoyleClient from '@src/system/classes/clientClass.js';
import { IntentsBitField, Partials } from 'discord.js';

const client = new GargoyleClient({
    shards: 'auto',
    intents: [
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions,
    ],
    partials: [Partials.Channel],
});

export default client;

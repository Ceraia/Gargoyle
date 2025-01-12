import GargoyleClient from '@src/system/backend/classes/gargoyleClient.js';
import { IntentsBitField, Partials } from 'discord.js';

const client = new GargoyleClient({
    shards: 'auto',
    intents: [
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildExpressions,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

export default client;

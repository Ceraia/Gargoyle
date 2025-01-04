import { MessageCreateOptions, TextChannel } from 'discord.js';

export function sendAsServer(message: MessageCreateOptions, channel: TextChannel): void {
    channel.fetchWebhooks().then(async (webhooks) => {
        let webhook;

        if (webhooks.size === 0) {
            webhook = await channel.createWebhook({
                name: channel.guild?.name || channel.client.user.username,
                reason: 'Server Message'
            });
        } else {
            webhook = webhooks.first();
        }

        await webhook?.send({
            avatarURL: channel.guild?.iconURL() || undefined,
            username: channel.guild?.name || channel.client.user.username,
            ...message
        });
    });
}

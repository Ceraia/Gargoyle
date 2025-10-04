import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleModule from '@src/system/backend/classes/gargoyleModule.js';
import GargoyleEmbedBuilder from '@builders/gargoyleEmbedBuilder.js';
import GargoyleEvent from '@src/system/backend/classes/gargoyleEvent.js';
import { Events, GuildMember, TextChannel } from 'discord.js';

export default class Entropy extends GargoyleModule {
    public override category: string = 'entropy';
    public override events = [new RolePrefix(), new LeaveLog()];
}

class RolePrefix extends GargoyleEvent {
    public event = Events.GuildMemberUpdate as const;
    private lastChanged = new Map<string, number>();

    public async execute(_client: GargoyleClient, member: GuildMember): Promise<void> {
        if (member.guild.id !== '1009048008857493624') return;

        if (this.lastChanged.has(member.id) && Date.now() - this.lastChanged.get(member.id)! < 10000) return;

        const updatedMember = await member.fetch(true);
        let namePrefix = '[';

        const roles = updatedMember.roles.cache.sort((a, b) => b.position - a.position);

        roles.forEach((role) => {
            if (role.name === '@everyone') return;
            // If role starts with a single letter and then a space
            if (role.name.match(/^[a-zA-Z0-9] /)) namePrefix += role.name.split('')[0].toUpperCase();
        });

        let username = updatedMember.nickname?.split(' ').slice(1).join(' ') || updatedMember.user.username;

        namePrefix += `] ${username}`;

        updatedMember.setNickname(namePrefix).catch(() => {});
    }
}

class LeaveLog extends GargoyleEvent {
    public event = Events.GuildMemberRemove as const;

    public execute(_client: GargoyleClient, member: GuildMember): void {
        if (member.guild.id !== '1009048008857493624') return;

        const channel = member.guild.systemChannel as TextChannel;
        if (!channel) return;

        channel.send({ embeds: [new GargoyleEmbedBuilder().setDescription(`User ${member.user.tag} (<@!${member.user.id}>) has left the server.`)] });
    }
}

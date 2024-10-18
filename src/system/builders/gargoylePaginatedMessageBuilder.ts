import { Message, MessagePayload, MessageEditOptions } from 'discord.js';

const paginatedMessages = new Map<string, GargoylePaginatedMessageBuilder>();

function getPaginatedMessage(message: Message) {
    if (!paginatedMessages.has(message.id)) return null;
    return paginatedMessages.get(message.id);
}

class GargoylePaginatedMessageBuilder {
    private _pages: Map<number, string | MessagePayload | MessageEditOptions>;
    private _currentPage: number;
    private _message: Message;
    private _messageId: string;

    constructor(message: Message) {
        this._pages = new Map<number, string | MessagePayload | MessageEditOptions>();
        this._currentPage = 0;
        this._message = message;
        this._messageId = message.id;
        this.addPage({ content: message.content, embeds: message.embeds, components: message.components });
        paginatedMessages.set(this._messageId, this);
    }

    public addPage(content: string | MessagePayload | MessageEditOptions, page?: number) {
        if (page) {
            this._pages.set(page, content);
        } else {
            this._pages.set(this._pages.size + 1, content);
        }
        return this;
    }

    public nextPage() {
        if (this._currentPage < this._pages.size) {
            this._currentPage++;
            this.updateMessage();
        }
    }

    public previousPage() {
        if (this._currentPage > 0) {
            this._currentPage--;
            this.updateMessage();
        }
    }

    public updateMessage() {
        const pageContent = this._pages.get(this._currentPage);
        if (pageContent) {
            this._message.edit(pageContent);
        }
    }
}

export default GargoylePaginatedMessageBuilder;
export { getPaginatedMessage, GargoylePaginatedMessageBuilder };

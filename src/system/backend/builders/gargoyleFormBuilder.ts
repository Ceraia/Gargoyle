import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import GargoyleCommand from '../classes/gargoyleCommand.js';

class GargoyleFormModalBuilder {
    command: GargoyleCommand;
    modals: ModalBuilder[];

    /**
     * Creates an instance of GargoyleFormModalBuilder.
     *
     * @constructor
     * @param {GargoyleCommand} command - The command associated with the modal.
     * @param {Question[]} questions - The questions to be asked in the modal(s).
     */
    constructor(command: GargoyleCommand, ...questions: Question[]) {
        this.command = command;
        this.modals = this.buildModals(questions);
    }

    /**
     * Builds a collection of modals based on the provided questions.
     * @param {Question[]} questions - The questions to generate modals for.
     * @returns {ModalBuilder[]} An array of ModalBuilder objects.
     */
    private buildModals(questions: Question[]): ModalBuilder[] {
        const modals: ModalBuilder[] = [];

        // Iterate through each question and create a modal for it
        for (const [index, question] of questions.entries()) {
            const modal = new ModalBuilder()
                .setCustomId(`form-modal-${this.command.slashCommand?.name || this.command.textCommand?.name}-${index}`)
                .setTitle(this.command.slashCommand?.name || this.command.textCommand?.name || 'Form');

            const textInput = new TextInputBuilder().setCustomId(`form-input-${index}`).setLabel(question.question).setStyle(question.style);

            const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
            modal.addComponents(actionRow);

            modals.push(modal);
        }

        return modals;
    }

    /**
     * Returns the array of generated modals.
     * @returns {ModalBuilder[]} An array of ModalBuilder objects.
     */
    getModals(): ModalBuilder[] {
        return this.modals;
    }
}

class Question {
    question: string;
    style: TextInputStyle;
    constructor(question: string, style?: TextInputStyle) {
        this.question = question;
        this.style = style ?? TextInputStyle.Short;
    }
}

export default GargoyleFormModalBuilder;

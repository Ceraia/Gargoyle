import GargoyleClient from '@classes/gargoyleClient.js';
import GargoyleCommand from '@classes/gargoyleCommand.js';
import GargoyleEmbedBuilder from '@src/system/backend/builders/gargoyleEmbedBuilder.js';
import { ChatInputCommandInteraction, InteractionContextType, InteractionResponse, SlashCommandBuilder } from 'discord.js';
export default class Fun extends GargoyleCommand {
    public override category: string = 'fun';
    public override slashCommand = new SlashCommandBuilder()
        .setName('fun')
        .setDescription('Fun related commands!')
        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName('text')
                .setDescription('Text related commands.')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('aesthetic')
                        .setDescription('Change text to look like ｔｈｉｓ.')
                        .addStringOption((option) =>
                            option.setName('text').setDescription('The text to change.').setRequired(true).setMaxLength(2000)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('upside-down')
                        .setDescription('Flip text.')
                        .addStringOption((option) => option.setName('text').setDescription('The text to flip.').setRequired(true).setMaxLength(2000))
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('uwu')
                        .setDescription('UwUify text.')
                        .addStringOption((option) =>
                            option.setName('text').setDescription('The text to UwUify.').setRequired(true).setMaxLength(2000)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('mock')
                        .setDescription('Mock text.')
                        .addStringOption((option) => option.setName('text').setDescription('The text to mock.').setRequired(true).setMaxLength(2000))
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('clap')
                        .setDescription('Clap text.')
                        .addStringOption((option) => option.setName('text').setDescription('The text to clap.').setRequired(true).setMaxLength(2000))
                )
        )
        .addSubcommand((subcommand) => subcommand.setName('truth-or-dare').setDescription('Truth or dare related commands.'))
        .addSubcommand((subcommand) =>
            subcommand
                .setName('8ball')
                .setDescription('Ask the magic 8ball a question.')
                .addStringOption((option) => option.setName('question').setDescription('The question to ask the magic 8ball.').setRequired(true))
        )
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]) as SlashCommandBuilder;

    public override executeSlashCommand(_client: GargoyleClient, interaction: ChatInputCommandInteraction) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'text') {
            return textReplace(interaction);
        }

        if (subcommand === 'truth-or-dare') {
            return truthDare(interaction);
        }

        if (subcommand === '8ball') {
            return eightBall(interaction);
        }

        return null;
    }
}

function textReplace(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
    const subcommand = interaction.options.getSubcommand();
    const text = interaction.options.getString('text');

    if (!text) return Promise.reject(new Error('Text is required'));

    if (subcommand === 'aesthetic') {
        return interaction.reply({
            content: text
                .replace(/ /g, '　')
                .replace(/a/g, 'ａ')
                .replace(/b/g, 'ｂ')
                .replace(/c/g, 'ｃ')
                .replace(/d/g, 'ｄ')
                .replace(/e/g, 'ｅ')
                .replace(/f/g, 'ｆ')
                .replace(/g/g, 'ｇ')
                .replace(/h/g, 'ｈ')
                .replace(/i/g, 'ｉ')
                .replace(/j/g, 'ｊ')
                .replace(/k/g, 'ｋ')
                .replace(/l/g, 'ｌ')
                .replace(/m/g, 'ｍ')
                .replace(/n/g, 'ｎ')
                .replace(/o/g, 'ｏ')
                .replace(/p/g, 'ｐ')
                .replace(/q/g, 'ｑ')
                .replace(/r/g, 'ｒ')
                .replace(/s/g, 'ｓ')
                .replace(/t/g, 'ｔ')
                .replace(/u/g, 'ｕ')
                .replace(/v/g, 'ｖ')
                .replace(/w/g, 'ｗ')
                .replace(/x/g, 'ｘ')
                .replace(/y/g, 'ｙ')
                .replace(/z/g, 'ｚ')
                .replace(/A/g, 'Ａ')
                .replace(/B/g, 'Ｂ')
                .replace(/C/g, 'Ｃ')
                .replace(/D/g, 'Ｄ')
                .replace(/E/g, 'Ｅ')
                .replace(/F/g, 'Ｆ')
                .replace(/G/g, 'Ｇ')
                .replace(/H/g, 'Ｈ')
                .replace(/I/g, 'Ｉ')
                .replace(/J/g, 'Ｊ')
                .replace(/K/g, 'Ｋ')
                .replace(/L/g, 'Ｌ')
                .replace(/M/g, 'Ｍ')
                .replace(/N/g, 'Ｎ')
                .replace(/O/g, 'Ｏ')
                .replace(/P/g, 'Ｐ')
                .replace(/Q/g, 'Ｑ')
                .replace(/R/g, 'Ｒ')
                .replace(/S/g, 'Ｓ')
                .replace(/T/g, 'Ｔ')
                .replace(/U/g, 'Ｕ')
                .replace(/V/g, 'Ｖ')
                .replace(/W/g, 'Ｗ')
                .replace(/X/g, 'Ｘ')
                .replace(/Y/g, 'Ｙ')
                .replace(/Z/g, 'Ｚ')
        });
    }
    if (subcommand === 'upside-down') {
        return interaction.reply({
            content: text
                .split('')
                .reverse()
                .join('')
                .replace(/a/g, 'ɐ')
                .replace(/b/g, 'q')
                .replace(/c/g, 'ɔ')
                .replace(/e/g, 'ǝ')
                .replace(/f/g, 'ɟ')
                .replace(/g/g, 'ƃ')
                .replace(/h/g, 'ɥ')
                .replace(/i/g, 'ᴉ')
                .replace(/j/g, 'ɾ')
                .replace(/k/g, 'ʞ')
                .replace(/m/g, 'ɯ')
                .replace(/p/g, 'd')
                .replace(/q/g, 'b')
                .replace(/r/g, 'ɹ')
                .replace(/t/g, 'ʇ')
                .replace(/u/g, '⋳')
                .replace(/n/g, 'u')
                .replace(/⋳/g, 'n')
                .replace(/v/g, 'ʌ')
                .replace(/w/g, 'ʍ')
                .replace(/y/g, 'ʎ')
                .replace(/A/g, '∀')
                .replace(/B/g, 'q')
                .replace(/C/g, 'Ɔ')
                .replace(/D/g, 'p')
                .replace(/d/g, 'p')
                .replace(/E/g, 'Ǝ')
                .replace(/F/g, 'Ⅎ')
                .replace(/G/g, 'פ')
                .replace(/J/g, 'ſ')
                .replace(/K/g, 'ʞ')
                .replace(/L/g, '˥')
                .replace(/M/g, 'W')
                .replace(/P/g, 'Ԁ')
                .replace(/R/g, 'ɹ')
                .replace(/T/g, '┴')
                .replace(/U/g, '∩')
                .replace(/V/g, 'Λ')
                .replace(/W/g, 'M')
                .replace(/Y/g, '⅄')
        });
    }
    if (subcommand === 'uwu') {
        return interaction.reply({
            content: text
                .replace(/(?:r|l)/g, 'w')
                .replace(/(?:R|L)/g, 'W')
                .replace(/n([aeiou])/g, 'ny$1')
                .replace(/N([aeiou])/g, 'Ny$1')
                .replace(/N([AEIOU])/g, 'Ny$1')
                .replace(/ove/g, 'uv')
                .replace(/th/g, 'd')
                .replace(/Th/g, 'D')
                .replace(/TH/g, 'D')
                .replace(/ove/g, 'uv')
        });
    }
    if (subcommand === 'mock') {
        return interaction.reply({
            content: text
                .split('')
                .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
                .join('')
        });
    }
    if (subcommand === 'clap') {
        return interaction.reply({ content: text.replace(/ /g, '👏') });
    }

    return interaction.reply({ content: text });
}

function truthDare(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
    const truths: string[] = [
        'What\'s the most embarrassing thing that\'s ever happened to you?',
        'Have you ever lied to get out of trouble?',
        'What\'s your biggest fear?',
        'What\'s the worst gift you\'ve ever received?',
        'What\'s the most childish thing you still do?',
        'What\'s a secret you\'ve never told anyone?',
        'What\'s the worst thing you\'ve ever done?',
        'What\'s the most embarrassing thing in your room?',
        'What\'s the most awkward date you\'ve been on?',
        'What\'s the most trouble you\'ve gotten into at school?',
        'What\'s the worst thing you\'ve ever said to someone?',
        'What\'s the most embarrassing nickname you\'ve had?',
        'What\'s the most embarrassing thing you\'ve done in public?',
        'What\'s the weirdest thing you\'ve ever eaten?',
        'What\'s the most embarrassing thing you\'ve worn?',
        'What\'s the most embarrassing thing you\'ve done for a dare?',
        'What\'s the most embarrassing thing you\'ve done in front of a crush?',
        'What\'s the most embarrassing thing that\'s ever happened to you?',
        'Have you ever lied to get out of trouble?',
        'What\'s your biggest fear?',
        'What\'s the worst gift you\'ve ever received?',
        'What\'s the most childish thing you still do?',
        'What\'s a secret you\'ve never told anyone?',
        'What\'s the worst thing you\'ve ever done?',
        'What\'s the most embarrassing thing in your room?',
        'What\'s the most awkward date you\'ve been on?',
        'What\'s the most trouble you\'ve gotten into at school?',
        'What\'s the worst thing you\'ve ever said to someone?',
        'What\'s the most embarrassing nickname you\'ve had?',
        'What\'s the most embarrassing thing you\'ve done in public?',
        'What\'s the weirdest thing you\'ve ever eaten?',
        'What\'s the most embarrassing thing you\'ve worn?',
        'What\'s the most embarrassing thing you\'ve done for a dare?',
        'What\'s the most embarrassing thing you\'ve done in front of a crush?',
        'Have you ever stolen something?',
        'Have you ever cheated on a test?',
        'Have you ever told a secret you weren\'t supposed to share?',
        'What\'s the most annoying habit you have?',
        'Who was your first crush?',
        'What\'s the weirdest thing you\'ve ever Googled?',
        'What\'s your most irrational fear?',
        'What\'s the worst haircut you\'ve ever had?',
        'Have you ever been caught lying?',
        'What\'s the most embarrassing text you\'ve sent?',
        'Have you ever accidentally sent a text to the wrong person?',
        'Have you ever peed in a pool?',
        'What\'s the most embarrassing thing your parents have caught you doing?',
        'Have you ever blamed someone else for something you did?',
        'Have you ever pretended to be sick to skip school/work?',
        'What\'s your most embarrassing social media post?',
        'What\'s the most trouble you\'ve gotten into at home?',
        'Have you ever been caught talking to yourself?',
        'What\'s the weirdest dream you\'ve ever had?',
        'What\'s the most ridiculous lie you\'ve ever told?',
        'Have you ever laughed at a joke you didn\'t understand?',
        'Have you ever cried during a movie?',
        'What\'s the weirdest rumor you\'ve heard about yourself?',
        'What\'s your guilty pleasure TV show or movie?',
        'Have you ever lied to a friend?',
        'What\'s the most disgusting food you\'ve ever tried?',
        'What\'s your most embarrassing talent?',
        'What\'s the worst thing you\'ve done to get someone\'s attention?',
        'Have you ever had an imaginary friend?',
        'Have you ever been caught singing in the shower?',
        'What\'s the weirdest thing you collect?',
        'What\'s the most awkward text you\'ve received?',
        'Who do you have a secret crush on?',
        'What\'s the most embarrassing thing you\'ve done in a relationship?',
        'What\'s a lie you regret telling?',
        'Have you ever had a wardrobe malfunction?',
        'Have you ever told a crush you liked them and been rejected?',
        'Have you ever done something silly to impress someone?',
        'What\'s a memory you wish you could erase?',
        'Have you ever been caught eavesdropping?',
        'What\'s the silliest thing you\'ve been upset about?',
        'What\'s the most awkward conversation you\'ve had?',
        'Have you ever accidentally insulted someone?',
        'What\'s a talent you wish you had?',
        'Have you ever been scared of the dark?',
        'What\'s your most embarrassing habit?',
        'What\'s the worst grade you\'ve ever gotten?',
        'Have you ever been caught lying to your parents?',
        'Have you ever broken something and blamed someone else?',
        'What\'s the most childish thing you’ve done recently?',
        'Who\'s your least favorite teacher and why?',
        'What\'s the most embarrassing photo of you that exists?',
        'What\'s the longest you\'ve gone without showering?',
        'Have you ever had a crush on a teacher?',
        'Have you ever been caught sleeping in class?',
        'Have you ever skipped school or work?',
        'What\'s the dumbest thing you\'ve ever argued about?',
        'Have you ever made a prank call?',
        'What\'s your weirdest phobia?',
        'Have you ever walked into something while texting?',
        'What\'s the weirdest thing you\'ve done alone?',
        'Have you ever been caught dancing when you thought no one was watching?',
        'What\'s the most awkward compliment you\'ve received?',
        'What\'s the most awkward thing you\'ve said on a first date?',
        'Have you ever lied to make yourself sound cooler?',
        'What\'s the worst thing you\'ve done to a sibling?',
        'Have you ever ruined a surprise party?',
        'What\'s the most useless skill you have?',
        'Have you ever been scared of a kid\'s movie?',
        'What\'s the weirdest superstition you believe in?',
        'Have you ever eaten something off the floor?',
        'What\'s the most expensive thing you\'ve broken?',
        'Have you ever been caught faking an accent?',
        'What\'s the most awkward thing you\'ve done at work/school?',
        'Have you ever been mistaken for someone else?',
        'What\'s the worst advice you\'ve ever given?',
        'What\'s the longest you\'ve gone without brushing your teeth?',
        'What\'s the most ridiculous thing you\'ve cried about?',
        'Have you ever walked in on someone accidentally?',
        'Have you ever been caught sneaking out?',
        'What\'s the worst lie you\'ve told to get out of a date?',
        'What\'s the worst excuse you\'ve used to cancel plans?',
        'What\'s the most embarrassing song on your playlist?'
    ];
    const dares: string[] = [
        'Do a handstand for 10 seconds.',
        'Act like a monkey until your next turn.',
        'Sing everything you say for the next 10 minutes.',
        'Do 20 pushups.',
        'Do 20 situps.',
        'Dance without music for 2 minutes.',
        'Call someone and sing "Happy Birthday" to them.',
        'Post an embarrassing photo on social media.',
        'Let someone tickle you for 30 seconds.',
        'Wear your socks on your hands for the next 5 minutes.',
        'Talk in an accent for the next 10 minutes.',
        'Try to lick your elbow.',
        'Act like a chicken for 1 minute.',
        'Do your best impression of someone in the room.',
        'Balance a spoon on your nose for 1 minute.',
        'Eat a spoonful of mustard.',
        'Spin around 10 times and try to walk in a straight line.',
        'Hold your breath for 20 seconds.',
        'Do a cartwheel (or attempt one).',
        'Draw a mustache on your face with a marker.',
        'Let someone write something on your forehead.',
        'Wear your clothes backward for the next 10 minutes.',
        'Speak without using your lips for 2 minutes.',
        'Do 15 jumping jacks.',
        'Eat a piece of food without using your hands.',
        'Try to juggle 3 objects.',
        'Pretend you\'re a cat for 5 minutes.',
        'Wear a silly hat for the next 3 rounds.',
        'Let someone redo your hairstyle.',
        'Try to do the splits.',
        'Write your name with your toes.',
        'Talk like a baby for the next 5 minutes.',
        'Take a selfie making a funny face.',
        'Walk backward everywhere for the next 3 minutes.',
        'Gargle a song for everyone to guess.',
        'Pretend to be a waiter and take everyone\'s “order.”',
        'Do 10 squats while holding an object on your head.',
        'Let someone tickle you for 20 seconds.',
        'Do your best evil laugh.',
        'Hold a plank position for 30 seconds.',
        'Wear sunglasses for the next 3 rounds.',
        'Pretend to be an alien and communicate without words.',
        'Do your best animal impression.',
        'Eat something blindfolded and guess what it is.',
        'Try to drink a glass of water while upside down.',
        'Speak in rhymes until your next turn.',
        'Pretend you\'re an old person for 2 minutes.',
        'Draw a funny picture on someone\'s arm.',
        'Do your best impression of a celebrity.',
        'Let someone else redo your hairstyle.',
        'Act out a scene from your favorite movie.',
        'Pretend you\'re invisible and narrate what\'s happening.',
        'Wear a piece of toilet paper like a scarf.',
        'Make a tower of objects and keep it balanced.',
        'Balance a book on your head while walking.',
        'Eat a raw onion slice.',
        'Read the next sentence you say in a robot voice.',
        'Call someone and ask them a random question.',
        'Spin around and try to point at something specific.',
        'Pretend you\'re a superhero.',
        'Say the alphabet backward.',
        'Hold ice in your hand until your next turn.',
        'Wear someone else\'s shoes until the next round.',
        'Do your best fake cry.',
        'Pretend you\'re a mime for the next 2 minutes.',
        'Eat a spoonful of hot sauce.',
        'Speak only in questions until your next turn.',
        'Wear socks on your hands for the next 5 minutes.',
        'Pretend you\'re swimming on the floor.',
        'Let someone draw something on your face.',
        'Sing a random song out loud.',
        'Attempt to balance on one leg for 30 seconds.',
        'Eat something spicy without water.',
        'Act like a baby for 2 minutes.',
        'Draw a mustache on your face.',
        'Wear underwear on your head until your next turn.',
        'Hop on one foot for 2 minutes.',
        'Pretend you\'re a ghost and scare someone.',
        'Stack as many items as you can on your head.',
        'Dance to a random song for 1 minute.',
        'Try to hula hoop (use an imaginary one if needed).',
        'Brush your teeth in front of everyone without water.',
        'Do your best belly dance.',
        'Recite a tongue twister five times fast.',
        'Pretend to be a statue for 1 minute.',
        'Run in place for 2 minutes.',
        'Pretend to take a phone call and act it out.',
        'Make an animal noise every time you laugh.',
        'Draw something blindfolded and guess what it is.',
        'Swap seats with someone until the next round.',
        'Pretend you\'re an announcer and narrate the game.',
        'Speak in a whisper until your next turn.',
        'Put on a silly outfit using what\'s available.',
        'Pretend to take an imaginary selfie.',
        'Hop like a frog for 1 minute.',
        'Do 20 arm circles.',
        'Close your eyes and spin in a circle for 10 seconds.',
        'Take a sip of water without using your hands.',
        'Do a runway walk around the room.',
        'Pretend you\'re a teacher and “lecture” the group.',
        'Do a handstand for 10 seconds.',
        'Act like a monkey until your next turn.',
        'Sing everything you say for the next 10 minutes.',
        'Do 20 pushups',
        'Do 20 situps'
    ];

    return interaction.reply({
        embeds: [
            new GargoyleEmbedBuilder()
                .setTitle('Truth or Dare')
                .setDescription(
                    `Truth or dare?\n**Truth :** ${truths[Math.floor(Math.random() * truths.length)]}\n**Dare :** ${
                        dares[Math.floor(Math.random() * dares.length)]
                    }`
                )
        ]
    });
}

function eightBall(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
    const responses: string[] = [
        'It is certain.',
        'It is decidedly so.',
        'Without a doubt.',
        'Yes-definitely.',
        'You may rely on it.',
        'As I see it, yes.',
        'Most likely.',
        'Outlook good.',
        'Yes.',
        'Signs point to yes.',
        'Reply hazy, try again.',
        'Ask again later.',
        'Better not tell you now.',
        'Cannot predict now.',
        'Concentrate and ask again.',
        'Don\'t count on it.',
        'My reply is no.',
        'My sources say no.',
        'Outlook not so good.',
        'Very doubtful.'
    ];

    return interaction.reply({ embeds: [new GargoyleEmbedBuilder().setDescription(responses[Math.floor(Math.random() * responses.length)])] });
}

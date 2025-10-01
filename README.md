# Gargoyle

A powerful and feature-rich Discord bot built with Discord.js v14, TypeScript, and Bun runtime.

## Features

Gargoyle is a versatile Discord bot with a comprehensive set of commands and features.

Feel free to invite it using [this link!](https://discordapp.com/oauth2/authorize?client_id=758776071268859946)

### Technical Features

Commands are built to support full feature sets, to make expanding features and addons as modular as possible, allowing (currently) slashcommands, textcommands, context commands, responses to interactions built into the file and API endpoints per command available.

### Voice Features

- Dynamic voice channel creation and management
- Audio playback capabilities with `@discordjs/voice`

### Advanced Features

- MongoDB integration for data persistence
- Canvas-based image generation
- Steam API integration
- Sharp image processing
- Custom embed, button, modal, and select menu builders
- Slash command and text command support

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime (recommended) or Node.js
- [Docker](https://www.docker.com/) and Docker Compose (for MongoDB)
- MongoDB database
- Discord Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ceraia/Gargoyle.git
   cd Gargoyle
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DBUSERNAME=your_mongodb_username
   DBPASSWORD=your_mongodb_password
   # Add any other required environment variables
   ```

4. **Start the database**
   ```bash
   # For development with MongoDB
   bun run aux:on
   ```

### Running the Bot

**Development mode (with auto-reload):**
```bash
bun run dev
```

**Production mode:**
```bash
bun run start
```

**Using Docker (full stack):**
```bash
bun run dev:on    # Start all services (MongoDB + Bot)
bun run dev:off   # Stop all services
```

## Development

### Available Scripts

- `bun run start` - Start the bot
- `bun run dev` - Start with auto-reload
- `bun run dev:on` - Start all Docker services
- `bun run dev:off` - Stop all Docker services
- `bun run aux:on` - Start auxiliary services (MongoDB)
- `bun run aux:off` - Stop auxiliary services
- `bun run app:on` - Start app service
- `bun run app:off` - Stop app service
- `bun run build` - Compile TypeScript
- `bun run format` - Format code with Prettier
- `bun run check` - Format and build

### Project Structure

```
Gargoyle/
├── src/
│   ├── index.ts                 # Entry point
│   ├── commands/                # Command categories
│   ├── events/                  # Event handlers
│   └── system/                  # Core bot system
│       ├── botClient.ts        # Main client
│       └── backend/            # Backend utilities
│           ├── builders/       # Custom builders
│           ├── classes/        # Core classes
│           ├── database/       # Database handlers
│           ├── events/         # System events
│           ├── initializers/   # Initialization logic
│           └── tools/          # Helper tools
├── docker/                      # Docker configurations
├── media/                       # Assets (audio, fonts)
└── container/                   # Docker volumes
```

## Docker Support

The project includes Docker configurations for both development and production:

- `docker-compose.yml` - Production configuration
- `docker-compose-dev.yml` - Development configuration with profiles
- `docker/dev/Dockerfile` - Development container
- `docker/prod/Dockerfile` - Production container

### Docker Profiles

- **aux** - Auxiliary services (MongoDB)
- **app** - Application service (Bot)

## Tech Stack

- **Runtime:** Bun / Node.js
- **Language:** TypeScript
- **Framework:** Discord.js v14
- **Database:** MongoDB with Mongoose
- **Image Processing:** Sharp, Canvas
- **Audio:** @discordjs/voice, OpusScript
- **Validation:** Zod
- **Styling:** Colorette

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## Security

For security concerns, please review our [SECURITY.md](SECURITY.md) policy.

## Contact

Project maintained by [ceraia](https://github.com/ceraia)

---

Made with ❤️ and TypeScript

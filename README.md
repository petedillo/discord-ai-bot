# Discord AI Bot

A Discord bot with Ollama AI integration and extensible tool support. The bot allows users to interact with AI models through Discord slash commands, with support for function calling and custom tools.

## Features

- **AI Chat Integration**: Powered by Ollama with support for various models
- **Tool Support**: Extensible tool system allowing AI to perform actions
  - Math calculations
  - Time/date queries
  - qBittorrent integration (torrent management)
- **Prometheus Metrics**: Built-in metrics endpoint for monitoring
- **User Authorization**: Whitelist-based user access control
- **Docker Support**: Ready-to-deploy Docker configuration

## Requirements

- **Node.js** >= 20.0.0 or **Bun** >= 1.0.0
- **Ollama** running locally or remotely with a compatible model (e.g., `qwen-tools`)
- **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/petedillo/discord-ai-bot.git
cd discord-ai-bot
```

### 2. Install Dependencies
```bash
npm install
# or
bun install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required configuration:
- `DISCORD_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `ALLOWED_USER_IDS`: Comma-separated Discord user IDs allowed to use the bot
- `OLLAMA_HOST`: Ollama API endpoint (default: `http://localhost:11434`)
- `OLLAMA_MODEL`: Model to use (e.g., `qwen-tools`)

Optional configuration:
- `METRICS_ENABLED`: Enable Prometheus metrics (default: `true`)
- `METRICS_PORT`: Metrics server port (default: `9090`)
- `QBIT_ENABLED`: Enable qBittorrent tool (default: `true`)
- `QBIT_HOST`: qBittorrent WebUI URL
- `LOG_LEVEL`: Logging level (`debug`, `info`, `warn`, `error`, `silent`)

### 4. Build the Project
```bash
npm run build
```

### 5. Start the Bot
```bash
npm run start
```

For development with auto-reload:
```bash
npm run dev
```

## Available Commands

- `/ask <question>` - Ask the AI a question. The AI can use available tools to help answer.
- `/tools` - List all available AI tools

## Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Building Manually
```bash
docker build -t discord-ai-bot .
docker run -d --env-file .env discord-ai-bot
```

## Development

### Project Structure
```
src/
├── ai/              # AI client and tool execution logic
├── clients/         # External API clients
├── commands/        # Discord slash commands
├── config.ts        # Configuration management
├── events/          # Discord event handlers
├── metrics/         # Prometheus metrics
├── tools/           # AI tool implementations
└── utils/           # Utility functions
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Lint code with ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:run` - Run tests once without watch mode

### Adding New Tools
1. Create a new tool file in `src/tools/`
2. Extend `BaseTool` class
3. Implement `execute()` method
4. Register the tool in `src/tools/index.ts`

Example:
```typescript
import { BaseTool } from './BaseTool.js';

interface MyToolParams {
  input: string;
}

export class MyTool extends BaseTool {
  name = 'my_tool';
  description = 'Description of what this tool does';
  
  async execute(params: MyToolParams): Promise<string> {
    // Tool implementation
    return `Processed: ${params.input}`;
  }
}
```

## License

This project is open source and available for use and modification.
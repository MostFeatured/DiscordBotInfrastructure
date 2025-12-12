# Getting Started with DBI

This guide will walk you through setting up your first Discord bot using DBI (Discord Bot Infrastructure).

## Prerequisites

- **Node.js 16.9.0 or higher** - [Download Node.js](https://nodejs.org/)
- **A Discord Application** - [Create one here](https://discord.com/developers/applications)
- **Basic JavaScript/TypeScript knowledge**

---

## Installation

### Create a New Project

```bash
mkdir my-discord-bot
cd my-discord-bot
npm init -y
```

### Install Dependencies

```bash
npm install @mostfeatured/dbi discord.js
```

For TypeScript users:
```bash
npm install -D typescript @types/node ts-node
```

---

## Project Setup

### Recommended Project Structure

```
my-discord-bot/
├── package.json
├── .env                    # Environment variables (keep this secret!)
├── dbi.js                  # DBI configuration
├── login.js                # Bot startup script
├── publish.js              # Command publishing script
└── src/
    ├── commands/           # Slash commands
    │   └── ping.js
    ├── components/         # Buttons, Select Menus, Modals
    │   └── confirm.js
    ├── events/             # Discord event handlers
    │   └── ready.js
    └── locales/            # Language files
        └── en.js
```

---

## Step-by-Step Configuration

### 1. Create the DBI Configuration (`dbi.js`)

The DBI configuration is the heart of your bot. It defines how your bot connects to Discord and its default behaviors.

```javascript
const { createDBI } = require("@mostfeatured/dbi");

// Create a DBI instance with a unique namespace
const dbi = createDBI("my-bot", {
  // Strict mode - throws errors for duplicate registrations
  strict: true,
  
  // Discord connection settings
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: {
      intents: [
        "Guilds",           // For guild-related events
        "GuildMessages",     // For message events
        "MessageContent"     // For reading message content (privileged)
      ]
    }
  },
  
  // Default settings for interactions
  defaults: {
    locale: {
      name: "en",  // Default language
      // Custom message when locale path not found
      invalidPath: (ctx) => `Missing translation: ${ctx.path}`
    },
    // Default permissions required to use commands
    defaultMemberPermissions: ["SendMessages"],
    // Whether commands work in DMs
    directMessages: false
  },
  
  // Reference system for passing data through components
  references: {
    autoClear: {
      ttl: 60 * 60 * 1000,  // References expire after 1 hour
      check: 60 * 1000       // Check for expired refs every minute
    }
  },
  
  // Inline listener cleanup (for createInlineButton, etc.)
  inlineListeners: {
    autoClear: {
      ttl: 15 * 60 * 1000,  // 15 minutes TTL
      check: 60 * 1000       // Check every minute
    }
  }
});

module.exports = dbi;
```

### Configuration Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `strict` | `boolean` | Throw errors for duplicate registrations |
| `discord.token` | `string` | Your bot token |
| `discord.options` | `ClientOptions` | Discord.js client options |
| `defaults.locale.name` | `string` | Default locale name |
| `defaults.locale.invalidPath` | `string \| function` | Message/function for missing locale paths |
| `defaults.defaultMemberPermissions` | `string[]` | Required permissions for commands |
| `defaults.directMessages` | `boolean` | Allow commands in DMs |
| `references.autoClear.ttl` | `number` | Reference time-to-live (ms) |
| `references.autoClear.check` | `number` | Cleanup check interval (ms) |
| `sharding` | `"hybrid" \| "default" \| "off"` | Sharding mode |
| `store` | `DBIStore` | Custom persistent store |

---

### 2. Create Your First Command (`src/commands/ping.js`)

```javascript
const dbi = require("../../dbi");

dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "ping",
    description: "Check the bot's latency",
    
    async onExecute({ interaction, dbi }) {
      const ws = dbi.client().client.ws.ping;
      const start = Date.now();
      
      await interaction.deferReply();
      
      const roundtrip = Date.now() - start;
      
      await interaction.editReply(
        `🏓 **Pong!**\n` +
        `> WebSocket: \`${ws}ms\`\n` +
        `> Roundtrip: \`${roundtrip}ms\``
      );
    }
  });
});
```

---

### 3. Create an Event Handler (`src/events/ready.js`)

```javascript
const dbi = require("../../dbi");

dbi.register(({ Event }) => {
  Event({
    name: "clientReady",
    id: "ready-handler",  // Unique ID for multiple handlers of same event
    
    onExecute({ client }) {
      console.log(`✅ Bot is online!`);
      console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
      
      // Set bot status
      client.user.setActivity({
        name: "with DBI",
        type: 0  // Playing
      });
    }
  });
});
```

---

### 4. Create the Login Script (`login.js`)

```javascript
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

async function start() {
  try {
    // Recursively import all files in src/
    // This makes DBI aware of all your commands, events, etc.
    await Utils.recursiveImport("./src");
    
    // Load all registered features into DBI
    await dbi.load();
    
    // Connect to Discord
    await dbi.login();
    
    console.log(`✅ Logged in as ${dbi.client().client.user.tag}`);
    
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

start();
```

---

### 5. Create the Publish Script (`publish.js`)

Commands must be published to Discord before they appear in the client.

```javascript
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

async function publish() {
  try {
    await Utils.recursiveImport("./src");
    await dbi.load();
    
    // For development: Publish to a specific guild (instant updates)
    await dbi.publish("Guild", "YOUR_GUILD_ID");
    
    // For production: Publish globally (can take up to 1 hour)
    // await dbi.publish("Global");
    
    await dbi.unload();
    console.log("✅ Commands published successfully!");
    
  } catch (error) {
    console.error("Failed to publish commands:", error);
    process.exit(1);
  }
}

publish();
```

---

### 6. Set Up Environment Variables

Create a `.env` file (never commit this!):

```env
DISCORD_TOKEN=your_bot_token_here
```

Install dotenv:
```bash
npm install dotenv
```

Add to top of `dbi.js`:
```javascript
require("dotenv").config();
```

---

## Running Your Bot

### Publish Commands First

```bash
node publish.js
```

### Start the Bot

```bash
node login.js
```

---

## Development Workflow

1. **Make changes** to your commands/events/components
2. **Restart the bot** to apply changes
3. **Republish commands** only if you changed command names, descriptions, or options

> **Tip:** For faster development, publish to a guild instead of globally. Guild command updates are instant!

---

## TypeScript Setup

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### TypeScript Example (`src/commands/ping.ts`)

```typescript
import { createDBI } from "@mostfeatured/dbi";

// Import your DBI instance
import dbi from "../../dbi";

dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "ping",
    description: "Check latency",
    async onExecute({ interaction, dbi }) {
      const latency = dbi.client().client.ws.ping;
      await interaction.reply(`Pong! ${latency}ms`);
    }
  });
});
```

---

## Next Steps

Now that you have a basic bot running, explore these guides:

1. **[Chat Input Commands](./CHAT_INPUT.md)** - Learn about slash commands and options
2. **[Components](./COMPONENTS.md)** - Add buttons, select menus, and modals
3. **[Events](./EVENTS.md)** - Handle Discord events
4. **[Localization](./LOCALIZATION.md)** - Support multiple languages
5. **[Advanced Features](./ADVANCED_FEATURES.md)** - Rate limiting, references, and more

---

## Troubleshooting

### Commands not appearing?

1. Make sure you published commands: `node publish.js`
2. For global commands, wait up to 1 hour
3. Check bot has `applications.commands` scope
4. Verify the bot is in the guild

### Bot not responding?

1. Check the bot has required permissions
2. Verify intents are properly configured
3. Check for errors in console
4. Ensure `dbi.load()` was called before `dbi.login()`

### "Missing Access" error?

1. Invite bot with proper permissions
2. Check channel permissions
3. Verify bot role position

### Token errors?

1. Regenerate token in Discord Developer Portal
2. Check `.env` file is being loaded
3. Ensure no spaces around the `=` in `.env`

---

## Getting Help

- Check the [documentation](./README.md)
- Review the [examples](../test/)
- Report issues on GitHub

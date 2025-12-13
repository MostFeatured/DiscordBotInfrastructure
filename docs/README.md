# DBI - Discord Bot Infrastructure

<div align="center">

**The most advanced, modern, and developer-friendly Discord bot framework available.**

[![npm version](https://img.shields.io/npm/v/@mostfeatured/dbi.svg)](https://www.npmjs.com/package/@mostfeatured/dbi)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 🌟 Why DBI?

DBI (Discord Bot Infrastructure) is not just another Discord bot template—it's a **powerful NPM module** that provides a complete infrastructure for building production-ready Discord bots with minimal boilerplate.

### Key Features

| Feature | Description |
|---------|-------------|
| 🎯 **Slash Commands** | Full support for Discord's application commands with type-safe options |
| 🧩 **Components V2** | Buttons, Select Menus, Modals with built-in state management |
| ⚡ **Svelte Integration** | Build reactive Discord UIs with Svelte 5 components |
| 🌍 **Localization** | Multi-language support for both content and interactions |
| 📨 **Message Commands** | Automatic slash-to-message command conversion |
| 🔄 **Reference System** | Pass complex data through components without database |
| ⏱️ **Rate Limiting** | Built-in per-user, channel, guild rate limiting |
| 🔀 **Multi-Client** | Support for multiple bot clients simultaneously |
| 📦 **Hybrid Sharding** | Built-in support for discord-hybrid-sharding |
| 🔒 **Type Safety** | Full TypeScript support with intelligent autocomplete |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./GETTING_STARTED.md) | Installation and basic setup |
| [Chat Input Commands](./CHAT_INPUT.md) | Slash commands and options |
| [Components](./COMPONENTS.md) | Buttons, Select Menus, Modals |
| [Events](./EVENTS.md) | Discord events and Custom Events |
| [Localization](./LOCALIZATION.md) | Multi-language support |
| [Svelte Components](./SVELTE_COMPONENTS.md) | Reactive UI with Svelte 5 |
| [Advanced Features](./ADVANCED_FEATURES.md) | References, Rate Limiting, Message Commands |
| [API Reference](./API_REFERENCE.md) | Complete API documentation |

---

## 🚀 Quick Start

### Installation

```bash
npm install @mostfeatured/dbi discord.js
# or
pnpm add @mostfeatured/dbi discord.js
# or
yarn add @mostfeatured/dbi discord.js
```

### Project Structure

```
my-bot/
├── dbi.js          # DBI configuration
├── login.js        # Bot startup script
├── publish.js      # Command publishing script
└── src/            # Your bot features
    ├── commands/
    ├── events/
    ├── components/
    └── locales/
```

### Step 1: Configure DBI (`dbi.js`)

```javascript
const { createDBI } = require("@mostfeatured/dbi");

const dbi = createDBI("my-bot", {
  strict: true,
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: {
      intents: ["Guilds", "GuildMessages"]
    }
  },
  defaults: {
    locale: { name: "en" },
    defaultMemberPermissions: ["SendMessages"],
    directMessages: false
  },
  references: {
    autoClear: {
      ttl: 60 * 60 * 1000, // 1 hour
      check: 60 * 1000     // Check every minute
    }
  }
});

module.exports = dbi;
```

### Step 2: Create a Command (`src/commands/ping.js`)

```javascript
const dbi = require("../dbi");

dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "ping",
    description: "Check the bot's latency",
    async onExecute({ interaction, dbi }) {
      const latency = dbi.client().client.ws.ping;
      await interaction.reply(`🏓 Pong! Latency: ${latency}ms`);
    }
  });
});
```

### Step 3: Start the Bot (`login.js`)

```javascript
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  // Import all files from src/
  await Utils.recursiveImport("./src");
  
  // Load all registered features
  await dbi.load();
  
  // Connect to Discord
  await dbi.login();
  
  console.log(`✅ Logged in as ${dbi.client().client.user.tag}`);
})();
```

### Step 4: Publish Commands (`publish.js`)

```javascript
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  
  // Publish to a specific guild (for development)
  await dbi.publish("Guild", "YOUR_GUILD_ID");
  
  // Or publish globally (for production)
  // await dbi.publish("Global");
  
  await dbi.unload();
  console.log("✅ Commands published!");
})();
```

---

## 🎯 Core Concepts

### The Register Pattern

DBI uses a register pattern to define all bot features:

```javascript
dbi.register(({ ChatInput, Button, Event, Locale }) => {
  // Define features here
  ChatInput({ /* ... */ });
  Button({ /* ... */ });
  Event({ /* ... */ });
  Locale({ /* ... */ });
});
```

This pattern provides:
- **Dependency injection** - Access only what you need
- **Type safety** - Full autocomplete support
- **Organization** - Group related features together
- **Hot reloading** - Support for `onUnload` callbacks

### Available Register Functions

| Function | Description |
|----------|-------------|
| `ChatInput` | Slash commands |
| `Button` | Button components |
| `StringSelectMenu` | String select menus |
| `UserSelectMenu` | User select menus |
| `RoleSelectMenu` | Role select menus |
| `ChannelSelectMenu` | Channel select menus |
| `MentionableSelectMenu` | Mentionable select menus |
| `Modal` | Modal dialogs |
| `MessageContextMenu` | Message context menu commands |
| `UserContextMenu` | User context menu commands |
| `Event` | Discord events |
| `Locale` | Content localization |
| `InteractionLocale` | Interaction name localization |
| `CustomEvent` | Custom event definitions |
| `HTMLComponentsV2` | Svelte/Eta template components |
| `ChatInputOptions` | Command option builders |
| `onUnload` | Cleanup callback for hot reloading |

### Inline Listeners

Create one-time use components without pre-registration:

```javascript
dbi.register(({ ChatInput, createInlineButton }) => {
  ChatInput({
    name: "confirm",
    description: "Confirm an action",
    async onExecute({ interaction }) {
      const confirmBtn = createInlineButton({
        options: { style: "Success", label: "Confirm" },
        onExecute({ interaction }) {
          interaction.reply("Confirmed!");
        }
      });
      
      await interaction.reply({
        content: "Are you sure?",
        components: [
          {
            type: 1,
            components: [confirmBtn.toJSON()]
          }
        ]
      });
    }
  });
});
```

---

## 💡 Example: Complete Feature

Here's a complete example showing multiple DBI features working together:

```javascript
const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions, Button, Locale }) => {
  
  // Localization
  Locale({
    name: "en",
    data: {
      poll: {
        title: "Poll: {0}",
        voted: "You voted for: {0}",
        results: "Results so far:"
      }
    }
  });

  // Button handler
  Button({
    name: "poll-vote",
    onExecute({ interaction, data, locale }) {
      const [option] = data;
      interaction.reply({
        content: locale.user.data.poll.voted(option),
        ephemeral: true
      });
    },
    options: {
      style: Discord.ButtonStyle.Primary
    }
  });

  // Slash command
  ChatInput({
    name: "poll",
    description: "Create a poll",
    options: [
      ChatInputOptions.string({
        name: "question",
        description: "The poll question",
        required: true
      }),
      ChatInputOptions.string({
        name: "options",
        description: "Comma-separated options",
        required: true
      })
    ],
    async onExecute({ interaction, locale, dbi }) {
      const question = interaction.options.getString("question");
      const options = interaction.options.getString("options").split(",");
      
      const buttons = options.map(opt => 
        dbi.interaction("poll-vote").toJSON({
          overrides: { label: opt.trim() },
          reference: { data: [opt.trim()] }
        })
      );

      await interaction.reply({
        content: locale.user.data.poll.title(question),
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: buttons
          }
        ]
      });
    }
  });
});
```

---

## 🔗 Related Links

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord API Documentation](https://discord.com/developers/docs)

---

## 📄 License

GPL-3.0 License - See [LICENSE](../LICENSE) for details.

---

<div align="center">

**Made with ❤️ by [TheArmagan](https://github.com/TheArmagan) and the MostFeatured team**

</div>

---

> 📄 **LLM-optimized version:** [llm/README.txt](./llm/README.txt)

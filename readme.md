<div align="center">

# 🤖 DBI - Discord Bot Infrastructure

[![npm version](https://img.shields.io/npm/v/@mostfeatured/dbi.svg?style=flat-square)](https://www.npmjs.com/package/@mostfeatured/dbi)
[![npm downloads](https://img.shields.io/npm/dm/@mostfeatured/dbi.svg?style=flat-square)](https://www.npmjs.com/package/@mostfeatured/dbi)
[![License](https://img.shields.io/npm/l/@mostfeatured/dbi.svg?style=flat-square)](LICENSE)

**The most advanced, modern, and developer-friendly Discord.js v14 bot infrastructure.**

[Getting Started](#-quick-start) •
[Features](#-features) •
[Documentation](#-documentation) •
[Examples](#-examples)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Slash Commands** | Full support with 14 option types, autocomplete, and subcommands |
| 🔘 **Components** | Buttons, Select Menus (5 types), and Modals with built-in state management |
| 🌍 **Localization** | Multi-language support for both content and command translations |
| 📨 **Events** | Discord events, custom events, and internal DBI events |
| 💬 **Message Commands** | Automatic slash command emulation from prefix commands |
| 🔗 **Reference System** | Pass complex data through component interactions |
| 🚀 **Multi-Client** | Run multiple bots with namespace isolation |
| ⚡ **Hybrid Sharding** | Scale to millions of servers with discord-hybrid-sharding |
| 🎨 **Svelte Components** | Build reactive Discord UIs with Svelte 5 (HTMLComponentsV2) |
| 🔄 **Hot Reloading** | Update features without restarting your bot |
| 🛡️ **Rate Limiting** | Built-in rate limit management per user/channel/guild |
| 📝 **TypeScript** | Full type safety with intelligent autocomplete |

---

## 📦 Installation

```bash
npm install @mostfeatured/dbi discord.js
```

---

## 🚀 Quick Start

### 1. Create DBI Instance

```javascript
// dbi.js
const { createDBI } = require("@mostfeatured/dbi");

const dbi = createDBI("my-bot", {
  strict: true,
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: { intents: ["Guilds"] }
  },
  defaults: {
    locale: { name: "en" },
    directMessages: false
  }
});

module.exports = dbi;
```

### 2. Define Features

```javascript
// src/commands/ping.js
const dbi = require("../dbi");

dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "ping",
    description: "Check bot latency",
    onExecute({ interaction, dbi }) {
      interaction.reply(`🏓 Pong! ${dbi.client().client.ws.ping}ms`);
    }
  });
});
```

### 3. Start Bot

```javascript
// index.js
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  await dbi.login();
  console.log(`✅ Logged in as ${dbi.client().client.user.tag}`);
})();
```

### 4. Publish Commands

```javascript
// publish.js
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  await dbi.publish("Global"); // or dbi.publish("Guild", "GUILD_ID")
  await dbi.unload();
  console.log("✅ Commands published!");
})();
```

---

## 💡 Examples

### Slash Command with Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "greet",
    description: "Greet a user",
    options: [
      ChatInputOptions.user({
        name: "target",
        description: "User to greet",
        required: true
      }),
      ChatInputOptions.string({
        name: "message",
        description: "Custom message"
      })
    ],
    onExecute({ interaction }) {
      const user = interaction.options.getUser("target");
      const message = interaction.options.getString("message") || "Hello!";
      interaction.reply(`${message}, ${user}!`);
    }
  });
});
```

### Button with Reference Data

```javascript
const Discord = require("discord.js");

dbi.register(({ ChatInput, Button }) => {
  ChatInput({
    name: "shop",
    description: "View the shop",
    onExecute({ interaction, dbi }) {
      interaction.reply({
        content: "🛒 Welcome to the shop!",
        components: [{
          type: Discord.ComponentType.ActionRow,
          components: [
            dbi.interaction("buy-item").toJSON({
              overrides: { label: "Buy Sword - 100g" },
              reference: { data: ["sword", 100] }
            })
          ]
        }]
      });
    }
  });

  Button({
    name: "buy-item",
    options: { style: Discord.ButtonStyle.Primary },
    onExecute({ interaction, data }) {
      const [item, price] = data;
      interaction.reply(`✅ You bought **${item}** for **${price}g**!`);
    }
  });
});
```

### Multi-Language Support

```javascript
dbi.register(({ Locale, ChatInput }) => {
  Locale({
    name: "en",
    data: {
      greeting: "Hello, {0}!",
      farewell: "Goodbye!"
    }
  });

  Locale({
    name: "tr",
    data: {
      greeting: "Merhaba, {0}!",
      farewell: "Hoşça kal!"
    }
  });

  ChatInput({
    name: "hello",
    description: "Say hello",
    onExecute({ interaction, locale }) {
      const greeting = locale.user.data.greeting(interaction.user.username);
      interaction.reply(greeting);
    }
  });
});
```

---

## 📚 Documentation

Comprehensive documentation is available in the [docs](./docs/) folder:

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/GETTING_STARTED.md) | Installation, setup, and project structure |
| [Chat Input](./docs/CHAT_INPUT.md) | Slash commands, options, and autocomplete |
| [Components](./docs/COMPONENTS.md) | Buttons, select menus, and modals |
| [Events](./docs/EVENTS.md) | Discord events, custom events, DBI events |
| [Localization](./docs/LOCALIZATION.md) | Multi-language support |
| [Advanced Features](./docs/ADVANCED_FEATURES.md) | Message commands, sharding, multi-client |
| [Svelte Components](./docs/SVELTE_COMPONENTS.md) | HTMLComponentsV2 with Svelte 5 |
| [API Reference](./docs/API_REFERENCE.md) | Complete API documentation |

---

## 🏗️ Project Structure

```
my-bot/
├── dbi.js           # DBI configuration
├── index.js         # Bot entry point
├── publish.js       # Command publisher
└── src/
    ├── commands/    # Slash commands
    ├── components/  # Buttons, modals, menus
    ├── events/      # Event handlers
    └── locales/     # Language files
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

[GPL-3.0](LICENSE) © TheArmagan

---

<div align="center">

**"There will always be something free and valuable on earth."**

Made with ❤️ by [TheArmagan](https://github.com/TheArmagan)

</div>
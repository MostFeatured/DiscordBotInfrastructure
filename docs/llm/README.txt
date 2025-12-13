================================================================================
DBI (DISCORD BOT INFRASTRUCTURE) - LLM REFERENCE DOCUMENT
================================================================================

DOCUMENT TYPE: Overview & Quick Start Guide
PACKAGE: @mostfeatured/dbi
VERSION COMPATIBILITY: discord.js v14
LANGUAGE: TypeScript/JavaScript

================================================================================
SECTION 1: WHAT IS DBI?
================================================================================

DBI is an NPM module that provides complete infrastructure for building 
production-ready Discord bots. It is NOT a template - it's a framework.

PRIMARY PURPOSE:
- Simplify Discord bot development
- Provide type-safe APIs
- Handle boilerplate automatically
- Enable reactive UI patterns

================================================================================
SECTION 2: CORE FEATURES
================================================================================

FEATURE                  | DESCRIPTION
-------------------------|--------------------------------------------------
Slash Commands           | Full Discord application commands with type-safe options
Components V2            | Buttons, Select Menus, Modals with state management
Svelte Integration       | Reactive Discord UIs with Svelte 5 components
Localization            | Multi-language support for content and interactions
Message Commands        | Automatic slash-to-message command conversion
Reference System        | Pass complex data through components without database
Rate Limiting           | Built-in per-user, channel, guild rate limiting
Multi-Client            | Support for multiple bot clients simultaneously
Hybrid Sharding         | Built-in support for discord-hybrid-sharding
Type Safety             | Full TypeScript support with intelligent autocomplete

================================================================================
SECTION 3: INSTALLATION
================================================================================

COMMAND (npm):
npm install @mostfeatured/dbi discord.js

COMMAND (pnpm):
pnpm add @mostfeatured/dbi discord.js

COMMAND (yarn):
yarn add @mostfeatured/dbi discord.js

REQUIREMENTS:
- Node.js 16.9.0 or higher
- Discord Application with bot token

================================================================================
SECTION 4: PROJECT STRUCTURE (RECOMMENDED)
================================================================================

my-bot/
├── dbi.js          # DBI configuration (createDBI call)
├── login.js        # Bot startup script
├── publish.js      # Command publishing script
└── src/
    ├── commands/   # Slash commands
    ├── events/     # Discord event handlers
    ├── components/ # Buttons, Select Menus, Modals
    └── locales/    # Language files

================================================================================
SECTION 5: BASIC SETUP PATTERN
================================================================================

STEP 1 - Create DBI Instance (dbi.js):
----------------------------------------
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
      ttl: 60 * 60 * 1000,
      check: 60 * 1000
    }
  }
});

module.exports = dbi;

STEP 2 - Create Command (src/commands/ping.js):
------------------------------------------------
const dbi = require("../dbi");

dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "ping",
    description: "Check the bot's latency",
    async onExecute({ interaction, dbi }) {
      const latency = dbi.client().client.ws.ping;
      await interaction.reply(`Pong! Latency: ${latency}ms`);
    }
  });
});

STEP 3 - Start Bot (login.js):
-------------------------------
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  await dbi.login();
  console.log(`Logged in as ${dbi.client().client.user.tag}`);
})();

STEP 4 - Publish Commands (publish.js):
----------------------------------------
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  await dbi.publish("Guild", "YOUR_GUILD_ID"); // Development
  // await dbi.publish("Global"); // Production
  await dbi.unload();
  console.log("Commands published!");
})();

================================================================================
SECTION 6: REGISTER PATTERN
================================================================================

All DBI features are defined using the register pattern:

dbi.register(({ ChatInput, Button, Event, Locale }) => {
  // Define features here
  ChatInput({ /* ... */ });
  Button({ /* ... */ });
  Event({ /* ... */ });
  Locale({ /* ... */ });
});

AVAILABLE REGISTER FUNCTIONS:
- ChatInput          : Slash commands
- Button             : Button components
- StringSelectMenu   : String select menus
- UserSelectMenu     : User select menus
- RoleSelectMenu     : Role select menus
- ChannelSelectMenu  : Channel select menus
- MentionableSelectMenu : Mentionable select menus
- Modal              : Modal dialogs
- MessageContextMenu : Message context menu commands
- UserContextMenu    : User context menu commands
- Event              : Discord events
- Locale             : Content localization
- InteractionLocale  : Interaction name localization
- CustomEvent        : Custom event definitions
- HTMLComponentsV2   : Svelte/Eta template components
- ChatInputOptions   : Command option builders
- onUnload           : Cleanup callback for hot reloading

================================================================================
SECTION 7: DOCUMENTATION FILES
================================================================================

FILE                    | CONTENT
------------------------|--------------------------------------------------
GETTING_STARTED.md      | Installation and basic setup
CHAT_INPUT.md           | Slash commands and options
COMPONENTS.md           | Buttons, Select Menus, Modals
EVENTS.md               | Discord events and Custom Events
LOCALIZATION.md         | Multi-language support
SVELTE_COMPONENTS.md    | Reactive UI with Svelte 5
ADVANCED_FEATURES.md    | References, Rate Limiting, Message Commands
API_REFERENCE.md        | Complete API documentation

================================================================================
END OF DOCUMENT
================================================================================

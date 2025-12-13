# Advanced Features

This guide covers advanced DBI features including message commands, multi-client support, rate limiting, references, sharding, and more.

---

## Table of Contents

- [Message Commands](#message-commands)
- [Reference System](#reference-system)
- [Rate Limiting](#rate-limiting)
- [Multi-Client Support](#multi-client-support)
- [Sharding](#sharding)
- [Hot Reloading](#hot-reloading)
- [Persistent Store](#persistent-store)
- [Flag-based Loading](#flag-based-loading)
- [Data Management](#data-management)

---

## Message Commands

DBI can automatically convert slash commands to message-based commands, allowing users to use traditional prefix commands.

### Enabling Message Commands

```javascript
const dbi = createDBI("my-bot", {
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: {
      intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent"  // Required for message commands
      ]
    }
  },
  
  // Enable message commands
  messageCommands: {
    // Prefixes to listen for
    prefixes: ["!", ".", "?"],
    
    // Or dynamic prefixes
    // prefixes: async ({ message }) => {
    //   const guildPrefix = await getGuildPrefix(message.guild?.id);
    //   return [guildPrefix, "!"];
    // },
    
    // Type aliases for boolean parsing
    typeAliases: {
      booleans: {
        "yes": true,
        "no": false,
        "true": true,
        "false": false,
        "on": true,
        "off": false,
        "1": true,
        "0": false
      }
    }
  },
  
  defaults: {
    messageCommands: {
      // Content shown while processing
      deferReplyContent: "Processing..."
      // Or dynamic:
      // deferReplyContent: ({ interaction }) => `Processing ${interaction.commandName}...`
    }
  }
});
```

### How It Works

Message commands emulate slash commands:
- `!ping` → `/ping`
- `!user info @John` → `/user info user:@John`
- `!ban @User spam` → `/ban user:@User reason:spam`

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  // This command works with both slash and message commands
  ChatInput({
    name: "greet",
    description: "Greet someone",
    options: [
      ChatInputOptions.user({
        name: "user",
        description: "User to greet",
        required: true
      }),
      ChatInputOptions.string({
        name: "message",
        description: "Custom message",
        required: false
      })
    ],
    
    onExecute({ interaction }) {
      const user = interaction.options.getUser("user");
      const message = interaction.options.getString("message") || "Hello!";
      
      interaction.reply(`${message} ${user}`);
    }
  });
});

// Usage:
// Slash: /greet user:@John message:Welcome!
// Message: !greet @John Welcome!
```

### Message Command Aliases

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "help",
    description: "Show help",
    
    other: {
      messageCommand: {
        // Additional command aliases
        aliases: ["h", "?", "commands", "cmds"],
        
        // Set to true to disable message command for this
        ignore: false
      }
    },
    
    onExecute({ interaction }) {
      interaction.reply("Help information...");
    }
  });
});

// Now works with: !help, !h, !?, !commands, !cmds
```

### Rest String Arguments

Capture remaining text in a single string:

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "say",
    description: "Make the bot say something",
    options: [
      ChatInputOptions.string({
        name: "message",
        description: "The message",
        required: true,
        messageCommands: {
          rest: true  // Capture all remaining text
        }
      })
    ],
    
    onExecute({ interaction }) {
      const message = interaction.options.getString("message");
      interaction.reply(message);
    }
  });
});

// !say Hello world, how are you?
// message = "Hello world, how are you?"
```

### Handling Message Command Errors

```javascript
const { ApplicationCommandOptionType } = require("discord.js");

// Argument validation error
dbi.events.on("messageCommandArgumentError", ({ message, error, dbiInteraction }) => {
  const option = error.option;
  const errorMessages = {
    MissingRequiredOption: `Missing required argument: \`${option.name}\``,
    MinLength: `\`${option.name}\` must be at least ${option.minLength} characters`,
    MaxLength: `\`${option.name}\` must be at most ${option.maxLength} characters`,
    InvalidChoice: `\`${option.name}\` must be one of: ${error.extra?.map(c => c.name).join(", ")}`,
    InvalidInteger: `\`${option.name}\` must be a whole number`,
    InvalidNumber: `\`${option.name}\` must be a number`,
    InvalidBoolean: `\`${option.name}\` must be yes/no or true/false`,
    InvalidUser: `\`${option.name}\` must be a valid user mention`,
    InvalidChannel: `\`${option.name}\` must be a valid channel mention`,
    InvalidRole: `\`${option.name}\` must be a valid role mention`
  };
  
  message.reply(`❌ ${errorMessages[error.type] || "Invalid argument"}`);
  return false;
});

// DM usage when not allowed
dbi.events.on("messageCommandDirectMessageUsageError", ({ message }) => {
  message.reply("❌ This command can only be used in servers.");
  return false;
});

// Missing permissions
dbi.events.on("messageCommandDefaultMemberPermissionsError", ({ message, permissions }) => {
  message.reply(`❌ You need these permissions: ${permissions.join(", ")}`);
  return false;
});
```

---

## Reference System

The reference system allows passing data through Discord's component custom IDs.

### Custom ID Encoding

DBI encodes different types in the custom ID:

| Type | Encoding | Example |
|------|----------|---------|
| String | Raw | `"hello"` → `hello` |
| Number | `π` prefix | `42` → `π42` |
| BigInt | `ᙖ` prefix | `12345n` → `ᙖ12345` |
| Boolean | `𝞫` prefix | `true` → `𝞫1` |
| `undefined` | `🗶u` | `undefined` → `🗶u` |
| `null` | `🗶n` | `null` → `🗶n` |
| Object | `¤` + ref ID | `{...}` → `¤abc123` |

### Using References

```javascript
dbi.register(({ Button }) => {
  Button({
    name: "action",
    options: { style: Discord.ButtonStyle.Primary, label: "Action" },
    
    onExecute({ interaction, data }) {
      // data is an array of the referenced values
      const [userId, action, metadata] = data;
      
      console.log(`User: ${userId}`);        // string
      console.log(`Action: ${action}`);       // string
      console.log(`Metadata:`, metadata);     // object (if was object)
      
      if (metadata?.$ref) {
        // This is an object reference
        console.log(`Ref ID: ${metadata.$ref}`);
        
        // Clean up when done
        metadata.$unRef();
      }
      
      interaction.reply("Done!");
    }
  });
});

// Creating the button:
const button = dbi.interaction("action").toJSON({
  reference: {
    data: [
      "123456789",                    // String - encoded in custom ID
      "approve",                       // String - encoded in custom ID
      { complex: "object", nested: {} } // Object - stored in memory
    ],
    ttl: 300000  // Optional: auto-expire in 5 minutes
  }
});
```

### Reference Configuration

```javascript
const dbi = createDBI("my-bot", {
  references: {
    autoClear: {
      ttl: 3600000,   // Default TTL: 1 hour
      check: 60000    // Check every minute
    }
  }
});
```

### Manual Reference Management

```javascript
// Access references directly
const refs = dbi.data.refs;

// Get a reference
const ref = refs.get("refId");
console.log(ref.value);  // The stored object
console.log(ref.at);     // Timestamp when created
console.log(ref.ttl);    // Time-to-live in ms

// Delete a reference
refs.delete("refId");

// Check if reference exists
refs.has("refId");
```

---

## Rate Limiting

DBI provides built-in rate limiting for interactions.

### Declarative Rate Limits

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "daily",
    description: "Claim daily reward",
    
    // Static rate limits
    rateLimits: [
      {
        type: "User",
        duration: 86400000  // 24 hours in ms
      }
    ],
    
    onExecute({ interaction }) {
      interaction.reply("Here's your daily reward! 🎁");
    }
  });
});
```

### Rate Limit Types

| Type | Description |
|------|-------------|
| `User` | Per-user across all servers |
| `Channel` | Per-channel |
| `Guild` | Per-server |
| `Member` | Per-member (user+guild combination) |
| `Message` | Per-message |

### Dynamic Rate Limits

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "action",
    description: "Do something",
    
    async onExecute({ interaction, setRateLimit }) {
      const isPremium = await checkPremium(interaction.user.id);
      
      // Set different cooldowns based on status
      if (isPremium) {
        await setRateLimit("User", 30000);  // 30 seconds for premium
      } else {
        await setRateLimit("User", 300000); // 5 minutes for free
      }
      
      // ... do the action
      interaction.reply("Done!");
    }
  });
});
```

### Rate Limit Events

```javascript
dbi.events.on("interactionRateLimit", async ({ 
  interaction, 
  dbiInteraction,
  rateLimit,
  remainingTime 
}) => {
  const seconds = Math.ceil(remainingTime / 1000);
  const minutes = Math.floor(seconds / 60);
  
  let timeText;
  if (minutes > 0) {
    timeText = `${minutes}m ${seconds % 60}s`;
  } else {
    timeText = `${seconds}s`;
  }
  
  await interaction.reply({
    content: `⏳ Cooldown! Try again in **${timeText}**.`,
    ephemeral: true
  });
  
  return false;  // Don't execute
});
```

---

## Multi-Client Support

DBI supports running multiple Discord clients simultaneously.

### Configuration

```javascript
const dbi = createDBI("my-bot", {
  discord: [
    {
      namespace: "main",
      token: process.env.MAIN_BOT_TOKEN,
      options: {
        intents: ["Guilds", "GuildMessages"]
      }
    },
    {
      namespace: "music",
      token: process.env.MUSIC_BOT_TOKEN,
      options: {
        intents: ["Guilds", "GuildVoiceStates"]
      }
    },
    {
      namespace: "moderation",
      token: process.env.MOD_BOT_TOKEN,
      options: {
        intents: ["Guilds", "GuildMembers", "GuildBans"]
      }
    }
  ]
});
```

### Accessing Clients

```javascript
// Get first/default client
const defaultClient = dbi.client();

// Get specific client by namespace
const musicClient = dbi.client("music");
const modClient = dbi.client("moderation");

// Access Discord.js client
const discordClient = musicClient.client;
console.log(discordClient.user.tag);

// Get all clients
const allClients = dbi.data.clients;

// Round-robin selection
const nextClient = dbi.data.clients.next();        // Global round-robin
const nextMusic = dbi.data.clients.next("music");  // Key-specific round-robin

// Random client
const randomClient = dbi.data.clients.random();
const randomThree = dbi.data.clients.random(3);  // Array of 3 random clients
```

### Publishing to Specific Clients

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "play",
    description: "Play music",
    
    // Only publish to music bot
    publish: "music",
    
    onExecute({ interaction, clientNamespace }) {
      console.log(`Handled by: ${clientNamespace}`);
      // ...
    }
  });
});
```

### Events with Multiple Clients

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "guildCreate",
    id: "guild-logger",
    
    // Control which client handles
    triggerType: "OneByOneGlobal",  // Default: sequential globally
    // triggerType: "Random",        // Random client
    // triggerType: "First",         // Always first client
    
    onExecute({ guild, nextClient }) {
      console.log(`${nextClient.namespace} joined: ${guild.name}`);
    }
  });
});
```

---

## Sharding

DBI supports both default Discord.js sharding and discord-hybrid-sharding.

### Default Sharding

```javascript
const dbi = createDBI("my-bot", {
  sharding: "default",
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: {
      intents: ["Guilds"]
    }
  }
});
```

### Hybrid Sharding

For discord-hybrid-sharding (recommended for large bots):

```javascript
const dbi = createDBI("my-bot", {
  sharding: "hybrid",
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: {
      intents: ["Guilds"]
    }
  }
});

// Access cluster info
if (dbi.cluster) {
  console.log(`Cluster ID: ${dbi.cluster.id}`);
  console.log(`Shard IDs: ${dbi.cluster.shards}`);
}
```

### Shard Manager (separate file)

```javascript
const { ClusterManager } = require("discord-hybrid-sharding");

const manager = new ClusterManager("./bot.js", {
  totalShards: "auto",
  shardsPerClusters: 2,
  token: process.env.DISCORD_TOKEN
});

manager.on("clusterCreate", cluster => {
  console.log(`Launched cluster ${cluster.id}`);
});

manager.spawn();
```

---

## Hot Reloading

DBI supports unloading and reloading features dynamically.

### Using onUnload

```javascript
dbi.register(({ ChatInput, Event, onUnload }) => {
  let interval;
  
  Event({
    name: "clientReady",
    id: "stats-updater",
    
    onExecute({ client }) {
      interval = setInterval(() => {
        updateStats(client);
      }, 60000);
    }
  });
  
  // Cleanup when unloading
  onUnload(() => {
    if (interval) {
      clearInterval(interval);
    }
    console.log("Stats updater cleaned up");
  });
  
  ChatInput({
    name: "reload-safe",
    description: "Safe command",
    onExecute({ interaction }) {
      interaction.reply("Hello!");
    }
  });
});
```

### Reload Flow

```javascript
// Unload current features
await dbi.unload();

// Clear require cache for updated files
Utils.recursiveUnload("./src");

// Re-import files
await Utils.recursiveImport("./src");

// Load again
await dbi.load();

console.log("Bot reloaded!");
```

### Utils for Hot Reloading

```javascript
const { Utils } = require("@mostfeatured/dbi");

// Import all files in a directory
await Utils.recursiveImport("./src");

// Unload modules from require cache
Utils.recursiveUnload("./src");

// Unload a single module
Utils.unloadModule("./src/commands/ping.js");
```

---

## Persistent Store

DBI includes a store interface for persistent data.

### Default MemoryStore

```javascript
const { MemoryStore } = require("@mostfeatured/dbi");

const dbi = createDBI("my-bot", {
  store: new MemoryStore()  // Default - not persistent
});
```

### Custom Store Implementation

```javascript
// Implement the DBIStore interface
class RedisStore {
  constructor(redis) {
    this.redis = redis;
  }
  
  async get(key, defaultValue) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : defaultValue;
  }
  
  async set(key, value) {
    await this.redis.set(key, JSON.stringify(value));
  }
  
  async delete(key) {
    await this.redis.del(key);
  }
  
  async has(key) {
    return (await this.redis.exists(key)) === 1;
  }
}

// Use custom store
const dbi = createDBI("my-bot", {
  store: new RedisStore(redisClient)
});

// Use the store
await dbi.config.store.set("key", { data: "value" });
const data = await dbi.config.store.get("key");
```

---

## Flag-based Loading

Load different features based on flags.

### Defining Flags

```javascript
dbi.register(({ ChatInput, Event }) => {
  // Always loaded
  ChatInput({
    name: "ping",
    description: "Ping",
    onExecute({ interaction }) {
      interaction.reply("Pong!");
    }
  });
  
  // Only loaded with 'debug' flag
  ChatInput({
    name: "debug-info",
    description: "Debug information",
    flag: "debug",
    
    onExecute({ interaction }) {
      interaction.reply("Debug info...");
    }
  });
  
  // Only loaded with 'admin' flag
  ChatInput({
    name: "eval",
    description: "Evaluate code",
    flag: "admin",
    
    onExecute({ interaction }) {
      // Dangerous!
    }
  });
});
```

### Loading with Flags

```javascript
// Load only non-flagged features
await dbi.load();

// Load with specific flags
await dbi.load("debug");
await dbi.load("debug", "admin");

// Load everything
await dbi.load("all");
```

---

## Data Management

DBI provides utilities for managing shared data.

### Using dbi.data.other

```javascript
// Store data
dbi.set("config", { prefix: "!", language: "en" });
dbi.set("cache.users", new Map());

// Get data
const config = dbi.get("config");
const cache = dbi.get("cache.users");

// Get with default
const settings = dbi.get("settings", { theme: "dark" });

// Check existence
if (dbi.has("config")) {
  // ...
}

// Delete data
dbi.delete("cache");
```

### Constructor Data

```javascript
const dbi = createDBI("my-bot", {
  data: {
    other: {
      // Pre-populated data
      startTime: Date.now(),
      version: "1.0.0",
      customData: {}
    },
    refs: new Map()  // Pre-existing references
  }
});
```

### Accessing Registered Features

```javascript
// Get an interaction by name
const ping = dbi.interaction("ping");
const button = dbi.interaction("my-button");

// Get an event by ID
const readyEvent = dbi.event("ready-handler");

// Get a locale by name
const enLocale = dbi.locale("en");

// Access collections directly
const allInteractions = dbi.data.interactions;  // Discord.Collection
const allEvents = dbi.data.events;
const allLocales = dbi.data.locales;
```

---

## Strict Mode

Strict mode enforces best practices:

```javascript
const dbi = createDBI("my-bot", {
  strict: true  // Default is true
});
```

With strict mode:
- Duplicate interaction names throw errors
- Duplicate event IDs throw errors
- Duplicate locale names throw errors
- Custom IDs over 100 characters throw errors
- Missing event IDs throw errors

Without strict mode:
- Duplicates are silently ignored/overwritten
- Long custom IDs are truncated

---

## Next Steps

- [Svelte Components](./SVELTE_COMPONENTS.md) - Build reactive Discord UIs
- [API Reference](./API_REFERENCE.md) - Complete API documentation

---

> 📄 **LLM-optimized version:** [llm/ADVANCED_FEATURES.txt](./llm/ADVANCED_FEATURES.txt)

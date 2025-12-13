# Chat Input Commands (Slash Commands)

This guide covers everything you need to know about creating slash commands with DBI.

---

## Table of Contents

- [Basic Commands](#basic-commands)
- [Command Options](#command-options)
- [Subcommands](#subcommands)
- [Autocomplete](#autocomplete)
- [Permissions](#permissions)
- [Context Menus](#context-menus)
- [Execution Context](#execution-context)

---

## Basic Commands

### Simple Command

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "hello",
    description: "Say hello!",
    
    onExecute({ interaction }) {
      interaction.reply("Hello, World! 👋");
    }
  });
});
```

### Async Command

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "fetch-data",
    description: "Fetch some data",
    
    async onExecute({ interaction }) {
      // Defer reply for long operations
      await interaction.deferReply();
      
      // Do async work
      const data = await fetchSomeData();
      
      // Edit the deferred reply
      await interaction.editReply(`Data: ${data}`);
    }
  });
});
```

---

## Command Options

DBI provides type-safe option builders through `ChatInputOptions`.

### String Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "echo",
    description: "Echo a message",
    options: [
      ChatInputOptions.string({
        name: "message",
        description: "The message to echo",
        required: true,
        minLength: 1,
        maxLength: 2000
      })
    ],
    
    onExecute({ interaction }) {
      const message = interaction.options.getString("message");
      interaction.reply(message);
    }
  });
});
```

### String with Choices

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "color",
    description: "Pick a color",
    options: [
      ChatInputOptions.stringChoices({
        name: "color",
        description: "Choose your favorite color",
        required: true,
        choices: [
          { name: "Red", value: "red" },
          { name: "Green", value: "green" },
          { name: "Blue", value: "blue" }
        ]
      })
    ],
    
    onExecute({ interaction }) {
      const color = interaction.options.getString("color");
      interaction.reply(`You chose: ${color}`);
    }
  });
});
```

### Number Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "roll",
    description: "Roll a dice",
    options: [
      ChatInputOptions.integer({
        name: "sides",
        description: "Number of sides",
        required: true,
        minValue: 2,
        maxValue: 100
      }),
      ChatInputOptions.number({
        name: "multiplier",
        description: "Multiplier (decimal)",
        required: false,
        minValue: 0.1,
        maxValue: 10.0
      })
    ],
    
    onExecute({ interaction }) {
      const sides = interaction.options.getInteger("sides");
      const multiplier = interaction.options.getNumber("multiplier") ?? 1;
      const result = Math.floor(Math.random() * sides + 1) * multiplier;
      interaction.reply(`🎲 You rolled: ${result}`);
    }
  });
});
```

### Boolean Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "announce",
    description: "Make an announcement",
    options: [
      ChatInputOptions.string({
        name: "message",
        description: "The announcement",
        required: true
      }),
      ChatInputOptions.boolean({
        name: "mention-everyone",
        description: "Ping @everyone?",
        required: false
      })
    ],
    
    onExecute({ interaction }) {
      const message = interaction.options.getString("message");
      const mention = interaction.options.getBoolean("mention-everyone");
      
      const content = mention ? `@everyone ${message}` : message;
      interaction.reply(content);
    }
  });
});
```

### User, Role, Channel Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "info",
    description: "Get information",
    options: [
      ChatInputOptions.user({
        name: "user",
        description: "Target user",
        required: true
      }),
      ChatInputOptions.role({
        name: "role",
        description: "Target role",
        required: false
      }),
      ChatInputOptions.channel({
        name: "channel",
        description: "Target channel",
        required: false,
        channelTypes: ["GuildText", "GuildVoice"]
      })
    ],
    
    onExecute({ interaction }) {
      const user = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");
      const channel = interaction.options.getChannel("channel");
      
      let info = `User: ${user.tag}`;
      if (role) info += `\nRole: ${role.name}`;
      if (channel) info += `\nChannel: ${channel.name}`;
      
      interaction.reply(info);
    }
  });
});
```

### Mentionable Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "mention",
    description: "Mention a user or role",
    options: [
      ChatInputOptions.mentionable({
        name: "target",
        description: "User or role to mention",
        required: true
      })
    ],
    
    onExecute({ interaction }) {
      const mentionable = interaction.options.getMentionable("target");
      interaction.reply(`Mentionable: ${mentionable}`);
    }
  });
});
```

### Attachment Options

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "upload",
    description: "Upload a file",
    options: [
      ChatInputOptions.attachment({
        name: "file",
        description: "The file to upload",
        required: true
      })
    ],
    
    async onExecute({ interaction }) {
      const file = interaction.options.getAttachment("file");
      interaction.reply(`Received: ${file.name} (${file.size} bytes)`);
    }
  });
});
```

---

## All ChatInputOptions Methods

| Method | Description | Key Options |
|--------|-------------|-------------|
| `string()` | Free text input | `minLength`, `maxLength` |
| `stringChoices()` | Text with predefined choices | `choices[]` |
| `stringAutocomplete()` | Text with dynamic autocomplete | `onComplete()` |
| `integer()` | Whole number | `minValue`, `maxValue` |
| `integerChoices()` | Integer with choices | `choices[]` |
| `integerAutocomplete()` | Integer with autocomplete | `onComplete()` |
| `number()` | Decimal number | `minValue`, `maxValue` |
| `numberChoices()` | Number with choices | `choices[]` |
| `numberAutocomplete()` | Number with autocomplete | `onComplete()` |
| `boolean()` | True/false | - |
| `user()` | User mention | - |
| `channel()` | Channel mention | `channelTypes[]` |
| `role()` | Role mention | - |
| `mentionable()` | User or role | - |
| `attachment()` | File upload | - |

---

## Autocomplete

Autocomplete provides dynamic suggestions as users type.

### String Autocomplete

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "search",
    description: "Search for an item",
    options: [
      ChatInputOptions.stringAutocomplete({
        name: "query",
        description: "Search query",
        required: true,
        
        // Return suggestions based on user input
        async onComplete({ value, interaction }) {
          const items = await searchDatabase(value);
          
          // Return up to 25 suggestions
          return items.slice(0, 25).map(item => ({
            name: item.displayName,  // Shown to user
            value: item.id           // Sent when selected
          }));
        },
        
        // Optional: Validate the final selection
        async validate({ value, step }) {
          if (step === "Autocomplete") {
            // During autocomplete, just return true
            return true;
          }
          
          // After selection, validate the value
          const item = await getItemById(value);
          return item !== null;
        }
      })
    ],
    
    async onExecute({ interaction }) {
      const itemId = interaction.options.getString("query");
      const item = await getItemById(itemId);
      
      interaction.reply(`Selected: ${item.name}`);
    }
  });
});
```

### Number Autocomplete

```javascript
dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "quantity",
    description: "Select quantity",
    options: [
      ChatInputOptions.integerAutocomplete({
        name: "amount",
        description: "Amount to select",
        required: true,
        
        onComplete({ value }) {
          // Suggest common quantities
          const suggestions = [1, 5, 10, 25, 50, 100];
          
          // Filter based on what user typed
          const typed = parseInt(value) || 0;
          
          return suggestions
            .filter(n => n.toString().startsWith(typed.toString()))
            .map(n => ({ name: `${n} items`, value: n }));
        }
      })
    ],
    
    onExecute({ interaction }) {
      const amount = interaction.options.getInteger("amount");
      interaction.reply(`Quantity: ${amount}`);
    }
  });
});
```

---

## Subcommands

### Using Subcommand Options

```javascript
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "config",
    description: "Bot configuration",
    options: [
      {
        type: Discord.ApplicationCommandOptionType.Subcommand,
        name: "view",
        description: "View current configuration"
      },
      {
        type: Discord.ApplicationCommandOptionType.Subcommand,
        name: "set",
        description: "Change a setting",
        options: [
          ChatInputOptions.string({
            name: "key",
            description: "Setting name",
            required: true
          }),
          ChatInputOptions.string({
            name: "value",
            description: "New value",
            required: true
          })
        ]
      }
    ],
    
    onExecute({ interaction }) {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case "view":
          interaction.reply("Current config: ...");
          break;
          
        case "set":
          const key = interaction.options.getString("key");
          const value = interaction.options.getString("value");
          interaction.reply(`Set ${key} = ${value}`);
          break;
      }
    }
  });
});
```

### Subcommand Groups

```javascript
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions }) => {
  ChatInput({
    name: "admin",
    description: "Admin commands",
    options: [
      {
        type: Discord.ApplicationCommandOptionType.SubcommandGroup,
        name: "user",
        description: "User management",
        options: [
          {
            type: Discord.ApplicationCommandOptionType.Subcommand,
            name: "ban",
            description: "Ban a user",
            options: [
              ChatInputOptions.user({
                name: "target",
                description: "User to ban",
                required: true
              })
            ]
          },
          {
            type: Discord.ApplicationCommandOptionType.Subcommand,
            name: "kick",
            description: "Kick a user",
            options: [
              ChatInputOptions.user({
                name: "target",
                description: "User to kick",
                required: true
              })
            ]
          }
        ]
      },
      {
        type: Discord.ApplicationCommandOptionType.SubcommandGroup,
        name: "channel",
        description: "Channel management",
        options: [
          {
            type: Discord.ApplicationCommandOptionType.Subcommand,
            name: "lock",
            description: "Lock a channel"
          },
          {
            type: Discord.ApplicationCommandOptionType.Subcommand,
            name: "unlock",
            description: "Unlock a channel"
          }
        ]
      }
    ],
    
    onExecute({ interaction }) {
      const group = interaction.options.getSubcommandGroup();
      const subcommand = interaction.options.getSubcommand();
      
      switch (`${group}/${subcommand}`) {
        case "user/ban":
          const banTarget = interaction.options.getUser("target");
          interaction.reply(`Banning ${banTarget.tag}...`);
          break;
          
        case "user/kick":
          const kickTarget = interaction.options.getUser("target");
          interaction.reply(`Kicking ${kickTarget.tag}...`);
          break;
          
        case "channel/lock":
          interaction.reply("Channel locked!");
          break;
          
        case "channel/unlock":
          interaction.reply("Channel unlocked!");
          break;
      }
    }
  });
});
```

---

## Permissions

### Default Member Permissions

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "ban",
    description: "Ban a user",
    
    // Users need BanMembers permission to see/use this command
    defaultMemberPermissions: ["BanMembers"],
    
    async onExecute({ interaction }) {
      // Only users with BanMembers can reach here
    }
  });
});
```

### Allow in Direct Messages

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "help",
    description: "Get help",
    
    // Allow this command in DMs
    directMessages: true,
    
    onExecute({ interaction }) {
      interaction.reply("Here's how to use me...");
    }
  });
});
```

---

## Context Menus

### Message Context Menu

Right-click on a message to use:

```javascript
dbi.register(({ MessageContextMenu }) => {
  MessageContextMenu({
    name: "Report Message",
    
    async onExecute({ interaction }) {
      // interaction.targetMessage is the right-clicked message
      const message = interaction.targetMessage;
      
      await interaction.reply({
        content: `Reported message by ${message.author.tag}`,
        ephemeral: true
      });
    }
  });
});
```

### User Context Menu

Right-click on a user to use:

```javascript
dbi.register(({ UserContextMenu }) => {
  UserContextMenu({
    name: "View Profile",
    
    async onExecute({ interaction }) {
      // interaction.targetUser is the right-clicked user
      const user = interaction.targetUser;
      
      await interaction.reply({
        content: `Profile: ${user.tag}\nID: ${user.id}`,
        ephemeral: true
      });
    }
  });
});
```

---

## Execution Context

The `onExecute` function receives a context object with useful properties:

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "context-demo",
    description: "Demonstrates execution context",
    
    async onExecute(ctx) {
      const {
        interaction,      // Discord.js ChatInputCommandInteraction
        dbi,              // Your DBI instance
        dbiInteraction,   // The DBIChatInput instance
        locale,           // Locale helpers
        setRateLimit,     // Rate limit function
        other,            // Custom data object
        clientNamespace,  // Multi-client namespace
        v2                // Whether Components V2 is enabled
      } = ctx;
      
      // Access user's locale
      const greeting = locale.user.data.greeting();
      
      // Access guild's locale (if in guild)
      const guildGreeting = locale.guild?.data.greeting?.();
      
      // Set a rate limit (e.g., once per minute per user)
      await setRateLimit("User", 60000);
      
      // Access DBI methods
      const button = dbi.interaction("my-button");
      
      await interaction.reply(greeting);
    }
  });
});
```

### Context Properties Reference

| Property | Type | Description |
|----------|------|-------------|
| `interaction` | `ChatInputCommandInteraction` | The Discord.js interaction |
| `dbi` | `DBI` | Your DBI instance |
| `dbiInteraction` | `DBIChatInput` | The registered interaction object |
| `locale.user` | `DBILocale` | User's preferred locale |
| `locale.guild` | `DBILocale \| undefined` | Guild's preferred locale |
| `setRateLimit` | `function` | Set rate limit for this interaction |
| `other` | `object` | Shared custom data |
| `clientNamespace` | `string` | Multi-client namespace |
| `v2` | `boolean` | Components V2 enabled |

---

## Rate Limiting

DBI supports built-in rate limiting:

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "daily",
    description: "Daily reward",
    
    // Built-in rate limits
    rateLimits: [
      {
        type: "User",
        duration: 86400000  // 24 hours in milliseconds
      }
    ],
    
    async onExecute({ interaction }) {
      interaction.reply("Here's your daily reward! 🎁");
    }
  });
});
```

### Rate Limit Types

| Type | Description |
|------|-------------|
| `User` | Per-user rate limit |
| `Channel` | Per-channel rate limit |
| `Guild` | Per-guild rate limit |
| `Member` | Per-member (user+guild) rate limit |
| `Message` | Per-message rate limit |

### Dynamic Rate Limiting

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "action",
    description: "Perform an action",
    
    async onExecute({ interaction, setRateLimit }) {
      // Set rate limit dynamically based on result
      const isPremium = await checkPremium(interaction.user.id);
      
      // Premium users: 1 minute cooldown, Free users: 5 minutes
      await setRateLimit("User", isPremium ? 60000 : 300000);
      
      interaction.reply("Action performed!");
    }
  });
});
```

---

## Message Command Aliases

Commands can have aliases for message command usage:

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "help",
    description: "Get help",
    
    other: {
      messageCommand: {
        aliases: ["h", "?", "commands"],
        ignore: false  // Set to true to disable message command
      }
    },
    
    onExecute({ interaction }) {
      interaction.reply("Help information...");
    }
  });
});
```

---

## Publishing Options

### Publish to Specific Client

For multi-client setups:

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "admin-only",
    description: "Admin bot command",
    
    // Only publish to 'admin' client namespace
    publish: "admin",
    
    onExecute({ interaction }) {
      // Only available on admin bot
    }
  });
});
```

### Conditional Registration with Flags

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "debug",
    description: "Debug command",
    
    // Only loaded when 'debug' flag is passed to dbi.load()
    flag: "debug",
    
    onExecute({ interaction }) {
      // Debug info...
    }
  });
});

// Load with flag
await dbi.load("debug");

// Or load without debug commands
await dbi.load();
```

---

## Next Steps

- [Components](./COMPONENTS.md) - Add interactive buttons and menus
- [Localization](./LOCALIZATION.md) - Support multiple languages
- [Advanced Features](./ADVANCED_FEATURES.md) - Rate limiting, references, and more

---

> 📄 **LLM-optimized version:** [llm/CHAT_INPUT.txt](./llm/CHAT_INPUT.txt)

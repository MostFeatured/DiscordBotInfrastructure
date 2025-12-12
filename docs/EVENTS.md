# Events Guide

DBI provides a powerful event system for handling both Discord events and custom events. This guide covers how to work with events effectively.

---

## Table of Contents

- [Basic Events](#basic-events)
- [Multiple Event Handlers](#multiple-event-handlers)
- [Event Configuration](#event-configuration)
- [Custom Events](#custom-events)
- [DBI Events](#dbi-events)
- [Event Order and Flow](#event-order-and-flow)

---

## Basic Events

### Simple Event Handler

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "clientReady",  // Discord.js event name
    id: "ready-logger",   // Unique ID for this handler
    
    onExecute({ client }) {
      console.log(`✅ Bot is online as ${client.user.tag}`);
      console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    }
  });
});
```

### Event Parameters

Each event receives its parameters in an object format:

```javascript
dbi.register(({ Event }) => {
  // Message events
  Event({
    name: "messageCreate",
    id: "message-logger",
    
    onExecute({ message }) {
      if (message.author.bot) return;
      console.log(`[${message.guild?.name}] ${message.author.tag}: ${message.content}`);
    }
  });
  
  // Member events
  Event({
    name: "guildMemberAdd",
    id: "welcome-handler",
    
    async onExecute({ member }) {
      const channel = member.guild.systemChannel;
      if (channel) {
        await channel.send(`Welcome ${member}! 👋`);
      }
    }
  });
  
  // Reaction events
  Event({
    name: "messageReactionAdd",
    id: "reaction-roles",
    
    onExecute({ reaction, user }) {
      if (user.bot) return;
      console.log(`${user.tag} reacted with ${reaction.emoji.name}`);
    }
  });
});
```

### Common Events Reference

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clientReady` | `{ client }` | Bot is connected and ready |
| `messageCreate` | `{ message }` | New message received |
| `messageDelete` | `{ message }` | Message was deleted |
| `messageUpdate` | `{ oldMessage, newMessage }` | Message was edited |
| `guildCreate` | `{ guild }` | Bot joined a guild |
| `guildDelete` | `{ guild }` | Bot left a guild |
| `guildMemberAdd` | `{ member }` | Member joined guild |
| `guildMemberRemove` | `{ member }` | Member left guild |
| `guildMemberUpdate` | `{ oldMember, newMember }` | Member updated |
| `interactionCreate` | `{ interaction }` | Any interaction received |
| `voiceStateUpdate` | `{ oldState, newState }` | Voice state changed |
| `channelCreate` | `{ channel }` | Channel created |
| `channelDelete` | `{ channel }` | Channel deleted |
| `roleCreate` | `{ role }` | Role created |
| `roleDelete` | `{ role }` | Role deleted |

---

## Multiple Event Handlers

You can register multiple handlers for the same event using unique IDs.

### Multiple Handlers

```javascript
dbi.register(({ Event }) => {
  // First handler - logging
  Event({
    name: "messageCreate",
    id: "message-logger",
    
    onExecute({ message }) {
      console.log(`Message: ${message.id}`);
    }
  });
  
  // Second handler - auto-moderation
  Event({
    name: "messageCreate",
    id: "auto-mod",
    
    onExecute({ message }) {
      if (containsBadWords(message.content)) {
        message.delete();
      }
    }
  });
  
  // Third handler - leveling system
  Event({
    name: "messageCreate",
    id: "leveling",
    
    async onExecute({ message }) {
      if (message.author.bot) return;
      await addXP(message.author.id, 10);
    }
  });
});
```

### Toggling Event Handlers

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "messageCreate",
    id: "togglable-logger",
    disabled: false,  // Can start disabled
    
    onExecute({ message }) {
      console.log(message.content);
    }
  });
});

// Toggle the handler programmatically
const handler = dbi.event("togglable-logger");

handler.toggle();       // Toggle state
handler.toggle(true);   // Disable
handler.toggle(false);  // Enable

console.log(handler.disabled);  // Check state
```

---

## Event Configuration

### Trigger Types

Control how events are handled across multiple clients:

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "messageCreate",
    id: "my-handler",
    
    // "OneByOne" - Each client triggers sequentially
    // "OneByOneGlobal" - Global sequential (default)
    // "Random" - Random client handles
    // "First" - First client only
    triggerType: "OneByOneGlobal",
    
    onExecute({ message, nextClient }) {
      // nextClient is available for multi-client setups
      console.log(`Handled by: ${nextClient?.namespace}`);
    }
  });
});
```

### Ordered Execution

Control execution order with delays:

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "messageCreate",
    id: "ordered-handler",
    
    ordered: {
      await: true,        // Wait for async completion
      delayBefore: 100,   // Wait 100ms before executing
      delayAfter: 50      // Wait 50ms after executing
    },
    
    async onExecute({ message }) {
      await doAsyncWork(message);
    }
  });
});
```

### Conditional Loading with Flags

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "messageCreate",
    id: "debug-logger",
    flag: "debug",  // Only load with debug flag
    
    onExecute({ message }) {
      console.log("[DEBUG]", message);
    }
  });
});

// Load with debug events
await dbi.load("debug");

// Load without debug events
await dbi.load();
```

### Event TTL (Inline Events)

```javascript
dbi.register(({ createInlineEvent }) => {
  // Create a temporary event that auto-removes
  createInlineEvent({
    name: "messageCreate",
    ttl: 60000,  // Auto-remove after 1 minute
    
    onExecute({ message }) {
      if (message.content === "special") {
        message.reply("You found it!");
      }
    }
  });
});
```

---

## Custom Events

Define your own events that can be triggered programmatically.

### Defining Custom Events

```javascript
dbi.register(({ CustomEvent, Event }) => {
  // Define a custom event structure
  CustomEvent({
    name: "userLevelUp",
    map: {
      userId: "userId",
      newLevel: "newLevel",
      guild: "guild"
    }
  });
  
  // Listen for the custom event
  Event({
    name: "userLevelUp",
    id: "levelup-announcer",
    
    onExecute({ userId, newLevel, guild }) {
      const channel = guild.systemChannel;
      if (channel) {
        channel.send(`🎉 <@${userId}> reached level ${newLevel}!`);
      }
    }
  });
});

// Trigger the custom event from anywhere
dbi.emit("userLevelUp", {
  userId: "123456789",
  newLevel: 10,
  guild: someGuild
});
```

### Custom Event with Direct Trigger

```javascript
dbi.register(({ CustomEvent }) => {
  const levelUpEvent = CustomEvent({
    name: "playerLevelUp",
    map: {
      playerId: "playerId",
      level: "level",
      rewards: "rewards"
    }
  });
  
  // Trigger using the returned object
  levelUpEvent.trigger({
    playerId: "12345",
    level: 5,
    rewards: ["gold", "exp_boost"]
  });
});
```

---

## DBI Events

DBI provides internal events for interaction and event lifecycle management.

### Available DBI Events

| Event | Description | Data |
|-------|-------------|------|
| `clientsReady` | All clients connected | - |
| `beforeInteraction` | Before handling interaction | Context object |
| `afterInteraction` | After handling interaction | Context object |
| `interactionError` | Error during interaction | Context + error |
| `interactionRateLimit` | Rate limit triggered | Rate limit info |
| `beforeEvent` | Before event handler | Event data |
| `afterEvent` | After event handler | Event data |
| `eventError` | Error during event | Event data + error |
| `messageCommandArgumentError` | Invalid message command arg | Error details |
| `messageCommandDirectMessageUsageError` | DM command not allowed | Error details |
| `messageCommandDefaultMemberPermissionsError` | Missing permissions | Error details |

### Before/After Interaction

```javascript
// Listen for interaction events
dbi.events.on("beforeInteraction", async (ctx) => {
  console.log(`Interaction: ${ctx.dbiInteraction.name}`);
  console.log(`User: ${ctx.interaction.user.tag}`);
  
  // Return true to continue, false to stop
  return true;
});

dbi.events.on("afterInteraction", async (ctx) => {
  console.log(`Completed: ${ctx.dbiInteraction.name}`);
  return true;
});
```

### Error Handling

```javascript
dbi.events.on("interactionError", async ({ interaction, dbiInteraction, error }) => {
  console.error(`Error in ${dbiInteraction.name}:`, error);
  
  // Notify the user
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "An error occurred. Please try again later.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "An error occurred. Please try again later.",
        ephemeral: true
      });
    }
  } catch (e) {
    console.error("Could not send error message:", e);
  }
  
  return true;
});

dbi.events.on("eventError", async ({ eventName, dbiEvent, error }) => {
  console.error(`Error in event ${eventName}:`, error);
  return true;
});
```

### Rate Limiting

```javascript
dbi.events.on("interactionRateLimit", async ({ 
  interaction, 
  dbiInteraction, 
  rateLimit,
  remainingTime 
}) => {
  const seconds = Math.ceil(remainingTime / 1000);
  
  await interaction.reply({
    content: `⏳ Slow down! Try again in ${seconds} seconds.`,
    ephemeral: true
  });
  
  return false;  // Don't execute the interaction
});
```

### Message Command Errors

```javascript
const { ApplicationCommandOptionType } = require("discord.js");

dbi.events.on("messageCommandArgumentError", ({ 
  message, 
  interaction, 
  dbiInteraction,
  error 
}) => {
  message.reply(
    `❌ Invalid argument \`${error.option.name}\` (Index: ${error.index}).\n` +
    `Error: \`${error.type}\`\n` +
    `Expected: \`${ApplicationCommandOptionType[error.option.type]}\``
  );
  
  return false;  // Don't execute the command
});

dbi.events.on("messageCommandDirectMessageUsageError", ({ message }) => {
  message.reply("❌ This command cannot be used in DMs.");
  return false;
});

dbi.events.on("messageCommandDefaultMemberPermissionsError", ({ 
  message, 
  permissions 
}) => {
  message.reply(`❌ You need these permissions: ${permissions.join(", ")}`);
  return false;
});
```

### One-Time Event Handlers

```javascript
// Handler that runs only once
dbi.events.on("clientsReady", () => {
  console.log("Bot is ready!");
}, { once: true });
```

### Removing Event Handlers

```javascript
// on() returns a function to remove the handler
const removeHandler = dbi.events.on("beforeInteraction", (ctx) => {
  console.log("Interaction received");
  return true;
});

// Later, remove the handler
removeHandler();
```

---

## Event Order and Flow

### Interaction Flow

1. Discord sends interaction
2. `beforeInteraction` event fires
3. Rate limit check
4. `interactionRateLimit` event if limited
5. Interaction handler executes
6. `afterInteraction` event fires
7. If error: `interactionError` event fires

### Event Flow

1. Discord sends event
2. `beforeEvent` event fires
3. Event handler executes
4. `afterEvent` event fires
5. If error: `eventError` event fires

### Best Practices

```javascript
// ✅ Good - Use specific event IDs
Event({
  name: "messageCreate",
  id: "spam-filter-v1",  // Descriptive ID
  onExecute({ message }) { /* ... */ }
});

// ❌ Bad - Missing ID causes conflicts
Event({
  name: "messageCreate",
  // No ID - will throw error if strict mode is on
  onExecute({ message }) { /* ... */ }
});

// ✅ Good - Return early from bot messages
Event({
  name: "messageCreate",
  id: "my-handler",
  onExecute({ message }) {
    if (message.author.bot) return;  // Ignore bots
    // Handle user messages
  }
});

// ✅ Good - Use async/await properly
Event({
  name: "guildMemberAdd",
  id: "welcome",
  async onExecute({ member }) {
    try {
      await member.send("Welcome!");
    } catch (error) {
      console.error("Could not DM member:", error);
    }
  }
});
```

---

## Guild Locale in Events

Access guild locale in events:

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "messageCreate",
    id: "localized-response",
    
    onExecute({ message, locale }) {
      if (message.content === "!hello") {
        // Use guild's locale for response
        const greeting = locale?.guild?.data?.greeting?.() || "Hello!";
        message.reply(greeting);
      }
    }
  });
});
```

---

## Next Steps

- [Localization](./LOCALIZATION.md) - Multi-language support
- [Advanced Features](./ADVANCED_FEATURES.md) - Message commands, multi-client
- [API Reference](./API_REFERENCE.md) - Complete API documentation

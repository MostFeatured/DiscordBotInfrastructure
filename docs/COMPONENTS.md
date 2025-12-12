# Components Guide

DBI provides comprehensive support for Discord's interactive components: Buttons, Select Menus, and Modals. This guide covers how to create, configure, and handle all component types.

---

## Table of Contents

- [Buttons](#buttons)
- [Select Menus](#select-menus)
- [Modals](#modals)
- [Reference System](#reference-system)
- [Inline Components](#inline-components)
- [Builder Pattern](#builder-pattern)

---

## Buttons

### Basic Button

```javascript
const Discord = require("discord.js");

dbi.register(({ ChatInput, Button }) => {
  // Define the button handler
  Button({
    name: "greet-button",
    
    // Default button appearance
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "Click Me!",
      emoji: "👋"
    },
    
    // Executed when button is clicked
    onExecute({ interaction }) {
      interaction.reply({
        content: "Hello! You clicked the button! 🎉",
        ephemeral: true
      });
    }
  });

  // Command that sends the button
  ChatInput({
    name: "greet",
    description: "Get a greeting button",
    
    onExecute({ interaction, dbi }) {
      // Get the button and convert to JSON for Discord
      const button = dbi.interaction("greet-button").toJSON();
      
      interaction.reply({
        content: "Click the button below!",
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [button]
          }
        ]
      });
    }
  });
});
```

### Button Styles

| Style | Constant | Use Case |
|-------|----------|----------|
| Primary | `ButtonStyle.Primary` | Main action (blue) |
| Secondary | `ButtonStyle.Secondary` | Alternative action (gray) |
| Success | `ButtonStyle.Success` | Positive action (green) |
| Danger | `ButtonStyle.Danger` | Destructive action (red) |
| Link | `ButtonStyle.Link` | External URL (gray with icon) |
| Premium | `ButtonStyle.Premium` | SKU-based button |

### Button with Overrides

Override default button options when sending:

```javascript
dbi.register(({ ChatInput, Button }) => {
  Button({
    name: "action-button",
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "Default Label"
    },
    onExecute({ interaction, data }) {
      interaction.reply(`Action: ${data[0]}`);
    }
  });

  ChatInput({
    name: "actions",
    description: "Show action buttons",
    
    onExecute({ interaction, dbi }) {
      const button = dbi.interaction("action-button");
      
      interaction.reply({
        content: "Choose an action:",
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [
              // Override label and style
              button.toJSON({
                overrides: {
                  label: "Accept",
                  style: Discord.ButtonStyle.Success,
                  emoji: "✅"
                },
                reference: { data: ["accept"] }
              }),
              button.toJSON({
                overrides: {
                  label: "Decline",
                  style: Discord.ButtonStyle.Danger,
                  emoji: "❌"
                },
                reference: { data: ["decline"] }
              })
            ]
          }
        ]
      });
    }
  });
});
```

### Link Button

Link buttons don't need a handler:

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "links",
    description: "Show useful links",
    
    onExecute({ interaction }) {
      interaction.reply({
        content: "Useful links:",
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [
              {
                type: Discord.ComponentType.Button,
                style: Discord.ButtonStyle.Link,
                label: "Website",
                url: "https://example.com",
                emoji: "🌐"
              },
              {
                type: Discord.ComponentType.Button,
                style: Discord.ButtonStyle.Link,
                label: "Documentation",
                url: "https://docs.example.com",
                emoji: "📚"
              }
            ]
          }
        ]
      });
    }
  });
});
```

### Disabled Button

```javascript
dbi.register(({ ChatInput, Button }) => {
  Button({
    name: "disabled-demo",
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "Click Me"
    },
    onExecute({ interaction }) {
      // Disable the button after click
      const button = dbi.interaction("disabled-demo").toJSON({
        overrides: { disabled: true, label: "Clicked!" }
      });
      
      interaction.update({
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [button]
          }
        ]
      });
    }
  });
});
```

---

## Select Menus

DBI supports all five types of select menus.

### String Select Menu

```javascript
dbi.register(({ ChatInput, StringSelectMenu }) => {
  StringSelectMenu({
    name: "color-select",
    
    options: {
      placeholder: "Choose a color...",
      minValues: 1,
      maxValues: 1,
      options: [
        { label: "Red", value: "red", emoji: "🔴", description: "A warm color" },
        { label: "Green", value: "green", emoji: "🟢", description: "Nature's color" },
        { label: "Blue", value: "blue", emoji: "🔵", description: "The sky's color" }
      ]
    },
    
    onExecute({ interaction }) {
      const selected = interaction.values[0];
      interaction.reply(`You selected: ${selected}`);
    }
  });

  ChatInput({
    name: "colors",
    description: "Pick a color",
    
    onExecute({ interaction, dbi }) {
      const select = dbi.interaction("color-select").toJSON();
      
      interaction.reply({
        content: "Choose your favorite color:",
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [select]
          }
        ]
      });
    }
  });
});
```

### Multi-Select

```javascript
dbi.register(({ StringSelectMenu }) => {
  StringSelectMenu({
    name: "toppings-select",
    
    options: {
      placeholder: "Select toppings...",
      minValues: 1,
      maxValues: 5,
      options: [
        { label: "Cheese", value: "cheese", emoji: "🧀" },
        { label: "Pepperoni", value: "pepperoni", emoji: "🍕" },
        { label: "Mushrooms", value: "mushrooms", emoji: "🍄" },
        { label: "Olives", value: "olives", emoji: "🫒" },
        { label: "Onions", value: "onions", emoji: "🧅" }
      ]
    },
    
    onExecute({ interaction }) {
      const selected = interaction.values;
      interaction.reply(`Toppings: ${selected.join(", ")}`);
    }
  });
});
```

### User Select Menu

```javascript
dbi.register(({ ChatInput, UserSelectMenu }) => {
  UserSelectMenu({
    name: "user-select",
    
    options: {
      placeholder: "Select a user...",
      minValues: 1,
      maxValues: 1
    },
    
    onExecute({ interaction }) {
      const user = interaction.users.first();
      interaction.reply(`You selected: ${user.tag}`);
    }
  });

  ChatInput({
    name: "select-user",
    description: "Select a user",
    
    onExecute({ interaction, dbi }) {
      const select = dbi.interaction("user-select").toJSON();
      
      interaction.reply({
        content: "Select a user:",
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [select]
          }
        ]
      });
    }
  });
});
```

### Role Select Menu

```javascript
dbi.register(({ RoleSelectMenu }) => {
  RoleSelectMenu({
    name: "role-select",
    
    options: {
      placeholder: "Select roles...",
      minValues: 1,
      maxValues: 10
    },
    
    onExecute({ interaction }) {
      const roles = interaction.roles;
      const roleNames = roles.map(r => r.name).join(", ");
      interaction.reply(`Selected roles: ${roleNames}`);
    }
  });
});
```

### Channel Select Menu

```javascript
dbi.register(({ ChannelSelectMenu }) => {
  ChannelSelectMenu({
    name: "channel-select",
    
    options: {
      placeholder: "Select a channel...",
      channelTypes: [
        Discord.ChannelType.GuildText,
        Discord.ChannelType.GuildVoice
      ]
    },
    
    onExecute({ interaction }) {
      const channel = interaction.channels.first();
      interaction.reply(`Selected: ${channel.name}`);
    }
  });
});
```

### Mentionable Select Menu

```javascript
dbi.register(({ MentionableSelectMenu }) => {
  MentionableSelectMenu({
    name: "mentionable-select",
    
    options: {
      placeholder: "Select users or roles...",
      minValues: 1,
      maxValues: 5
    },
    
    onExecute({ interaction }) {
      const users = interaction.users;
      const roles = interaction.roles;
      
      let response = "";
      if (users.size) response += `Users: ${users.map(u => u.tag).join(", ")}\n`;
      if (roles.size) response += `Roles: ${roles.map(r => r.name).join(", ")}`;
      
      interaction.reply(response || "Nothing selected");
    }
  });
});
```

### Dynamic Select Options

Override select options when sending:

```javascript
dbi.register(({ ChatInput, StringSelectMenu }) => {
  StringSelectMenu({
    name: "dynamic-select",
    options: {
      placeholder: "Select...",
      options: []  // Will be overridden
    },
    onExecute({ interaction, data }) {
      const [category] = data;
      const selected = interaction.values[0];
      interaction.reply(`${category}: ${selected}`);
    }
  });

  ChatInput({
    name: "shop",
    description: "Browse the shop",
    
    async onExecute({ interaction, dbi }) {
      const items = await fetchShopItems();
      
      const select = dbi.interaction("dynamic-select").toJSON({
        overrides: {
          placeholder: "Select an item to buy...",
          options: items.map(item => ({
            label: item.name,
            value: item.id,
            description: `$${item.price}`,
            emoji: item.emoji
          }))
        },
        reference: { data: ["shop"] }
      });
      
      interaction.reply({
        content: "🛒 **Shop**",
        components: [
          { type: Discord.ComponentType.ActionRow, components: [select] }
        ]
      });
    }
  });
});
```

---

## Modals

Modals are popup forms that collect user input.

### Basic Modal

```javascript
dbi.register(({ ChatInput, Button, Modal }) => {
  // Define the modal
  Modal({
    name: "feedback-modal",
    
    options: {
      title: "Send Feedback",
      components: [
        {
          type: Discord.ComponentType.ActionRow,
          components: [
            {
              type: Discord.ComponentType.TextInput,
              customId: "subject",
              label: "Subject",
              style: Discord.TextInputStyle.Short,
              placeholder: "Brief description",
              required: true,
              minLength: 5,
              maxLength: 100
            }
          ]
        },
        {
          type: Discord.ComponentType.ActionRow,
          components: [
            {
              type: Discord.ComponentType.TextInput,
              customId: "message",
              label: "Message",
              style: Discord.TextInputStyle.Paragraph,
              placeholder: "Your detailed feedback...",
              required: true,
              minLength: 20,
              maxLength: 2000
            }
          ]
        }
      ]
    },
    
    async onExecute({ interaction }) {
      const subject = interaction.fields.getTextInputValue("subject");
      const message = interaction.fields.getTextInputValue("message");
      
      // Process the feedback
      await saveFeedback({ subject, message, userId: interaction.user.id });
      
      await interaction.reply({
        content: "Thank you for your feedback! ✅",
        ephemeral: true
      });
    }
  });

  // Button that opens the modal
  Button({
    name: "feedback-button",
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "Send Feedback",
      emoji: "📝"
    },
    async onExecute({ interaction, dbi }) {
      const modal = dbi.interaction("feedback-modal").toJSON();
      await interaction.showModal(modal);
    }
  });

  // Command that sends the button
  ChatInput({
    name: "feedback",
    description: "Send us feedback",
    
    onExecute({ interaction, dbi }) {
      const button = dbi.interaction("feedback-button").toJSON();
      
      interaction.reply({
        content: "We'd love to hear your feedback!",
        components: [
          { type: Discord.ComponentType.ActionRow, components: [button] }
        ]
      });
    }
  });
});
```

### Modal with Pre-filled Data

```javascript
dbi.register(({ Modal, Button }) => {
  Modal({
    name: "edit-modal",
    options: {
      title: "Edit Item",
      components: [
        {
          type: Discord.ComponentType.ActionRow,
          components: [
            {
              type: Discord.ComponentType.TextInput,
              customId: "name",
              label: "Name",
              style: Discord.TextInputStyle.Short,
              value: ""  // Will be overridden
            }
          ]
        },
        {
          type: Discord.ComponentType.ActionRow,
          components: [
            {
              type: Discord.ComponentType.TextInput,
              customId: "description",
              label: "Description",
              style: Discord.TextInputStyle.Paragraph,
              value: ""  // Will be overridden
            }
          ]
        }
      ]
    },
    
    async onExecute({ interaction, data }) {
      const [itemId] = data;
      const name = interaction.fields.getTextInputValue("name");
      const description = interaction.fields.getTextInputValue("description");
      
      await updateItem(itemId, { name, description });
      
      interaction.reply({
        content: "Item updated! ✅",
        ephemeral: true
      });
    }
  });

  Button({
    name: "edit-button",
    options: { style: Discord.ButtonStyle.Secondary, label: "Edit" },
    
    async onExecute({ interaction, data, dbi }) {
      const [itemId] = data;
      const item = await getItem(itemId);
      
      // Pre-fill the modal with current values
      const modal = dbi.interaction("edit-modal").toJSON({
        overrides: {
          components: [
            {
              type: Discord.ComponentType.ActionRow,
              components: [{
                type: Discord.ComponentType.TextInput,
                customId: "name",
                label: "Name",
                style: Discord.TextInputStyle.Short,
                value: item.name  // Pre-filled!
              }]
            },
            {
              type: Discord.ComponentType.ActionRow,
              components: [{
                type: Discord.ComponentType.TextInput,
                customId: "description",
                label: "Description",
                style: Discord.TextInputStyle.Paragraph,
                value: item.description  // Pre-filled!
              }]
            }
          ]
        },
        reference: { data: [itemId] }
      });
      
      await interaction.showModal(modal);
    }
  });
});
```

---

## Reference System

The reference system allows you to pass data through components without using a database.

### How It Works

When you add `reference.data` to a component:
- **Primitive values** (string, number, boolean) are encoded directly in the custom ID
- **Objects** are stored in memory with a reference ID

### Primitive References

```javascript
dbi.register(({ Button }) => {
  Button({
    name: "action-btn",
    options: { style: Discord.ButtonStyle.Primary, label: "Action" },
    
    onExecute({ interaction, data }) {
      // data contains the referenced values
      const [userId, actionType, timestamp] = data;
      
      console.log(`User: ${userId}, Action: ${actionType}, Time: ${timestamp}`);
      interaction.reply(`Processed action: ${actionType}`);
    }
  });
});

// When creating the button:
const button = dbi.interaction("action-btn").toJSON({
  reference: {
    data: [
      "123456789",           // string
      42,                     // number
      true,                   // boolean
      Date.now()              // number (timestamp)
    ]
  }
});
```

### Object References

```javascript
dbi.register(({ Button }) => {
  Button({
    name: "cart-btn",
    options: { style: Discord.ButtonStyle.Primary, label: "View Cart" },
    
    onExecute({ interaction, data }) {
      const [cart] = data;
      
      // cart is a full object!
      console.log(cart.items);
      console.log(cart.total);
      
      // Clean up the reference when done
      cart.$unRef();
      
      interaction.reply(`Cart total: $${cart.total}`);
    }
  });
});

// When creating the button:
const cart = {
  items: ["item1", "item2", "item3"],
  total: 99.99,
  userId: "123456789"
};

const button = dbi.interaction("cart-btn").toJSON({
  reference: {
    data: [cart],  // Object is stored in memory
    ttl: 300000    // Auto-expire in 5 minutes
  }
});
```

### Reference TTL

References can auto-expire:

```javascript
// Component-level TTL
const button = dbi.interaction("my-btn").toJSON({
  reference: {
    data: [myData],
    ttl: 60000  // Expires in 1 minute
  }
});

// Global auto-clear in DBI config
const dbi = createDBI("bot", {
  references: {
    autoClear: {
      ttl: 3600000,  // Default TTL: 1 hour
      check: 60000   // Check every minute
    }
  }
});
```

### Manual Reference Management

```javascript
dbi.register(({ Button }) => {
  Button({
    name: "data-btn",
    options: { style: Discord.ButtonStyle.Primary, label: "Process" },
    
    onExecute({ interaction, data }) {
      const [complexData] = data;
      
      // Check if reference still exists
      if (!complexData) {
        return interaction.reply({
          content: "This button has expired!",
          ephemeral: true
        });
      }
      
      // Use the $ref property to identify the reference
      console.log(`Reference ID: ${complexData.$ref}`);
      
      // Manually remove the reference
      complexData.$unRef();  // or: dbi.data.refs.delete(complexData.$ref)
      
      interaction.reply("Data processed and cleaned up!");
    }
  });
});
```

---

## Inline Components

Inline components are created dynamically and don't need pre-registration.

### Inline Button

```javascript
dbi.register(({ ChatInput, createInlineButton }) => {
  ChatInput({
    name: "confirm",
    description: "Confirm an action",
    
    async onExecute({ interaction }) {
      // Create an inline button that expires
      const confirmBtn = createInlineButton({
        options: {
          style: Discord.ButtonStyle.Success,
          label: "Confirm"
        },
        // TTL is automatic based on config.inlineListeners.autoClear.ttl
        onExecute({ interaction }) {
          interaction.reply("Action confirmed! ✅");
        }
      });
      
      const cancelBtn = createInlineButton({
        options: {
          style: Discord.ButtonStyle.Danger,
          label: "Cancel"
        },
        onExecute({ interaction }) {
          interaction.reply("Action cancelled. ❌");
        }
      });
      
      await interaction.reply({
        content: "Are you sure?",
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [
              confirmBtn.toJSON(),
              cancelBtn.toJSON()
            ]
          }
        ]
      });
    }
  });
});
```

### Inline Select Menu

```javascript
dbi.register(({ ChatInput, createInlineStringSelectMenu }) => {
  ChatInput({
    name: "poll",
    description: "Create a quick poll",
    
    async onExecute({ interaction }) {
      const votes = new Map();
      
      const select = createInlineStringSelectMenu({
        options: {
          placeholder: "Cast your vote...",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
            { label: "Option C", value: "c" }
          ]
        },
        onExecute({ interaction }) {
          const vote = interaction.values[0];
          votes.set(interaction.user.id, vote);
          
          interaction.reply({
            content: `You voted for ${vote}!`,
            ephemeral: true
          });
        }
      });
      
      await interaction.reply({
        content: "🗳️ **Quick Poll**\nVote for your choice!",
        components: [
          { type: Discord.ComponentType.ActionRow, components: [select.toJSON()] }
        ]
      });
    }
  });
});
```

### Inline Modal

```javascript
dbi.register(({ ChatInput, Button, createInlineModal }) => {
  ChatInput({
    name: "input",
    description: "Get user input",
    
    async onExecute({ interaction }) {
      const modal = createInlineModal({
        options: {
          title: "Enter Information",
          components: [
            {
              type: Discord.ComponentType.ActionRow,
              components: [{
                type: Discord.ComponentType.TextInput,
                customId: "input",
                label: "Your Input",
                style: Discord.TextInputStyle.Short,
                required: true
              }]
            }
          ]
        },
        onExecute({ interaction }) {
          const input = interaction.fields.getTextInputValue("input");
          interaction.reply(`You entered: ${input}`);
        }
      });
      
      await interaction.showModal(modal.toJSON());
    }
  });
});
```

### Available Inline Creators

| Function | Creates |
|----------|---------|
| `createInlineButton()` | Inline button |
| `createInlineStringSelectMenu()` | Inline string select |
| `createInlineUserSelectMenu()` | Inline user select |
| `createInlineRoleSelectMenu()` | Inline role select |
| `createInlineChannelSelectMenu()` | Inline channel select |
| `createInlineMentionableSelectMenu()` | Inline mentionable select |
| `createInlineModal()` | Inline modal |
| `createInlineEvent()` | Inline event listener |

---

## Builder Pattern

DBI provides builder classes for more fluent component creation.

### Button Builder

```javascript
dbi.register(({ ChatInput, Button }) => {
  Button({
    name: "builder-btn",
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "Default"
    },
    onExecute({ interaction }) {
      interaction.reply("Clicked!");
    }
  });

  ChatInput({
    name: "builder-demo",
    description: "Builder pattern demo",
    
    onExecute({ interaction, dbi }) {
      const btn = dbi.interaction("builder-btn");
      
      // Use the builder for fluent configuration
      const built = btn.createBuilder()
        .setLabel("Custom Label")
        .setEmoji("🎉")
        .setStyle(Discord.ButtonStyle.Success)
        .setReference(["data1", "data2"])
        .setTTL(60000)
        .toJSON();
      
      interaction.reply({
        content: "Builder pattern!",
        components: [
          { type: Discord.ComponentType.ActionRow, components: [built] }
        ]
      });
    }
  });
});
```

### Select Menu Builder

```javascript
dbi.register(({ StringSelectMenu }) => {
  StringSelectMenu({
    name: "builder-select",
    options: {
      placeholder: "Select...",
      options: []
    },
    onExecute({ interaction }) {
      interaction.reply(`Selected: ${interaction.values.join(", ")}`);
    }
  });
});

// Usage:
const select = dbi.interaction("builder-select");

const built = select.createBuilder()
  .setPlaceholder("Choose items...")
  .setMinValues(1)
  .setMaxValues(3)
  .setOptions([
    { label: "A", value: "a" },
    { label: "B", value: "b" },
    { label: "C", value: "c" }
  ])
  .toJSON();
```

---

## Component Execution Context

All components receive a context object in `onExecute`:

```javascript
dbi.register(({ Button }) => {
  Button({
    name: "context-demo",
    options: { style: Discord.ButtonStyle.Primary, label: "Demo" },
    
    onExecute(ctx) {
      const {
        interaction,      // Discord.js ButtonInteraction
        data,             // Referenced data array
        dbi,              // DBI instance
        dbiInteraction,   // The DBIButton instance
        locale,           // Locale helpers
        setRateLimit,     // Rate limit setter
        other,            // Custom shared data
        clientNamespace,  // Multi-client namespace
        v2                // Components V2 enabled
      } = ctx;
      
      // Use as needed
      interaction.reply("Demo!");
    }
  });
});
```

---

## Next Steps

- [Events](./EVENTS.md) - Handle Discord events
- [Svelte Components](./SVELTE_COMPONENTS.md) - Build reactive UIs
- [Advanced Features](./ADVANCED_FEATURES.md) - Rate limiting and more

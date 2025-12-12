# Localization Guide

DBI provides a comprehensive localization system for creating multi-language Discord bots. This guide covers both content localization (text translations) and interaction localization (command names and descriptions).

---

## Table of Contents

- [Content Localization](#content-localization)
- [Interaction Localization](#interaction-localization)
- [Using Locales](#using-locales)
- [Dynamic Locale Selection](#dynamic-locale-selection)
- [Best Practices](#best-practices)

---

## Content Localization

Content localization translates the text your bot sends in messages, embeds, and replies.

### Basic Locale Definition

```javascript
dbi.register(({ Locale }) => {
  // English locale
  Locale({
    name: "en",
    data: {
      greeting: "Hello!",
      goodbye: "Goodbye!",
      welcome: "Welcome to our server!",
      help: {
        title: "Help Menu",
        description: "Here are the available commands:"
      }
    }
  });
  
  // Turkish locale
  Locale({
    name: "tr",
    data: {
      greeting: "Merhaba!",
      goodbye: "Hoşça kal!",
      welcome: "Sunucumuza hoş geldiniz!",
      help: {
        title: "Yardım Menüsü",
        description: "İşte mevcut komutlar:"
      }
    }
  });
  
  // Spanish locale
  Locale({
    name: "es",
    data: {
      greeting: "¡Hola!",
      goodbye: "¡Adiós!",
      welcome: "¡Bienvenido a nuestro servidor!",
      help: {
        title: "Menú de Ayuda",
        description: "Aquí están los comandos disponibles:"
      }
    }
  });
});
```

### Using Variables in Translations

Use `{0}`, `{1}`, etc. as placeholders:

```javascript
dbi.register(({ Locale }) => {
  Locale({
    name: "en",
    data: {
      // Simple variable
      welcomeUser: "Welcome, {0}!",
      
      // Multiple variables
      levelUp: "{0} reached level {1}!",
      
      // Complex message
      orderConfirm: "Order #{0} confirmed. Total: ${1}. Ships to: {2}",
      
      // Nested with variables
      messages: {
        ban: "{0} has been banned by {1}. Reason: {2}",
        kick: "{0} has been kicked by {1}."
      }
    }
  });
  
  Locale({
    name: "tr",
    data: {
      welcomeUser: "Hoş geldin, {0}!",
      levelUp: "{0} seviye {1}'e ulaştı!",
      orderConfirm: "Sipariş #{0} onaylandı. Toplam: {1}₺. Teslimat: {2}",
      messages: {
        ban: "{0}, {1} tarafından yasaklandı. Sebep: {2}",
        kick: "{0}, {1} tarafından atıldı."
      }
    }
  });
});
```

### Nested Locale Structure

Organize translations with nested objects:

```javascript
dbi.register(({ Locale }) => {
  Locale({
    name: "en",
    data: {
      commands: {
        help: {
          title: "Help",
          description: "List of commands",
          noCommands: "No commands available"
        },
        settings: {
          title: "Settings",
          language: "Language",
          notifications: "Notifications"
        }
      },
      errors: {
        notFound: "Item not found",
        noPermission: "You don't have permission",
        cooldown: "Please wait {0} seconds"
      },
      success: {
        saved: "Settings saved!",
        deleted: "Item deleted!"
      }
    }
  });
});
```

---

## Interaction Localization

Interaction localization translates command names, descriptions, options, and choices as they appear in Discord's UI.

### Basic Interaction Locale

```javascript
dbi.register(({ ChatInput, ChatInputOptions, InteractionLocale }) => {
  // Define the command with your primary language
  ChatInput({
    name: "ayarlar",
    description: "Bot ayarlarını değiştir",
    options: [
      ChatInputOptions.string({
        name: "dil",
        description: "Tercih ettiğiniz dil",
        required: true,
        choices: [
          { name: "Türkçe", value: "tr" },
          { name: "İngilizce", value: "en" }
        ]
      })
    ],
    onExecute({ interaction }) {
      const lang = interaction.options.getString("dil");
      interaction.reply(`Dil: ${lang}`);
    }
  });

  // Add translations for other languages
  InteractionLocale({
    name: "ayarlar",  // Must match the command name
    data: {
      // English translation
      en: {
        name: "settings",
        description: "Change bot settings",
        options: {
          dil: {
            name: "language",
            description: "Your preferred language",
            choices: {
              "Türkçe": "Turkish",
              "İngilizce": "English"
            }
          }
        }
      },
      
      // Spanish translation
      es: {
        name: "ajustes",
        description: "Cambiar configuración del bot",
        options: {
          dil: {
            name: "idioma",
            description: "Tu idioma preferido",
            choices: {
              "Türkçe": "Turco",
              "İngilizce": "Inglés"
            }
          }
        }
      }
    }
  });
});
```

### Localization Structure

The `InteractionLocale` data structure follows this pattern:

```javascript
InteractionLocale({
  name: "command-name",  // Original command name
  data: {
    "locale-code": {
      name: "translated-name",          // Command name
      description: "translated-desc",   // Command description
      options: {
        "original-option-name": {
          name: "translated-option",
          description: "translated-desc",
          choices: {
            "Original Choice": "Translated Choice"
          }
        }
      }
    }
  }
});
```

### Supported Locale Codes

Discord supports these locale codes:

| Code | Language |
|------|----------|
| `en` | English |
| `bg` | Bulgarian |
| `zh` | Chinese |
| `hr` | Croatian |
| `cs` | Czech |
| `da` | Danish |
| `nl` | Dutch |
| `fi` | Finnish |
| `fr` | French |
| `de` | German |
| `el` | Greek |
| `hi` | Hindi |
| `hu` | Hungarian |
| `it` | Italian |
| `ja` | Japanese |
| `ko` | Korean |
| `no` | Norwegian |
| `pl` | Polish |
| `pt` | Portuguese |
| `ro` | Romanian |
| `ru` | Russian |
| `es` | Spanish |
| `sv` | Swedish |
| `th` | Thai |
| `tr` | Turkish |
| `uk` | Ukrainian |
| `vi` | Vietnamese |

---

## Using Locales

### In Interactions

Access locales through the `locale` object in execution context:

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "greet",
    description: "Greet the user",
    
    onExecute({ interaction, locale }) {
      // User's locale (based on Discord client language)
      const userGreeting = locale.user.data.greeting();
      
      // Guild's locale (based on guild's preferred locale)
      const guildGreeting = locale.guild?.data.greeting?.();
      
      interaction.reply(userGreeting);
    }
  });
});
```

### Function-style Access

Locale values are accessed as functions, allowing for variable substitution:

```javascript
dbi.register(({ Locale, ChatInput }) => {
  Locale({
    name: "en",
    data: {
      welcome: "Welcome, {0}!",
      levelUp: "{0} reached level {1}! 🎉"
    }
  });

  ChatInput({
    name: "welcome",
    description: "Welcome someone",
    options: [/* user option */],
    
    onExecute({ interaction, locale }) {
      const user = interaction.options.getUser("user");
      
      // Pass variables to the locale function
      const message = locale.user.data.welcome(user.username);
      
      interaction.reply(message);
      // Output: "Welcome, John!"
    }
  });
});
```

### Path-based Access

Access nested paths as chained function calls:

```javascript
dbi.register(({ Locale, ChatInput }) => {
  Locale({
    name: "en",
    data: {
      commands: {
        help: {
          title: "Help Menu",
          footer: "Page {0} of {1}"
        }
      }
    }
  });

  ChatInput({
    name: "help",
    description: "Show help",
    
    onExecute({ interaction, locale }) {
      // Chain to access nested values
      const title = locale.user.data.commands.help.title();
      const footer = locale.user.data.commands.help.footer(1, 5);
      
      interaction.reply({
        embeds: [{
          title: title,
          footer: { text: footer }
        }]
      });
    }
  });
});
```

### Alternative Access Methods

```javascript
// Using the get() method for dynamic paths
const path = "commands.help.title";
const value = locale.user.get(path);  // Returns raw string or null

// Using format() for dynamic paths with variables
const formatted = locale.user.format("commands.help.footer", 1, 5);
```

### Accessing Locale by Name

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "translate",
    description: "Show translation",
    
    onExecute({ interaction, dbi }) {
      // Get a specific locale by name
      const enLocale = dbi.locale("en");
      const trLocale = dbi.locale("tr");
      
      const enGreeting = enLocale.data.greeting();
      const trGreeting = trLocale.data.greeting();
      
      interaction.reply(`EN: ${enGreeting}\nTR: ${trGreeting}`);
    }
  });
});
```

---

## Dynamic Locale Selection

### Based on User Settings

```javascript
dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "message",
    description: "Send a message",
    
    async onExecute({ interaction, dbi }) {
      // Get user's saved language preference from database
      const userLang = await getUserLanguage(interaction.user.id);
      
      // Get the locale
      const locale = dbi.locale(userLang) || dbi.locale("en");
      
      const message = locale.data.welcomeMessage();
      interaction.reply(message);
    }
  });
});
```

### Based on Guild Settings

```javascript
dbi.register(({ Event }) => {
  Event({
    name: "guildMemberAdd",
    id: "welcome-message",
    
    async onExecute({ member, locale }) {
      // Use guild's locale or default
      const guildLocale = locale?.guild || dbi.locale("en");
      const message = guildLocale.data.welcome(member.user.username);
      
      const channel = member.guild.systemChannel;
      if (channel) {
        await channel.send(message);
      }
    }
  });
});
```

---

## Merging Locales

Locales with the same name are automatically merged:

```javascript
// File 1: Base translations
dbi.register(({ Locale }) => {
  Locale({
    name: "en",
    data: {
      common: {
        yes: "Yes",
        no: "No",
        cancel: "Cancel"
      }
    }
  });
});

// File 2: Feature-specific translations
dbi.register(({ Locale }) => {
  Locale({
    name: "en",
    data: {
      shop: {
        buy: "Buy",
        sell: "Sell",
        cart: "Cart"
      }
    }
  });
});

// Result: Both 'common' and 'shop' are available in 'en' locale
```

---

## Handling Missing Translations

### Default Invalid Path Handler

```javascript
const dbi = createDBI("my-bot", {
  defaults: {
    locale: {
      name: "en",
      
      // Custom message for missing translations
      invalidPath: ({ path, locale }) => {
        console.warn(`Missing translation: ${path} in ${locale.name}`);
        return `[Missing: ${path}]`;
      }
    }
  }
});
```

### Fallback to Default Locale

DBI automatically falls back to the default locale when a path is missing:

```javascript
dbi.register(({ Locale }) => {
  Locale({
    name: "en",
    data: {
      greeting: "Hello!",
      special: "Special message"
    }
  });
  
  Locale({
    name: "tr",
    data: {
      greeting: "Merhaba!"
      // 'special' is missing - will fall back to English
    }
  });
});

// In a Turkish context:
const message = locale.user.data.special();
// Returns "Special message" (fallback to English)
```

---

## Best Practices

### 1. Organize by Feature

```
src/
├── locales/
│   ├── en/
│   │   ├── common.js
│   │   ├── commands.js
│   │   └── errors.js
│   └── tr/
│       ├── common.js
│       ├── commands.js
│       └── errors.js
```

### 2. Use Consistent Keys

```javascript
// ✅ Good - Consistent naming
data: {
  commands: {
    help: { title: "...", description: "..." },
    settings: { title: "...", description: "..." }
  }
}

// ❌ Bad - Inconsistent naming
data: {
  helpTitle: "...",
  help_description: "...",
  settingsHeader: "..."
}
```

### 3. Include Context for Translators

```javascript
Locale({
  name: "en",
  data: {
    // {0} = username, {1} = level number
    levelUp: "{0} reached level {1}!",
    
    // {0} = item name, {1} = price in dollars
    itemPurchased: "Purchased {0} for ${1}!"
  }
});
```

### 4. Test All Locales

```javascript
// Helper to test all locale paths
function testLocales(dbi) {
  const paths = ["greeting", "goodbye", "commands.help.title"];
  const locales = ["en", "tr", "es"];
  
  for (const localeName of locales) {
    const locale = dbi.locale(localeName);
    if (!locale) {
      console.warn(`Missing locale: ${localeName}`);
      continue;
    }
    
    for (const path of paths) {
      const value = locale.get(path);
      if (!value) {
        console.warn(`Missing: ${localeName}.${path}`);
      }
    }
  }
}
```

### 5. Handle Pluralization

```javascript
Locale({
  name: "en",
  data: {
    items: {
      one: "1 item",
      many: "{0} items"
    }
  }
});

// Usage
function formatItems(count, locale) {
  if (count === 1) {
    return locale.data.items.one();
  }
  return locale.data.items.many(count);
}
```

### 6. Use Conditional Registration

```javascript
dbi.register(({ Locale }) => {
  Locale({
    name: "de",
    flag: "german",  // Only load with 'german' flag
    data: {
      greeting: "Hallo!"
    }
  });
});

// Load with German locale
await dbi.load("german");
```

---

## Complete Example

### File Structure

```
src/
├── locales/
│   ├── index.js
│   ├── en.js
│   └── tr.js
├── commands/
│   └── shop.js
└── interactions/
    └── shop.locale.js
```

### en.js

```javascript
const dbi = require("../../dbi");

dbi.register(({ Locale }) => {
  Locale({
    name: "en",
    data: {
      shop: {
        title: "🛒 Shop",
        welcome: "Welcome to the shop, {0}!",
        balance: "Your balance: ${0}",
        items: {
          sword: { name: "Sword", description: "A sharp blade" },
          shield: { name: "Shield", description: "Protective armor" }
        },
        purchase: {
          success: "Successfully purchased {0}!",
          noFunds: "You don't have enough funds!",
          confirm: "Buy {0} for ${1}?"
        }
      }
    }
  });
});
```

### tr.js

```javascript
const dbi = require("../../dbi");

dbi.register(({ Locale }) => {
  Locale({
    name: "tr",
    data: {
      shop: {
        title: "🛒 Mağaza",
        welcome: "Mağazaya hoş geldin, {0}!",
        balance: "Bakiyen: {0}₺",
        items: {
          sword: { name: "Kılıç", description: "Keskin bir bıçak" },
          shield: { name: "Kalkan", description: "Koruyucu zırh" }
        },
        purchase: {
          success: "{0} başarıyla satın alındı!",
          noFunds: "Yeterli bakiyen yok!",
          confirm: "{0}'ı {1}₺'ye satın al?"
        }
      }
    }
  });
});
```

### shop.js

```javascript
const dbi = require("../../dbi");

dbi.register(({ ChatInput }) => {
  ChatInput({
    name: "shop",
    description: "Open the shop",
    
    onExecute({ interaction, locale }) {
      const t = locale.user.data.shop;
      
      interaction.reply({
        embeds: [{
          title: t.title(),
          description: t.welcome(interaction.user.username),
          fields: [
            {
              name: t.items.sword.name(),
              value: t.items.sword.description()
            },
            {
              name: t.items.shield.name(),
              value: t.items.shield.description()
            }
          ],
          footer: { text: t.balance(100) }
        }]
      });
    }
  });
});
```

---

## Next Steps

- [Advanced Features](./ADVANCED_FEATURES.md) - Message commands, multi-client
- [Svelte Components](./SVELTE_COMPONENTS.md) - Reactive UI components
- [API Reference](./API_REFERENCE.md) - Complete API documentation

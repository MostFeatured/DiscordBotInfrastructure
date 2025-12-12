import { createDBI } from "../src";
import path from "path";

const dbi = createDBI("svelte", {
  discord: {
    token: process.env.DISCORD_TOKEN || "",
    options: {
      intents: [
        "GuildMessages",
        "Guilds",
        "MessageContent",
        "GuildMessageReactions"
      ],
    }
  },
  references: {
    autoClear: {
      ttl: 60000 * 60, // 60 minutes
      check: 60000 // every 60 seconds
    }
  }
});

dbi.register(({ ChatInput, HTMLComponentsV2 }) => {
  // Svelte product showcase with Components V2
  HTMLComponentsV2({
    name: "product-showcase",
    mode: 'svelte',
    file: path.join(__dirname, "product-showcase.svelte")
  });

  // Test command
  ChatInput({
    name: "test-svelte",
    description: "Test Svelte product showcase",
    async onExecute({ interaction, dbi }) {
      const showcase = dbi.interaction("product-showcase") as any;

      const products = [
        {
          name: "Gaming Keyboard",
          description: "RGB mechanical keyboard with Cherry MX switches",
          price: 149,
          image: "https://cdn.discordapp.com/embed/avatars/0.png",
          category: "Electronics",
          rating: 4.8,
          stock: 25
        },
        {
          name: "Wireless Mouse",
          description: "Ergonomic wireless mouse with 16000 DPI sensor",
          price: 79,
          image: "https://cdn.discordapp.com/embed/avatars/1.png",
          category: "Electronics",
          rating: 4.5,
          stock: 42
        },
        {
          name: "USB-C Hub",
          description: "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader",
          price: 59,
          image: "https://cdn.discordapp.com/embed/avatars/2.png",
          category: "Accessories",
          rating: 4.3,
          stock: 18
        },
        {
          name: "Monitor Stand",
          description: "Adjustable monitor stand with cable management",
          price: 89,
          image: "https://cdn.discordapp.com/embed/avatars/3.png",
          category: "Furniture",
          rating: 4.6,
          stock: 31
        }
      ];

      // Use send() method - this sends the message AND initializes lifecycle hooks (onMount)
      // The interval in onMount will start immediately after the message is sent
      await showcase.send(interaction, {
        data: {
          products,
          currentIndex: 0,
          cart: [],
          view: 'browse',
          elapsedTime: 0
        }
      });
    }
  });
});

setTimeout(() => {
  console.log("Loading DBI...");
  dbi.load().then(() => {
    dbi.publish("Guild", "1341841733511806978")
    console.log("DBI loaded.");
    dbi.login().then(() => {
      console.log("Bot is running with Svelte components!");
    });
  });
}, 100);
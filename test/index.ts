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
        },
        {
          name: "Webcam 4K",
          description: "Ultra HD webcam with autofocus and noise-canceling mic",
          price: 129,
          image: "https://cdn.discordapp.com/embed/avatars/4.png",
          category: "Electronics",
          rating: 4.7,
          stock: 15
        },
        {
          name: "Desk Lamp",
          description: "LED desk lamp with adjustable brightness and color temperature",
          price: 45,
          image: "https://cdn.discordapp.com/embed/avatars/0.png",
          category: "Furniture",
          rating: 4.4,
          stock: 60
        },
        {
          name: "Headphone Stand",
          description: "Aluminum headphone stand with cable holder",
          price: 35,
          image: "https://cdn.discordapp.com/embed/avatars/1.png",
          category: "Accessories",
          rating: 4.2,
          stock: 28
        },
        {
          name: "Gaming Headset",
          description: "7.1 surround sound gaming headset with RGB lighting",
          price: 99,
          image: "https://cdn.discordapp.com/embed/avatars/2.png",
          category: "Electronics",
          rating: 4.6,
          stock: 35
        },
        {
          name: "Mouse Pad XL",
          description: "Extended mouse pad with stitched edges, 900x400mm",
          price: 25,
          image: "https://cdn.discordapp.com/embed/avatars/3.png",
          category: "Accessories",
          rating: 4.8,
          stock: 100
        },
        {
          name: "Ergonomic Chair",
          description: "Mesh office chair with lumbar support and adjustable armrests",
          price: 299,
          image: "https://cdn.discordapp.com/embed/avatars/4.png",
          category: "Furniture",
          rating: 4.9,
          stock: 8
        },
        {
          name: "Cable Management Kit",
          description: "Complete kit with cable clips, ties, and sleeve",
          price: 19,
          image: "https://cdn.discordapp.com/embed/avatars/0.png",
          category: "Accessories",
          rating: 4.1,
          stock: 75
        },
        {
          name: "Portable SSD 1TB",
          description: "Ultra-fast portable SSD with USB 3.2 Gen 2",
          price: 109,
          image: "https://cdn.discordapp.com/embed/avatars/1.png",
          category: "Electronics",
          rating: 4.7,
          stock: 22
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
          elapsedTime: 0,
          reviews: [],
          editingProduct: null
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
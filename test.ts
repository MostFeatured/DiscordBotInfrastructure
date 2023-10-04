import { ApplicationCommandOptionType } from "discord.js";
import { createDBI } from "./src";

const dbi = createDBI("xd", {
  discord: {
    options: {
      intents: [
        "GuildMembers",
        "GuildMessages",
        "MessageContent",
        "Guilds"
      ]
    },
    token: ""
  },
  messageCommands: {
    prefixes: ["."],
    typeAliases: { 
      booleans: {
        "true": true,
        "false": false,
        "yes": true,
        "no": false,
        "y": true,
        "n": false,
        "1": true,
        "0": false,
        "evet": true,
        "hayır": false,
        "hayir": false,
        "doğru": true,
        "yanlış": false,
        "yanlis": false,
        "d": true,
        "e": true,
        "h": false
      }
    }
  }
});

dbi.events.on("messageCommandArgumentError", (data) => {
  data.message.reply(`‼️ Invalid argument \`${data.error.option.name}\`. Error Kind: \`${data.error.type}\`. Expected: \`${ApplicationCommandOptionType[data.error.option.type]}\`${data.error.type === "InvalidCompleteChoice" ? ` with any of \`${data.error.extra.map(i => i.value).join(", ")}\`` : ""}.`);
  return false;
});

dbi.register(({ ChatInput, ChatInputOptions, InteractionLocale }) => {

  ChatInput({
    name: "test command",
    description: "test command description",
    onExecute(ctx) {
      let b = ctx.interaction.options.getBoolean("test_bool");
      let c = ctx.interaction.options.getString("choices");
      ctx.interaction.reply(`Boolean: ${b}, String: ${c}`);
    },
    other: {
      messageCommand: {
        aliases: ["test2 command2"]
      }
    },
    options: [
      ChatInputOptions.boolean({
        name: "test_bool",
        description: "test_bool description",
        required: true
      }),
      ChatInputOptions.stringAutocomplete({
        name: "choices",
        description: "choices description",
        required: true,
        onComplete({ interaction, value }) {
          return [
            {
              name: "choice1",
              value: "choice1"
            },
            {
              name: "choice2",
              value: "choice2"
            },
            {
              name: "test2",
              value: "test2"
            }
          ].filter(c => c.name.startsWith(value));
        },
      }),
    ]
  });

  ChatInput({
    name: "test command deeptest",
    description: "test command deeptest description",
    onExecute(ctx) {
      let b = ctx.interaction.options.getBoolean("test_bool");
      let c = ctx.interaction.options.getString("choices");
      ctx.interaction.reply(`deeptest Boolean: ${b}, String: ${c}`);
    },
    other: {
      messageCommand: {
        aliases: ["test2 command2 deeptest2"]
      }
    },
    options: [
      ChatInputOptions.boolean({
        name: "test_bool",
        description: "test_bool description",
        required: true
      }),
      ChatInputOptions.stringAutocomplete({
        name: "choices",
        description: "choices description",
        required: true,
        onComplete({ interaction, value }) {
          return [
            {
              name: "choice1",
              value: "choice1"
            },
            {
              name: "choice2",
              value: "choice2"
            },
            {
              name: "test2",
              value: "test2"
            }
          ].filter(c => c.name.startsWith(value));
        },
      }),
    ]
  });

  InteractionLocale({
    name: "test command",
    data: {
      tr: {
        name: "test komutu",
        description: "test komutu açıklaması",
        options: {
          choices: {
            name: "seçenekler",
            description: "seçenekler açıklaması",
            choices: {
              "choicename1": "seçenek1",
              "choicename2": "seçenek2"
            }
          }
        }
      }
    }
  })
})

dbi.load().then(() => {
  dbi.login().then(() => {
    console.log("ready");
  });
});
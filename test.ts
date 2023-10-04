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
  data.message.reply(`‼️ Invalid argument \`${data.error.option.name}\`. Error Kind: \`${data.error.type}\`. Expected: \`${ApplicationCommandOptionType[data.error.option.type]}\`.`);
  return false;
});

dbi.register(({ ChatInput, ChatInputOptions, InteractionLocale }) => {

  ChatInput({
    name: "test command",
    description: "test command description",
    onExecute(ctx) {
      let b = ctx.interaction.options.getBoolean("test");
      ctx.interaction.reply("test command executed: "+b);
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
      ChatInputOptions.stringChoices({
        name: "choices",
        description: "choices description",
        required: true,
        choices: [
          {
            name: "choicename1",
            value: "choiceval1"
          },
          {
            name: "choicename2",
            value: "choiceval2"
          }
        ]
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
import { ApplicationCommandOptionType } from "discord.js";
import { createDBI } from "./src";

const dbi = createDBI("xd", {
  discord: {
    options: {
      intents: [
        "GuildMembers",
        "GuildMessages",
        "MessageContent",
        "Guilds",
        "DirectMessages"
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
  data.message.reply(`‼️ Invalid argument \`${data.error.option.name}\` (Index: \`${data.error.index}\`). Error Kind: \`${data.error.type}\`. Expected: \`${ApplicationCommandOptionType[data.error.option.type]}\`${data.error.extra ? ` with any of \`${data.error.extra.map(i => i.name).join(", ")}\`` : ""}.`);
  return false;
});

dbi.register(({ ChatInput, ChatInputOptions, InteractionLocale }) => {

  ChatInput({
    name: "test command",
    description: "test command description",
    onExecute(ctx) {
      let b = ctx.interaction.options.getBoolean("test_bool");
      let c = ctx.interaction.options.getString("choices_auto");
      let d = ctx.interaction.options.getString("choices");
      let u = ctx.interaction.options.getUser("user");
      let a = ctx.interaction.options.getAttachment("attachment");
      let atcName = ctx.interaction.options.getString("atc_name");
      ctx.interaction.reply(`Boolean: ${b}, String auto: ${c}, String: ${d}, User: ${u}, Atc: ${a.url}, Atc name: ${atcName}`);
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
        name: "choices_auto",
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
      ChatInputOptions.stringChoices({
        name: "choices",
        description: "choices description",
        required: true,
        choices: [
          {
            name: "choice1normal",
            value: "choice1normal"
          },
          {
            name: "choice2normal",
            value: "choice2normal"
          },
          {
            name: "test2normal",
            value: "test2normal"
          }
        ]
      }),
      ChatInputOptions.user({
        name: "user",
        description: "user description",
        required: true
      }),
      ChatInputOptions.attachment({
        name: "attachment",
        description: "attachment description",
        required: true
      }),
      ChatInputOptions.string({
        name: "atc_name",
        description: "atc_name description",
        required: true
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
              "choice1normal": "seçenek1normal",
              "choice2normal": "seçenek2normal"
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
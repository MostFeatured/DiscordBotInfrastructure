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

dbi.register(({ ChatInput, ChatInputOptions }) => {

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
        name: "test",
        description: "test description",
        required: true
      }),
    ]
  })

})

dbi.load().then(() => {
  dbi.login().then(() => {
    console.log("ready");
  });
});
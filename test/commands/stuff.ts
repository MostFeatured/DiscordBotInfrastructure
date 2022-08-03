import { dbi } from "..";

dbi.register(({ChatInput, ChatInputOptions}) => {
  ChatInput({
    name: "hello world",
    description: "bruh",
    async onExecute(ctx) {
      ctx.interaction.reply({ content: `Hi! \`${ctx.interaction.options.getString("yazı")}\`` });
    },
    options: [
      ChatInputOptions.string({
        name: "yazı",
        description: "yazı yazıon",
        minLength: 3,
        maxLength: 16,
        required: true
      })
    ]
  });
})
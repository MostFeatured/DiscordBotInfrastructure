import { ButtonStyle, ComponentType } from "discord.js";
import { dbi } from "..";

dbi.register(({ ChatInput, ChatInputOptions, Button, Event }) => {

  Event({
    name: "ready",
    onExecute() {
      console.log("READY");
    }
  });

  Event({
    name: "messageCreate",
    onExecute(ctx) {
      console.log(ctx.message.content);
    }
  })

  Button({
    name: "button1",
    onExecute(ctx) {
      ctx.interaction.reply(`Text was: \`${(ctx.data[0] as any)?.text}\``);
    },
    options: {
      style: ButtonStyle.Primary,
      label: "WOW"
    }
  });

  ChatInput({
    name: "hello world",
    description: "bruh",
    async onExecute(ctx) {
      ctx.interaction.reply({
        content: `Hi! \`${ctx.interaction.options.getString("yazı")}\``,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              (ctx.dbi.data.interactions.get("button1") as any).toJSON({ text: ctx.interaction.options.getString("yazı") })
            ]
          }
        ]
      });
    },
    options: [
      ChatInputOptions.stringAutocomplete({
        name: "yazı",
        description: "yazı yazıon",
        minLength: 3,
        maxLength: 16,
        required: true,
        async onComplete(ctx) {
          return [{ name: `${ctx.value} yazdın`, value: `${ctx.value}` }]
        }
      })
    ],
  });

});
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { dbi } from "..";

dbi.register(({ ChatInput, ChatInputOptions, Button, Event, Modal }) => {

  Modal({
    name: "modalIsCool",
    onExecute(ctx) {
      ctx.interaction.reply("xd 1");
    },
    options: {
      title: "XDaaaa",
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              customId: "COOLID",
              label: "WOWXD",
              style: TextInputStyle.Short,
              type: ComponentType.TextInput,
              placeholder: "valla yani"
            }
          ]
        }
      ]
    }
  })

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
      console.log("aa1")
      console.log((ctx.dbi.data.interactions.get("modalIsCool") as any).toJSON());
      ctx.interaction.showModal((ctx.dbi.data.interactions.get("modalIsCool") as any).toJSON())
      // ctx.interaction.reply({
      //   content: `Hi! \`${ctx.interaction.options.getString("yazı")}\``,
      //   components: [
      //     {
      //       type: ComponentType.ActionRow,
      //       components: [
      //         (ctx.dbi.data.interactions.get("button1") as any).toJSON({ text: ctx.interaction.options.getString("yazı") })
      //       ]
      //     }
      //   ]
      // });
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
let dbi = (0, _1.createDBI)("asd", {
    discord: {
        token: "ODI0MjEwMTMyMzUwMDA5MzY2.G8YRue.GPxxFyZTOG0cnijU_O8U9uvBDwf01zuVHBBoKI",
        options: {
            intents: ["Guilds"]
        }
    }
});
dbi.register(({ InteractionLocale, ChatInput, ChatInputOptions }) => {
    ChatInput({
        name: "english command",
        description: "english command",
        onExecute(ctx) {
            ctx.interaction.reply("wow");
        },
        options: [
            ChatInputOptions.string({
                name: "value",
                description: "..."
            })
        ]
    });
    // InteractionLocale({
    //   name: "english command",
    //   data: {
    //     tr: {
    //       name: "turkce komut",
    //       description: "turkce komut",
    //       options: {
    //         value: {
    //           name: "deger",
    //           description: "..."
    //         }
    //       }
    //     }
    //   }
    // })
});
(async () => {
    await dbi.load();
    await dbi.publish("Guild", "817408899904438282");
})();
//# sourceMappingURL=test.js.map
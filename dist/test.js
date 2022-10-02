"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
let dbi = (0, _1.createDBI)("xd", {
    strict: true,
    discord: {
        token: "<yourTokenHere>",
        options: {
            intents: [
                "Guilds"
            ]
        }
    },
    defaults: {
        locale: "en",
        defaultMemberPermissions: ["SendMessages"],
        directMessages: false
    },
    references: {
        autoClear: {
            ttl: 60 * 1000 * 60,
            check: 60 * 1000
        }
    }
});
dbi.register(({ ChatInput, ChatInputOptions, InteractionLocale, Locale }) => {
    ChatInput({
        name: "cinsiyet seç",
        description: "...",
        onExecute({ interaction, locale }) {
            interaction.reply(`tmm ok knk! oldu bu iş **${locale.user.data.genders[interaction.options.get("cinsiyet").value]()}**`);
        },
        options: [
            ChatInputOptions.stringChoices({
                name: "cinsiyet",
                description: "...",
                required: true,
                choices: [
                    {
                        name: "Erkek",
                        value: "erkek"
                    },
                    {
                        name: "Kadın",
                        value: "kadın"
                    },
                    {
                        name: "Diğer",
                        value: "diğer"
                    },
                ]
            })
        ]
    });
    Locale({
        name: "tr",
        data: {
            genders: {
                erkek: "Erkek",
                kadın: "Kadın",
                diğer: "Diğer"
            }
        }
    });
    Locale({
        name: "en",
        data: {
            genders: {
                erkek: "Male",
                kadın: "Female",
                diğer: "Other"
            }
        }
    });
    InteractionLocale({
        name: "cinsiyet seç",
        data: {
            en: {
                name: "select gender",
                description: "...",
                options: {
                    cinsiyet: {
                        name: "gender",
                        description: "...",
                        choices: {
                            "Erkek": "Male",
                            "Kadın": "Female",
                            "Diğer": "Other"
                        }
                    }
                }
            }
        }
    });
});
(async () => {
    await dbi.load();
    // await dbi.publish("Guild", "817408899904438282");
    await dbi.login();
    // await dbi.unload();
    console.log(1);
})();
//# sourceMappingURL=test.js.map
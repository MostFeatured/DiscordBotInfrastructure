const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions }) => {
    ChatInput({
        name: "cinsiyet seç",
        description: "Cinsiyet seçmenizi sağlar.",
        onExecute({ interaction, locale }) {
            let gender = interaction.options.get("cinsiyet").value;
            let genderNames = locale.user.data.genders;
            let genderText = locale.user.data.genderText(interaction.user, genderNames[gender]());

            interaction.reply({
                content: genderText,
                components: [
                    {
                        type: Discord.ComponentType.ActionRow,
                        components: [
                            dbi.interaction("viewGender").toJSON({ override: { label: locale.user.data.clickText() }, reference: { ttl: 1000 * 60 * 10, data: [gender] } }),
                        ]
                    }
                ]
            });
        },
        options: [
            ChatInputOptions.stringChoices({
                name: "cinsiyet",
                description: "Seçeceğiniz cinsiyet.",
                required: true,
                choices: [
                    { name: "Erkek", value: "erkek" },
                    { name: "Kadın", value: "kadın" },
                    { name: "Diğer", value: "diğer" },
                ]
            })
        ],
    });
});
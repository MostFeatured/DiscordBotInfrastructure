const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ Button }) => {
    Button({
        name: "viewGender",
        onExecute({ interaction, locale }) {
            interaction.showModal(dbi.interaction("my-modal").toJSON({locale}))

        },
        options(data) {
            return {
                style: Discord.ButtonStyle.Danger,
                label: data[0].clickText,
            }
        }
    });
});
const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ Button }) => {
    Button({
        name: "viewGender",
        onExecute({ interaction, locale, data }) {
            interaction.showModal(dbi.interaction("my-modal").toJSON({
                override: {
                    title: locale.user.data.modal.title(),
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    customId: "name",
                                    type: Discord.ComponentType.TextInput,
                                    style: Discord.TextInputStyle.Short,
                                    label: locale.user.data.modal.label(),
                                }
                            ]
                        },
                    ],
                },
                data
            }));
        },
        options: {
            style: Discord.ButtonStyle.Danger,
            label: "example",
        }
    });
});
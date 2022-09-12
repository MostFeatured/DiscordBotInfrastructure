const dbi = require('../dbi');
const Discord = require("discord.js");

dbi.register(({ Modal }) => {
    Modal({
        name: "my-modal",
        onExecute({ interaction, locale }) {
            const text = locale.user.data.modal.text(interaction.fields.getField('name').value);

            interaction.reply(text);
        },
        options(data) {
            return {
                title: data[0].locale.user.data.modal.title(),
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.ActionRow,
                        components: [
                            {
                                customId: "name",
                                type: Discord.ComponentType.TextInput,
                                style: Discord.TextInputStyle.Short,
                                label: data[0].locale.user.data.modal.label(),
                            }
                        ]
                    },
                ],
            }
        }
    })
});
const dbi = require('../dbi');
const Discord = require("discord.js");

dbi.register(({ Modal }) => {
    Modal({
        name: "my-modal",
        onExecute({ interaction, locale, data }) {
            const text = locale.user.data.modal.text(interaction.fields.getField('name').value, data[0]);
            interaction.reply(text);
        },
        options: {
            title: "example",
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            customId: "name",
                            type: Discord.ComponentType.TextInput,
                            style: Discord.TextInputStyle.Short,
                            label: "example",
                        }
                    ]
                },
            ],
        }
    })
});
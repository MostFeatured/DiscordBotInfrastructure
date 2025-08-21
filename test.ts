import { createDBI } from "./src";

const dbi = createDBI("test", {
  strict: true,
  discord: {
    token: '',
    options: {
      intents: [
        "Guilds",
        "GuildMessages",
        "GuildMembers",
        "MessageContent",
      ]
    }
  }
});

dbi.register(({ HTMLComponentsV2, HTMLComponentsV2Handlers, Event }) => {
  HTMLComponentsV2({
    name: 'test-v2',
    description: 'Test HTML Components V2',
    template: `
    <components>
      <container>
        <components>
          <action-row>
            <% it.tabs.forEach((tab => { %>
              <button name="<%= tab.name %>" style="<%= tab.selected ? 'Primary' : 'Secondary' %>"><%= tab.label %></button>
            <% })) %>
          </action-row>
          <text-display>
            Seçili Sekme: <%= it.tabs.find(tab => tab.selected).label %>
          </text-display>
        </components>
      </container>
    </components>
    `,
    async onExecute({ interaction, data: [elementName, clicks] }) {
      if (interaction.isButton()) {
        console.log(`Button clicked: ${elementName}`);
        await interaction.deferUpdate();
        interaction.editReply({
          components: dbi.interaction("test-v2").toJSON({
            data: {
              tabs: [
                { name: 'tab:1', label: 'Tab 1' },
                { name: 'tab:2', label: 'Tab 2' },
                { name: 'tab:3', label: 'Tab 3' },
                { name: 'tab:4', label: 'Tab 4' },
                { name: 'tab:5', label: 'Tab 5' },
              ].map(tab => ({
                ...tab,
                selected: tab.name === elementName
              }))
            }
          })
        })
      }
    }
  });

  Event({
    id: 'test-v2-event',
    name: 'messageCreate',
    onExecute: async ({ message }) => {
      if (message.content === '!test') {
        await message.reply({
          components: dbi.interaction("test-v2").toJSON({
            data: {
              tabs: [
                { name: 'tab:1', label: 'Tab 1', selected: true },
                { name: 'tab:2', label: 'Tab 2' },
                { name: 'tab:3', label: 'Tab 3' },
                { name: 'tab:4', label: 'Tab 4' },
                { name: 'tab:5', label: 'Tab 5' },
              ]
            }
          }),
          flags: ["IsComponentsV2"]
        }).catch((err) => {
          console.log(JSON.stringify(err, null, 2));
        });
      }
    }
  })
});

(async () => {
  await dbi.load();
  await dbi.login();
})();
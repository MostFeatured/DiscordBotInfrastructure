const { createDBI } = require("./dist");

const dbi = createDBI("test", {
  discord: { options: { intents: [] }, token: "" },
});

dbi.emit("momCreate", { mom: { test: "zort" } });

dbi.register(({ Event, CustomEvent }) => {

  CustomEvent({
    name: "momCreate",
    map: {
      mom: "import('discord.js').GuildMember"
    },
  })

  Event({
    name: "momCreate",
    onExecute({mom}) {

      mom.ban({reason: "Aneni banladım"})
    
    }
  })
});
dbi.data.eventMap
dbi.events.on("eventError", (data) => {

  if (data.eventName == "momCreate") {
    data.mom
  }

})
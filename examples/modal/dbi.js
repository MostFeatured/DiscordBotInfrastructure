const { createDBI } = require("@mostfeatured/dbi");

let dbi = createDBI("modal-example", {
  strict: true,
  discord: {
    token: "<token>",
    options: {
      intents: [
        "Guilds",
        "MessageContent",
        "GuildMessages",
        "GuildMessageTyping",
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


module.exports = dbi;
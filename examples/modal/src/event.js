const dbi = require("../dbi");

dbi.register(({ Event })=>{
  Event({
    name: "ready",
    id: "botIsReady",
    onExecute() {
      console.log(`Bot ready!`);
    }
  });

  Event({
    name: "messageCreate",
    onExecute({ message }) {
      if (dbi.client.user.id === message.author.id) return;

      message.channel.send("hello !");
    }
  })
});
import { createDBI, recursiveImport } from "../src/index";
import path from "path";

export let dbi = createDBI("namespace", {
  discord: {
    token: "",
    options: {
      intents: [
        "Guilds",
        "MessageContent",
        "GuildMessages"
      ]
    }
  },
  defaults: {
    locale: "tr"
  }
});

dbi.events.on("beforeInteraction", (data) => {
  console.log("beforeInteraction");
  return true;
});

(async () => {
  await recursiveImport(path.resolve(__dirname, "./things"));

  await dbi.load();
  // await dbi.publish("Guild", "817408899904438282");
  await dbi.login();
  console.log("ok");  
})();

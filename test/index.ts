import { createDBI, recursiveImport } from "../src/index";
import path from "path";

export let dbi = createDBI("namespace", {
  discord: {
    token: "ODI0MjEwMTMyMzUwMDA5MzY2.YFsDgA.6mhpQwJb2Rev5vxvUj59mOjS3EI",
    options: {
      intents: [
        "Guilds"
      ]
    }
  }
});

(async () => {
  await recursiveImport(path.resolve(__dirname, "./commands"));
  // await dbi.publish("Guild", "817408899904438282");
  await dbi.login();
  console.log("ok");  
})();


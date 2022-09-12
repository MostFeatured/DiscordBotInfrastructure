const { recursiveImport } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await recursiveImport("./src");

  await dbi.load();
  await dbi.publish("Guild", "<Guild Id>");
  // await dbi.publish("Global");
  await dbi.unload();

  console.log("Published!");
})();
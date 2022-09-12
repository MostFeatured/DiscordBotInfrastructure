const { recursiveImport } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await recursiveImport("./src");

  await dbi.load();
  await dbi.login();

  await dbi.client.user.setActivity({
    name: "hello world!"
  });

  console.log(`Logged in! ${dbi.client.user.tag} (${dbi.client.user.id})`);
})();
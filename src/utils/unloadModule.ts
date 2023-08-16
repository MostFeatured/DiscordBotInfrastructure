export function unloadModule(modulePath) {
  let nodeModule = require.cache[modulePath];
  if (nodeModule) {
    for (let child of nodeModule.children) unloadModule(child.id);
  }
  delete require.cache[modulePath];
}
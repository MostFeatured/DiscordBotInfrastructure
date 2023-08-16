import fs from "fs";
import path from "path";
import { unloadModule } from "./unloadModule";

/**
 * @example
 * await recursiveUnload("./src", [".js"], [".d.ts"])
 * await dbi.unload()
 */
export async function recursiveUnload(folderPath: string, exts: string[] = [".js"], ignore: string[] = [".d.ts",".js.map",".d.ts.map"]): Promise<any> {
  let files = await fs.promises.readdir(folderPath, { withFileTypes: true });
  let dirName = __dirname;

  for (const file of files) {
    let filePath = path.resolve(folderPath, file.name);
    let relative = path.relative(dirName, filePath);
    if (!relative.includes(`${path.sep}-`)) {
      if (file.isDirectory()) {
        await recursiveUnload(filePath, exts)
      } else if (exts.some(i => file.name.endsWith(i)) && !ignore.some(i => file.name.endsWith(i))) {
        unloadModule(filePath)
      }
    }
  }
}
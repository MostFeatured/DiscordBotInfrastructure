import fs from "fs";
import path from "path";

/**
 * @example
 * await recursiveImport("./src", [".js"], [".d.ts"])
 */
export async function recursiveImport(folderPath: string, exts: string[] = [".js"], ignore: string[] = [".d.ts",".js.map",".d.ts.map"]): Promise<any> {
  let files = await fs.promises.readdir(folderPath, { withFileTypes: true });
  let dirName = __dirname;

  for (const file of files) {
    let filePath = path.resolve(folderPath, file.name);
    let relative = path.relative(dirName, filePath);
    if (!relative.includes(`${path.sep}-`)) {
      if (file.isDirectory()) {
        await recursiveImport(filePath, exts)
      } else if (exts.some(i => file.name.endsWith(i)) && !ignore.some(i => file.name.endsWith(i))) {
        await import(filePath);
      }
    }
  }
}
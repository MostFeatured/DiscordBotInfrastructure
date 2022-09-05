import fs from "fs";
import path from "path";

/**
 * Usage: `await recursiveImport("./src", [".js", ".ts"])`
 */
export async function recursiveImport(folderPath: string, exts: string[] = [".js", ".ts"]): Promise<any> {
  let files = await fs.promises.readdir(folderPath, { withFileTypes: true });

  for (const file of files) {
    let filePath = path.resolve(folderPath, file.name);
    if (file.isDirectory()) {
      await recursiveImport(filePath, exts)
    } else if (exts.some(i => filePath.endsWith(i))) {
      await import(filePath)
    }
  }
}
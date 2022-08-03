import fs from "fs";
import path from "path";

export async function recursiveImport(folderPath: string): Promise<any> {
  let files = await fs.promises.readdir(folderPath, { withFileTypes: true });

  for (const file of files) {
    let filePath = path.resolve(folderPath, file.name);
    if (file.isDirectory()) {
      await recursiveImport(filePath)
    } else if (filePath.endsWith(".js")) {
      await import(filePath)
    }
  }
}
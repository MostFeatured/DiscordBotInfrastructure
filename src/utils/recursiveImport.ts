import fs from "fs";
import path from "path";

/**
 * @example
 * await recursiveImport("./src", [".js"], [".d.ts"])
 */
export async function recursiveImport(folderPath: string, exts: string[] = [".js"], ignore: string[] = [".d.ts", ".js.map", ".d.ts.map"]): Promise<any> {
  let files = await fs.promises.readdir(folderPath, { withFileTypes: true });
  let dirName = __dirname;

  for (const file of files) {
    let filePath = path.resolve(folderPath, file.name);
    let relative = path.relative(dirName, filePath);
    if (!relative.includes(`${path.sep}-`)) {
      if (file.isDirectory()) {
        await recursiveImport(filePath, exts, ignore);
      } else if (exts.some(i => file.name.endsWith(i)) && !ignore.some(i => file.name.endsWith(i))) {
        // Use require for CommonJS compatibility
        // Wrap in try-catch for Bun compatibility - Bun throws "Missing 'default' export"
        // but still executes the module's side effects (dbi.register calls)
        try {
          require(filePath);
        } catch (e: any) {
          // Ignore "Missing 'default' export" errors in Bun runtime
          // The module's side effects still execute before the error is thrown
          if (!e.message?.includes("Missing 'default' export") &&
            !e.message?.includes("does not provide an export named 'default'")) {
            throw e;
          }
        }
      }
    }
  }
}
import { DBI, TDBIConfigConstructor } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

export function createDBI(namespace: string, cfg: TDBIConfigConstructor): DBI {
  return new DBI(namespace, cfg);
}
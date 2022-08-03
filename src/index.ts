import { DBI, DBIConfig } from "./DBI";
export { recursiveImport } from "./utils/recursiveImport";

export function createDBI(namespace: string, cfg: DBIConfig): DBI {
  return new DBI(namespace, cfg);
}
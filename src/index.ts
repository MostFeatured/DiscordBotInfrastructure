import { DBI, DBIConfig } from "./DBI";

export function createDBI(namespace: string, cfg: DBIConfig): DBI {
  return new DBI(namespace, cfg);
}
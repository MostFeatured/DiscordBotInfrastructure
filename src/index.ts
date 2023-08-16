import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
import { recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";

import path from "path";
import { parseCustomId, buildCustomId } from "./utils/customId";
import { unloadModule } from "./utils/unloadModule";
import { recursiveUnload } from "./utils/recursiveUnload";

export const generatedPath = path.resolve(__dirname, "../generated");

export function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TNamespace, TOtherType> {
  return new DBI<TNamespace, TOtherType>(namespace, cfg);
};

export const Utils = {
  parseCustomId,
  buildCustomId,
  recursiveImport,
  unloadModule,
  recursiveUnload
};
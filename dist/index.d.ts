import { NamespaceEnums } from "../generated/namespaceData";
import { DBI, DBIConfigConstructor } from "./DBI";
import { recursiveImport as _recursiveImport } from "./utils/recursiveImport";
export { MemoryStore } from "./utils/MemoryStore";
import { parseCustomId, buildCustomId } from "./utils/customId";
export declare const generatedPath: string;
export declare function createDBI<TNamespace extends NamespaceEnums, TOtherType = Record<string, any>>(namespace: TNamespace, cfg: DBIConfigConstructor): DBI<TNamespace, TOtherType>;
export declare const Utils: {
    parseCustomId: typeof parseCustomId;
    buildCustomId: typeof buildCustomId;
    recursiveImport: typeof _recursiveImport;
};
/**
 * @deprecated
 */
export declare function recursiveImport(...args: any[]): Promise<any>;
//# sourceMappingURL=index.d.ts.map
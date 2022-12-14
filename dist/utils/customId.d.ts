import { DBI } from "../DBI";
import { NamespaceEnums } from "../../generated/namespaceData";
export declare function buildCustomId(dbi: DBI<NamespaceEnums>, name: string, data: any[], ttl?: number): string;
export declare function parseCustomId(dbi: DBI<NamespaceEnums>, customId: string): {
    name: string;
    data: any[];
};
//# sourceMappingURL=customId.d.ts.map
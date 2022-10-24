import { SelectMenuComponentData } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBISelectMenu } from "./SelectMenu";
export declare type DBISelectMenuOverrides = Omit<SelectMenuComponentData, "customId" | "type">;
export declare class DBISelectMenuBuilder<TNamespace extends NamespaceEnums> {
    component: DBISelectMenu<TNamespace>;
    overrides: DBISelectMenuOverrides;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBISelectMenu<TNamespace>;
        overrides?: DBISelectMenuOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBISelectMenuBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBISelectMenuBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBISelectMenuBuilder<TNamespace>;
    setOverrides(overrides: DBISelectMenuOverrides): DBISelectMenuBuilder<TNamespace>;
    addOverrides(overrides: DBISelectMenuOverrides): DBISelectMenuBuilder<TNamespace>;
    toJSON(): SelectMenuComponentData;
}
//# sourceMappingURL=SelectMenuBuilder.d.ts.map
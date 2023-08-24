import { BaseSelectMenuComponentData, StringSelectMenuComponentData } from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIStringSelectMenu } from "../Components/StringSelectMenu";
import { RecursivePartial } from "../../utils/UtilTypes";
export declare type DBIStringSelectMenuOverrides = RecursivePartial<Omit<StringSelectMenuComponentData, "customId" | "type">>;
export declare class DBIStringSelectMenuBuilder<TNamespace extends NamespaceEnums> {
    component: DBIStringSelectMenu<TNamespace>;
    overrides: DBIStringSelectMenuOverrides;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIStringSelectMenu<TNamespace>;
        overrides?: DBIStringSelectMenuOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIStringSelectMenuBuilder<TNamespace>;
    addTTL(ttl: number): DBIStringSelectMenuBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIStringSelectMenuBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIStringSelectMenuBuilder<TNamespace>;
    setOverrides(overrides: DBIStringSelectMenuOverrides): DBIStringSelectMenuBuilder<TNamespace>;
    addOverrides(overrides: DBIStringSelectMenuOverrides): DBIStringSelectMenuBuilder<TNamespace>;
    toJSON(): BaseSelectMenuComponentData;
}
//# sourceMappingURL=StringSelectMenuBuilder.d.ts.map
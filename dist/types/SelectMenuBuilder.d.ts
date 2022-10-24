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
    setTTL(ttl: number): this;
    setData(...data: (string | number | object)[]): this;
    addData(...data: (string | number | object)[]): this;
    setOverrides(overrides: DBISelectMenuOverrides): this;
    addOverrides(overrides: DBISelectMenuOverrides): this;
    toJSON(): SelectMenuComponentData;
}
//# sourceMappingURL=SelectMenuBuilder.d.ts.map
import { BaseSelectMenuComponentData, ChannelSelectMenuComponentData } from "discord.js";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIChannelSelectMenu } from "../Components/ChannelSelectMenu";
export declare type DBIChannelSelectMenuOverrides = Omit<ChannelSelectMenuComponentData, "customId" | "type">;
export declare class DBIChannelSelectMenuBuilder<TNamespace extends NamespaceEnums> {
    component: DBIChannelSelectMenu<TNamespace>;
    overrides: Partial<DBIChannelSelectMenuOverrides>;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIChannelSelectMenu<TNamespace>;
        overrides?: DBIChannelSelectMenuOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIChannelSelectMenuBuilder<TNamespace>;
    addTTL(ttl: number): DBIChannelSelectMenuBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIChannelSelectMenuBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIChannelSelectMenuBuilder<TNamespace>;
    setOverrides(overrides: DBIChannelSelectMenuOverrides): DBIChannelSelectMenuBuilder<TNamespace>;
    addOverrides(overrides: DBIChannelSelectMenuOverrides): DBIChannelSelectMenuBuilder<TNamespace>;
    toJSON(): BaseSelectMenuComponentData;
}
//# sourceMappingURL=ChannelSelectMenuBuilder.d.ts.map
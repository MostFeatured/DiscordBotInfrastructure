import { ActionRowData, APIActionRowComponent, APITextInputComponent, JSONEncodable, ModalActionRowComponentData, ModalComponentData } from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBIModal } from "./Modal";
export declare type DBIModalOverrides = {
    components?: (JSONEncodable<APIActionRowComponent<APITextInputComponent>> | ActionRowData<ModalActionRowComponentData>)[];
    title?: string;
} & Omit<ModalComponentData, "customId" | "type" | "title" | "components">;
export declare class DBIModalBuilder<TNamespace extends NamespaceEnums> {
    component: DBIModal<TNamespace>;
    overrides: DBIModalOverrides;
    reference: {
        data: (string | number | object)[];
        ttl?: number;
    };
    constructor(arg: {
        component: DBIModal<TNamespace>;
        overrides?: DBIModalOverrides;
        reference?: {
            data: (string | number | object)[];
            ttl?: number;
        };
    });
    setTTL(ttl: number): DBIModalBuilder<TNamespace>;
    addTTL(ttl: number): DBIModalBuilder<TNamespace>;
    setData(...data: (string | number | object)[]): DBIModalBuilder<TNamespace>;
    addData(...data: (string | number | object)[]): DBIModalBuilder<TNamespace>;
    setOverrides(overrides: DBIModalOverrides): DBIModalBuilder<TNamespace>;
    addOverrides(overrides: DBIModalOverrides): DBIModalBuilder<TNamespace>;
    toJSON(): ModalComponentData;
}
//# sourceMappingURL=ModalBuilder.d.ts.map
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBIModalBuilder, DBIModalOverrides } from "./ModalBuilder";
export interface IDBIModalExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ModalSubmitInteraction<"cached">;
    data: TDBIReferencedData[];
}
export interface ModalComponentData {
    title: string;
    components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}
export declare type TDBIModalOmitted<TNamespace extends NamespaceEnums> = Omit<DBIModal<TNamespace>, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIModal<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI<TNamespace>, args: TDBIModalOmitted<TNamespace>);
    options: ModalComponentData;
    onExecute(ctx: IDBIModalExecuteCtx<TNamespace>): Promise<void> | void;
    toJSON(arg?: IDBIToJSONArgs<DBIModalOverrides>): Discord.ModalComponentData;
    createBuilder(arg?: IDBIToJSONArgs<DBIModalOverrides>): DBIModalBuilder<TNamespace>;
}
//# sourceMappingURL=Modal.d.ts.map
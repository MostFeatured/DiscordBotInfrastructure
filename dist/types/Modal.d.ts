import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
export interface IDBIModalExecuteCtx<TNamespace extends NamespaceEnums = NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ModalSubmitInteraction<"cached">;
    data: TDBIReferencedData[];
}
export interface ModalComponentData {
    title: string;
    components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}
export declare type TDBIModalOmitted<TNamespace extends NamespaceEnums = NamespaceEnums> = Omit<DBIModal<TNamespace>, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIModal<TNamespace extends NamespaceEnums = NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI, args: TDBIModalOmitted);
    options: ModalComponentData;
    onExecute(ctx: IDBIModalExecuteCtx<TNamespace>): Promise<any> | any;
    toJSON(arg?: IDBIToJSONArgs<ModalComponentData>): Discord.ModalComponentData;
}
//# sourceMappingURL=Modal.d.ts.map
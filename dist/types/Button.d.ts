import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
import { NamespaceEnums } from "../../generated/namespaceData";
export interface IDBIButtonExecuteCtx<TNamespace extends NamespaceEnums = NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
    interaction: Discord.ButtonInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIButtonOmitted<TNamespace extends NamespaceEnums = NamespaceEnums> = Omit<DBIButton<TNamespace>, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIButton<TNamespace extends NamespaceEnums = NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
    constructor(dbi: DBI, args: TDBIButtonOmitted);
    options?: Omit<Discord.ButtonComponentData, "customId" | "type">;
    onExecute(ctx: IDBIButtonExecuteCtx<TNamespace>): Promise<any> | any;
    toJSON(arg?: IDBIToJSONArgs<Omit<Discord.ButtonComponentData, "customId" | "type">>): Discord.ButtonComponentData;
}
//# sourceMappingURL=Button.d.ts.map
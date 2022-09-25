import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { IDBIToJSONArgs } from "../utils/UtilTypes";
export interface IDBISelectMenuExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ButtonInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBISelectMenuOmitted = Omit<DBISelectMenu, "type" | "description" | "dbi" | "toJSON">;
export declare class DBISelectMenu extends DBIBaseInteraction {
    constructor(dbi: DBI, args: TDBISelectMenuOmitted);
    options: Omit<Discord.SelectMenuComponentData, "customId" | "type">;
    onExecute(ctx: IDBISelectMenuExecuteCtx): Promise<any> | any;
    toJSON(arg?: IDBIToJSONArgs<Omit<Discord.SelectMenuComponentData, "customId" | "type">>): Discord.SelectMenuComponentData;
}
//# sourceMappingURL=SelectMenu.d.ts.map
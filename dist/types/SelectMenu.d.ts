import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
export interface IDBISelectMenuExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ButtonInteraction<Discord.CacheType>;
    data: (string | number | {
        [key: string]: any;
        $ref: string;
        $unRef(): boolean;
    })[];
}
export declare type TDBISelectMenuOmitted = Omit<DBIBaseInteraction, "type" | "description" | "dbi" | "toJSON">;
export declare class DBISelectMenu extends DBIBaseInteraction {
    constructor(dbi: DBI, args: TDBISelectMenuOmitted);
    options: Omit<Discord.SelectMenuComponentData, "customId" | "type">;
    onExecute(ctx: IDBISelectMenuExecuteCtx): Promise<any> | any;
    toJSON(...customData: (string | number | object)[]): Discord.SelectMenuComponentData;
}
//# sourceMappingURL=SelectMenu.d.ts.map
import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
export interface IDBIButtonExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ButtonInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIButtonOmitted = Omit<DBIButton, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIButton extends DBIBaseInteraction {
    constructor(dbi: DBI, args: TDBIButtonOmitted);
    options?: Omit<Discord.ButtonComponentData, "customId" | "type"> | ((data: (number | string | any)[]) => Omit<Discord.ButtonComponentData, "customId" | "type">);
    onExecute(ctx: IDBIButtonExecuteCtx): Promise<any> | any;
    referenceTTL?: number;
    toJSON(...customData: (string | number | object)[]): Discord.ButtonComponentData;
}
//# sourceMappingURL=Button.d.ts.map
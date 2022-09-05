import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";
export interface IDBIChatInputExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>;
}
export declare type TDBIChatInputOmitted = Omit<DBIChatInput, "type" | "dbi">;
export declare class DBIChatInput extends DBIBaseInteraction {
    constructor(dbi: DBI, cfg: TDBIChatInputOmitted);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    options?: any[];
    onExecute(ctx: IDBIChatInputExecuteCtx): void;
}
//# sourceMappingURL=ChatInput.d.ts.map
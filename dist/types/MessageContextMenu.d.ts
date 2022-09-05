import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";
export declare type TDBIMessageContextMenuOmitted = Omit<DBIMessageContextMenu, "type" | "description" | "dbi" | "options">;
export interface IDBIMessageContextMenuExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.MessageContextMenuCommandInteraction<Discord.CacheType>;
}
export declare class DBIMessageContextMenu extends DBIBaseInteraction {
    constructor(dbi: DBI, cfg: TDBIMessageContextMenuOmitted);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    onExecute(ctx: IDBIMessageContextMenuExecuteCtx): Promise<any> | any;
}
//# sourceMappingURL=MessageContextMenu.d.ts.map
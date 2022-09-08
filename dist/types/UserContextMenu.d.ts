import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";
export declare type TDBIUserContextMenuOmitted = Omit<DBIUserContextMenu, "type" | "description" | "dbi" | "options">;
export interface IDBIUserContextMenuExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.UserContextMenuCommandInteraction<"cached">;
}
export declare class DBIUserContextMenu extends DBIBaseInteraction {
    constructor(dbi: DBI, cfg: TDBIUserContextMenuOmitted);
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    onExecute(ctx: IDBIUserContextMenuExecuteCtx): Promise<any> | any;
}
//# sourceMappingURL=UserContextMenu.d.ts.map
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";

export type TDBIUserContextMenuOmitted = Omit<DBIUserContextMenu, "type" | "description" | "dbi" | "options">;

export interface IDBIUserContextMenuExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.UserContextMenuCommandInteraction<Discord.CacheType>;
}

export class DBIUserContextMenu extends DBIBaseInteraction {
  constructor(dbi: DBI, cfg: TDBIUserContextMenuOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "UserContextMenu"
    });
  }
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  override onExecute(ctx: IDBIUserContextMenuExecuteCtx): Promise<any> | any {}
}
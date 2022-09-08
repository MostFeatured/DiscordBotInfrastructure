import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";

export type TDBIUserContextMenuOmitted = Omit<DBIUserContextMenu, "type" | "description" | "dbi" | "options">;

export interface IDBIUserContextMenuExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.UserContextMenuCommandInteraction<"cached">;
}

export class DBIUserContextMenu extends DBIBaseInteraction {
  constructor(dbi: DBI, cfg: TDBIUserContextMenuOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "UserContextMenu"
    });

    this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
    this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
  }
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  override onExecute(ctx: IDBIUserContextMenuExecuteCtx): Promise<any> | any {}
}
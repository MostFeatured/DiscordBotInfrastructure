import Discord from "discord.js";
import { DBI } from "../../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";

export interface IDBIChatInputExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>;
}

export type TDBIChatInputOmitted = Omit<DBIChatInput, "type" | "dbi">;

export class DBIChatInput extends DBIBaseInteraction {
  constructor(dbi: DBI, cfg: TDBIChatInputOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "ChatInput",
      name: cfg.name.toLowerCase(),
      options: Array.isArray(cfg.options) ? cfg.options : []
    });
  }
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  declare options?: any[];
  override onExecute(ctx: IDBIChatInputExecuteCtx) {
    
  }
}
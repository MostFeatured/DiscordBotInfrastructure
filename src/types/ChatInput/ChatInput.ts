import Discord from "discord.js";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "../Interaction";

export interface IDBIExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ChatInputCommandInteraction;
}

export type TDBIChatInputOmitted = Omit<DBIChatInput, "type">;

export class DBIChatInput extends DBIBaseInteraction {
  constructor(cfg: TDBIChatInputOmitted) {
    super({
      ...(cfg as any),
      type: "ChatInput",
      name: cfg.name.toLowerCase(),
      options: Array.isArray(cfg.options) ? cfg.options : []
    });
  }
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  override onExecute(ctx: IDBIExecuteCtx) {
    
  }
}
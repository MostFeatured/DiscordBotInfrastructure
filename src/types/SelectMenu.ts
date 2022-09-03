import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import { customIdBuilder } from "../utils/customId";

export interface IDBISelectMenuExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ButtonInteraction<Discord.CacheType>;
  data: (string | number | { [key: string]: any, $ref: string, $unRef(): boolean })[];
}

export type TDBISelectMenuOmitted = Omit<DBIBaseInteraction, "type" | "description" | "dbi" | "toJSON">;

export class DBISelectMenu extends DBIBaseInteraction {
  constructor(dbi: DBI, args: TDBISelectMenuOmitted) {
    super(dbi, {
      ...(args as any),
      type: "SelectMenu",
    });
  }

  declare options: Omit<Discord.SelectMenuComponentData, "customId" | "type">;

  override onExecute(ctx: IDBISelectMenuExecuteCtx) { };

  toJSON(...customData: (string | number | object)[]): Discord.SelectMenuComponentData {
    return {
      ...this.options,
      customId: customIdBuilder(this.dbi, this.name, customData),
      type: Discord.ComponentType.SelectMenu
    } as any
  };
}
import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { customIdBuilder } from "../utils/customId";
import { IDBIToJSONArgs } from "../utils/UtilTypes";

export interface IDBISelectMenuExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ButtonInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBISelectMenuOmitted = Omit<DBISelectMenu, "type" | "description" | "dbi" | "toJSON">;

export class DBISelectMenu extends DBIBaseInteraction {
  constructor(dbi: DBI, args: TDBISelectMenuOmitted) {
    super(dbi, {
      ...(args as any),
      type: "SelectMenu",
    });
  }

  declare options: Omit<Discord.SelectMenuComponentData, "customId" | "type">;

  override onExecute(ctx: IDBISelectMenuExecuteCtx): Promise<any> | any { };

  toJSON(arg: IDBIToJSONArgs<Omit<Discord.SelectMenuComponentData, "customId" | "type">> = {} as any): Discord.SelectMenuComponentData {
    return {
      ...this.options,
      ...(arg?.override || {}),
      customId: customIdBuilder(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.tll)
    } as any;
  };
}
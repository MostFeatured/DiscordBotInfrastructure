import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { customIdBuilder } from "../utils/customId";
import { IDBIToJSONArgs } from "../utils/UtilTypes";

export interface IDBIButtonExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ButtonInteraction<"cached">;
  data: TDBIReferencedData[];
}

export type TDBIButtonOmitted = Omit<DBIButton, "type" | "description" | "dbi" | "toJSON">;

export class DBIButton extends DBIBaseInteraction {
  constructor(dbi: DBI, args: TDBIButtonOmitted) {
    super(dbi, {
      ...(args as any),
      type: "Button",
    });
  }

  declare options?: Omit<Discord.ButtonComponentData, "customId" | "type">;

  override onExecute(ctx: IDBIButtonExecuteCtx): Promise<any> | any { };
  toJSON(arg: IDBIToJSONArgs<Omit<Discord.ButtonComponentData, "customId" | "type">> = {} as any): Discord.ButtonComponentData {
    return {
      ...this.options,
      ...(arg?.override || {}),
      customId: customIdBuilder(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl)
    } as any;
  };
}
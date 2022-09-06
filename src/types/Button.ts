import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { customIdBuilder } from "../utils/customId";

export interface IDBIButtonExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ButtonInteraction<Discord.CacheType>;
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

  declare options: Omit<Discord.ButtonComponentData, "customId" | "type">;

  override onExecute(ctx: IDBIButtonExecuteCtx): Promise<any> | any { };

  toJSON(...customData: (string | number | object)[]): Discord.ButtonComponentData {
    return {
      ...this.options,
      customId: customIdBuilder(this.dbi, this.name, customData),
      type: Discord.ComponentType.Button
    } as any;
  };
}
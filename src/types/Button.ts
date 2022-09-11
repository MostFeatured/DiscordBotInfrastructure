import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { customIdBuilder } from "../utils/customId";

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
    this.referenceTTL = args.referenceTTL;
  }

  declare options?: Omit<Discord.ButtonComponentData, "customId" | "type"> | ((data: (number | string | any)[]) => Omit<Discord.ButtonComponentData, "customId" | "type">);

  override onExecute(ctx: IDBIButtonExecuteCtx): Promise<any> | any { };
  declare referenceTTL?: number
  toJSON(...customData: (string | number | object)[]): Discord.ButtonComponentData {
    return {
      ...(typeof this.options == "function" ? this.options(customData) : this.options),
      customId: customIdBuilder(this.dbi, this.name, customData, this.referenceTTL),
      type: Discord.ComponentType.Button
    } as any;
  };
}
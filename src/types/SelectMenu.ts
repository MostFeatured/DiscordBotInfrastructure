import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import { customIdBuilder } from "../utils/customId";

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
    this.referenceTTL = args.referenceTTL;
  }

  declare options: Omit<Discord.SelectMenuComponentData, "customId" | "type"> | ((data: (number | string | any)[]) => Omit<Discord.SelectMenuComponentData, "customId" | "type">);

  override onExecute(ctx: IDBISelectMenuExecuteCtx): Promise<any> | any { };

  declare referenceTTL?: number;

  toJSON(...customData: (string | number | object)[]): Discord.SelectMenuComponentData {
    return {
      ...(typeof this.options == "function" ? this.options(customData) : this.options),
      customId: customIdBuilder(this.dbi, this.name, customData, this.referenceTTL),
      type: Discord.ComponentType.SelectMenu
    } as any
  };
}
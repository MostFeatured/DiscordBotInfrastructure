import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
import { customIdBuilder } from "../utils/customId";

export interface IDBIModalExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ModalSubmitInteraction<"cached">;

  data: TDBIReferencedData[];
}

export type TDBIModalOmitted = Omit<DBIModal, "type" | "description" | "dbi" | "toJSON">;

export class DBIModal extends DBIBaseInteraction {
  constructor(dbi: DBI, args: TDBIModalOmitted) {
    super(dbi, {
      ...(args as any),
      type: "Modal"
    });
    this.referenceTTL = args.referenceTTL;
  }

  declare options: Omit<Discord.ModalComponentData, "customId"> | ((data: (number | string | any)[]) => Omit<Discord.ModalComponentData, "customId">);

  override onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any { };

  declare referenceTTL?: number;

  toJSON(...customData: (string | number | object)[]): Discord.ModalComponentData {
    return {
      ...(typeof this.options == "function" ? this.options(customData) : this.options),
      customId: customIdBuilder(this.dbi, this.name, customData, this.referenceTTL)
    } as any;
  };
}
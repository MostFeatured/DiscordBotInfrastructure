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
  constructor(dbi: DBI, cfg: TDBIModalOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "Modal"
    })
  }

  declare options: Omit<Discord.ModalComponentData, "customId">;

  override onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any { };

  toJSON(...customData: (string | number | object)[]): Discord.ModalComponentData {
    return {
      ...this.options,
      customId: customIdBuilder(this.dbi, this.name, customData)
    } as any;
  };
}
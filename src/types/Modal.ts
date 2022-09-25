import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
import { customIdBuilder } from "../utils/customId";
import { IDBIToJSONArgs } from "../utils/UtilTypes";

export interface IDBIModalExecuteCtx extends IDBIBaseExecuteCtx {
  interaction: Discord.ModalSubmitInteraction<"cached">;

  data: TDBIReferencedData[];
}

export interface ModalComponentData {
  title: string;
  components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}

export type TDBIModalOmitted = Omit<DBIModal, "type" | "description" | "dbi" | "toJSON">;

export class DBIModal extends DBIBaseInteraction {
  constructor(dbi: DBI, args: TDBIModalOmitted) {
    super(dbi, {
      ...(args as any),
      type: "Modal"
    });
  }

  declare options: ModalComponentData;

  override onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any { };

  toJSON(arg: IDBIToJSONArgs<ModalComponentData> = {} as any): Discord.ModalComponentData {
    return {
      ...this.options,
      ...(arg?.override || {}),
      customId: customIdBuilder(this.dbi, this.name, arg?.reference?.data || [], arg?.reference?.ttl)
    } as any;
  };
}
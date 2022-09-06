import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
export interface IDBIModalExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ModalSubmitInteraction<Discord.CacheType>;
    data: TDBIReferencedData[];
}
export declare type TDBIModalOmitted = Omit<DBIModal, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIModal extends DBIBaseInteraction {
    constructor(dbi: DBI, cfg: TDBIModalOmitted);
    options: Omit<Discord.ModalComponentData, "customId">;
    onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any;
    toJSON(...customData: (string | number | object)[]): Discord.ModalComponentData;
}
//# sourceMappingURL=Modal.d.ts.map
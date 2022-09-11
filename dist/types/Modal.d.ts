import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
export interface IDBIModalExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ModalSubmitInteraction<"cached">;
    data: TDBIReferencedData[];
}
export declare type TDBIModalOmitted = Omit<DBIModal, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIModal extends DBIBaseInteraction {
    constructor(dbi: DBI, args: TDBIModalOmitted);
    options: Omit<Discord.ModalComponentData, "customId"> | ((data: (number | string | any)[]) => Omit<Discord.ModalComponentData, "customId">);
    onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any;
    referenceTTL?: number;
    toJSON(...customData: (string | number | object)[]): Discord.ModalComponentData;
}
//# sourceMappingURL=Modal.d.ts.map
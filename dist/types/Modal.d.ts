import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx, TDBIReferencedData } from "./Interaction";
import Discord from "discord.js";
export interface IDBIModalExecuteCtx extends IDBIBaseExecuteCtx {
    interaction: Discord.ModalSubmitInteraction<"cached">;
    data: TDBIReferencedData[];
}
export interface ModalComponentData {
    title: string;
    components: (Discord.ActionRowData<Discord.ModalActionRowComponentData>)[];
}
export declare type TDBIModalOmitted = Omit<DBIModal, "type" | "description" | "dbi" | "toJSON">;
export declare class DBIModal extends DBIBaseInteraction {
    constructor(dbi: DBI, args: TDBIModalOmitted);
    options: ModalComponentData | ((data: TDBIReferencedData[]) => ModalComponentData);
    onExecute(ctx: IDBIModalExecuteCtx): Promise<any> | any;
    referenceTTL?: number;
    toJSON(...customData: (string | number | object)[]): Discord.ModalComponentData;
}
//# sourceMappingURL=Modal.d.ts.map
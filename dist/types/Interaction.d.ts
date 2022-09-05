import Discord from "discord.js";
import { DBI } from "../DBI";
import { DBILocale } from "./Locale";
export interface IDBIBaseExecuteCtx {
    interaction: Discord.ChatInputCommandInteraction | Discord.UserContextMenuCommandInteraction | Discord.MessageContextMenuCommandInteraction | Discord.ModalSubmitInteraction | Discord.AutocompleteInteraction | Discord.SelectMenuInteraction | Discord.ButtonInteraction;
    locale: {
        user: DBILocale;
        guild?: DBILocale;
    };
    dbi: DBI;
    setRateLimit(type: TDBIRateLimitTypes, duration: number): Promise<any>;
    other: Record<string, any>;
}
export declare type TDBIInteractionTypes = "ChatInput" | "UserContextMenu" | "MessageContextMenu" | "Modal" | "Autocomplete" | "SelectMenu" | "Button";
export declare type TDBIRateLimitTypes = "User" | "Channel" | "Guild" | "Member" | "Message";
export declare type DBIRateLimit = {
    type: TDBIRateLimitTypes;
    /**
     * Duration in milliseconds.
     */
    duration: number;
};
export declare class DBIBaseInteraction {
    constructor(dbi: DBI, cfg: Omit<DBIBaseInteraction, "dbi">);
    dbi: DBI;
    name: string;
    description: string;
    readonly type: TDBIInteractionTypes;
    options?: any | any[];
    other?: Record<string, any>;
    rateLimits?: DBIRateLimit[];
    onExecute(ctx: IDBIBaseExecuteCtx): Promise<any> | any;
}
//# sourceMappingURL=Interaction.d.ts.map
import Discord from "discord.js";
import { DBIChatInput } from "../types/ChatInput/ChatInput";
import { DBIInteractionLocale } from "../types/InteractionLocale";
export declare function publishInteractions(clientToken: string, interactions: Discord.Collection<string, DBIChatInput>, interactionsLocales: Discord.Collection<string, DBIInteractionLocale>, publishType: "Guild" | "Global", guildId?: string): Promise<void>;
export declare function localeifyOptions(options: any[], localeData: any): any[];
export declare function formatLocale(locale: DBIInteractionLocale): any;
//# sourceMappingURL=publishInteractions.d.ts.map
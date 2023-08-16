import Discord from "discord.js";
import { DBIChatInput } from "../types/ChatInput/ChatInput";
import { DBIClientData } from "../DBI";
import { DBIInteractionLocale } from "../types/other/InteractionLocale";
import { NamespaceEnums } from "../../generated/namespaceData";
export declare function publishInteractions(clients: DBIClientData<NamespaceEnums>[], interactions: Discord.Collection<string, DBIChatInput<NamespaceEnums>>, interactionsLocales: Discord.Collection<string, DBIInteractionLocale>, publishType: "Guild" | "Global", guildId?: string): Promise<void>;
export declare function localeifyOptions(options: any[], localeData: any): any[];
export declare function formatLocale(locale: DBIInteractionLocale): any;
//# sourceMappingURL=publishInteractions.d.ts.map
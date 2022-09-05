import Discord from "discord.js";
import { DBIChatInput } from "../types/ChatInput/ChatInput";
export declare function publishInteractions(clientToken: string, interactions: Discord.Collection<string, DBIChatInput>, publishType: "Guild" | "Global", guildId?: string): Promise<void>;
//# sourceMappingURL=publishInteractions.d.ts.map
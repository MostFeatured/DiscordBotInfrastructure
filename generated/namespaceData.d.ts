import { TDBIInteractions } from "../src/types/Interaction";
import { DBILangObject, TDBILocaleString } from "../src/types/Locale";
export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: TDBIInteractions<NamespaceEnums> };
    eventNames: string;
    localeNames: TDBILocaleString;
    customEvents: { momCreate: {mom: import("discord.js").GuildMember}}
  }
  
}

export type NamespaceEnums = keyof NamespaceData;
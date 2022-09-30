import { DBIChatInput } from "../src/types/ChatInput/ChatInput";
import { DBIEvent } from "../src/types/Event";
import { TDBIInteractions } from "../src/types/Interaction";
import { DBILangObject, TDBILocaleString } from "../src/types/Locale";
import { DBIModal } from "../src/types/Modal";
export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: TDBIInteractions };
    eventNames: string;
    localeNames: TDBILocaleString;
  }
  // "bum": {
  //   contentLocale: DBILangObject;
  //   interactionMapping: { "hello": DBIModal };
  //   eventNames: "zort" | "pırt";
  //   localeNames: "tr" | "en"
  // }
}

export type NamespaceEnums = keyof NamespaceData;
export type InteractionNames = string;
import { DBICustomEvent } from "../src/types/CustomEvent.js";
import { TDBIInteractions } from "../src/types/Interaction";
import { DBILangObject, TDBILocaleString } from "../src/types/Locale";
export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: TDBIInteractions<NamespaceEnums> };
    eventNames: string;
    localeNames: TDBILocaleString;
    customEvents: { [k: string]: DBICustomEvent<NamespaceEnums> }
  }
}

export type NamespaceEnums = keyof NamespaceData;
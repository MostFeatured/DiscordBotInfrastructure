import { DBICustomEvent } from "../src/types/other/CustomEvent.js";
import { TDBIInteractions } from "../src/types/Interaction";
import { DBILangObject, TDBILocaleString } from "../src/types/other/Locale.js";
export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: TDBIInteractions<NamespaceEnums> };
    eventNames: string;
    localeNames: TDBILocaleString;
    customEvents: { },
    clientNamespaces: string;
  }
}

export type NamespaceEnums = keyof NamespaceData;
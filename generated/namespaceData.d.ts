import { DBICustomEvent } from "../src/types/other/CustomEvent.js";
import { DBIBaseInteraction, TDBIInteractions } from "../src/types/Interaction";
import { DBILangObject, TDBILocaleString } from "../src/types/other/Locale.js";

// Users should augment this interface to add their namespaces
export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: DBIBaseInteraction<NamespaceEnums> };
    eventNames: string;
    localeNames: TDBILocaleString;
    customEvents: {};
    clientNamespaces: string;
  }
}

export type NamespaceEnums = keyof NamespaceData;
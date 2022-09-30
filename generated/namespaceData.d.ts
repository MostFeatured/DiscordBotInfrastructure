import { TDBIInteractions } from "../src/types/Interaction";
import { DBILangObject, TDBILocaleString } from "../src/types/Locale";
export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: TDBIInteractions };
    eventNames: string;
    localeNames: TDBILocaleString;
  }
}

export type NamespaceEnums = keyof NamespaceData;
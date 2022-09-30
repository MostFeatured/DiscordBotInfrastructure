import { DBILangObject } from "../src/types/Locale";

export interface NamespaceData {
  [k: string]: {
    contentLocale: DBILangObject
  }
}

export type NamespaceEnums = keyof NamespaceData;
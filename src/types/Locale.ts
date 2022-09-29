// @ts-ignore
import * as stuffs from "stuffs";
import { namespaceData } from "../../generated/namespaceData";
import { DBI } from "../DBI";

export interface DBILangObject {
  [property: string]: DBILangObject & ((...args: any[]) => string);
}

export interface DBILangConstructorObject {
  [property: string]: DBILangConstructorObject | string;
}

export type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";

export type TDBILocaleConstructor = Omit<DBILocale, "data" | "dbi"> & { data: DBILangConstructorObject };

export class DBILocale {
  name: TDBILocaleString;
  data: namespaceData[DBI["namespace"]]["contentLocale"];
  private _data;
  dbi: DBI;
  constructor(dbi: DBI, cfg: TDBILocaleConstructor) {
    this.dbi = dbi;
    this.name = cfg.name;
    this._data = cfg.data;
    this.data = convertLang(cfg.data as any) as any;
  }
}

export function convertLang(data: DBILangConstructorObject): DBILangObject {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (typeof value === "string") {
      return [key, (...args: any[]) => {
        return stuffs.mapReplace(value, Object.fromEntries(args.map((t, i) => [`{${i}}`, t])))
      }]
    } else {
      return [key, convertLang(value)];
    }
  }))
}

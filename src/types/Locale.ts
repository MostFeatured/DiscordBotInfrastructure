// @ts-ignore
import * as stuffs from "stuffs";
import { DBI } from "../DBI";

export interface LangObject {
  [property: string]: LangObject & ((...args: any[]) => string);
}

export interface LangConstructorObject {
  [property: string]: LangConstructorObject | string;
}

export type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";

export type TDBILocaleConstructor<TDataFormat> = Omit<DBILocale, "data" | "dbi"> & { data: TDataFormat };

export class DBILocale<TDataFormat = LangConstructorObject> {
  name: TDBILocaleString;
  data: LangObject;
  private _data: TDataFormat;
  dbi: DBI;
  constructor(dbi: DBI, cfg: TDBILocaleConstructor<TDataFormat>) {
    this.dbi = dbi;
    this.name = cfg.name;
    this._data = cfg.data;
    this.data = convertLang(cfg.data as any);
  }
}

export function convertLang(data: LangConstructorObject): LangObject {
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

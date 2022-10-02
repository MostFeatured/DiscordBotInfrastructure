import stuffs from "stuffs";
import { NamespaceData, NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";


export interface DBILangObject {
  [property: string]: DBILangObject & ((...args: any[]) => string);
}

export interface DBILangConstructorObject {
  [property: string]: DBILangConstructorObject | string;
}

export type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";

export type TDBILocaleConstructor<TNamespace extends NamespaceEnums> = Omit<DBILocale<TNamespace>, "data" | "dbi" | "mergeLocale"> & { data: DBILangConstructorObject };

export class DBILocale<TNamespace extends NamespaceEnums> {
  name: TDBILocaleString;
  data: NamespaceData[TNamespace]["contentLocale"];
  private _data: DBILangConstructorObject;
  dbi: DBI<TNamespace, {}>;
  constructor(dbi: DBI<TNamespace, {}>, cfg: TDBILocaleConstructor<TNamespace>) {
    this.dbi = dbi;
    this.name = cfg.name;
    this._data = cfg.data;
    this.data = convertLang<TNamespace>(cfg.data);
  }
  mergeLocale(locale: DBILocale<TNamespace>): DBILocale<TNamespace> {
    this._data = stuffs.defaultify(locale._data, this._data, true) as any;
    this.data = convertLang<TNamespace>(this._data);

    locale.data = this.data;
    locale._data = this._data;

    return this;
  }
}

export function convertLang<TNamespace extends NamespaceEnums>(data: DBILangConstructorObject): NamespaceData[TNamespace]["contentLocale"] {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (typeof value === "string") {
      return [key, (...args: any[]) => {
        return stuffs.mapReplace(value, args.map((t, i) => [new RegExp(`\\{${i}(;[^}]+)?\\}`, "g"), t]))
      }];
    } else {
      return [key, convertLang(value)];
    }
  }))
}

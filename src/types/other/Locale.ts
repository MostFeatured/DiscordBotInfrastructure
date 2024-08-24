import stuffs from "stuffs";
import { NamespaceData, NamespaceEnums } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";
import _ from "lodash";
import util from "util";

export interface DBILangObject {
  [property: string]: DBILangObject & ((...args: any[]) => string);
}

export interface DBILangConstructorObject {
  [property: string]: DBILangConstructorObject | string;
}

export type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";

export type TDBILocaleConstructor<TNamespace extends NamespaceEnums> = Omit<DBILocale<TNamespace>, "data" | "dbi" | "mergeLocale" | "_data" | "get" | "format"> & { data: DBILangConstructorObject };

export class DBILocale<TNamespace extends NamespaceEnums> {
  name: TDBILocaleString;
  data: NamespaceData[TNamespace]["contentLocale"];
  _data: DBILangConstructorObject;
  dbi: DBI<TNamespace, {}>;
  flag?: string
  constructor(dbi: DBI<TNamespace, {}>, cfg: TDBILocaleConstructor<TNamespace>) {
    this.dbi = dbi;
    this.name = cfg.name;
    this.flag = cfg.flag;
    this._data = cfg.data;
    this.data = createInfinitePathProxy((path, ...args) => {
      return this.format(path.join("."), ...args);
    });;
  }
  mergeLocale(locale: DBILocale<TNamespace>): DBILocale<TNamespace> {
    this._data = stuffs.defaultify(locale._data, this._data, true) as any;
    locale._data = this._data;

    return this;
  }
  get(path: string): string | null {
    return _.get(this._data as any, path) as string || null;
  }
  format(path: string, ...args: any[]): string {
    let value = this.get(path);
    if (!value) {
      const defaultLocale = this.dbi.locale(this.dbi.config.defaults.locale.name as any);
      if (!defaultLocale || defaultLocale.name === this.name) return this.dbi.config.defaults.locale.invalidPath({
        locale: this,
        path,
      });
      value = defaultLocale.get(path);
    }
    if (!value) return this.dbi.config.defaults.locale.invalidPath({
      locale: this,
      path,
    });
    return stuffs.mapReplace(value, args.map((t, i) => [new RegExp(`\\{${i}(;[^}]+)?\\}`, "g"), t]));
  }
}

export function createInfinitePathProxy(onApplyPath: (path: string[], ...args: any[]) => string, path: string[] = []): any {
  return new Proxy(() => { }, {
    get(target, key) {
      return createInfinitePathProxy(onApplyPath, [...path, key.toString()]);
    },
    apply(target, thisArg, args) {
      return onApplyPath(path, ...args);
    }
  });
}
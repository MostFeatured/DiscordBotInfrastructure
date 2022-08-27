import stuffs from "stuffs";

export interface LangObject {
  [property: string]: LangObject & ((...args: any[]) => string);
}

export interface LangConstructorObject {
  [property: string]: LangConstructorObject | string;
}

export type TDBILocaleConstructor = DBILocale & { data: LangConstructorObject };

export class DBILocale {
  locale: string;
  data: LangObject
  private _data: LangConstructorObject;
  constructor(cfg: TDBILocaleConstructor) {
    this.locale = cfg.locale;
    this._data = cfg.data;
    this.data = convert(cfg.data); // TODO: Convert to LangObj
  }
}

function convert(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (typeof value === "string") {
      return [key, (...args) => {
        return stuffs.mapReplace(value, Object.fromEntries(args.map((t, i) => [`{${i}}`, t])))
      }]
    } else {
      return [key, convert(value)];
    }
  }))
}

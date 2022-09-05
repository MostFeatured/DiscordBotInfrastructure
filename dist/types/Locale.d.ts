import { DBI } from "../DBI";
export interface LangObject {
    [property: string]: LangObject & ((...args: any[]) => string);
}
export interface LangConstructorObject {
    [property: string]: LangConstructorObject | string;
}
export declare type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";
export declare type TDBILocaleConstructor = Omit<DBILocale & {
    data: LangConstructorObject;
}, "dbi">;
export declare class DBILocale {
    name: TDBILocaleString;
    data: LangObject;
    private _data;
    dbi: DBI;
    constructor(dbi: DBI, cfg: TDBILocaleConstructor);
}
//# sourceMappingURL=Locale.d.ts.map
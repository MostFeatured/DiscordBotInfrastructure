import { DBI } from "../DBI";
export interface LangObject {
    [property: string]: LangObject & ((...args: any[]) => string);
}
export interface LangConstructorObject {
    [property: string]: LangConstructorObject | string;
}
export declare type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";
export declare type TDBILocaleConstructor<TDataFormat> = Omit<DBILocale, "data" | "dbi"> & {
    data: TDataFormat;
};
export declare class DBILocale<TDataFormat = LangConstructorObject> {
    name: TDBILocaleString;
    data: LangObject;
    private _data;
    dbi: DBI;
    constructor(dbi: DBI, cfg: TDBILocaleConstructor<TDataFormat>);
}
export declare function convertLang(data: LangConstructorObject): LangObject;
//# sourceMappingURL=Locale.d.ts.map
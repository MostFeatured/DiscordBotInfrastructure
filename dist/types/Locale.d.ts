import { NamespaceData, NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";
export interface DBILangObject {
    [property: string]: DBILangObject & ((...args: any[]) => string);
}
export interface DBILangConstructorObject {
    [property: string]: DBILangConstructorObject | string;
}
export declare type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";
export declare type TDBILocaleConstructor<TNamespace extends NamespaceEnums = NamespaceEnums> = Omit<DBILocale<TNamespace>, "data" | "dbi"> & {
    data: DBILangConstructorObject;
};
export declare class DBILocale<TNamespace extends NamespaceEnums = NamespaceEnums> {
    name: TDBILocaleString;
    data: NamespaceData[TNamespace]["contentLocale"];
    private _data;
    dbi: DBI;
    constructor(dbi: DBI, cfg: TDBILocaleConstructor);
}
export declare function convertLang<TNamespace extends NamespaceEnums = NamespaceEnums>(data: DBILangConstructorObject): NamespaceData[TNamespace]["contentLocale"];
//# sourceMappingURL=Locale.d.ts.map
import { NamespaceData, NamespaceEnums } from "../../generated/namespaceData";
import { DBI } from "../DBI";
export interface DBILangObject {
    [property: string]: DBILangObject & ((...args: any[]) => string);
}
export interface DBILangConstructorObject {
    [property: string]: DBILangConstructorObject | string;
}
export declare type TDBILocaleString = "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl" | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it" | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru" | "es" | "sv" | "th" | "tr" | "uk" | "vi";
export declare type TDBILocaleConstructor<TNamespace extends NamespaceEnums> = Omit<DBILocale<TNamespace>, "data" | "dbi" | "mergeLocale"> & {
    data: DBILangConstructorObject;
};
export declare class DBILocale<TNamespace extends NamespaceEnums> {
    name: TDBILocaleString;
    data: NamespaceData[TNamespace]["contentLocale"];
    private _data;
    dbi: DBI<TNamespace, {}>;
    constructor(dbi: DBI<TNamespace, {}>, cfg: TDBILocaleConstructor<TNamespace>);
    mergeLocale(locale: DBILocale<TNamespace>): DBILocale<TNamespace>;
}
export declare function convertLang<TNamespace extends NamespaceEnums>(data: DBILangConstructorObject): NamespaceData[TNamespace]["contentLocale"];
//# sourceMappingURL=Locale.d.ts.map
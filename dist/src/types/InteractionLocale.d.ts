import { DBI } from "../DBI";
import { TDBILocaleString } from "./Locale";
export declare type TDBIInteractionLocaleData = {
    [K in TDBILocaleString]?: {
        name: string;
        description: string;
        options?: {
            [k: string]: {
                name: string;
                description: string;
                choices?: {
                    [k: string]: string;
                };
            };
        };
    };
};
export declare type TDBIInteractionLocaleOmitted = Omit<DBIInteractionLocale, "dbi">;
export declare class DBIInteractionLocale {
    name: string;
    data: TDBIInteractionLocaleData;
    dbi: DBI;
    constructor(dbi: any, cfg: TDBIInteractionLocaleOmitted);
}
//# sourceMappingURL=InteractionLocale.d.ts.map
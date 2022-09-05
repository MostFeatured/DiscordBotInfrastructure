import { DBI } from "../DBI";
export declare function customIdBuilder(dbi: DBI, name: string, customData: any[]): string;
export declare function parseCustomId(dbi: DBI, customId: string): {
    name: string;
    data: any[];
};
//# sourceMappingURL=customId.d.ts.map
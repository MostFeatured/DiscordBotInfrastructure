export interface IDBIToJSONArgs<T> {
    reference?: {
        ttl?: number;
        data: (string | number | object)[];
    };
    overrides?: RecursivePartial<T>;
}
export declare type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
//# sourceMappingURL=UtilTypes.d.ts.map
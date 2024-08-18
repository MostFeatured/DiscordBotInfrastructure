export interface IDBIToJSONArgs<T> {
  reference?: {
    ttl?: number;
    data: (string | number | object | boolean | null | undefined)[];
  };
  overrides?: RecursivePartial<T>;
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
}
export interface IDBIToJSONArgs<T> {
  reference?: {
    ttl?: number;
    data: (string | number | object)[];
  };
  overrides: T;
}
export interface IDBIToJSONArgs<T> {
  reference?: {
    tll?: number;
    data: (string | number | object)[];
  };
  override: T;
}
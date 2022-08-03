import _ from "lodash";

export class MemoryStore {
  store: Record<string, any>;
  constructor() {
    this.store = {};
  }
  async get(key: string, defaultValue?: any): Promise<any> {
    let val = _.get(this.store, key);
    if (!val) {
      this.set(key, defaultValue);
      return defaultValue;
    }
    return val;
  }

  async set(key: string, value: any): Promise<any> {
    return this.store = _.set(this.store, key, value);
  }

  async del(key: string): Promise<boolean> {
    return _.unset(this.store, key);
  }

  async has(key: string): Promise<boolean> {
    return _.has(this.store, key);
  }
}
export declare class MemoryStore {
    store: Record<string, any>;
    constructor();
    get(key: string, defaultValue?: any): Promise<any>;
    set(key: string, value: any): Promise<any>;
    delete(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
}
//# sourceMappingURL=MemoryStore.d.ts.map
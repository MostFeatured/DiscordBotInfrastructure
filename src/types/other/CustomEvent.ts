import { NamespaceEnums, NamespaceData } from "../../../generated/namespaceData";
import { DBI } from "../../DBI";

export type TDBICustomEventOmitted<TNamespace extends NamespaceEnums, CEventName extends keyof NamespaceData[TNamespace]["customEvents"] = keyof NamespaceData[TNamespace]["customEvents"]> = Omit<DBICustomEvent<TNamespace, CEventName>, "type" | "dbi" | "toJSON" | "trigger">;
export class DBICustomEvent<TNamespace extends NamespaceEnums, CEventName extends keyof NamespaceData[TNamespace]["customEvents"] = keyof NamespaceData[TNamespace]["customEvents"]> {
  dbi: DBI<TNamespace>;
  name: CEventName;
  map: {[key: string]: string};
  type: string;
  trigger(args: NamespaceData[TNamespace]["customEvents"][CEventName]) {
    return this.dbi.data.clients.first().client.emit(this.name as string, { ...args, _DIRECT_: true});
  }
  constructor(dbi: DBI<TNamespace>, cfg: TDBICustomEventOmitted<TNamespace, CEventName>) {
    this.dbi = dbi;
    this.name = cfg.name;
    this.map = cfg.map;
    this.type = "CustomEvent";
  }
}
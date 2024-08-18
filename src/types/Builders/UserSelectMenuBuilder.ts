import { BaseSelectMenuComponentData, UserSelectMenuComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIUserSelectMenu } from "../Components/UserSelectMenu";
import { RecursivePartial } from "../../utils/UtilTypes";

export type DBIUserSelectMenuOverrides = RecursivePartial<Omit<UserSelectMenuComponentData, "customId" | "type">>

export class DBIUserSelectMenuBuilder<TNamespace extends NamespaceEnums> {
  component: DBIUserSelectMenu<TNamespace>
  overrides: DBIUserSelectMenuOverrides;
  reference: { data: (string | number | object | boolean | null | undefined)[], ttl?: number };
  constructor(arg: { component: DBIUserSelectMenu<TNamespace>, overrides?: DBIUserSelectMenuOverrides, reference?: { data: (string | number | object | boolean | null | undefined)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number): DBIUserSelectMenuBuilder<TNamespace> {
    this.reference.ttl = ttl;
    return this;
  }

  addTTL(ttl: number): DBIUserSelectMenuBuilder<TNamespace> {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object | boolean | null | undefined)[]): DBIUserSelectMenuBuilder<TNamespace> {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object | boolean | null | undefined)[]): DBIUserSelectMenuBuilder<TNamespace> {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBIUserSelectMenuOverrides): DBIUserSelectMenuBuilder<TNamespace> {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIUserSelectMenuOverrides): DBIUserSelectMenuBuilder<TNamespace> {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON(): BaseSelectMenuComponentData {
    return this.component.toJSON({ overrides: this.overrides as any, reference: this.reference });
  }

}
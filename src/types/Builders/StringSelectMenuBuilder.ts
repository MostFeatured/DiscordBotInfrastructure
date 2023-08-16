import { BaseSelectMenuComponentData, StringSelectMenuComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIStringSelectMenu } from "../Components/StringSelectMenu";

export type DBIStringSelectMenuOverrides =  Omit<StringSelectMenuComponentData, "customId" | "type">

export class DBIStringSelectMenuBuilder<TNamespace extends NamespaceEnums> {
  component: DBIStringSelectMenu<TNamespace>
  overrides: Partial<DBIStringSelectMenuOverrides>;
  reference: { data: (string | number | object)[], ttl?: number };
  constructor(arg: { component: DBIStringSelectMenu<TNamespace>, overrides?: DBIStringSelectMenuOverrides, reference?: { data: (string | number | object)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number): DBIStringSelectMenuBuilder<TNamespace> {
    this.reference.ttl = ttl;
    return this;
  }

  addTTL(ttl: number): DBIStringSelectMenuBuilder<TNamespace> {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object)[]): DBIStringSelectMenuBuilder<TNamespace> {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object)[]): DBIStringSelectMenuBuilder<TNamespace> {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBIStringSelectMenuOverrides): DBIStringSelectMenuBuilder<TNamespace> {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIStringSelectMenuOverrides): DBIStringSelectMenuBuilder<TNamespace> {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON(): BaseSelectMenuComponentData {
    return this.component.toJSON({ overrides: this.overrides as any, reference: this.reference });
  }

}
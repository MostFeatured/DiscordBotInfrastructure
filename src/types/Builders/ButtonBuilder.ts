import { ButtonComponentData, ButtonStyle } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIButton } from "../Components/Button";

export type DBIButtonOverrides = { style?: ButtonStyle } & Omit<ButtonComponentData, "customId" | "type" | "style">

export class DBIButtonBuilder<TNamespace extends NamespaceEnums> {
  component: DBIButton<TNamespace>
  overrides: DBIButtonOverrides;
  reference: { data: (string | number | object)[], ttl?: number };
  constructor(arg: { component: DBIButton<TNamespace>, overrides?: DBIButtonOverrides, reference?: { data: (string | number | object)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number): DBIButtonBuilder<TNamespace> {
    this.reference.ttl = ttl;
    return this;
  }

  addTTL(ttl: number): DBIButtonBuilder<TNamespace> {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object)[]): DBIButtonBuilder<TNamespace> {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object)[]): DBIButtonBuilder<TNamespace> {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBIButtonOverrides): DBIButtonBuilder<TNamespace> {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIButtonOverrides): DBIButtonBuilder<TNamespace> {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON(): ButtonComponentData {
    return this.component.toJSON({ overrides: this.overrides, reference: this.reference });
  }

}
import { BaseSelectMenuComponentData, MentionableSelectMenuComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIMentionableSelectMenu } from "../Components/MentionableSelectMenu";
import { RecursivePartial } from "../../utils/UtilTypes";

export type DBIMentionableSelectMenuOverrides = RecursivePartial<Omit<MentionableSelectMenuComponentData, "customId" | "type">>

export class DBIMentionableSelectMenuBuilder<TNamespace extends NamespaceEnums> {
  component: DBIMentionableSelectMenu<TNamespace>
  overrides: DBIMentionableSelectMenuOverrides;
  reference: { data: (string | number | object | boolean | null | undefined)[], ttl?: number };
  constructor(arg: { component: DBIMentionableSelectMenu<TNamespace>, overrides?: DBIMentionableSelectMenuOverrides, reference?: { data: (string | number | object | boolean | null | undefined)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number): DBIMentionableSelectMenuBuilder<TNamespace> {
    this.reference.ttl = ttl;
    return this;
  }

  addTTL(ttl: number): DBIMentionableSelectMenuBuilder<TNamespace> {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object | boolean | null | undefined)[]): DBIMentionableSelectMenuBuilder<TNamespace> {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object | boolean | null | undefined)[]): DBIMentionableSelectMenuBuilder<TNamespace> {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBIMentionableSelectMenuOverrides): DBIMentionableSelectMenuBuilder<TNamespace> {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIMentionableSelectMenuOverrides): DBIMentionableSelectMenuBuilder<TNamespace> {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON(): BaseSelectMenuComponentData {
    return this.component.toJSON({ overrides: this.overrides as any, reference: this.reference });
  }

}
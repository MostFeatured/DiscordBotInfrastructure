import { BaseSelectMenuComponentData, RoleSelectMenuComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIRoleSelectMenu } from "../Components/RoleSelectMenu";
import { RecursivePartial } from "../../utils/UtilTypes";

export type DBIRoleSelectMenuOverrides =  RecursivePartial<Omit<RoleSelectMenuComponentData, "customId" | "type">>

export class DBIRoleSelectMenuBuilder<TNamespace extends NamespaceEnums> {
  component: DBIRoleSelectMenu<TNamespace>
  overrides: Partial<DBIRoleSelectMenuOverrides>;
  reference: { data: (string | number | object)[], ttl?: number };
  constructor(arg: { component: DBIRoleSelectMenu<TNamespace>, overrides?: DBIRoleSelectMenuOverrides, reference?: { data: (string | number | object)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number): DBIRoleSelectMenuBuilder<TNamespace> {
    this.reference.ttl = ttl;
    return this;
  }

  addTTL(ttl: number): DBIRoleSelectMenuBuilder<TNamespace> {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object)[]): DBIRoleSelectMenuBuilder<TNamespace> {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object)[]): DBIRoleSelectMenuBuilder<TNamespace> {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBIRoleSelectMenuOverrides): DBIRoleSelectMenuBuilder<TNamespace> {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIRoleSelectMenuOverrides): DBIRoleSelectMenuBuilder<TNamespace> {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON(): BaseSelectMenuComponentData {
    return this.component.toJSON({ overrides: this.overrides as any, reference: this.reference });
  }

}
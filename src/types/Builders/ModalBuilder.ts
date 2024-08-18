import { ActionRowData, APIActionRowComponent, APITextInputComponent, JSONEncodable, ModalActionRowComponentData, ModalComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../../generated/namespaceData";
import { DBIModal } from "../Components/Modal";
import { RecursivePartial } from "../../utils/UtilTypes";

export type DBIModalOverrides = RecursivePartial<{ components?: (JSONEncodable<APIActionRowComponent<APITextInputComponent>> | ActionRowData<ModalActionRowComponentData>)[], title?: string } & Omit<ModalComponentData, "customId" | "type" | "title" | "components">>

export class DBIModalBuilder<TNamespace extends NamespaceEnums> {
  component: DBIModal<TNamespace>
  overrides: DBIModalOverrides;
  reference: { data: (string | number | object | boolean | null | undefined)[], ttl?: number };
  constructor(arg: { component: DBIModal<TNamespace>, overrides?: DBIModalOverrides, reference?: { data: (string | number | object | boolean | null | undefined)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number): DBIModalBuilder<TNamespace> {
    this.reference.ttl = ttl;
    return this;
  }

  addTTL(ttl: number): DBIModalBuilder<TNamespace> {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object | boolean | null | undefined)[]): DBIModalBuilder<TNamespace> {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object | boolean | null | undefined)[]): DBIModalBuilder<TNamespace> {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBIModalOverrides): DBIModalBuilder<TNamespace> {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIModalOverrides): DBIModalBuilder<TNamespace> {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON(): ModalComponentData {
    return this.component.toJSON({ overrides: this.overrides, reference: this.reference });
  }

}
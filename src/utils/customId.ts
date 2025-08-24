import { DBI } from "../DBI";
import * as stuffs from "stuffs";
import { NamespaceEnums } from "../../generated/namespaceData";

export function buildCustomId(dbi: DBI<NamespaceEnums>, name: string, data: any[], ttl?: number, v2 = false): string {
  let customId = [
    `${v2 ? 'v2:' : ''}${name}`,
    ...data.map(value => {
      if (typeof value == "string") return value;
      if (typeof value == "number") return `π${value}`;
      if (typeof value == "bigint") return `ᙖ${value.toString()}`;
      if (typeof value == "boolean") return `𝞫${value ? 1 : 0}`;
      if (typeof value == "undefined") return "🗶u";
      if (value === null) return "🗶n";
      if (value?.$ref) return `¤${value.$ref}`;
      let id = stuffs.randomString(8);
      Object.assign(value, {
        $ref: id,
        $unRef() { return dbi.data.refs.delete(id); },
      });
      dbi.data.refs.set(id, { at: Date.now(), value, ttl });
      return `¤${id}`;
    })
  ].join("—");
  if (!dbi.config.strict) customId = customId.slice(0, 100);
  if (customId.length > 100) throw new Error("Custom id cannot be longer than 100 characters.")
  return customId;
}

export function parseCustomId(dbi: DBI<NamespaceEnums>, customId: string): { name: string, data: any[], v2: boolean } {
  let splitted = customId.split("—");
  let name = splitted.shift();
  let v2 = name.startsWith("v2:");
  if (v2) name = name.slice(3);
  let data = splitted.map(value => {
    if (value.startsWith("π")) return Number(value.slice(1));
    if (value.startsWith("𝞫")) return !!Number(value.slice(1));
    if (value.startsWith("ᙖ")) return BigInt(value.slice(1));
    if (value.startsWith("¤")) return dbi.data.refs.get(value.slice(1))?.value;
    if (value == "🗶u") return undefined;
    if (value == "🗶n") return null;
    return value;
  });
  return {
    v2,
    name,
    data
  }
}
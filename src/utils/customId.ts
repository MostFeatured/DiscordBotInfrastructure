import { DBI } from "../DBI";
import * as stuffs from "stuffs";

export function customIdBuilder(dbi: DBI, name: string, customData: any[], ttl?:number): string {
  let customId = [
    name,
    ...customData.map(value => {
      if (typeof value == "string") return value;
      if (typeof value == "number") return `π${value}`;
      let id = stuffs.randomString(8);
      Object.assign(value, {
        $ref: id,
        $unRef() { return dbi.data.refs.delete(id); },
      })
      dbi.data.refs.set(id, { at: Date.now(), value, ttl });
      return `¤${id}`;
    })
  ].join("—");
  if (customId.length > 100) throw new Error("Custom id cannot be longer than 100 characters.")
  return customId;
}

export function parseCustomId(dbi: DBI, customId: string): {name: string, data: any[]} {
  let splitted = customId.split("—");
  let name = splitted.shift();
  let data = splitted.map(value => {
    if (value.startsWith("π")) return Number(value.slice(1));
    if (value.startsWith("¤")) return dbi.data.refs.get(value.slice(1))?.value;
    return value;
  });
  return {
    name,
    data
  }
}
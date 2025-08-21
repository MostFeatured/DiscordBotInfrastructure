import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { parseHTMLComponentsV2 } from "./parser";
import fs from "fs";


export type TDBIHTMLComponentsV2Omitted<TNamespace extends NamespaceEnums> = Omit<DBIHTMLComponentsV2<TNamespace>, "type" | "dbi" | "toJSON">;

export type TDBIHTMLComponentsV2ToJSONArgs = {
  data?: Record<string, any>;
}

export class DBIHTMLComponentsV2<TNamespace extends NamespaceEnums> {
  type = "HTMLComponentsV2";
  template?: string;
  file?: string;
  name: string;

  constructor(public dbi: DBI<TNamespace>, args: TDBIHTMLComponentsV2Omitted<TNamespace>) {
    this.template = args.template || fs.readFileSync(args.file || "", "utf-8");
    this.name = args.name;
  }

  toJSON(arg: TDBIHTMLComponentsV2ToJSONArgs = {}): any {
    return parseHTMLComponentsV2(
      this.dbi as any,
      this.template,
      this.name,
      { data: arg.data }
    )
  }
}
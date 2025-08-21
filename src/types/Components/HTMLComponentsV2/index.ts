import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { DBIBaseInteraction, DBIRateLimit, IDBIBaseExecuteCtx, TDBIReferencedData } from "../../Interaction";
import { parseHTMLComponentsV2 } from "./parser";
import fs from "fs";

export type TDBIHTMLComponentsV2Omitted<TNamespace extends NamespaceEnums> = Omit<DBIHTMLComponentsV2<TNamespace>, "type" | "dbi" | "toJSON" | "description">;

export type TDBIHTMLComponentsV2ToJSONArgs = {
  data?: Record<string, any>;
}

export interface IDBIHTMLComponentsV2ExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  data: TDBIReferencedData[];
}

export class DBIHTMLComponentsV2<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  template?: string;
  file?: string;

  constructor(dbi: DBI<TNamespace>, args: TDBIHTMLComponentsV2Omitted<TNamespace>) {
    super(dbi, {
      ...(args as any),
      type: "HTMLComponentsV2",
    });
    this.template = args.template || fs.readFileSync(args.file || "", "utf-8");
    this.name = args.name;
    this.handlers = args.handlers || [];
  }

  override toJSON(arg: TDBIHTMLComponentsV2ToJSONArgs = {}): any {
    return parseHTMLComponentsV2(
      this.dbi as any,
      this.template,
      this.name,
      { data: arg.data }
    )
  }

  override onExecute?(ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>) { };

  handlers?: any[] = [];
}
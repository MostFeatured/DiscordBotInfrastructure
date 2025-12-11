import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { DBIBaseInteraction, DBIRateLimit, IDBIBaseExecuteCtx, TDBIReferencedData } from "../../Interaction";
import { parseHTMLComponentsV2 } from "./parser";
import { renderSvelteComponent, renderSvelteComponentFromFile, SvelteRenderResult } from "./svelteRenderer";
import { parseSvelteComponent, createHandlerContext } from "./svelteParser";
import fs from "fs";

export type TDBIHTMLComponentsV2Omitted<TNamespace extends NamespaceEnums> = Omit<DBIHTMLComponentsV2<TNamespace>, "type" | "dbi" | "toJSON" | "description"> & {
  /**
   * Use 'svelte' for Svelte 5 components, 'eta' for Eta templates (default)
   */
  mode?: 'svelte' | 'eta';
  /**
   * Callback executed when the component interaction is triggered
   */
  onExecute?: (ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>) => void;
};

export type TDBIHTMLComponentsV2ToJSONArgs = {
  data?: Record<string, any>;
}

export interface IDBIHTMLComponentsV2ExecuteCtx<TNamespace extends NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  data: TDBIReferencedData[];
}

export class DBIHTMLComponentsV2<TNamespace extends NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  template?: string;
  file?: string;
  mode: 'svelte' | 'eta' = 'eta';
  private svelteComponentInfo: any = null;
  private _userOnExecute?: (ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>) => void;

  constructor(dbi: DBI<TNamespace>, args: TDBIHTMLComponentsV2Omitted<TNamespace>) {
    // Store user's onExecute callback before passing to super
    const userOnExecute = (args as any).onExecute;

    // Remove onExecute from args so it doesn't override the class method
    const argsWithoutOnExecute = { ...args };
    delete (argsWithoutOnExecute as any).onExecute;

    super(dbi, {
      ...(argsWithoutOnExecute as any),
      type: "HTMLComponentsV2",
    });
    this.template = args.template || (args.file ? fs.readFileSync(args.file, "utf-8") : undefined);
    this.file = args.file;
    this.name = args.name;
    this.handlers = args.handlers || [];
    this.mode = args.mode || 'eta';

    // Store user's onExecute callback if provided
    if (userOnExecute) {
      this._userOnExecute = userOnExecute;
    }

    // Pre-extract Svelte handlers at registration time
    if (this.mode === 'svelte' && this.template) {
      this.svelteComponentInfo = parseSvelteComponent(this.template);

      // Debug log
      console.log(`[Svelte] Component "${this.name}" registered with handlers:`,
        Array.from(this.svelteComponentInfo.handlers.entries())
      );
    }

    // Re-assign onExecute method after super() call because parent class sets it to undefined
    this.onExecute = this._handleExecute.bind(this);
  }

  private _handleExecute(ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>) {
    console.log("[Svelte] onExecute called with data:", ctx.data);

    // Call user's onExecute callback first if provided
    if (this._userOnExecute) {
      this._userOnExecute(ctx);
    }

    // If using Svelte mode, find and execute the handler
    if (this.mode === 'svelte' && this.svelteComponentInfo) {
      const [elementName, ...handlerData] = ctx.data;
      console.log("[Svelte] Element name:", elementName, "Handler data:", handlerData);

      if (typeof elementName === 'string') {
        // Find the handler info for this element
        const handlerInfo = this.svelteComponentInfo.handlers.get(elementName);
        console.log("[Svelte] Handler info:", handlerInfo);

        if (handlerInfo) {
          // Extract current state from handlerData (refs that were passed)
          // The second element in data array contains the current state
          const currentState = handlerData[0] || {};
          console.log("[Svelte] Current state:", currentState);

          // Create a NEW handler context for each execution with the current state
          // This ensures each interaction has its own isolated state
          // Pass 'this' so handlers can access component methods like toJSON()
          const handlerFunctions = createHandlerContext(
            this.svelteComponentInfo.scriptContent,
            typeof currentState === 'object' ? currentState : {},
            this
          );

          const handlerFn = handlerFunctions[handlerInfo.handlerName];
          console.log("[Svelte] Handler function:", handlerFn ? "found" : "not found", handlerInfo.handlerName);

          if (handlerFn && typeof handlerFn === 'function') {
            try {
              // Bind 'this' to the DBIHTMLComponentsV2 instance so handlers can use this.toJSON()
              handlerFn.call(this, ctx.interaction, ...handlerData.slice(1));
            } catch (error) {
              console.error(`Error executing Svelte handler '${handlerInfo.handlerName}':`, error);
            }
          } else {
            console.warn(`Handler function '${handlerInfo.handlerName}' not found for element '${elementName}'`);
          }
        } else {
          console.warn(`No handler info found for element '${elementName}'`);
        }
      }
    }
  }

  override toJSON(arg: TDBIHTMLComponentsV2ToJSONArgs = {}): any {
    if (this.mode === 'svelte' && this.template) {
      // Render Svelte component
      const result = renderSvelteComponent(
        this.dbi as any,
        this.template,
        this.name,
        {
          data: arg.data,
          ttl: this.ttl
        }
      );

      return result.components;
    } else {
      // Use Eta template parsing (default)
      return parseHTMLComponentsV2(
        this.dbi as any,
        this.template!,
        this.name,
        {
          data: arg.data,
          ttl: this.ttl
        }
      );
    }
  }

  handlers?: any[] = [];
}
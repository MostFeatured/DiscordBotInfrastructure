import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { DBIBaseInteraction, DBIRateLimit, IDBIBaseExecuteCtx, TDBIReferencedData } from "../../Interaction";
import { parseHTMLComponentsV2 } from "./parser";
import { renderSvelteComponent, renderSvelteComponentFromFile, SvelteRenderResult } from "./svelteRenderer";
import { parseSvelteComponent, createHandlerContext, HandlerContextResult } from "./svelteParser";
import fs from "fs";

export type TDBIHTMLComponentsV2Omitted<TNamespace extends NamespaceEnums> = Omit<DBIHTMLComponentsV2<TNamespace>, "type" | "dbi" | "toJSON" | "description" | "send" | "destroy" | "destroyAll"> & {
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

export interface TDBIHTMLComponentsV2SendOptions {
  data?: Record<string, any>;
  flags?: string[];
  content?: string;
  ephemeral?: boolean;
  /** If true, uses interaction.reply(). If false or unset, auto-detects based on target type */
  reply?: boolean;
  /** If true, uses interaction.followUp() instead of reply() */
  followUp?: boolean;
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

  // Store handler contexts per ref for lifecycle management
  // Key: ref id, Value: handlerContext with lifecycle hooks
  private _activeContexts: Map<string, any> = new Map();

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
          const currentState = handlerData[0] || {} as Record<string, any>;
          console.log("[Svelte] Current state:", currentState);

          // Get ref id for lifecycle tracking (if available)
          const refId = (currentState as any)?.$ref || null;

          // Check if this is first execution for this ref
          const isFirstExecution = refId && !this._activeContexts.has(refId);

          // Get existing context if any (to preserve lifecycle callbacks like intervals)
          const existingContext = refId ? this._activeContexts.get(refId) : null;

          // Create a NEW handler context for each execution with the current state
          // This ensures each interaction has its own isolated state
          // Pass 'this' so handlers can access component methods like toJSON()
          // Pass ctx so handlers can access ctx.interaction, ctx.data, ctx.locale, etc.
          const handlerContext = createHandlerContext(
            this.svelteComponentInfo.scriptContent,
            typeof currentState === 'object' ? currentState : {},
            this,
            ctx
          );

          const handlerFn = handlerContext.handlers[handlerInfo.handlerName];
          console.log("[Svelte] Handler function:", handlerFn ? "found" : "not found", handlerInfo.handlerName);

          if (handlerFn && typeof handlerFn === 'function') {
            try {
              // Store context for lifecycle management
              if (refId) {
                // If there's an existing context, transfer its destroy callbacks to the new context
                // This preserves intervals/timers created in onMount
                if (existingContext && existingContext.destroyCallbacks) {
                  // Merge existing destroy callbacks (don't run them!)
                  handlerContext.destroyCallbacks.push(...existingContext.destroyCallbacks);
                }

                this._activeContexts.set(refId, handlerContext);

                // Wrap $unRef to call onDestroy when ref is deleted (only wrap once)
                const stateObj = currentState as any;
                if (stateObj.$unRef && !stateObj.__unRefWrapped__) {
                  const originalUnRef = stateObj.$unRef.bind(stateObj);
                  stateObj.$unRef = () => {
                    // Run destroy callbacks before unref
                    const ctx = this._activeContexts.get(refId);
                    if (ctx && ctx.runDestroy) {
                      ctx.runDestroy();
                    }
                    this._activeContexts.delete(refId);
                    return originalUnRef();
                  };
                  stateObj.__unRefWrapped__ = true;
                }
              }

              // Run onMount callbacks only on first execution
              if (isFirstExecution && handlerContext.runMount) {
                handlerContext.runMount();
              }

              // Mark that we're inside handler execution (prevents auto-render during handler)
              handlerContext.setInHandler(true);

              try {
                // Bind 'this' to the DBIHTMLComponentsV2 instance so handlers can use this.toJSON()
                // Pass wrappedCtx so handlers use the proxy-wrapped ctx that tracks interaction calls
                // This ensures __asyncInteractionCalled__ flag is set when handler calls ctx.interaction.reply() etc.
                handlerFn.call(this, handlerContext.wrappedCtx, ...handlerData.slice(1));
              } finally {
                // Always reset handler execution flag
                handlerContext.setInHandler(false);
              }

              // Run effects after handler execution (state may have changed)
              handlerContext.runEffects();

              // If there are pending data changes and no interaction method was called,
              // flush the render now (synchronously uses interaction.update)
              if (handlerContext.hasPendingRender()) {
                handlerContext.flushRender();
              }
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

  /**
   * Send the component to an interaction or channel and initialize lifecycle hooks (onMount)
   * This is the recommended way to send Svelte components with intervals/timers
   * 
   * @param target - Discord interaction or channel to send to
   * @param options - Send options including data, flags, content
   * 
   * @example
   * ```ts
   * const showcase = dbi.interaction("product-showcase");
   * 
   * // Send as interaction reply
   * await showcase.send(interaction, { data: { count: 0 } });
   * 
   * // Send to a channel directly
   * await showcase.send(channel, { data: { count: 0 } });
   * 
   * // Send as followUp (if already replied)
   * await showcase.send(interaction, { data: { count: 0 }, followUp: true });
   * ```
   */
  async send(target: any, options: TDBIHTMLComponentsV2SendOptions = {}): Promise<any> {
    const { data = {}, flags = ["IsComponentsV2"], content, ephemeral, reply, followUp } = options;

    // Render components
    const components = this.toJSON({ data });

    // Build message options
    const messageOptions: any = { components, flags };
    if (content) messageOptions.content = content;
    if (ephemeral) messageOptions.flags = [...flags, "Ephemeral"];

    // Detect target type and send accordingly
    let message: any;
    const isInteraction = target.reply && target.user; // Interactions have both reply method and user property
    const isChannel = target.send && !target.user; // Channels have send but no user

    if (isInteraction) {
      if (followUp) {
        message = await target.followUp(messageOptions);
      } else {
        message = await target.reply(messageOptions);
      }
    } else if (isChannel) {
      message = await target.send(messageOptions);
    } else {
      throw new Error("Invalid target: must be an interaction or channel");
    }

    // If Svelte mode, create initial handler context and run onMount
    if (this.mode === 'svelte' && this.svelteComponentInfo && data.$ref) {
      const refId = data.$ref;

      // Create handler context with a fake ctx that has the message
      const fakeCtx = {
        interaction: {
          replied: true,
          deferred: false,
          message: message,
        }
      };

      const handlerContext = createHandlerContext(
        this.svelteComponentInfo.scriptContent,
        data,
        this,
        fakeCtx
      );

      // Store the context for lifecycle management
      this._activeContexts.set(refId, handlerContext);

      // Wrap $unRef to call onDestroy when ref is deleted
      if (data.$unRef) {
        const originalUnRef = data.$unRef.bind(data);
        data.$unRef = () => {
          if (handlerContext.runDestroy) {
            handlerContext.runDestroy();
          }
          this._activeContexts.delete(refId);
          return originalUnRef();
        };
      }

      // Run onMount callbacks
      handlerContext.runMount();

      // Run initial effects
      handlerContext.runEffects();
    }

    return message;
  }

  /**
   * Destroy a component instance by ref ID or data object
   * This runs onDestroy callbacks (clears intervals/timers) and removes the ref
   * 
   * @param refOrData - Either a ref ID string or the data object with $ref
   * @returns true if destroyed, false if not found
   * 
   * @example
   * ```ts
   * // Destroy by data object
   * showcase.destroy(data);
   * 
   * // Destroy by ref ID
   * showcase.destroy(data.$ref);
   * 
   * // Destroy all active instances of this component
   * showcase.destroyAll();
   * ```
   */
  destroy(refOrData: string | Record<string, any>): boolean {
    const refId = typeof refOrData === 'string' ? refOrData : refOrData?.$ref;

    if (!refId) {
      console.warn("[Svelte] Cannot destroy: no ref ID provided");
      return false;
    }

    const context = this._activeContexts.get(refId);
    if (context) {
      // Run destroy callbacks (clears intervals, timers, etc.)
      if (context.runDestroy) {
        context.runDestroy();
      }
      this._activeContexts.delete(refId);
    }

    // Also delete from DBI refs store
    this.dbi.data.refs.delete(refId);

    return true;
  }

  /**
   * Destroy all active instances of this component
   * Useful for cleanup when the bot shuts down or component is unloaded
   * 
   * @returns Number of instances destroyed
   */
  destroyAll(): number {
    let count = 0;
    for (const [refId, context] of this._activeContexts) {
      if (context.runDestroy) {
        context.runDestroy();
      }
      this.dbi.data.refs.delete(refId);
      count++;
    }
    this._activeContexts.clear();
    return count;
  }

  handlers?: any[] = [];
}
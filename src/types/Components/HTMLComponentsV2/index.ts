import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { DBIBaseInteraction, DBIRateLimit, IDBIBaseExecuteCtx, TDBIReferencedData } from "../../Interaction";
import { parseHTMLComponentsV2 } from "./parser";
import { renderSvelteComponent, renderSvelteComponentFromFile, SvelteRenderResult } from "./svelteRenderer";
import { parseSvelteComponent, createHandlerContext, HandlerContextResult } from "./svelteParser";
import { createEnhancedError, isComponentValidationError, parseDiscordComponentError, ComponentErrorInfo, ParsedDiscordError } from "./errorParser";
import fs from "fs";

// Re-export error parser utilities for external use
export { createEnhancedError, isComponentValidationError, parseDiscordComponentError, ComponentErrorInfo, ParsedDiscordError } from "./errorParser";

/**
 * Parse Discord API error and provide helpful context about which HTML element caused the error
 * Uses the enhanced error parser for detailed, developer-friendly messages
 */
function parseDiscordAPIError(error: any, source?: string, componentName?: string, components?: any[]): Error {
  // Use the new enhanced error parser
  if (isComponentValidationError(error)) {
    return createEnhancedError(error, components, source, componentName);
  }
  return error;
}

export type TDBIHTMLComponentsV2Omitted<TNamespace extends NamespaceEnums> = Omit<DBIHTMLComponentsV2<TNamespace>, "type" | "dbi" | "toJSON" | "description" | "send" | "destroy" | "destroyAll" | "__lastRenderModals__" | "_pendingModals" | "_initPromise"> & {
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

/**
 * Result object returned by send() method
 * Includes the Discord message and a render() method for manual re-rendering
 */
export interface TDBIHTMLComponentsV2SendResult {
  /** The Discord message object returned from send/reply/followUp */
  message: any;
  /** The data object with reactive state (includes $ref) */
  data: Record<string, any>;
  /** Manually trigger a re-render of the component */
  render: () => Promise<void>;
  /** Destroy this component instance (clears intervals, timers, removes ref) */
  destroy: () => boolean;
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
  /** The directory of the source file (used for resolving relative imports) */
  private _sourceDir?: string;

  // Store handler contexts per ref for lifecycle management
  // Key: ref id, Value: handlerContext with lifecycle hooks
  private _activeContexts: Map<string, any> = new Map();

  // Store pending modal promises for await showModal() support
  // Key: modal customId, Value: { resolve, reject } functions
  _pendingModals: Map<string, { resolve: (result: any) => void; reject: (error: any) => void }> = new Map();

  // Track initialization promise
  private _initPromise: Promise<void> | null = null;

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

    // Store source directory for resolving relative imports in Svelte components
    if (this.file) {
      const path = require("path");
      this._sourceDir = path.dirname(path.resolve(this.file));
    }

    // Store user's onExecute callback if provided
    if (userOnExecute) {
      this._userOnExecute = userOnExecute;
    }

    // Pre-extract Svelte handlers at registration time (lazy loaded)
    if (this.mode === 'svelte' && this.template) {
      // Store the promise so we can await it in _handleExecute
      this._initPromise = this._initSvelteComponent();
    }

    // Re-assign onExecute method after super() call because parent class sets it to undefined
    this.onExecute = this._handleExecute.bind(this);
  }

  private async _initSvelteComponent() {
    if (this.template && !this.svelteComponentInfo) {
      this.svelteComponentInfo = await parseSvelteComponent(this.template);
    }
  }

  private async _handleExecute(ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>) {
    // Wait for Svelte component initialization if not yet completed
    if (this._initPromise) {
      await this._initPromise;
    }

    // Call user's onExecute callback first if provided
    if (this._userOnExecute) {
      this._userOnExecute(ctx);
    }

    // If using Svelte mode, find and execute the handler
    if (this.mode === 'svelte' && this.svelteComponentInfo) {
      const [elementName, ...handlerData] = ctx.data;

      if (typeof elementName === 'string') {
        // Check if this is a modal submit (elementName is the modal id)
        const modalHandlerInfo = this.svelteComponentInfo.modalHandlers.get(elementName);

        if (modalHandlerInfo) {
          // This is a modal submit - execute the onsubmit handler (or just resolve promise if no handler)
          this._executeModalSubmit(ctx, elementName, modalHandlerInfo.onsubmitHandler, handlerData);
          return;
        }

        // Find the handler info for this element (button, select, etc.)
        let handlerInfo = this.svelteComponentInfo.handlers.get(elementName);

        // If not found by exact match, try prefix matching for dynamic names (from {#each})
        if (!handlerInfo) {
          for (const [key, info] of this.svelteComponentInfo.handlers) {
            if (info.isDynamicName && elementName.startsWith(key + '_')) {
              handlerInfo = info;
              break;
            }
          }
        }

        if (handlerInfo) {
          this._executeElementHandler(ctx, handlerInfo, handlerData);
        }
      }
    }
  }

  /**
   * Execute a modal submit handler
   */
  private _executeModalSubmit(
    ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>,
    modalId: string,
    handlerName: string | undefined,
    handlerData: any[]
  ) {
    // Extract current state from handlerData (refs that were passed)
    const currentState = handlerData[0] || {} as Record<string, any>;

    // Get ref id for lifecycle tracking (if available)
    const refId = (currentState as any)?.$ref || null;

    // Extract all field values from modal interaction (text inputs, selects, file uploads, etc.)
    const modalInteraction = ctx.interaction as any;
    const fields = this._extractModalFields(modalInteraction);

    // Check if there's a pending promise for this modal (from await showModal())
    // Use the modal's customId to find the pending promise
    const pendingKey = modalInteraction.customId;
    const pendingModal = this._pendingModals.get(pendingKey);

    if (pendingModal) {
      // Resolve the promise with fields and interaction
      pendingModal.resolve({
        fields,
        interaction: modalInteraction,
        ctx: ctx
      });
      this._pendingModals.delete(pendingKey);
    }

    // If no onsubmit handler defined, just return (promise-based usage)
    if (!handlerName) {
      return;
    }

    // Create handler context for modal submit
    const handlerContext = createHandlerContext(
      this.svelteComponentInfo!.scriptContent,
      typeof currentState === 'object' ? currentState : {},
      this,
      ctx,
      this._sourceDir,
      this.svelteComponentInfo!.inlineHandlers
    );

    const handlerFn = handlerContext.handlers[handlerName];

    if (handlerFn && typeof handlerFn === 'function') {
      try {
        // Store context for lifecycle management
        if (refId) {
          const existingContext = this._activeContexts.get(refId);
          if (existingContext && existingContext.destroyCallbacks) {
            handlerContext.destroyCallbacks.push(...existingContext.destroyCallbacks);
          }
          this._activeContexts.set(refId, handlerContext);
        }

        handlerContext.setInHandler(true);

        try {
          // Call handler with ctx and fields object
          handlerFn.call(this, handlerContext.wrappedCtx, fields, ...handlerData.slice(1));
        } finally {
          handlerContext.setInHandler(false);
        }

        handlerContext.runEffects();

        if (handlerContext.hasPendingRender()) {
          handlerContext.flushRender();
        }
      } catch (error) {
        // Re-throw the error so it's visible to the developer
        console.error(`[DBI-Svelte] Modal handler "${handlerName}" failed:`, error);
        throw error;
      }
    }
  }

  /**
   * Execute an element handler (button, select, etc.)
   */
  private _executeElementHandler(
    ctx: IDBIHTMLComponentsV2ExecuteCtx<TNamespace>,
    handlerInfo: any,
    handlerData: any[]
  ) {
    // Extract current state from handlerData (refs that were passed)
    // The second element in data array contains the current state
    const currentState = handlerData[0] || {} as Record<string, any>;

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
      this.svelteComponentInfo!.scriptContent,
      typeof currentState === 'object' ? currentState : {},
      this,
      ctx,
      this._sourceDir,
      this.svelteComponentInfo!.inlineHandlers
    );

    const handlerFn = handlerContext.handlers[handlerInfo.handlerName];

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
        // Re-throw the error so it's visible to the developer
        console.error(`[DBI-Svelte] Handler "${handlerInfo.handlerName}" failed:`, error);
        throw error;
      }
    }
  }

  // Store last render's modals for showModal() to access
  // Note: Used internally by handler context, not truly private
  __lastRenderModals__: Map<string, any> | null = null;

  override async toJSON(arg: TDBIHTMLComponentsV2ToJSONArgs = {}): Promise<any> {
    if (this.mode === 'svelte' && this.template) {
      // Render Svelte component
      const result = await renderSvelteComponent(
        this.dbi as any,
        this.template,
        this.name,
        {
          data: arg.data,
          ttl: this.ttl
        }
      );

      // Store modals for showModal() to access
      this.__lastRenderModals__ = result.modals;

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
   * const result = await showcase.send(channel, { data: { count: 0 } });
   * 
   * // Send as followUp (if already replied)
   * const result = await showcase.send(interaction, { data: { count: 0 }, followUp: true });
   * 
   * // Manual re-render from outside
   * await result.render();
   * ```
   */
  async send(target: any, options: TDBIHTMLComponentsV2SendOptions = {}): Promise<TDBIHTMLComponentsV2SendResult> {
    // Wait for Svelte component initialization if not yet completed
    if (this._initPromise) {
      await this._initPromise;
    }

    const { data = {}, flags = ["IsComponentsV2"], content, ephemeral, reply, followUp } = options;

    // Render components (toJSON is async) - this also creates $ref in data if not present
    const components = await this.toJSON({ data });

    // Build message options
    const messageOptions: any = { components, flags };
    if (content) messageOptions.content = content;
    if (ephemeral) messageOptions.flags = [...flags, "Ephemeral"];

    // Detect target type and send accordingly
    let message: any;
    const isInteraction = target.reply && target.user; // Interactions have both reply method and user property
    const isChannel = target.send && !target.user; // Channels have send but no user

    try {
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
    } catch (error: any) {
      // Check if it's a Discord API error and enhance it with helpful context
      if (error.code || error.rawError || (error.message && error.message.includes('Invalid Form Body'))) {
        const source = this.file ? fs.readFileSync(this.file, 'utf-8') : this.template;
        throw parseDiscordAPIError(error, source, this.name, components);
      }
      throw error;
    }

    // If Svelte mode, create initial handler context and run onMount
    // After toJSON, data.$ref is guaranteed to exist (created in renderSvelteComponent)
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
        fakeCtx,
        this._sourceDir,
        this.svelteComponentInfo.inlineHandlers
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

      // Return result object with render() method for manual re-rendering
      const component = this;
      return {
        message,
        data,
        render: async () => {
          // Run pre-render callbacks (async)
          await handlerContext.runPreRender();

          // Re-render the component
          const components = await component.toJSON({ data });
          await message.edit({
            components,
            flags: ["IsComponentsV2"],
          });

          // Run after-render callbacks
          handlerContext.runAfterRender();
        },
        destroy: () => component.destroy(data)
      } as TDBIHTMLComponentsV2SendResult;
    }

    // For non-Svelte mode, return simple result object
    return {
      message,
      data,
      render: async () => {
        const components = await this.toJSON({ data });
        await message.edit({
          components,
          flags: ["IsComponentsV2"],
        });
      },
      destroy: () => this.destroy(data)
    } as TDBIHTMLComponentsV2SendResult;
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
   * Extract all field values from a modal interaction
   * Supports text inputs, select menus (string, user, role, mentionable, channel), and file uploads
   * 
   * Returns an object where keys are the custom_id of each component and values are:
   * - For text inputs: string value
   * - For string selects: string[] of selected values
   * - For user selects: string[] of user IDs
   * - For role selects: string[] of role IDs
   * - For mentionable selects: { users: string[], roles: string[] }
   * - For channel selects: string[] of channel IDs
   * - For file uploads: attachment objects array
   */
  private _extractModalFields(modalInteraction: any): Record<string, any> {
    const fields: Record<string, any> = {};

    // Handle classic text input fields via ModalSubmitFields
    if (modalInteraction.fields && modalInteraction.fields.fields) {
      for (const [customId, field] of modalInteraction.fields.fields) {
        // Text input - field.value is the string
        // For select menus, value might be an array
        fields[customId] = field.values || field.value;
      }
    }

    // Handle new modal components from interaction.data.components
    // The new modal structure uses Label wrappers with nested components
    const data = modalInteraction.data || (modalInteraction as any).data;
    if (data && data.components) {
      this._extractFieldsFromComponents(data.components, fields);
    }

    // Also check for components directly on the interaction (some Discord.js versions)
    if (modalInteraction.components && Array.isArray(modalInteraction.components)) {
      this._extractFieldsFromInteractionComponents(modalInteraction.components, fields);
    }

    return fields;
  }

  /**
   * Extract fields from Discord.js style interaction components (ActionRow objects)
   */
  private _extractFieldsFromInteractionComponents(components: any[], fields: Record<string, any>) {
    for (const row of components) {
      // ActionRow has components property
      const rowComponents = row.components || [];
      for (const component of rowComponents) {
        const customId = component.customId || component.custom_id || component.id;
        if (!customId) continue;

        // Check component type
        const type = component.type;

        // Text Input (type 4)
        if (type === 4 || component.value !== undefined) {
          fields[customId] = component.value || '';
        }

        // Select menus (types 3, 5, 6, 7, 8) - check for values array
        if (component.values !== undefined) {
          fields[customId] = component.values;
        }
      }
    }
  }

  /**
   * Recursively extract field values from component structure
   */
  private _extractFieldsFromComponents(components: any[], fields: Record<string, any>) {
    for (const component of components) {
      const type = component.type;
      // Support both custom_id and id for backward compatibility
      const customId = component.custom_id || component.id;

      // Type 18 = Label/Field - can have nested component or components
      if (type === 18) {
        if (component.component) {
          this._extractFieldsFromComponents([component.component], fields);
        }
        if (component.components) {
          this._extractFieldsFromComponents(component.components, fields);
        }
        continue;
      }

      // Type 1 = Action Row - has nested components array
      if (type === 1 && component.components) {
        this._extractFieldsFromComponents(component.components, fields);
        continue;
      }

      if (!customId) continue;

      switch (type) {
        case 4: // Text Input
          fields[customId] = component.value || '';
          break;

        case 3: // String Select
          fields[customId] = component.values || [];
          break;

        case 5: // User Select
          fields[customId] = component.values || [];
          break;

        case 6: // Role Select
          fields[customId] = component.values || [];
          break;

        case 7: // Mentionable Select - can have both users and roles
          // Discord returns resolved data for mentionables
          fields[customId] = {
            values: component.values || [],
            users: component.resolved?.users ? Object.keys(component.resolved.users) : [],
            roles: component.resolved?.roles ? Object.keys(component.resolved.roles) : []
          };
          break;

        case 8: // Channel Select
          fields[customId] = component.values || [];
          break;

        case 19: // File Upload
          // File uploads come through as attachments
          fields[customId] = component.attachments || [];
          break;
      }
    }
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
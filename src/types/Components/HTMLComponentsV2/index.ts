import { NamespaceEnums } from "../../../../generated/namespaceData";
import { DBI } from "../../../DBI";
import { DBIBaseInteraction, DBIRateLimit, IDBIBaseExecuteCtx, TDBIReferencedData } from "../../Interaction";
import { parseHTMLComponentsV2 } from "./parser";
import { renderSvelteComponent, renderSvelteComponentFromFile, SvelteRenderResult } from "./svelteRenderer";
import { parseSvelteComponent, createHandlerContext, HandlerContextResult } from "./svelteParser";
import fs from "fs";

/**
 * Parse Discord API error and provide helpful context about which HTML element caused the error
 */
function parseDiscordAPIError(error: any, source?: string, componentName?: string): Error {
  // Check if it's a Discord API error with form body issues
  const message = error.message || '';
  const rawError = error.rawError || error;

  // Extract the path from error message like "data.components[0].components[0].accessory.media.url"
  const pathMatch = message.match(/data\.components(\[[^\]]+\](?:\.[^\[\s\[]+|\[[^\]]+\])*)/);

  if (!pathMatch) {
    return error; // Not a parseable Discord API error
  }

  const errorPath = pathMatch[1];
  const errorCode = message.match(/\[([A-Z_]+)\]/)?.[1] || 'UNKNOWN';

  // Parse the path to understand the component structure
  // e.g., "[0].components[0].accessory.media.url" -> component index 0, child 0, accessory.media.url
  const parts = errorPath.split(/\.|\[|\]/).filter(Boolean);

  // Build a human-readable path description
  let description = '';
  let elementHint = '';
  let currentPath = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!isNaN(Number(part))) {
      currentPath.push(`[${part}]`);
    } else {
      currentPath.push(part);

      // Provide hints based on known Discord component structure
      if (part === 'accessory') {
        elementHint = '<section> element\'s accessory (thumbnail/button)';
      } else if (part === 'media') {
        elementHint = '<thumbnail> or <media-gallery> element';
      } else if (part === 'url') {
        elementHint = 'media URL attribute';
      } else if (part === 'components') {
        // Skip, it's container
      } else if (part === 'content') {
        elementHint = 'text content of a <text-display> element';
      } else if (part === 'label') {
        elementHint = 'label attribute of a <button> or <option>';
      } else if (part === 'custom_id') {
        elementHint = 'name attribute of an interactive element';
      } else if (part === 'placeholder') {
        elementHint = 'placeholder attribute of a select menu';
      } else if (part === 'title') {
        elementHint = 'title attribute of a <modal> or <section>';
      } else if (part === 'options') {
        elementHint = '<option> elements inside a <string-select>';
      } else if (part === 'value') {
        elementHint = 'value attribute of an <option> or <text-input>';
      } else if (part === 'description') {
        elementHint = 'description attribute of an <option>';
      }
    }
  }

  // Map error codes to helpful messages
  const errorMessages: Record<string, string> = {
    'BASE_TYPE_REQUIRED': 'This field is required but was empty or undefined',
    'STRING_TYPE_REQUIRED': 'This field must be a string',
    'NUMBER_TYPE_REQUIRED': 'This field must be a number',
    'BOOLEAN_TYPE_REQUIRED': 'This field must be a boolean',
    'INVALID_URL': 'The URL provided is not valid',
    'MAX_LENGTH': 'The value exceeds the maximum allowed length',
    'MIN_LENGTH': 'The value is shorter than the minimum required length',
    'CHOICE_NOT_FOUND': 'The selected value is not in the list of options',
  };

  const errorExplanation = errorMessages[errorCode] || `Error code: ${errorCode}`;

  // Build the enhanced error message
  let enhancedMessage = `
╔══════════════════════════════════════════════════════════════╗
║  Discord API Error - Invalid Component Data                   ║
╚══════════════════════════════════════════════════════════════╝

📍 Component: ${componentName || 'unknown'}
📍 Error Path: data.components${errorPath}
📍 Error Code: ${errorCode}

❌ ${errorExplanation}
${elementHint ? `\n💡 This error is likely in: ${elementHint}` : ''}

🔍 What to check:
`;

  // Add specific suggestions based on error type
  if (errorPath.includes('media.url')) {
    enhancedMessage += `   • Make sure the image/media URL is provided and valid
   • Check that the data property used for the image exists
   • Example: <thumbnail media={product?.image}> - is product.image defined?
`;
  } else if (errorPath.includes('accessory')) {
    enhancedMessage += `   • The <section> element requires valid content in its accessory
   • If using <thumbnail>, ensure the media URL is valid
`;
  } else if (errorPath.includes('content')) {
    enhancedMessage += `   • Text content cannot be empty or undefined
   • Check your template expressions like {variable?.property}
`;
  } else if (errorPath.includes('options')) {
    enhancedMessage += `   • Select menu options must have valid value and label
   • Each <option> needs: value="..." and text content
`;
  } else if (errorPath.includes('label') || errorPath.includes('custom_id')) {
    enhancedMessage += `   • Interactive elements (buttons, selects) need valid labels/names
   • Check that text content and name attributes are not empty
`;
  }

  // If we have source, try to highlight relevant section
  if (source && elementHint) {
    const elementType = elementHint.match(/<(\w+-?\w*)>/)?.[1];
    if (elementType) {
      const elementRegex = new RegExp(`<${elementType}[^>]*>`, 'g');
      const matches = source.match(elementRegex);
      if (matches && matches.length > 0) {
        enhancedMessage += `\n📝 Found ${matches.length} <${elementType}> element(s) in template:`;
        matches.slice(0, 3).forEach((m, i) => {
          enhancedMessage += `\n   ${i + 1}. ${m.substring(0, 80)}${m.length > 80 ? '...' : ''}`;
        });
        if (matches.length > 3) {
          enhancedMessage += `\n   ... and ${matches.length - 3} more`;
        }
      }
    }
  }

  const enhancedError = new Error(enhancedMessage);
  (enhancedError as any).originalError = error;
  (enhancedError as any).type = 'discord-api-error';
  (enhancedError as any).path = errorPath;
  (enhancedError as any).code = errorCode;

  return enhancedError;
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

    console.log("[DBI-Svelte] _handleExecute called, mode:", this.mode, "svelteComponentInfo:", !!this.svelteComponentInfo);
    console.log("[DBI-Svelte] ctx.data:", ctx.data);

    // Call user's onExecute callback first if provided
    if (this._userOnExecute) {
      this._userOnExecute(ctx);
    }

    // If using Svelte mode, find and execute the handler
    if (this.mode === 'svelte' && this.svelteComponentInfo) {
      const [elementName, ...handlerData] = ctx.data;
      console.log("[DBI-Svelte] elementName:", elementName, "handlerData:", handlerData);

      if (typeof elementName === 'string') {
        // Check if this is a modal submit (elementName is the modal id)
        const modalHandlerInfo = this.svelteComponentInfo.modalHandlers.get(elementName);
        console.log("[DBI-Svelte] modalHandlerInfo for", elementName, ":", modalHandlerInfo);

        if (modalHandlerInfo) {
          // This is a modal submit - execute the onsubmit handler (or just resolve promise if no handler)
          this._executeModalSubmit(ctx, elementName, modalHandlerInfo.onsubmitHandler, handlerData);
          return;
        }

        // Find the handler info for this element (button, select, etc.)
        const handlerInfo = this.svelteComponentInfo.handlers.get(elementName);
        console.log("[DBI-Svelte] handlerInfo for", elementName, ":", handlerInfo);
        console.log("[DBI-Svelte] Available handlers:", [...this.svelteComponentInfo.handlers.keys()]);

        if (handlerInfo) {
          this._executeElementHandler(ctx, handlerInfo, handlerData);
        } else {
          console.log("[DBI-Svelte] No handler found for element:", elementName);
        }
      }
    } else {
      console.log("[DBI-Svelte] Not executing Svelte handler: mode=", this.mode, "svelteComponentInfo=", !!this.svelteComponentInfo);
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
      ctx
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
        // Modal handler execution failed
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
      ctx
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
        // Handler execution failed
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
   * await showcase.send(channel, { data: { count: 0 } });
   * 
   * // Send as followUp (if already replied)
   * await showcase.send(interaction, { data: { count: 0 }, followUp: true });
   * ```
   */
  async send(target: any, options: TDBIHTMLComponentsV2SendOptions = {}): Promise<any> {
    // Wait for Svelte component initialization if not yet completed
    if (this._initPromise) {
      await this._initPromise;
    }

    const { data = {}, flags = ["IsComponentsV2"], content, ephemeral, reply, followUp } = options;

    // Render components (toJSON is async) - this also creates $ref in data if not present
    const components = await this.toJSON({ data });

    console.log("[DBI-Svelte] send() - data.$ref after toJSON:", data.$ref);
    console.log("[DBI-Svelte] send() - mode:", this.mode, "svelteComponentInfo:", !!this.svelteComponentInfo);

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
        throw parseDiscordAPIError(error, source, this.name);
      }
      throw error;
    }

    // If Svelte mode, create initial handler context and run onMount
    // After toJSON, data.$ref is guaranteed to exist (created in renderSvelteComponent)
    if (this.mode === 'svelte' && this.svelteComponentInfo && data.$ref) {
      const refId = data.$ref;
      console.log("[DBI-Svelte] send() - Creating handler context for ref:", refId);

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
      console.log("[DBI-Svelte] send() - Running onMount, mountCallbacks:", handlerContext.mountCallbacks?.length);
      handlerContext.runMount();

      // Run initial effects
      handlerContext.runEffects();
    } else {
      console.log("[DBI-Svelte] send() - NOT creating handler context: mode=", this.mode, "svelteComponentInfo=", !!this.svelteComponentInfo, "data.$ref=", data.$ref);
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
        fields[customId] = field.value;
      }
    }

    // Handle new modal components from interaction.data.components
    // The new modal structure uses Label wrappers with nested components
    const data = modalInteraction.data || (modalInteraction as any).data;
    if (data && data.components) {
      this._extractFieldsFromComponents(data.components, fields);
    }

    return fields;
  }

  /**
   * Recursively extract field values from component structure
   */
  private _extractFieldsFromComponents(components: any[], fields: Record<string, any>) {
    for (const component of components) {
      const type = component.type;
      const customId = component.custom_id;

      // Type 18 = Label - has nested component
      if (type === 18 && component.component) {
        this._extractFieldsFromComponents([component.component], fields);
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
import { compile } from "svelte/compiler";
import { DBI } from "../../../DBI";
import { NamespaceEnums } from "../../../../generated/namespaceData";
import { parseHTMLComponentsV2 } from "./parser";
import { parseSvelteComponent, createHandlerContext, SvelteComponentInfo, HandlerContextResult } from "./svelteParser";
import * as stuffs from "stuffs";

export interface SvelteRenderOptions {
  data?: Record<string, any>;
  ttl?: number;
}

export interface SvelteRenderResult {
  components: any[];
  handlers: Map<string, { handlerFn: Function, context: any }>;
  componentInfo: SvelteComponentInfo;
}

/**
 * Compile and render a Svelte component to Discord components
 */
export async function renderSvelteComponent(
  dbi: DBI<NamespaceEnums>,
  source: string,
  dbiName: string,
  options: SvelteRenderOptions = {}
): Promise<SvelteRenderResult> {
  const { data = {}, ttl = 0 } = options;

  // Parse the Svelte component to extract handlers
  // This also injects auto-generated names into elements without name attribute
  const componentInfo = await parseSvelteComponent(source, data);

  // Use the processed source (with auto-generated names injected)
  const processedSource = componentInfo.processedSource;

  // Compile the Svelte component for SSR
  const compiled = compile(processedSource, {
    generate: "server",
    css: "injected",
    dev: false,
  } as any);

  // Create a module context for the compiled code
  let html = "";
  try {
    const moduleContext = createModuleContext(dbi, data, ttl);
    const componentModule = evaluateCompiledComponent(compiled.js.code, moduleContext);

    // Render the component with props (include data in props)
    const renderResult = componentModule.render({ ...data, data });
    html = renderResult.html || renderResult.body || "";

    // Debug: Log rendered HTML
    if (process.env.DEBUG_SVELTE) {
      console.log("Rendered HTML:", html);
    }
  } catch (error) {
    console.error("Error rendering Svelte component:", error);
    throw error;
  }

  console.log("Rendered HTML:", html);

  // For Svelte mode, inject state into interactive elements as a ref
  // Reuse existing ref if data already has one, otherwise create new
  if (data && Object.keys(data).length > 0) {
    let stateRefId: string;

    // Check if data already has a $ref (from previous render)
    if (data.$ref && typeof data.$ref === 'string') {
      stateRefId = data.$ref;
      // Update the existing ref's value with new data
      const existingRef = dbi.data.refs.get(stateRefId);
      if (existingRef) {
        existingRef.value = data;
        existingRef.at = Date.now(); // Refresh timestamp
      } else {
        // Ref expired or was deleted, create new one with same ID
        dbi.data.refs.set(stateRefId, { at: Date.now(), value: data, ttl });
      }
    } else {
      // Create a new ref for the state
      stateRefId = stuffs.randomString(8);
      data.$ref = stateRefId; // Store ref ID in data for future updates
      dbi.data.refs.set(stateRefId, { at: Date.now(), value: data, ttl });
    }

    // Add state ref to all elements with name attribute (buttons, selects)
    html = html.replace(/<button([^>]*name="[^"]*"[^>]*)>/g, (match, attrs) => {
      // Check if it already has data attributes
      if (attrs.includes('data-1:')) return match;
      return `<button${attrs} data-1:ref="${stateRefId}">`;
    });
    // Also handle select elements
    html = html.replace(/<(string-select|user-select|role-select|channel-select|mentionable-select)([^>]*name="[^"]*"[^>]*)>/g, (match, tag, attrs) => {
      if (attrs.includes('data-1:')) return match;
      return `<${tag}${attrs} data-1:ref="${stateRefId}">`;
    });
  }

  console.log("HTML with state:", html);

  // Parse the rendered HTML to Discord components
  const components = parseHTMLComponentsV2(dbi, html, dbiName, { data, ttl });

  console.log("Parsed Components:", JSON.stringify(components, null, 2));

  // Create handler context (also captures $effect callbacks)
  const handlerContext = createHandlerContext(componentInfo.scriptContent, data);
  const handlers = new Map<string, { handlerFn: Function, context: any }>();

  // Run effects on initial render
  handlerContext.runEffects();

  // Map handlers to component names
  componentInfo.handlers.forEach((handlerInfo, componentName) => {
    const handlerFn = handlerContext.handlers[handlerInfo.handlerName];
    if (handlerFn && typeof handlerFn === "function") {
      handlers.set(componentName, {
        handlerFn,
        context: data
      });
    }
  });

  return {
    components,
    handlers,
    componentInfo
  };
}

/**
 * Create a module context for evaluating the compiled Svelte component
 */
function createModuleContext(dbi: DBI<NamespaceEnums>, data: Record<string, any>, ttl: number) {
  return {
    // Store objects in refs for later retrieval in handlers
    // This is used internally by the parser when converting to Discord components
    __storeRef: (obj: any) => {
      let id = stuffs.randomString(8);
      dbi.data.refs.set(id, { at: Date.now(), value: obj, ttl });
      return id;
    },

    // DBI instance for advanced usage
    __dbi: dbi,

    // All data context available
    ...data,
    data, // Also expose as 'data' prop
  };
}

/**
 * Evaluate the compiled Svelte component code
 */
function evaluateCompiledComponent(code: string, context: Record<string, any>): any {
  try {
    // Aggressively strip ALL import statements
    // Svelte 5 generates imports with special chars like $ that need careful handling
    let processedCode = code;

    // Remove all lines that start with 'import' (most reliable approach)
    processedCode = processedCode
      .split('\n')
      .filter(line => !line.trim().startsWith('import '))
      .join('\n');

    // Also remove 'export default' and replace with assignment
    processedCode = processedCode.replace(/export\s+default\s+/g, 'module.exports = ');

    // Create exports object
    const exports: any = {};
    const module = { exports };

    // Provide Svelte 5 server runtime functions
    // The compiled code references these via the $ namespace
    const $: any = {
      // Escape functions
      escape: (str: any) => String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"),
      escape_text: (str: any) => String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;"),
      escape_attribute_value: (str: any) => String(str)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"),
      // Array helpers for {#each}
      ensure_array_like: (value: any) => {
        if (Array.isArray(value)) return value;
        if (value == null) return [];
        if (typeof value === 'object' && Symbol.iterator in value) {
          return Array.from(value);
        }
        return [value];
      },
      // Renderer methods
      component: (fn: Function) => fn,
      push: (content: string) => content,
      pop: () => { },
      attr: (name: string, value: any, is_boolean?: boolean) => {
        if (is_boolean && !value) return '';
        if (value == null) return '';
        return ` ${name}="${String(value)}"`;
      },
      spread_attributes: (attrs: Record<string, any>) => {
        return Object.entries(attrs)
          .map(([key, value]) => ` ${key}="${String(value)}"`)
          .join('');
      },
      spread_props: (props: Record<string, any>) => props,
      bind_props: (props: Record<string, any>, names: string[]) => {
        const result: any = {};
        names.forEach(name => {
          if (name in props) result[name] = props[name];
        });
        return result;
      },
      stringify: (value: any) => JSON.stringify(value),
      store_get: (store: any) => store,
      unsubscribe_stores: () => { },
      // Control flow
      each: (items: any[], fn: Function) => {
        return items.map((item, index) => fn(item, index)).join('');
      },
      // Lifecycle
      tick: () => Promise.resolve(),
      flush: () => { },
      // Validation
      validate_component: (component: any) => component,
      validate_store: (store: any) => store,
      // Misc
      noop: () => { },
      run: (fn: Function) => fn(),
      run_all: (fns: Function[]) => fns.forEach(f => f()),
      is_promise: (value: any) => value && typeof value.then === 'function',
      missing_component: { $$render: () => '' },
    };

    // Create renderer object that accumulates HTML
    let html = '';
    const $$renderer: any = {
      out: '',
      head: '',
      component: (fn: Function) => {
        return fn($$renderer);
      },
      push: (content: string) => {
        html += content;
        return $$renderer;
      },
      pop: () => $$renderer,
      element: (tag: string, fn: Function) => {
        html += `<${tag}`;
        fn();
        html += `>`;
        return $$renderer;
      },
      close: (tag: string) => {
        html += `</${tag}>`;
        return $$renderer;
      },
    };

    // Create a function wrapper with all context and Svelte runtime
    // Include lifecycle stubs - these are no-ops in SSR but need to be defined
    const allContext = {
      ...context,
      $,
      $$renderer,
      module,
      exports,
      // Lifecycle stubs for SSR (actual lifecycle runs in handler context)
      onMount: (fn: Function) => { /* SSR no-op, real onMount runs in handler context */ },
      onDestroy: (fn: Function) => { /* SSR no-op, real onDestroy runs in handler context */ },
    };

    const contextKeys = Object.keys(allContext);
    const contextValues = Object.values(allContext);

    // Wrap in IIFE
    const wrappedCode = `
      (function(${contextKeys.join(", ")}) {
        ${processedCode}
        return module.exports;
      })
    `;

    // Evaluate the code
    const func = eval(wrappedCode);
    const component = func(...contextValues);

    // Return a render function
    return {
      render: (props: any) => {
        html = '';
        try {
          component($$renderer, props);
          return { html, head: '', css: { code: '', map: null } };
        } catch (e) {
          console.error('Component render error:', e);
          throw e;
        }
      }
    };
  } catch (error) {
    console.error("Error evaluating compiled component:", error);
    console.error("Code preview (first 500 chars):", code.substring(0, 500));
    throw error;
  }
}

/**
 * Render a Svelte component from a file
 */
export async function renderSvelteComponentFromFile(
  dbi: DBI<NamespaceEnums>,
  filePath: string,
  dbiName: string,
  options: SvelteRenderOptions = {}
): Promise<SvelteRenderResult> {
  const fs = require("fs");
  const source = fs.readFileSync(filePath, "utf-8");
  return await renderSvelteComponent(dbi, source, dbiName, options);
}

import { compile } from "svelte/compiler";
import { DBI } from "../../../DBI";
import { NamespaceEnums } from "../../../../generated/namespaceData";
import { parseHTMLComponentsV2 } from "./parser";
import { parseSvelteComponent, createHandlerContext, SvelteComponentInfo, HandlerContextResult } from "./svelteParser";
import * as stuffs from "stuffs";
import * as vm from "vm";

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

  // Compile the Svelte component for SSR (Svelte 5)
  const compiled = compile(processedSource, {
    generate: "server",
    css: "injected",
    dev: false,
  } as any);

  // Create a module context for the compiled code
  let html = "";
  try {
    const moduleContext = createModuleContext(dbi, data, ttl);
    const Component = evaluateCompiledComponent(compiled.js.code, moduleContext);

    // Svelte 5 SSR: Use render from svelte/server
    const { render } = require("svelte/server");
    const renderResult = render(Component, { props: { ...data, data } });
    html = renderResult.body || "";
  } catch (error) {
    throw error;
  }

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

  // Parse the rendered HTML to Discord components
  const components = parseHTMLComponentsV2(dbi, html, dbiName, { data, ttl });

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
    // Load Svelte 5 internal runtime
    const svelteInternal = require("svelte/internal/server");

    // Process the code to work in our context
    let processedCode = code;

    // Collect external modules to inject into sandbox
    const externalModules: Record<string, any> = {};

    // Replace svelte internal imports
    processedCode = processedCode.replace(
      /import\s*\*\s*as\s*(\w+)\s*from\s*["']svelte\/internal\/server["'];?/g,
      'const $1 = __svelteInternal;'
    );
    processedCode = processedCode.replace(
      /import\s*\{([^}]+)\}\s*from\s*["']svelte\/internal\/server["'];?/g,
      (match, imports) => {
        const importList = imports.split(',').map((i: string) => i.trim());
        return `const { ${importList.join(', ')} } = __svelteInternal;`;
      }
    );

    // Handle external module imports (default imports)
    processedCode = processedCode.replace(
      /import\s+(\w+)\s+from\s*["']([^"']+)["'];?/g,
      (match, varName, modulePath) => {
        // Skip svelte imports
        if (modulePath.startsWith('svelte')) return '';
        try {
          const mod = require(modulePath);
          externalModules[varName] = mod.default || mod;
          return `const ${varName} = __externalModules.${varName};`;
        } catch (e) {
          return '';
        }
      }
    );

    // Handle named imports from external modules
    processedCode = processedCode.replace(
      /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?/g,
      (match, imports, modulePath) => {
        // Skip svelte imports
        if (modulePath.startsWith('svelte')) return '';
        try {
          const mod = require(modulePath);
          const importList = imports.split(',').map((i: string) => i.trim());
          importList.forEach((importName: string) => {
            const [name, alias] = importName.split(' as ').map(s => s.trim());
            externalModules[alias || name] = mod[name] || mod.default?.[name];
          });
          return importList.map((importName: string) => {
            const [name, alias] = importName.split(' as ').map(s => s.trim());
            return `const ${alias || name} = __externalModules.${alias || name};`;
          }).join('\n');
        } catch (e) {
          return '';
        }
      }
    );

    // Handle namespace imports from external modules
    processedCode = processedCode.replace(
      /import\s*\*\s*as\s*(\w+)\s*from\s*["']([^"']+)["'];?/g,
      (match, varName, modulePath) => {
        // Skip svelte imports
        if (modulePath.startsWith('svelte')) return '';
        try {
          const mod = require(modulePath);
          externalModules[varName] = mod;
          return `const ${varName} = __externalModules.${varName};`;
        } catch (e) {
          return '';
        }
      }
    );

    // Remove any remaining import statements
    processedCode = processedCode
      .split('\n')
      .filter(line => !line.trim().startsWith('import '))
      .join('\n');

    // Replace 'export default' with assignment
    processedCode = processedCode.replace(/export\s+default\s+/g, '__exports.default = ');
    // Replace 'export function' with assignment
    processedCode = processedCode.replace(/export\s+function\s+(\w+)/g, '__exports.$1 = function $1');
    // Replace 'export const' with assignment
    processedCode = processedCode.replace(/export\s+const\s+(\w+)/g, '__exports.$1 = ');
    // Replace 'export let' with assignment  
    processedCode = processedCode.replace(/export\s+let\s+(\w+)/g, '__exports.$1 = ');

    // Create the sandbox context
    const __exports: any = {};
    // Svelte lifecycle functions - no-ops for SSR
    const svelteLifecycle = {
      onMount: () => () => { }, // Returns cleanup function
      onDestroy: () => { },
      beforeUpdate: () => { },
      afterUpdate: () => { },
      tick: () => Promise.resolve(),
      untrack: (fn: () => any) => fn(),
      createEventDispatcher: () => () => { },
    };

    // Note: Svelte 5 runes ($state, $derived, etc.) are compile-time features
    // The compiler transforms them, so we don't need runtime implementations.
    // The `$` variable is used by compiled code as the svelte/internal/server namespace.

    const sandbox = {
      __svelteInternal: svelteInternal,
      __externalModules: externalModules,
      $: svelteInternal, // Direct alias for compiled Svelte code that uses `$`
      __exports,
      console,
      ...svelteLifecycle,
      ...context,
    };

    // Wrap code in IIFE
    const wrappedCode = `
      (function() {
        ${processedCode}
      })();
    `;

    // Run in VM context for better isolation
    vm.createContext(sandbox);
    vm.runInContext(wrappedCode, sandbox);

    // Return the component
    const Component = sandbox.__exports.default;

    if (!Component) {
      throw new Error("Svelte component did not export a default component");
    }

    return Component;
  } catch (error) {
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

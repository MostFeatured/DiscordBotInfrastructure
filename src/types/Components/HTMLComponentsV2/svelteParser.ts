import { parse } from "svelte/compiler";
import { walk } from "estree-walker";
import * as stuffs from "stuffs";


export interface SvelteHandlerInfo {
  name: string;
  handlerName: string;
  eventType: string; // onclick, onchange, etc.
  element: string; // button, string-select, etc.
}

export interface SvelteComponentInfo {
  handlers: Map<string, SvelteHandlerInfo>;
  scriptContent: string;
  processedSource: string; // Source with auto-generated names injected
}

/**
 * Parse a Svelte component and extract event handlers
 * Also injects auto-generated names into elements that have handlers but no name
 */
export function parseSvelteComponent(source: string, data?: Record<string, any>): SvelteComponentInfo {
  const ast = parse(source);
  const handlers = new Map<string, SvelteHandlerInfo>();
  let scriptContent = "";

  // Extract script content
  if (ast.instance) {
    scriptContent = source.substring(ast.instance.content.start, ast.instance.content.end);
  }

  // Track elements that need auto-generated names (node -> name mapping)
  // We'll inject these into the source after the walk
  const elementsNeedingNames: Array<{ node: any; name: string; handlerName: string; eventType: string; element: string }> = [];
  let autoNameCounter = 0;

  // Walk through HTML nodes to find event handlers
  walk(ast.html as any, {
    enter(node: any) {
      if (node.type === "Element" || node.type === "InlineComponent") {
        const attributes = node.attributes || [];

        // Find name attribute
        const nameAttr = attributes.find((attr: any) =>
          attr.type === "Attribute" && attr.name === "name"
        );

        // Check if element has an onclick/onchange handler and get the handler info
        let foundHandler: { eventType: string; handlerName: string } | null = null;

        for (const attr of attributes) {
          const isEventHandler = attr.type === "EventHandler";
          const isOnAttribute = attr.type === "Attribute" && attr.name && attr.name.startsWith("on");

          if (isEventHandler || isOnAttribute) {
            const eventType = attr.name;
            let handlerName = "";

            if (attr.type === "Attribute" && Array.isArray(attr.value)) {
              const exprValue = attr.value.find((v: any) => v.type === "ExpressionTag" || v.type === "MustacheTag");
              if (exprValue && exprValue.expression) {
                if (exprValue.expression.type === "Identifier") {
                  handlerName = exprValue.expression.name;
                } else if (exprValue.expression.type === "CallExpression" && exprValue.expression.callee) {
                  handlerName = exprValue.expression.callee.name;
                }
              }
            } else if (attr.expression) {
              if (attr.expression.type === "Identifier") {
                handlerName = attr.expression.name;
              } else if (attr.expression.type === "CallExpression" && attr.expression.callee) {
                handlerName = attr.expression.callee.name;
              } else if (attr.expression.type === "MemberExpression") {
                handlerName = extractMemberExpressionName(attr.expression);
              }
            }

            if (handlerName) {
              foundHandler = { eventType, handlerName };
              break;
            }
          }
        }

        if (!foundHandler) return; // No handler found, skip

        let componentName: string;
        if (nameAttr) {
          componentName = getAttributeValue(nameAttr);
        } else {
          // No name attribute - generate a deterministic one based on position
          // Use the handler name and counter for deterministic naming
          const positionKey = `${node.name.toLowerCase()}_${autoNameCounter++}`;

          // If data is provided, use/store in $autoNames for persistence across re-renders
          if (data) {
            if (!data.$autoNames) {
              data.$autoNames = {};
            }
            if (!data.$autoNames[positionKey]) {
              data.$autoNames[positionKey] = `__auto_${positionKey}`;
            }
            componentName = data.$autoNames[positionKey];
          } else {
            // No data - use deterministic name based on position
            componentName = `__auto_${positionKey}`;
          }

          // Track this element for source injection
          elementsNeedingNames.push({
            node,
            name: componentName,
            handlerName: foundHandler.handlerName,
            eventType: foundHandler.eventType,
            element: node.name.toLowerCase()
          });
        }

        // Add to handlers map
        handlers.set(componentName, {
          name: componentName,
          handlerName: foundHandler.handlerName,
          eventType: foundHandler.eventType,
          element: node.name.toLowerCase(),
        });
      }
    }
  });

  // Inject auto-generated names into the source
  // Sort by position descending so we don't mess up offsets
  let processedSource = source;
  const sortedElements = [...elementsNeedingNames].sort((a, b) => b.node.start - a.node.start);

  for (const { node, name } of sortedElements) {
    // Find the position right after the opening tag name
    // e.g., <button ...> -> insert after "button"
    const tagEnd = node.start + 1 + node.name.length; // +1 for '<'
    processedSource = processedSource.slice(0, tagEnd) + ` name="${name}"` + processedSource.slice(tagEnd);
  }

  return {
    handlers,
    scriptContent,
    processedSource
  };
}

/**
 * Extract the full name from a MemberExpression (e.g., obj.method)
 */
function extractMemberExpressionName(expr: any): string {
  if (expr.type === "Identifier") {
    return expr.name;
  }
  if (expr.type === "MemberExpression") {
    const object = extractMemberExpressionName(expr.object);
    const property = expr.property.name || expr.property.value;
    return `${object}.${property}`;
  }
  return "";
}

/**
 * Get the value from an attribute
 */
function getAttributeValue(attr: any): string {
  if (!attr.value) return "";

  if (Array.isArray(attr.value)) {
    // Static text value
    if (attr.value[0]?.type === "Text") {
      return attr.value[0].data;
    }
    // Expression value
    if (attr.value[0]?.expression) {
      return extractExpressionValue(attr.value[0].expression);
    }
  }

  return "";
}

/**
 * Extract value from an expression
 */
function extractExpressionValue(expr: any): string {
  if (expr.type === "Identifier") {
    return expr.name;
  }
  if (expr.type === "Literal") {
    return String(expr.value);
  }
  return "";
}

export interface HandlerContextResult {
  handlers: Record<string, Function>;
  effects: Function[];
  runEffects: () => void;
  hasPendingRender: () => boolean;
  flushRender: () => Promise<void>;
  wrappedCtx: any; // Proxy-wrapped ctx for passing to handlers
  // Lifecycle hooks
  mountCallbacks: Function[];
  destroyCallbacks: Function[];
  runMount: () => void;
  runDestroy: () => void;
  // Handler execution tracking
  setInHandler: (value: boolean) => void;
}

/**
 * Parse import statements from script and extract module info
 */
interface ImportInfo {
  moduleName: string;
  imports: { name: string; alias?: string }[];
  isDefault: boolean;
  defaultName?: string;
}

function parseImports(script: string): { imports: ImportInfo[]; cleanedScript: string } {
  const imports: ImportInfo[] = [];

  // Match: import { a, b as c } from "module"
  // Match: import name from "module"
  // Match: import * as name from "module"
  const importRegex = /import\s+(?:(\w+)\s*,?\s*)?(?:\{\s*([^}]+)\s*\})?(?:\*\s+as\s+(\w+))?\s+from\s+["']([^"']+)["'];?/g;

  let cleanedScript = script;
  let match;

  while ((match = importRegex.exec(script)) !== null) {
    const [fullMatch, defaultImport, namedImports, namespaceImport, moduleName] = match;

    // Skip svelte internal imports - we provide these ourselves
    if (moduleName === 'svelte' || moduleName.startsWith('svelte/')) {
      cleanedScript = cleanedScript.replace(fullMatch, '');
      continue;
    }

    const importInfo: ImportInfo = {
      moduleName,
      imports: [],
      isDefault: false
    };

    // Default import: import name from "module"
    if (defaultImport) {
      importInfo.isDefault = true;
      importInfo.defaultName = defaultImport;
    }

    // Namespace import: import * as name from "module"
    if (namespaceImport) {
      importInfo.isDefault = true;
      importInfo.defaultName = namespaceImport;
    }

    // Named imports: import { a, b as c } from "module"
    if (namedImports) {
      const parts = namedImports.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        const aliasMatch = part.match(/^(\w+)\s+as\s+(\w+)$/);
        if (aliasMatch) {
          importInfo.imports.push({ name: aliasMatch[1], alias: aliasMatch[2] });
        } else {
          importInfo.imports.push({ name: part });
        }
      }
    }

    imports.push(importInfo);
    cleanedScript = cleanedScript.replace(fullMatch, '');
  }

  return { imports, cleanedScript };
}

/**
 * Load modules and create injection variables
 */
function loadModules(imports: ImportInfo[]): { modules: Record<string, any>; varDeclarations: string } {
  const modules: Record<string, any> = {};
  const declarations: string[] = [];

  for (const importInfo of imports) {
    try {
      // Try to require the module
      const mod = require(importInfo.moduleName);

      if (importInfo.isDefault && importInfo.defaultName) {
        // Default or namespace import
        modules[importInfo.defaultName] = mod.default || mod;
        declarations.push(`var ${importInfo.defaultName} = __modules__["${importInfo.defaultName}"];`);
      }

      // Named imports
      for (const imp of importInfo.imports) {
        const varName = imp.alias || imp.name;
        modules[varName] = mod[imp.name];
        declarations.push(`var ${varName} = __modules__["${varName}"];`);
      }
    } catch (err) {
      console.error(`[Svelte] Failed to import module "${importInfo.moduleName}":`, err);
    }
  }

  return { modules, varDeclarations: declarations.join('\n') };
}

/**
 * Create a handler context from script content
 * This evaluates the Svelte script and returns the handler functions and effects
 */
export function createHandlerContext(scriptContent: string, initialData: Record<string, any> = {}, component?: any, ctx?: any): HandlerContextResult {
  const handlers: Record<string, Function> = {};
  const effects: Function[] = [];

  try {
    // Parse and extract imports first
    const { imports, cleanedScript } = parseImports(scriptContent);
    const { modules, varDeclarations } = loadModules(imports);

    // Extract only function declarations from the script
    const functionNames = extractFunctionNames(cleanedScript);

    // Extract $effect calls and convert them to collectable functions
    const effectBodies = extractEffectBodies(cleanedScript);

    // Process script to be safe for evaluation:
    // 1. Remove reactive declarations (let x = $state(...))
    // 2. Remove $props destructuring
    // 3. Convert $effect to __registerEffect__
    // 4. Keep only function declarations
    let processedScript = cleanedScript
      // Remove $state declarations completely or make them var
      .replace(/let\s+(\w+)\s*=\s*\$state\(([^)]*)\);?/g, 'var $1 = $2;')
      // Remove $derived declarations but keep the value
      .replace(/let\s+(\w+)\s*=\s*\$derived\(([^)]+)\);?/g, 'var $1 = $2;')
      // Convert $effect calls to __registerEffect__ calls
      .replace(/\$effect\s*\(\s*((?:function\s*\([^)]*\)|\([^)]*\)\s*=>|\(\)\s*=>)[^}]*\{[\s\S]*?\}\s*)\);?/g, '__registerEffect__($1);')
      // Simpler $effect pattern: $effect(() => { ... })
      .replace(/\$effect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*\);?/g, '__registerEffect__(function() {$1});')
      // Replace $props destructuring with data access (handles default values)
      .replace(/let\s+\{\s*([^}]+)\s*\}\s*=\s*\$props\(\);?/g, (match, vars) => {
        return vars.split(',').map((v: string) => {
          v = v.trim();
          // Skip empty strings and comments
          if (!v || v.startsWith('//')) return '';
          // Remove inline comments from the variable definition
          v = v.replace(/\/\/.*$/, '').trim();
          if (!v) return '';
          // Skip 'data' prop as it's already defined in the wrapper
          if (v === 'data') return '';
          // Check if there's a default value: varName = defaultValue
          const defaultMatch = v.match(/^(\w+)\s*=\s*(.+)$/);
          if (defaultMatch) {
            const [, varName, defaultValue] = defaultMatch;
            // Skip 'data' prop even with default value
            if (varName === 'data') return '';
            // Clean default value from trailing comments
            const cleanDefault = defaultValue.replace(/\/\/.*$/, '').trim();
            return `var ${varName} = data.${varName} ?? ${cleanDefault};`;
          }
          return `var ${v} = data.${v};`;
        }).filter(Boolean).join('\n');
      });

    // Add module variable declarations at the beginning of processed script
    if (varDeclarations) {
      processedScript = varDeclarations + '\n\n' + processedScript;
    }

    // Wrap everything in an IIFE that takes data and component as parameters
    // This ensures data and 'this' are always available in the function scope
    // Also provides helper functions: render(), update() and rerender()
    // Data is wrapped in a Proxy for automatic reactivity
    // Interaction methods (reply, followUp, deferReply) are wrapped to auto-render after completion
    const wrappedScript = `
      return function(__data__, __component__, __ctx__, __modules__) {
        __modules__ = __modules__ || {};
        var self = __component__;
        var __effects__ = [];
        var __renderPending__ = false;
        var __autoRenderEnabled__ = true;
        var __hasDataChanges__ = false;
        
        // Lifecycle callbacks
        var __mountCallbacks__ = [];
        var __destroyCallbacks__ = [];
        var __isMounted__ = false;
        
        // Store last message reference for background updates (intervals, timeouts)
        var __lastMessage__ = __ctx__?.interaction?.message || null;
        
        // Throttle configuration
        var __throttleMinInterval__ = 250; // Minimum ms between renders
        var __lastRenderTime__ = 0;
        var __pendingRenderTimeout__ = null;
        var __isRateLimited__ = false;
        var __rateLimitEndTime__ = 0;
        
        function __registerEffect__(fn) {
          __effects__.push(fn);
        }
        
        // Lifecycle: onMount - called when component is first rendered
        // If callback returns a function, that function is called on destroy
        function onMount(fn) {
          __mountCallbacks__.push(fn);
        }
        
        // Lifecycle: onDestroy - called when ref is cleaned up
        function onDestroy(fn) {
          __destroyCallbacks__.push(fn);
        }
        
        // Rate-limit aware edit function with retry
        function __safeEdit__(editFn, retryCount) {
          retryCount = retryCount || 0;
          var maxRetries = 3;
          
          return editFn().catch(function(err) {
            // Check for rate limit (429)
            if (err.status === 429 || (err.message && err.message.includes('rate limit'))) {
              var retryAfter = err.retry_after || err.retryAfter || 1;
              console.log("[Svelte] Rate limited, waiting " + retryAfter + "s before retry");
              __isRateLimited__ = true;
              __rateLimitEndTime__ = Date.now() + (retryAfter * 1000);
              
              return new Promise(function(resolve) {
                setTimeout(function() {
                  __isRateLimited__ = false;
                  if (retryCount < maxRetries) {
                    resolve(__safeEdit__(editFn, retryCount + 1));
                  } else {
                    console.error("[Svelte] Max retries reached after rate limit");
                    resolve();
                  }
                }, retryAfter * 1000);
              });
            }
            console.error("[Svelte] Edit error:", err.message);
            return Promise.resolve();
          });
        }
        
        // Throttled render - ensures minimum interval between renders
        function __throttledRender__(immediate) {
          var now = Date.now();
          var timeSinceLastRender = now - __lastRenderTime__;
          var waitTime = 0;
          
          // If rate limited, calculate wait time
          if (__isRateLimited__ && __rateLimitEndTime__ > now) {
            waitTime = Math.max(waitTime, __rateLimitEndTime__ - now);
          }
          
          // If within throttle interval, schedule for later
          if (!immediate && timeSinceLastRender < __throttleMinInterval__) {
            waitTime = Math.max(waitTime, __throttleMinInterval__ - timeSinceLastRender);
          }
          
          // Clear any pending render
          if (__pendingRenderTimeout__) {
            clearTimeout(__pendingRenderTimeout__);
            __pendingRenderTimeout__ = null;
          }
          
          if (waitTime > 0) {
            return new Promise(function(resolve) {
              __pendingRenderTimeout__ = setTimeout(function() {
                __pendingRenderTimeout__ = null;
                __lastRenderTime__ = Date.now();
                resolve(__executeRender__());
              }, waitTime);
            });
          }
          
          __lastRenderTime__ = now;
          return __executeRender__();
        }
        
        // Actual render execution
        function __executeRender__() {
          var components = __component__.toJSON({ data: __data__ });
          
          // Try to use current interaction if available
          if (__ctx__ && __ctx__.interaction) {
            try {
              var i = __ctx__.interaction;
              
              // Update last message reference
              if (i.message) {
                __lastMessage__ = i.message;
              }
              
              if (i.replied || i.deferred) {
                // Already replied, use message.edit with rate limit handling
                return __safeEdit__(function() {
                  return i.message.edit({
                    components: components,
                    flags: ["IsComponentsV2"],
                  });
                });
              } else {
                // Not replied yet, use update with rate limit handling
                return __safeEdit__(function() {
                  return i.update({
                    components: components,
                    flags: ["IsComponentsV2"],
                  });
                });
              }
            } catch (err) {
              console.error("[Svelte] Error in render with interaction:", err.message);
            }
          }
          
          // Fallback: Use last message reference (for intervals/timeouts outside interaction)
          if (__lastMessage__) {
            return __safeEdit__(function() {
              return __lastMessage__.edit({
                components: components,
                flags: ["IsComponentsV2"],
              });
            });
          }
          
          console.error("[Svelte] Cannot render: no interaction or message context");
          return Promise.resolve();
        }
        
        // Helper: Auto-detect whether to use update() or rerender()
        // If interaction was already replied/deferred, use message.edit
        // Otherwise use interaction.update
        function render(immediate) {
          return __throttledRender__(immediate);
        }
        
        // Track if we're inside a handler execution
        var __inHandlerExecution__ = false;
        
        // Mark that we have pending data changes
        function __markDataChanged__() {
          __hasDataChanges__ = true;
          
          // If we're NOT inside a handler (e.g., interval/timeout), trigger render immediately
          // The throttle will prevent too many renders
          if (!__inHandlerExecution__ && __autoRenderEnabled__ && __lastMessage__) {
            __hasDataChanges__ = false;
            __throttledRender__(false);
          }
        }
        
        // Flush pending render (called after interaction methods complete)
        function __flushRender__() {
          if (__hasDataChanges__ && __autoRenderEnabled__) {
            __hasDataChanges__ = false;
            render();
          }
        }
        
        // Create reactive proxy for data
        function __createReactiveProxy__(target, path) {
          if (typeof target !== 'object' || target === null) return target;
          
          return new Proxy(target, {
            get: function(obj, prop) {
              var value = obj[prop];
              // Wrap nested objects in proxy too
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return __createReactiveProxy__(value, path + '.' + String(prop));
              }
              return value;
            },
            set: function(obj, prop, value) {
              var oldValue = obj[prop];
              obj[prop] = value;
              // Only mark as changed if value actually changed
              if (oldValue !== value) {
                __markDataChanged__();
              }
              return true;
            }
          });
        }
        
        // Wrap data in reactive proxy
        var data = __createReactiveProxy__(__data__, 'data');
        
        // Track if an async interaction method was called
        var __asyncInteractionCalled__ = false;
        
        // Wrap interaction methods to auto-render after completion
        var interaction = null;
        var ctx = null;
        
        if (__ctx__ && __ctx__.interaction) {
          var originalInteraction = __ctx__.interaction;
          
          // Create a proxy for interaction that wraps reply/followUp/deferReply
          interaction = new Proxy(originalInteraction, {
            get: function(target, prop) {
              var value = target[prop];
              
              // Wrap methods that "consume" the interaction (reply, followUp, defer)
              if (prop === 'reply' || prop === 'followUp' || prop === 'deferReply' || prop === 'deferUpdate') {
                return function() {
                  // Mark that async interaction was called - this prevents sync flush at handler end
                  __asyncInteractionCalled__ = true;
                  
                  var result = value.apply(target, arguments);
                  // After the reply completes, flush any pending renders using throttled render
                  if (result && typeof result.then === 'function') {
                    result.then(function() {
                      if (__hasDataChanges__ && __autoRenderEnabled__) {
                        __hasDataChanges__ = false;
                        // Use throttled render which handles rate limits
                        __throttledRender__(false);
                      }
                    }).catch(function(err) {
                      console.error("[Svelte] Error in " + prop + ":", err.message);
                    });
                  }
                  return result;
                };
              }
              
              // Wrap update method - this one renders directly, no need to flush after
              if (prop === 'update') {
                return function() {
                  __autoRenderEnabled__ = false; // Disable auto since we're doing manual update
                  __asyncInteractionCalled__ = true;
                  return value.apply(target, arguments);
                };
              }
              
              // Bind functions to original target
              if (typeof value === 'function') {
                return value.bind(target);
              }
              
              return value;
            }
          });
          
          // Create wrapped ctx with the proxied interaction
          ctx = new Proxy(__ctx__, {
            get: function(target, prop) {
              if (prop === 'interaction') {
                return interaction;
              }
              return target[prop];
            }
          });
        }
        
        // Helper: Force update message using interaction.update (for button clicks without reply)
        // Helper: Force update message using interaction.update (for button clicks without reply)
        function update() {
          if (!__ctx__ || !__ctx__.interaction) {
            console.error("[Svelte] Cannot update: no interaction context");
            return Promise.resolve();
          }
          __autoRenderEnabled__ = false; // Disable auto-render since manual update called
          return __safeEdit__(function() {
            return __ctx__.interaction.update({
              components: __component__.toJSON({ data: __data__ }),
              flags: ["IsComponentsV2"],
            });
          });
        }
        
        // Helper: Force re-render message using message.edit (after reply/followUp)
        function rerender() {
          if (!__ctx__ || !__ctx__.interaction || !__ctx__.interaction.message) {
            console.error("[Svelte] Cannot rerender: no message context");
            return Promise.resolve();
          }
          __autoRenderEnabled__ = false; // Disable auto-render since manual rerender called
          return __safeEdit__(function() {
            return __ctx__.interaction.message.edit({
              components: __component__.toJSON({ data: __data__ }),
              flags: ["IsComponentsV2"],
            });
          });
        }
        
        // Helper: Disable auto-render (for handlers that don't need UI update)
        function noRender() {
          __autoRenderEnabled__ = false;
        }
        
        // Helper: Set throttle interval (minimum ms between renders)
        function setThrottle(ms) {
          __throttleMinInterval__ = ms;
        }
        
        // Helper: Destroy this component instance (clears intervals, timers, removes ref)
        // Call this when you want to clean up the component manually
        function destroy() {
          // Run all destroy callbacks (clears intervals, timers, etc.)
          __runDestroy__();
          
          // Clear the ref from DBI store if available
          if (__data__ && __data__.$ref && __component__ && __component__.dbi) {
            __component__.dbi.data.refs.delete(__data__.$ref);
          }
          
          // Disable further auto-renders
          __autoRenderEnabled__ = false;
        }
        
        // Check if there are pending data changes that need SYNC render
        // Returns false if async interaction was called (reply/followUp will handle render)
        function __hasPendingRender__() {
          return __hasDataChanges__ && __autoRenderEnabled__ && !__asyncInteractionCalled__;
        }
        
        // Synchronous flush for when handler completes without async interaction
        // Only called when no reply/followUp was made - uses throttled render
        function __syncFlushRender__() {
          if (__hasDataChanges__ && __autoRenderEnabled__ && !__asyncInteractionCalled__) {
            __hasDataChanges__ = false;
            return __throttledRender__(true); // immediate=true for sync flush
          }
          return Promise.resolve();
        }
        
        // Run all mount callbacks, if callback returns a function add it to destroy callbacks
        function __runMount__() {
          if (__isMounted__) return;
          __isMounted__ = true;
          for (var i = 0; i < __mountCallbacks__.length; i++) {
            try {
              var result = __mountCallbacks__[i]();
              // If mount callback returns a function, add it to destroy callbacks
              if (typeof result === 'function') {
                __destroyCallbacks__.push(result);
              }
            } catch (err) {
              console.error("[Svelte] Error in onMount:", err);
            }
          }
        }
        
        // Run all destroy callbacks
        function __runDestroy__() {
          for (var i = 0; i < __destroyCallbacks__.length; i++) {
            try {
              __destroyCallbacks__[i]();
            } catch (err) {
              console.error("[Svelte] Error in onDestroy:", err);
            }
          }
          // Clear pending timeouts
          if (__pendingRenderTimeout__) {
            clearTimeout(__pendingRenderTimeout__);
            __pendingRenderTimeout__ = null;
          }
        }
        
        // Set handler execution flag
        function __setInHandler__(value) {
          __inHandlerExecution__ = value;
        }
        
        ${processedScript}
        return { 
          handlers: { ${functionNames.length > 0 ? functionNames.join(", ") : ''} },
          effects: __effects__,
          hasPendingRender: __hasPendingRender__,
          flushRender: __syncFlushRender__,
          wrappedCtx: ctx,
          mountCallbacks: __mountCallbacks__,
          destroyCallbacks: __destroyCallbacks__,
          runMount: __runMount__,
          runDestroy: __runDestroy__,
          setInHandler: __setInHandler__
        };
      };
    `;

    console.log("[Svelte] Processed script:", processedScript);
    console.log("[Svelte] Wrapped script:", wrappedScript);
    console.log("[Svelte] Initial data:", initialData);

    // Create the factory function
    const factoryFunc = new Function('console', wrappedScript);
    const createHandlers = factoryFunc(console);

    // Execute with the actual data, component, ctx, and imported modules to get handlers with proper closure
    const result = createHandlers(initialData, component, ctx, modules);

    Object.assign(handlers, result.handlers || {});
    effects.push(...(result.effects || []));

    // Return full result including render helpers
    // Function to run all effects
    const runEffects = () => {
      for (const effect of effects) {
        try {
          effect();
        } catch (error) {
          console.error("Error running effect:", error);
        }
      }
    };

    return {
      handlers,
      effects,
      runEffects,
      hasPendingRender: result.hasPendingRender || (() => false),
      flushRender: result.flushRender || (() => Promise.resolve()),
      wrappedCtx: result.wrappedCtx || ctx,
      mountCallbacks: result.mountCallbacks || [],
      destroyCallbacks: result.destroyCallbacks || [],
      runMount: result.runMount || (() => { }),
      runDestroy: result.runDestroy || (() => { }),
      setInHandler: result.setInHandler || (() => { })
    };
  } catch (error) {
    console.error("Error creating handler context:", error);
    console.error("Processed script:", scriptContent);
  }

  // Function to run all effects (fallback)
  const runEffects = () => {
    for (const effect of effects) {
      try {
        effect();
      } catch (error) {
        console.error("Error running effect:", error);
      }
    }
  };

  return {
    handlers,
    effects,
    runEffects,
    hasPendingRender: () => false,
    flushRender: () => Promise.resolve(),
    wrappedCtx: ctx,
    mountCallbacks: [],
    destroyCallbacks: [],
    runMount: () => { },
    runDestroy: () => { },
    setInHandler: () => { }
  };
}

/**
 * Extract $effect callback bodies from script content
 */
function extractEffectBodies(script: string): string[] {
  const bodies: string[] = [];
  // Match $effect(() => { ... }) or $effect(function() { ... })
  const effectRegex = /\$effect\s*\(\s*(?:(?:function\s*\([^)]*\)|\([^)]*\)\s*=>|\(\)\s*=>)\s*\{([\s\S]*?)\})\s*\)/g;
  let match;
  while ((match = effectRegex.exec(script)) !== null) {
    bodies.push(match[1]);
  }
  return bodies;
}

/**
 * Extract function names from script content (excluding effect callbacks)
 */
function extractFunctionNames(script: string): string[] {
  const names: string[] = [];

  // Match function declarations: function name() {}
  const functionDeclRegex = /function\s+(\w+)\s*\(/g;
  let match;
  while ((match = functionDeclRegex.exec(script)) !== null) {
    names.push(match[1]);
  }

  // Match function expressions: const name = function() {}
  const functionExprRegex = /(?:const|let|var)\s+(\w+)\s*=\s*function\s*\(/g;
  while ((match = functionExprRegex.exec(script)) !== null) {
    names.push(match[1]);
  }

  // Match arrow functions: const name = () => {}
  const arrowFunctionRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
  while ((match = arrowFunctionRegex.exec(script)) !== null) {
    names.push(match[1]);
  }

  // Match arrow functions without parentheses: const name = x => {}
  const simpleArrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\w+\s*=>/g;
  while ((match = simpleArrowRegex.exec(script)) !== null) {
    names.push(match[1]);
  }

  return [...new Set(names)]; // Remove duplicates
}

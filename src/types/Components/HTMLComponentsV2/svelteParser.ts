import * as stuffs from "stuffs";

// Lazy imports to avoid issues with package managers that don't properly hoist dependencies
let _parse: typeof import("svelte/compiler").parse;

async function ensureImports() {
  if (!_parse) {
    const svelteCompiler = await import("svelte/compiler");
    _parse = svelteCompiler.parse;
  }
}

/**
 * Simple AST walker for Svelte AST nodes
 */
function walkSvelteAst(node: any, callback: (node: any) => void) {
  if (!node || typeof node !== 'object') return;

  callback(node);

  // Walk children based on node type
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      walkSvelteAst(child, callback);
    }
  }
  if (node.fragment && node.fragment.nodes) {
    for (const child of node.fragment.nodes) {
      walkSvelteAst(child, callback);
    }
  }
  if (node.nodes && Array.isArray(node.nodes)) {
    for (const child of node.nodes) {
      walkSvelteAst(child, callback);
    }
  }
  // Handle other potential child properties
  if (node.else) {
    walkSvelteAst(node.else, callback);
  }
  if (node.consequent) {
    walkSvelteAst(node.consequent, callback);
  }
  if (node.alternate) {
    walkSvelteAst(node.alternate, callback);
  }
  if (node.then) {
    walkSvelteAst(node.then, callback);
  }
  if (node.catch) {
    walkSvelteAst(node.catch, callback);
  }
  if (node.body) {
    if (Array.isArray(node.body)) {
      for (const child of node.body) {
        walkSvelteAst(child, callback);
      }
    } else {
      walkSvelteAst(node.body, callback);
    }
  }
}

export interface SvelteHandlerInfo {
  name: string;
  handlerName: string;
  eventType: string; // onclick, onchange, onsubmit, etc.
  element: string; // button, string-select, components (for modal), etc.
}

export interface ModalHandlerInfo {
  modalId: string;
  onsubmitHandler?: string; // Handler function name for onsubmit
}

export interface SvelteValidationWarning {
  type: 'missing-data' | 'unused-data' | 'undefined-handler' | 'syntax-error' | 'runtime-error';
  message: string;
  details?: string;
}

export interface SvelteComponentInfo {
  handlers: Map<string, SvelteHandlerInfo>;
  /** Modal onsubmit handlers keyed by modal id */
  modalHandlers: Map<string, ModalHandlerInfo>;
  scriptContent: string;
  processedSource: string; // Source with auto-generated names injected
  /** Props extracted from $props() destructuring */
  declaredProps: string[];
  /** Props that have default values (don't require data) */
  propsWithDefaults: string[];
  /** Function names declared in the script */
  declaredFunctions: string[];
}

/**
 * Parse a Svelte component and extract event handlers
 * Also injects auto-generated names into elements that have handlers but no name
 */
export async function parseSvelteComponent(source: string, data?: Record<string, any>): Promise<SvelteComponentInfo> {
  await ensureImports();

  let ast;
  try {
    ast = _parse(source);
  } catch (parseError: any) {
    // Format Svelte parse error with helpful details
    const errorMessage = parseError.message || 'Unknown parse error';
    const location = parseError.start || parseError.loc;
    let details = errorMessage;

    if (location) {
      const lines = source.split('\n');
      const lineNum = location.line || 1;
      const column = location.column || 0;
      const errorLine = lines[lineNum - 1] || '';
      const prevLine = lines[lineNum - 2] || '';
      const nextLine = lines[lineNum] || '';

      details = `
Svelte Parse Error at line ${lineNum}, column ${column}:
${errorMessage}

${lineNum > 1 ? `${lineNum - 1} | ${prevLine}\n` : ''}${lineNum} | ${errorLine}
${' '.repeat(String(lineNum).length + 3 + column)}^
${nextLine ? `${lineNum + 1} | ${nextLine}` : ''}
`.trim();
    }

    const enhancedError = new Error(`[DBI-Svelte] Failed to parse Svelte component:\n${details}`);
    (enhancedError as any).originalError = parseError;
    (enhancedError as any).type = 'svelte-parse-error';
    throw enhancedError;
  }

  const handlers = new Map<string, SvelteHandlerInfo>();
  const modalHandlers = new Map<string, ModalHandlerInfo>();
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
  walkSvelteAst(ast.html || ast.fragment, (node: any) => {
    if (node.type === "Element" || node.type === "InlineComponent" || node.type === "RegularElement" || node.type === "Component") {
      const attributes = node.attributes || [];
      const nodeName = node.name.toLowerCase();

      // Special handling for <components type="modal"> elements
      if (nodeName === "components") {
        const typeAttr = attributes.find((attr: any) =>
          attr.type === "Attribute" && attr.name === "type"
        );
        const typeValue = typeAttr ? getAttributeValue(typeAttr) : null;

        if (typeValue === "modal") {
          // This is a modal definition - extract id and onsubmit handler
          const idAttr = attributes.find((attr: any) =>
            attr.type === "Attribute" && attr.name === "id"
          );
          const modalId = idAttr ? getAttributeValue(idAttr) : null;

          if (modalId) {
            const modalInfo: ModalHandlerInfo = { modalId };

            // Find onsubmit handler
            for (const attr of attributes) {
              const isOnSubmit = (attr.type === "Attribute" && attr.name === "onsubmit") ||
                (attr.type === "EventHandler" && attr.name === "submit");

              if (isOnSubmit) {
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
                  }
                }

                if (handlerName) {
                  modalInfo.onsubmitHandler = handlerName;
                }
                break;
              }
            }

            modalHandlers.set(modalId, modalInfo);
          }
        }
        return; // Don't process <components> as regular elements
      }

      // Find name attribute
      const nameAttr = attributes.find((attr: any) =>
        attr.type === "Attribute" && attr.name === "name"
      );

      // Check if element has an onclick/onchange/handler and get the handler info
      let foundHandler: { eventType: string; handlerName: string } | null = null;

      for (const attr of attributes) {
        const isEventHandler = attr.type === "EventHandler";
        const isOnAttribute = attr.type === "Attribute" && attr.name && attr.name.startsWith("on");
        const isHandlerAttribute = attr.type === "Attribute" && attr.name === "handler";

        if (isEventHandler || isOnAttribute || isHandlerAttribute) {
          // For "handler" attribute, use the element type to determine eventType
          // button -> onclick, select -> onchange
          let eventType = attr.name;
          if (isHandlerAttribute) {
            const elementName = node.name.toLowerCase();
            if (elementName === "button") {
              eventType = "onclick";
            } else if (elementName.includes("select")) {
              eventType = "onchange";
            } else {
              eventType = "handler"; // fallback
            }
          }
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

  // Extract declared props from $props() destructuring
  const declaredProps: string[] = [];
  const propsWithDefaults: string[] = [];
  const propsMatch = scriptContent.match(/let\s+\{([\s\S]*?)\}\s*=\s*\$props\(\)/);
  if (propsMatch) {
    const propsContent = propsMatch[1];
    // Remove comments first
    const cleanedContent = propsContent
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const props = parsePropsContent(cleanedContent);
    for (const prop of props) {
      if (prop.name) {
        declaredProps.push(prop.name);
        if (prop.defaultValue !== undefined) {
          propsWithDefaults.push(prop.name);
        }
      }
    }
  }

  // Extract declared function names
  const declaredFunctions: string[] = [];
  const funcRegex = /(?:async\s+)?function\s+(\w+)\s*\(/g;
  let funcMatch;
  while ((funcMatch = funcRegex.exec(scriptContent)) !== null) {
    declaredFunctions.push(funcMatch[1]);
  }
  // Also match arrow functions assigned to variables: const/let/var name = (async) () =>
  const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
  while ((funcMatch = arrowRegex.exec(scriptContent)) !== null) {
    declaredFunctions.push(funcMatch[1]);
  }

  return {
    handlers,
    modalHandlers,
    scriptContent,
    processedSource,
    declaredProps,
    propsWithDefaults,
    declaredFunctions
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

/**
 * Parse $props() destructuring content with proper brace/bracket counting
 * Handles nested objects like: { name, options = { a: 1, b: [1, 2] }, count = 0 }
 */
function parsePropsContent(content: string): Array<{ name: string; defaultValue?: string }> {
  const props: Array<{ name: string; defaultValue?: string }> = [];
  let current = '';
  let braceCount = 0;
  let bracketCount = 0;
  let parenCount = 0;
  let inString: string | null = null;

  for (let i = 0; i <= content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';

    // Handle string boundaries
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (inString === char) {
        inString = null;
      } else if (!inString) {
        inString = char;
      }
    }

    // Only process structural characters when not in a string
    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
      else if (char === '(') parenCount++;
      else if (char === ')') parenCount--;

      // Split on comma only when at top level (no nested braces/brackets/parens)
      if ((char === ',' || i === content.length) && braceCount === 0 && bracketCount === 0 && parenCount === 0) {
        const trimmed = current.trim();
        if (trimmed) {
          // Parse "name = defaultValue" or just "name"
          const equalsIndex = trimmed.indexOf('=');
          if (equalsIndex > 0) {
            const name = trimmed.substring(0, equalsIndex).trim();
            const defaultValue = trimmed.substring(equalsIndex + 1).trim();
            props.push({ name, defaultValue });
          } else {
            props.push({ name: trimmed });
          }
        }
        current = '';
        continue;
      }
    }

    if (i < content.length) {
      current += char;
    }
  }

  return props;
}

/**
 * Validate a Svelte component and return warnings
 * Call this during development/registration to catch potential issues early
 */
export function validateSvelteComponent(
  componentInfo: SvelteComponentInfo,
  data: Record<string, any> = {},
  componentName: string = 'unknown'
): SvelteValidationWarning[] {
  const warnings: SvelteValidationWarning[] = [];

  // Skip internal props/data keys (used by the framework)
  const internalKeys = ['$ref', '$unRef', '__unRefWrapped__', '$autoNames', 'data'];

  // 1. Check for props declared but not provided in data (missing required data)
  // Skip props that have default values - they don't require data
  for (const prop of componentInfo.declaredProps) {
    if (internalKeys.includes(prop)) continue;
    if (componentInfo.propsWithDefaults.includes(prop)) continue; // Has default, not required
    if (!(prop in data)) {
      warnings.push({
        type: 'missing-data',
        message: `[${componentName}] Prop "${prop}" is declared in $props() without a default value but not provided in data`,
        details: `Add "${prop}" to your data object or provide a default value in $props()`
      });
    }
  }

  // 2. Check for data provided but not declared in props (potential typo or unused)
  for (const key of Object.keys(data)) {
    if (internalKeys.includes(key)) continue;
    if (key.startsWith('$')) continue; // Skip all $-prefixed internal keys
    if (!componentInfo.declaredProps.includes(key)) {
      warnings.push({
        type: 'unused-data',
        message: `[${componentName}] Data key "${key}" is provided but not declared in $props()`,
        details: `This data won't be accessible in the component. Add it to $props() destructuring.`
      });
    }
  }

  // 3. Check for undefined handlers referenced in elements
  for (const [elementName, handlerInfo] of componentInfo.handlers) {
    if (!componentInfo.declaredFunctions.includes(handlerInfo.handlerName)) {
      warnings.push({
        type: 'undefined-handler',
        message: `[${componentName}] Handler "${handlerInfo.handlerName}" referenced by <${handlerInfo.element} name="${elementName}"> is not defined`,
        details: `Make sure to define "function ${handlerInfo.handlerName}(ctx) { ... }" in your script`
      });
    }
  }

  // 4. Check for undefined modal submit handlers
  for (const [modalId, modalInfo] of componentInfo.modalHandlers) {
    if (modalInfo.onsubmitHandler && !componentInfo.declaredFunctions.includes(modalInfo.onsubmitHandler)) {
      warnings.push({
        type: 'undefined-handler',
        message: `[${componentName}] Modal submit handler "${modalInfo.onsubmitHandler}" for modal "${modalId}" is not defined`,
        details: `Make sure to define "function ${modalInfo.onsubmitHandler}(ctx, fields) { ... }" in your script`
      });
    }
  }

  // 5. Check for modal handler signatures (ctx parameter is optional for regular handlers)
  // Only modal handlers MUST have fields parameter to access submitted data
  const handlerFunctionRegex = /(?:async\s+)?function\s+(\w+)\s*\(\s*(\w*)\s*(?:,\s*(\w+))?\s*\)/g;
  let match;
  const scriptContent = componentInfo.scriptContent;

  while ((match = handlerFunctionRegex.exec(scriptContent)) !== null) {
    const funcName = match[1];
    const firstParam = match[2];
    const secondParam = match[3];

    // Only check modal handlers - they need 'fields' param to access form data
    const isModalHandler = Array.from(componentInfo.modalHandlers.values()).some(m => m.onsubmitHandler === funcName);

    if (isModalHandler && !secondParam) {
      warnings.push({
        type: 'syntax-error',
        message: `[${componentName}] Modal handler "${funcName}" should have "ctx" and "fields" parameters`,
        details: `Change to "function ${funcName}(ctx, fields) { ... }" to receive submitted form data`
      });
    }
  }

  // 6. Check for common template mistakes
  const templateContent = componentInfo.processedSource;

  // Check for onclick= without braces (common mistake)
  const badOnClickRegex = /onclick\s*=\s*["']([^"']+)["']/gi;
  while ((match = badOnClickRegex.exec(templateContent)) !== null) {
    if (!match[1].startsWith('{')) {
      warnings.push({
        type: 'syntax-error',
        message: `[${componentName}] onclick handler should use curly braces: onclick={${match[1]}}`,
        details: `String values are not valid for event handlers. Use onclick={handlerName} syntax.`
      });
    }
  }

  // Check for undefined variables in {expression} blocks (basic check)
  const expressionRegex = /\{([^}]+)\}/g;
  const knownIdentifiers = new Set([
    ...componentInfo.declaredProps,
    ...componentInfo.declaredFunctions,
    // Common Svelte/JS globals
    'true', 'false', 'null', 'undefined', 'console', 'Math', 'JSON', 'Array', 'Object',
    'Date', 'Number', 'String', 'Boolean', 'Promise', 'Map', 'Set',
    // Common Svelte constructs
    '#if', '/if', '#each', '/each', '#await', '/await', ':else', ':then', ':catch',
    '@html', '@debug', '@const'
  ]);

  // Add variables from script (let, const, var declarations)
  const varDeclRegex = /(?:let|const|var)\s+(\w+)/g;
  while ((match = varDeclRegex.exec(scriptContent)) !== null) {
    knownIdentifiers.add(match[1]);
  }

  return warnings;
}

/**
 * Log validation warnings to console with colors
 */
export function logValidationWarnings(warnings: SvelteValidationWarning[]): void {
  if (warnings.length === 0) return;

  console.warn(`\n⚠️  Svelte Component Validation Warnings (${warnings.length}):`);

  for (const warning of warnings) {
    const icon = warning.type === 'missing-data' ? '❌' :
      warning.type === 'unused-data' ? '⚠️' :
        warning.type === 'undefined-handler' ? '🔗' :
          warning.type === 'syntax-error' ? '💥' : '⚡';

    console.warn(`  ${icon} ${warning.message}`);
    if (warning.details) {
      console.warn(`     └─ ${warning.details}`);
    }
  }
  console.warn('');
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
      // Module import failed
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

    // First, remove comments from the script to avoid regex issues with braces in comments
    let scriptWithoutComments = cleanedScript
      // Remove single-line comments (but preserve the newline)
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '');

    let processedScript = scriptWithoutComments
      // Remove $state declarations completely or make them var
      .replace(/let\s+(\w+)\s*=\s*\$state\(([^)]*)\);?/g, 'var $1 = $2;')
      // Remove $derived declarations but keep the value
      .replace(/let\s+(\w+)\s*=\s*\$derived\(([^)]+)\);?/g, 'var $1 = $2;')
      // Convert $effect calls to __registerEffect__ calls
      .replace(/\$effect\s*\(\s*((?:function\s*\([^)]*\)|\([^)]*\)\s*=>|\(\)\s*=>)[^}]*\{[\s\S]*?\}\s*)\);?/g, '__registerEffect__($1);')
      // Simpler $effect pattern: $effect(() => { ... })
      .replace(/\$effect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*\);?/g, '__registerEffect__(function() {$1});');

    // Handle $props destructuring with proper brace counting (supports nested objects like { options = { a: 1 } })
    processedScript = processedScript.replace(/let\s+\{([\s\S]*?)\}\s*=\s*\$props\(\);?/g, (match) => {
      // Find the opening brace after 'let'
      const letIndex = match.indexOf('{');
      if (letIndex === -1) return match;

      // Use brace counting to find the matching closing brace
      let braceCount = 0;
      let startIndex = letIndex;
      let endIndex = -1;

      for (let i = startIndex; i < match.length; i++) {
        if (match[i] === '{') braceCount++;
        else if (match[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex === -1) return match;

      // Extract the content between braces
      const content = match.substring(startIndex + 1, endIndex);

      // Parse props with proper handling of nested braces
      const props = parsePropsContent(content);

      return props.map(prop => {
        if (!prop.name || prop.name === 'data') return '';
        if (prop.defaultValue !== undefined) {
          return `var ${prop.name} = data.${prop.name} ?? ${prop.defaultValue};`;
        }
        return `var ${prop.name} = data.${prop.name};`;
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
        
        // Modal store - stores rendered modal definitions
        var __modals__ = new Map();
        
        // Register a modal (called internally when modals are parsed)
        function __registerModal__(modalId, modalDef) {
          __modals__.set(modalId, modalDef);
        }
        
        // Show a modal by ID and return a Promise that resolves with the submitted fields
        // Modal definitions are rendered from <components type="modal" id="xxx">
        // Usage: 
        //   await showModal("edit-product"); // Just show, use onsubmit handler
        //   const { fields, interaction } = await showModal("edit-product"); // Get response
        //   await showModal("edit-product", { timeout: 60000 }); // 60 second timeout
        //   await showModal("edit-product", { timeout: 0 }); // No timeout (unlimited)
        function showModal(modalId, options) {
          if (!__ctx__ || !__ctx__.interaction) {
            return Promise.reject(new Error("showModal requires an interaction context"));
          }
          
          // Default timeout: 10 minutes (600000ms), 0 = no timeout
          var timeout = (options && typeof options.timeout === 'number') ? options.timeout : 600000;
          
          // Disable auto-render IMMEDIATELY since we're showing a modal
          // This prevents flushRender from trying to update after modal is shown
          __autoRenderEnabled__ = false;
          __asyncInteractionCalled__ = true;
          
          // Create a promise that will be resolved when modal is submitted
          return new Promise(async function(resolve, reject) {
            var timeoutId = null;
            var modal = null;
            
            try {
              // Re-render to get latest modal definitions (reactive)
              var renderResult = await __component__.toJSON({ data: __data__ });
              
              // Get modals from the render result stored on component
              var modals = __component__.__lastRenderModals__;
              if (!modals) {
                reject(new Error("No modals defined in this component. Use <components type=\\"modal\\" id=\\"...\\">")); 
                return;
              }
              
              modal = modals.get(modalId);
              if (!modal) {
                reject(new Error("Modal '" + modalId + "' not found. Available modals: " + Array.from(modals.keys()).join(", ")));
                return;
              }
              
              // Wrapped resolve/reject to clear timeout
              var wrappedResolve = function(result) {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(result);
              };
              var wrappedReject = function(error) {
                if (timeoutId) clearTimeout(timeoutId);
                reject(error);
              };
              
              // Store the promise resolver in component's pending modals map
              // This will be resolved when modal submit interaction is received
              __component__._pendingModals.set(modal.customId, { resolve: wrappedResolve, reject: wrappedReject });
              
              // Set up timeout if enabled (timeout > 0)
              if (timeout > 0) {
                timeoutId = setTimeout(function() {
                  // Clean up pending modal
                  __component__._pendingModals.delete(modal.customId);
                  reject(new Error("Modal '" + modalId + "' timed out after " + timeout + "ms"));
                }, timeout);
              }
              
              // Show the modal using the interaction
              var i = __ctx__.interaction;
              
              // Modal must be shown immediately - no deferral allowed
              await i.showModal({
                title: modal.title,
                customId: modal.customId,
                components: modal.components
              });
              
              // Note: Promise resolves later when modal is submitted
              // If you don't await for the response, the promise just hangs (which is fine)
            } catch (err) {
              // Clean up pending modal and timeout if show failed
              if (timeoutId) clearTimeout(timeoutId);
              if (modal && modal.customId) {
                __component__._pendingModals.delete(modal.customId);
              }
              reject(new Error("Failed to show modal: " + (err.message || err)));
            }
          });
        }
        
        // Rate-limit aware edit function with retry
        function __safeEdit__(editFn, retryCount) {
          retryCount = retryCount || 0;
          var maxRetries = 3;
          
          return editFn().catch(function(err) {
            // Check for rate limit (429)
            if (err.status === 429 || (err.message && err.message.includes('rate limit'))) {
              var retryAfter = err.retry_after || err.retryAfter || 1;
              __isRateLimited__ = true;
              __rateLimitEndTime__ = Date.now() + (retryAfter * 1000);
              
              return new Promise(function(resolve) {
                setTimeout(function() {
                  __isRateLimited__ = false;
                  if (retryCount < maxRetries) {
                    resolve(__safeEdit__(editFn, retryCount + 1));
                  } else {
                    resolve();
                  }
                }, retryAfter * 1000);
              });
            }
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
        async function __executeRender__() {
          var components = await __component__.toJSON({ data: __data__ });
          
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
              // Silently fail
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
        
        // Track pending low-priority updates (from intervals/timeouts)
        var __pendingLowPriorityRender__ = false;
        
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
        
        // Low-priority update - used for background tasks like intervals
        // If a handler is currently running, skip this update (the handler's update will include our changes)
        function lowPriorityUpdate(callback) {
          if (__inHandlerExecution__) {
            // Handler is running - just update data, skip render
            // The handler will render when it finishes
            if (callback) callback();
            return;
          }
          
          // No handler running - proceed with update
          if (callback) callback();
        }
        
        // Flush pending render (called after interaction methods complete)
        function __flushRender__() {
          if (__hasDataChanges__ && __autoRenderEnabled__) {
            __hasDataChanges__ = false;
            render();
          }
        }
        
        // Create reactive proxy for data
        // Also properly forwards Object.keys/values/entries operations
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
            },
            // Forward Object.keys/values/entries operations
            ownKeys: function(target) {
              return Reflect.ownKeys(target);
            },
            getOwnPropertyDescriptor: function(target, prop) {
              return Reflect.getOwnPropertyDescriptor(target, prop);
            },
            has: function(target, prop) {
              return Reflect.has(target, prop);
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
          // Also properly forwards Object.keys/values/entries operations
          // Uses Reflect.get to properly handle getters with correct 'this' binding
          interaction = new Proxy(originalInteraction, {
            get: function(target, prop, receiver) {
              // Use Reflect.get to properly handle getters (like 'roles', 'users', etc.)
              // This ensures 'this' context is correct for Discord.js Collection getters
              var value = Reflect.get(target, prop, target);
              
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
                      // Silently fail
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
            },
            // Forward Object.keys/values/entries operations
            ownKeys: function(target) {
              return Reflect.ownKeys(target);
            },
            getOwnPropertyDescriptor: function(target, prop) {
              return Reflect.getOwnPropertyDescriptor(target, prop);
            },
            has: function(target, prop) {
              return Reflect.has(target, prop);
            }
          });
          
          // Create wrapped ctx with the proxied interaction
          // Also properly forwards Object.keys/values/entries operations
          ctx = new Proxy(__ctx__, {
            get: function(target, prop, receiver) {
              if (prop === 'interaction') {
                return interaction;
              }
              // Use Reflect.get for proper getter handling
              return Reflect.get(target, prop, target);
            },
            // Forward Object.keys/values/entries operations
            ownKeys: function(target) {
              return Reflect.ownKeys(target);
            },
            getOwnPropertyDescriptor: function(target, prop) {
              return Reflect.getOwnPropertyDescriptor(target, prop);
            },
            has: function(target, prop) {
              return Reflect.has(target, prop);
            }
          });
        }
        
        // Helper: Force update message using interaction.update (for button clicks without reply)
        // Helper: Force update message using interaction.update (for button clicks without reply)
        async function update() {
          if (!__ctx__ || !__ctx__.interaction) {
            return Promise.resolve();
          }
          __autoRenderEnabled__ = false; // Disable auto-render since manual update called
          var components = await __component__.toJSON({ data: __data__ });
          return __safeEdit__(function() {
            return __ctx__.interaction.update({
              components: components,
              flags: ["IsComponentsV2"],
            });
          });
        }
        
        // Helper: Force re-render message using message.edit (after reply/followUp)
        async function rerender() {
          if (!__ctx__ || !__ctx__.interaction || !__ctx__.interaction.message) {
            return Promise.resolve();
          }
          __autoRenderEnabled__ = false; // Disable auto-render since manual rerender called
          var components = await __component__.toJSON({ data: __data__ });
          return __safeEdit__(function() {
            return __ctx__.interaction.message.edit({
              components: components,
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
              // Mount callback failed
            }
          }
        }
        
        // Run all destroy callbacks
        function __runDestroy__() {
          for (var i = 0; i < __destroyCallbacks__.length; i++) {
            try {
              __destroyCallbacks__[i]();
            } catch (err) {
              // Destroy callback failed
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

    // Create the factory function
    const factoryFunc = new Function('console', wrappedScript);
    const createHandlers = factoryFunc(console);

    // Execute with the actual data, component, ctx, and imported modules to get handlers with proper closure
    let result;
    try {
      result = createHandlers(initialData, component, ctx, modules);
    } catch (execError) {
      throw execError;
    }

    Object.assign(handlers, result.handlers || {});
    effects.push(...(result.effects || []));

    // Return full result including render helpers
    // Function to run all effects
    const runEffects = () => {
      for (const effect of effects) {
        try {
          effect();
        } catch (error) {
          // Effect failed
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
    // Log the error for debugging
    console.error("[DBI-Svelte] createHandlerContext failed:", error);
  }

  // Function to run all effects (fallback)
  const runEffects = () => {
    for (const effect of effects) {
      try {
        effect();
      } catch (error) {
        // Effect failed
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

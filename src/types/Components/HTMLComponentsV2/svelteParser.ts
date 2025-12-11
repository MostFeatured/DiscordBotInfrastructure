import { parse } from "svelte/compiler";
import { walk } from "estree-walker";


export interface SvelteHandlerInfo {
  name: string;
  handlerName: string;
  eventType: string; // onclick, onchange, etc.
  element: string; // button, string-select, etc.
}

export interface SvelteComponentInfo {
  handlers: Map<string, SvelteHandlerInfo>;
  scriptContent: string;
}

/**
 * Parse a Svelte component and extract event handlers
 */
export function parseSvelteComponent(source: string): SvelteComponentInfo {
  const ast = parse(source);
  const handlers = new Map<string, SvelteHandlerInfo>();
  let scriptContent = "";

  // Extract script content
  if (ast.instance) {
    scriptContent = source.substring(ast.instance.content.start, ast.instance.content.end);
  }

  // Walk through HTML nodes to find event handlers
  walk(ast.html as any, {
    enter(node: any) {
      if (node.type === "Element" || node.type === "InlineComponent") {
        const attributes = node.attributes || [];

        // Find name attribute
        const nameAttr = attributes.find((attr: any) =>
          attr.type === "Attribute" && attr.name === "name"
        );

        if (!nameAttr) return;

        const componentName = getAttributeValue(nameAttr);

        // Find event handler attributes (onclick, onchange, etc.)
        attributes.forEach((attr: any) => {
          // Svelte 5 uses "Attribute" type for onclick={fn}
          // Check for both EventHandler and Attribute with "on" prefix
          const isEventHandler = attr.type === "EventHandler";
          const isOnAttribute = attr.type === "Attribute" && attr.name && attr.name.startsWith("on");

          if (isEventHandler || isOnAttribute) {
            const eventType = attr.name; // onclick, onchange, etc.
            let handlerName = "";

            // For Attribute type, the value is in attr.value array
            if (attr.type === "Attribute" && Array.isArray(attr.value)) {
              // Svelte uses MustacheTag for {expression} syntax
              const exprValue = attr.value.find((v: any) => v.type === "ExpressionTag" || v.type === "MustacheTag");
              if (exprValue && exprValue.expression) {
                if (exprValue.expression.type === "Identifier") {
                  handlerName = exprValue.expression.name;
                } else if (exprValue.expression.type === "CallExpression" && exprValue.expression.callee) {
                  handlerName = exprValue.expression.callee.name;
                }
              }
            } else if (attr.expression) {
              // For EventHandler type
              if (attr.expression.type === "Identifier") {
                handlerName = attr.expression.name;
              } else if (attr.expression.type === "CallExpression" && attr.expression.callee) {
                handlerName = attr.expression.callee.name;
              } else if (attr.expression.type === "MemberExpression") {
                handlerName = extractMemberExpressionName(attr.expression);
              }
            }

            if (componentName && handlerName) {
              handlers.set(componentName, {
                name: componentName,
                handlerName,
                eventType,
                element: node.name.toLowerCase(),
              });
            }
          }
        });
      }
    }
  });

  return {
    handlers,
    scriptContent
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
 * Create a handler context from script content
 * This evaluates the Svelte script and returns the handler functions
 */
export function createHandlerContext(scriptContent: string, initialData: Record<string, any> = {}, component?: any): Record<string, Function> {
  const handlers: Record<string, Function> = {};

  try {
    // Extract only function declarations from the script
    const functionNames = extractFunctionNames(scriptContent);

    if (functionNames.length === 0) {
      return handlers;
    }

    // Process script to be safe for evaluation:
    // 1. Remove reactive declarations (let x = $state(...))
    // 2. Remove $props destructuring
    // 3. Keep only function declarations
    let processedScript = scriptContent
      // Remove $state declarations completely or make them var
      .replace(/let\s+(\w+)\s*=\s*\$state\(([^)]*)\);?/g, 'var $1 = $2;')
      // Remove $derived declarations
      .replace(/let\s+(\w+)\s*=\s*\$derived\([^)]*\);?/g, '')
      // Remove $effect calls
      .replace(/\$effect\s*\([^)]*\)\s*;?/g, '')
      // Replace $props destructuring with data access (handles default values)
      // e.g., let { count = 0, name } = $props() => var count = data.count ?? 0; var name = data.name;
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

    // Wrap everything in an IIFE that takes data and component as parameters
    // This ensures data and 'this' are always available in the function scope
    const wrappedScript = `
      return function(__data__, __component__) {
        var data = __data__;
        var self = __component__;
        ${processedScript}
        return { ${functionNames.join(", ")} };
      };
    `;

    console.log("[Svelte] Processed script:", processedScript);
    console.log("[Svelte] Wrapped script:", wrappedScript);
    console.log("[Svelte] Initial data:", initialData);

    // Create the factory function
    const factoryFunc = new Function('console', wrappedScript);
    const createHandlers = factoryFunc(console);

    // Execute with the actual data and component to get handlers with proper closure
    const result = createHandlers(initialData, component);

    Object.assign(handlers, result);
  } catch (error) {
    console.error("Error creating handler context:", error);
    console.error("Processed script:", scriptContent);
  }

  return handlers;
}

/**
 * Extract function names from script content
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

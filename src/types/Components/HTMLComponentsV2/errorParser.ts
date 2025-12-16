/**
 * Discord Components V2 Error Parser
 * Parses Discord API errors and provides helpful, developer-friendly error messages
 * that map component indices to actual HTML elements with their outerHTML
 */

import { JSDOM } from "jsdom";

export interface ComponentErrorInfo {
  /** Original error path like "components[0].components[4].accessory" */
  path: string;
  /** Error code like "BASE_TYPE_REQUIRED" */
  code: string;
  /** Error message from Discord */
  message: string;
  /** Parsed path segments for navigation */
  pathSegments: PathSegment[];
  /** Human-readable explanation of what went wrong */
  explanation: string;
  /** Suggested fix */
  suggestion: string;
  /** The actual HTML element's outerHTML that caused the error */
  htmlElement?: string;
  /** Annotation about what's wrong with this element */
  htmlAnnotation?: string;
}

export interface PathSegment {
  type: 'array' | 'property';
  key: string | number;
}

export interface ParsedDiscordError {
  /** Original error object */
  original: any;
  /** Parsed component errors */
  componentErrors: ComponentErrorInfo[];
  /** Formatted error message for display */
  formattedMessage: string;
}

// Known Discord error codes and their explanations
const ERROR_CODE_EXPLANATIONS: Record<string, { explanation: string; suggestion: string }> = {
  'BASE_TYPE_REQUIRED': {
    explanation: 'This field is required but is empty or missing!',
    suggestion: 'Add the required content or attributes to the element'
  },
  'BASE_TYPE_BAD_LENGTH': {
    explanation: 'Wrong number of child elements (section requires 1-3)',
    suggestion: 'A <section> must contain 1-3 <components> elements inside it'
  },
  'BASE_TYPE_MAX_LENGTH': {
    explanation: 'Value exceeds maximum length',
    suggestion: 'Reduce the text content or number of items'
  },
  'BASE_TYPE_MIN_LENGTH': {
    explanation: 'Value is below minimum length',
    suggestion: 'Add more content or items'
  },
  'BASE_TYPE_CHOICES': {
    explanation: 'Value is not one of the allowed choices',
    suggestion: 'Use a valid option for this field'
  },
  'STRING_TYPE_REGEX': {
    explanation: 'String value does not match required format',
    suggestion: 'Check the format requirements for this field'
  },
  'NUMBER_TYPE_MIN': {
    explanation: 'Number is below minimum value',
    suggestion: 'Increase the number to meet minimum requirement'
  },
  'NUMBER_TYPE_MAX': {
    explanation: 'Number exceeds maximum value',
    suggestion: 'Keep the number within limits'
  },
  'COMPONENT_LAYOUT_WIDTH_EXCEEDED': {
    explanation: 'Row exceeds maximum width (5 units for buttons)',
    suggestion: 'Move some components to a new action-row'
  },
  'COMPONENT_CUSTOM_ID_DUPLICATED': {
    explanation: 'Multiple components have the same custom_id',
    suggestion: 'Each interactive element must have a unique name/id'
  },
};

// Component type names for better error messages
const COMPONENT_TYPE_NAMES: Record<number, string> = {
  1: 'ActionRow',
  2: 'Button',
  3: 'StringSelect',
  4: 'TextInput',
  5: 'UserSelect',
  6: 'RoleSelect',
  7: 'MentionableSelect',
  8: 'ChannelSelect',
  9: 'Section',
  10: 'TextDisplay',
  12: 'MediaGallery',
  13: 'File',
  14: 'Separator',
  17: 'Container',
};

// Discord component HTML tag names (used to filter elements)
const DISCORD_COMPONENT_TAGS = new Set([
  'container', 'action-row', 'button', 'string-select', 'string-select-menu',
  'user-select', 'user-select-menu', 'role-select', 'role-select-menu',
  'mentionable-select', 'mentionable-select-menu', 'channel-select', 'channel-select-menu',
  'text-input', 'text-display', 'section', 'separator', 'media-gallery', 'file',
  'thumbnail', 'accessory', 'field'
]);

/**
 * Parse a Discord API error path like "components[0].components[4].accessory"
 * Returns array of segments for navigation
 */
function parseErrorPath(path: string): PathSegment[] {
  const segments: PathSegment[] = [];
  // Match both property.name and [index] patterns
  const regex = /\.?(\w+)|\[(\d+)\]/g;
  let match;

  while ((match = regex.exec(path)) !== null) {
    if (match[1]) {
      segments.push({ type: 'property', key: match[1] });
    } else if (match[2]) {
      segments.push({ type: 'array', key: parseInt(match[2], 10) });
    }
  }

  return segments;
}

/**
 * Check if an element tag is a Discord component
 */
function isDiscordComponentTag(tag: string): boolean {
  return DISCORD_COMPONENT_TAGS.has(tag.toLowerCase());
}

/**
 * Get Discord component children of an element (filters out non-component elements)
 */
function getComponentChildren(element: Element): Element[] {
  return Array.from(element.children).filter(child =>
    isDiscordComponentTag(child.tagName.toLowerCase())
  );
}

/**
 * Navigate HTML DOM following Discord's component path
 * Returns the exact element that has the error
 */
function findHTMLElementByPath(
  sourceHTML: string,
  segments: PathSegment[],
  components?: any[]
): { element: Element; annotation?: string } | null {
  try {
    const dom = new JSDOM(`<root>${sourceHTML}</root>`);
    const document = dom.window.document;
    const root = document.querySelector('root');
    if (!root) return null;

    // Find the main components container (skip modal type)
    let currentElement: Element | null = root.querySelector('components:not([type="modal"])') || root;
    let currentComponentsArray = components;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!currentElement) return null;

      if (segment.type === 'property') {
        const key = segment.key as string;

        if (key === 'components') {
          // "components" property means we look at children - continue to array index
          continue;
        } else if (key === 'accessory') {
          // Find <accessory> child
          const accessory = currentElement.querySelector(':scope > accessory');
          if (accessory) {
            currentElement = accessory;
          } else {
            // Accessory is MISSING - this is the error!
            return {
              element: currentElement,
              annotation: `<accessory> element is missing! This element should contain an <accessory>.`
            };
          }
        } else if (key === 'content' || key === 'label' || key === 'title' || key === 'placeholder' || key === 'url' || key === 'custom_id') {
          // These are text/attribute properties - return current element
          return {
            element: currentElement,
            annotation: `Error in the "${key}" field.`
          };
        }
      } else if (segment.type === 'array') {
        const index = segment.key as number;

        // Get component children (filter out non-component elements)
        const componentChildren = getComponentChildren(currentElement);

        if (index < componentChildren.length) {
          currentElement = componentChildren[index];
          // Update the JSON components array reference for the next iteration
          if (currentComponentsArray && Array.isArray(currentComponentsArray) && currentComponentsArray[index]) {
            currentComponentsArray = currentComponentsArray[index].components;
          }
        } else {
          // Index out of bounds - not enough children
          return {
            element: currentElement,
            annotation: `Expected child element #${index + 1} but only found ${componentChildren.length}!`
          };
        }
      }
    }

    return currentElement ? { element: currentElement } : null;
  } catch (e) {
    return null;
  }
}

/**
 * Format outerHTML for display - indent and optionally truncate
 */
function formatOuterHTML(outerHTML: string, maxLength: number = 600): string {
  // Pretty format by adding newlines
  let formatted = outerHTML
    .replace(/></g, '>\n<')
    .replace(/>\s+</g, '>\n<');

  // Truncate if too long
  if (formatted.length > maxLength) {
    const half = Math.floor(maxLength / 2) - 30;
    formatted = formatted.substring(0, half) + '\n    ... (truncated) ...\n' + formatted.substring(formatted.length - half);
  }

  // Basic indentation
  const lines = formatted.split('\n');
  let indent = 0;
  const indented = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('</')) indent = Math.max(0, indent - 1);
    const result = '    '.repeat(indent) + trimmed;
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
      indent++;
    }
    return result;
  });

  return indented.join('\n');
}

/**
 * Navigate through JSON components tree for breadcrumb generation
 */
function navigateComponentTree(components: any[], segments: PathSegment[]): { breadcrumb: string[] } | null {
  let current: any = { components };
  const breadcrumb: string[] = [];

  for (const segment of segments) {
    if (segment.type === 'property') {
      const key = segment.key as string;
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
        if (key !== 'components' && key !== 'data') {
          breadcrumb.push(key);
        }
      } else {
        return null;
      }
    } else if (segment.type === 'array') {
      const index = segment.key as number;
      if (Array.isArray(current) && index < current.length) {
        current = current[index];
        const typeName = current?.type ? (COMPONENT_TYPE_NAMES[current.type] || `Type${current.type}`) : 'Element';
        const name = current?.custom_id?.split('$')[1]?.split('/')[0] ||
          current?.label ||
          current?.placeholder?.substring(0, 20) ||
          '';
        breadcrumb.push(`${typeName}[${index}]${name ? ` "${name}"` : ''}`);
      } else {
        return null;
      }
    }
  }

  return { breadcrumb };
}

/**
 * Parse Discord API errors into user-friendly format
 */
export function parseDiscordComponentError(
  error: any,
  components?: any[],
  sourceHTML?: string
): ParsedDiscordError {
  const componentErrors: ComponentErrorInfo[] = [];

  // Try to extract error details from various Discord.js error formats
  let rawErrors: Record<string, { code: string; message: string }[]> = {};

  if (error.rawError?.errors) {
    rawErrors = flattenDiscordErrors(error.rawError.errors);
  } else if (error.errors) {
    rawErrors = flattenDiscordErrors(error.errors);
  } else if (typeof error.message === 'string') {
    const lines = error.message.split('\n');
    for (const line of lines) {
      const match = line.match(/^([\w\[\]\.]+)\[(\w+)\]:\s*(.+)$/);
      if (match) {
        const [, path, code, message] = match;
        if (!rawErrors[path]) rawErrors[path] = [];
        rawErrors[path].push({ code, message });
      }
    }
  }

  // Process each error
  for (const [path, errors] of Object.entries(rawErrors)) {
    for (const { code, message } of errors) {
      const pathSegments = parseErrorPath(path);
      const errorInfo = ERROR_CODE_EXPLANATIONS[code] || {
        explanation: message,
        suggestion: 'Check the Discord API documentation for this error'
      };

      const errorEntry: ComponentErrorInfo = {
        path,
        code,
        message,
        pathSegments,
        explanation: errorInfo.explanation,
        suggestion: errorInfo.suggestion
      };

      // Find the actual HTML element using JSDOM
      if (sourceHTML) {
        const htmlResult = findHTMLElementByPath(sourceHTML, pathSegments, components);
        if (htmlResult) {
          errorEntry.htmlElement = formatOuterHTML(htmlResult.element.outerHTML);
          errorEntry.htmlAnnotation = htmlResult.annotation;
        }
      }

      componentErrors.push(errorEntry);
    }
  }

  // Generate formatted message
  const formattedMessage = generateFormattedMessage(componentErrors, components, error);

  return {
    original: error,
    componentErrors,
    formattedMessage
  };
}

/**
 * Generate a beautifully formatted error message with actual HTML snippets
 */
function generateFormattedMessage(errors: ComponentErrorInfo[], components?: any[], originalError?: any): string {
  let msg = '\n';
  msg += '╔══════════════════════════════════════════════════════════════════════════════╗\n';
  msg += '║            🚨 Discord Components V2 - Validation Error                       ║\n';
  msg += '╠══════════════════════════════════════════════════════════════════════════════╣\n';

  if (errors.length === 0) {
    msg += `║ ${originalError?.message || 'Unknown error'}\n`;
  } else {
    for (let i = 0; i < errors.length; i++) {
      const err = errors[i];

      // Generate breadcrumb from components tree
      let breadcrumb = 'Unknown';
      if (components) {
        const nav = navigateComponentTree(components, err.pathSegments);
        if (nav && nav.breadcrumb.length > 0) {
          breadcrumb = nav.breadcrumb.join(' → ');
        }
      }

      msg += '║\n';
      msg += `║ ❌ Error ${i + 1}/${errors.length}\n`;
      msg += '║ ┌────────────────────────────────────────────────────────────────────────────\n';
      msg += `║ │ 📍 Path: ${err.path}\n`;
      msg += `║ │ 🏷️  Code: ${err.code}\n`;
      msg += `║ │ 📂 Location: ${breadcrumb}\n`;
      msg += '║ │\n';
      msg += `║ │ ⚠️  Problem: ${err.explanation}\n`;
      msg += `║ │ 💡 Solution: ${err.suggestion}\n`;

      // Show the actual HTML element that caused the error - THIS IS THE KEY FEATURE!
      if (err.htmlElement) {
        msg += '║ │\n';
        if (err.htmlAnnotation) {
          msg += `║ │ 🔍 ${err.htmlAnnotation}\n`;
        }
        msg += '║ │ 📄 Problematic HTML Element:\n';
        msg += '║ │ ┌──────────────────────────────────────────────────────────────────────\n';

        // Show the actual outerHTML with indentation
        const htmlLines = err.htmlElement.split('\n');
        for (const line of htmlLines) {
          msg += `║ │ │ ${line}\n`;
        }

        msg += '║ │ └──────────────────────────────────────────────────────────────────────\n';
      }

      msg += '║ └────────────────────────────────────────────────────────────────────────────\n';
    }
  }

  msg += '║\n';
  msg += '╚══════════════════════════════════════════════════════════════════════════════╝\n';

  return msg;
}

/**
 * Flatten nested Discord error objects into a path-based map
 */
function flattenDiscordErrors(
  obj: any,
  prefix = ''
): Record<string, { code: string; message: string }[]> {
  const result: Record<string, { code: string; message: string }[]> = {};

  if (!obj || typeof obj !== 'object') return result;

  // Check if this is an error entry
  if (obj._errors && Array.isArray(obj._errors)) {
    const cleanPrefix = prefix.replace(/^data\./, '');
    result[cleanPrefix] = obj._errors.map((e: any) => ({
      code: e.code || 'UNKNOWN',
      message: e.message || 'Unknown error'
    }));
  }

  // Recurse into nested objects
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_errors') continue;

    let newPrefix: string;
    if (/^\d+$/.test(key)) {
      // It's an array index - use bracket notation
      newPrefix = prefix ? `${prefix}[${key}]` : `[${key}]`;
    } else {
      newPrefix = prefix ? `${prefix}.${key}` : key;
    }

    const nested = flattenDiscordErrors(value, newPrefix);
    Object.assign(result, nested);
  }

  return result;
}

/**
 * Create a user-friendly error with enhanced message
 */
export function createEnhancedError(
  originalError: any,
  components?: any[],
  sourceHTML?: string,
  componentName?: string
): Error {
  const parsed = parseDiscordComponentError(originalError, components, sourceHTML);

  let enhancedMessage = `[DBI-ComponentsV2] ${componentName ? `Component "${componentName}" ` : ''}Discord API rejected the components:\n\n`;
  enhancedMessage += parsed.formattedMessage;

  const enhancedError = new Error(enhancedMessage);
  (enhancedError as any).originalError = originalError;
  (enhancedError as any).componentErrors = parsed.componentErrors;
  (enhancedError as any).parsedError = parsed;
  (enhancedError as any).type = 'discord-component-validation';

  // Preserve stack trace
  if (originalError.stack) {
    enhancedError.stack = enhancedError.message + '\n\nOriginal stack:\n' + originalError.stack;
  }

  return enhancedError;
}

/**
 * Check if an error is a Discord component validation error
 */
export function isComponentValidationError(error: any): boolean {
  if (!error) return false;

  // Check for common Discord.js error patterns
  if (error.code === 50035) return true; // Invalid Form Body
  if (error.rawError?.code === 50035) return true;

  // Check error message patterns
  const message = error.message || '';
  if (message.includes('components[') && message.includes('[BASE_TYPE')) return true;
  if (message.includes('Invalid Form Body')) return true;

  return false;
}

/**
 * Wrap an async function to enhance Discord component errors
 */
export function withEnhancedErrors<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { components?: any[]; sourceHTML?: string; componentName?: string } = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (isComponentValidationError(error)) {
        throw createEnhancedError(error, options.components, options.sourceHTML, options.componentName);
      }
      throw error;
    }
  }) as T;
}

/**
 * Discord Bot Infrastructure - Svelte Components Type Definitions
 * 
 * This file provides type definitions for Svelte components used with DBI.
 * These types are available globally in .svelte files within the DBI context.
 */

import type {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
  ThreadChannel
} from "discord.js";

declare global {
  // ============================================
  // RENDER HELPERS
  // ============================================

  /**
   * Force renders the component by calling render() on the Svelte component.
   * Use this when you need to manually trigger a render outside of reactive updates.
   * 
   * @returns The rendered component JSON
   * 
   * @example
   * ```svelte
   * function handleClick() {
   *   data.count++;
   *   render(); // Force immediate render
   * }
   * ```
   */
  function render(): any;

  /**
   * Updates the message using interaction.update().
   * Best used for button/select menu interactions where you want to update the existing message.
   * Disables auto-render since manual update is called.
   * 
   * @returns Promise that resolves when update is complete
   * 
   * @example
   * ```svelte
   * async function handleButton() {
   *   data.count++;
   *   await update(); // Updates the message with new data
   * }
   * ```
   */
  function update(): Promise<void>;

  /**
   * Re-renders the message using message.edit().
   * Use this after reply/followUp when you need to update the original message.
   * Disables auto-render since manual rerender is called.
   * 
   * @returns Promise that resolves when edit is complete
   * 
   * @example
   * ```svelte
   * async function handleButton() {
   *   await ctx.interaction.reply({ content: "Processing..." });
   *   data.result = await fetchData();
   *   await rerender(); // Updates the original message
   * }
   * ```
   */
  function rerender(): Promise<void>;

  /**
   * Disables automatic rendering for the current handler execution.
   * Use when you don't want data changes to trigger a UI update.
   * 
   * @example
   * ```svelte
   * function handleBackgroundTask() {
   *   noRender(); // Prevent auto-render
   *   data.internalState = calculateSomething(); // Won't trigger render
   * }
   * ```
   */
  function noRender(): void;

  /**
   * Sets the minimum interval between renders (throttle).
   * Default is 250ms. Use this to control render frequency for rapid updates.
   * 
   * @param ms - Minimum milliseconds between renders
   * 
   * @example
   * ```svelte
   * setThrottle(500); // Minimum 500ms between renders
   * 
   * // For a timer that updates every second:
   * setThrottle(1000);
   * ```
   */
  function setThrottle(ms: number): void;

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  /**
   * Registers a callback to run when the component is first mounted/sent.
   * If the callback returns a function, it will be called on destroy (cleanup).
   * 
   * @param callback - Function to run on mount. Can return a cleanup function.
   * 
   * @example
   * ```svelte
   * onMount(() => {
   *   console.log("Component mounted!");
   *   
   *   const interval = setInterval(() => {
   *     data.seconds++;
   *   }, 1000);
   *   
   *   // Return cleanup function
   *   return () => clearInterval(interval);
   * });
   * ```
   */
  function onMount(callback: () => void | (() => void)): void;

  /**
   * Registers a callback to run when the component is destroyed.
   * Use for cleanup: clearing intervals, timers, subscriptions, etc.
   * 
   * @param callback - Function to run on destroy
   * 
   * @example
   * ```svelte
   * let timer;
   * 
   * onMount(() => {
   *   timer = setInterval(() => data.count++, 1000);
   * });
   * 
   * onDestroy(() => {
   *   clearInterval(timer);
   *   console.log("Cleaned up!");
   * });
   * ```
   */
  function onDestroy(callback: () => void): void;

  // ============================================
  // COMPONENT CONTROL
  // ============================================

  /**
   * Destroys the component instance manually.
   * - Runs all onDestroy callbacks (clears intervals, timers, etc.)
   * - Removes the ref from DBI store
   * - Disables further auto-renders
   * 
   * Use when you want to clean up the component programmatically.
   * 
   * @example
   * ```svelte
   * function handleClose() {
   *   destroy(); // Clean up everything
   * }
   * 
   * // Or after a timeout:
   * onMount(() => {
   *   setTimeout(() => {
   *     destroy(); // Auto-destroy after 60 seconds
   *   }, 60000);
   * });
   * ```
   */
  function destroy(): void;

  // ============================================
  // REACTIVITY (Svelte 5 Runes)
  // ============================================

  /**
   * Creates a reactive effect that runs when its dependencies change.
   * Similar to Svelte 5's $effect rune.
   * 
   * @param callback - Function to run when dependencies change
   * 
   * @example
   * ```svelte
   * $effect(() => {
   *   console.log("Count changed:", data.count);
   * });
   * ```
   */
  function $effect(callback: () => void): void;

  // ============================================
  // CONTEXT TYPES
  // ============================================

  /**
   * The interaction context available in handlers.
   * Contains the Discord interaction and helper methods.
   */
  interface DBIContext<T extends Interaction = Interaction> {
    /** The Discord.js interaction object */
    interaction: T;
    /** The DBI instance */
    dbi: any;
    /** Locale helper for translations */
    locale: {
      user: (key: string, ...args: any[]) => string;
      guild: (key: string, ...args: any[]) => string;
    };
  }

  /**
   * The context object available in Svelte script handlers.
   * Automatically typed based on the interaction type.
   */
  const ctx: DBIContext<ButtonInteraction | StringSelectMenuInteraction | UserSelectMenuInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction | MentionableSelectMenuInteraction | ModalSubmitInteraction>;

  // ============================================
  // DATA TYPES
  // ============================================

  /**
   * The reactive data object passed to the component.
   * Changes to this object automatically trigger re-renders.
   * 
   * Special properties:
   * - `$ref`: Unique reference ID for the component instance
   * - `$unRef`: Set to true to destroy the component
   * 
   * @example
   * ```svelte
   * <script>
   *   let { data = $bindable() } = $props();
   *   
   *   // data is reactive - changes trigger re-render
   *   function increment() {
   *     data.count++; // Auto-renders
   *   }
   * </script>
   * ```
   */
  interface DBIData {
    /** Unique reference ID for this component instance */
    $ref?: string;
    /** Set to true to destroy this component instance */
    $unRef?: boolean;
    /** Any additional data properties */
    [key: string]: any;
  }
}

// ============================================
// MODULE DECLARATIONS
// ============================================

declare module "*.svelte" {
  import type { Component } from "svelte";

  const component: Component<any, any, any>;
  export default component;
}

// ============================================
// SVELTE HTML ELEMENTS (Discord Components V2)
// ============================================

declare module "svelte/elements" {
  type ButtonStyle = "Primary" | "Secondary" | "Success" | "Danger" | "Link" | "Premium";
  type TextInputStyle = "Short" | "Paragraph";
  type SelectType = "user" | "role" | "channel" | "mentionable";

  // Common attributes for interactive components
  interface DBIInteractiveAttributes {
    /** Handler function for this component */
    handler?: (ctx: any) => void | Promise<void>;
    /** Custom ID for the component (auto-generated if not provided) */
    "custom-id"?: string;
    /** Name for auto-generated custom ID */
    name?: string;
    /** Time-to-live for the component data in milliseconds */
    ttl?: number | string;
    /** Whether the component is disabled */
    disabled?: boolean;
  }

  // Data attributes for passing data to handlers
  interface DBIDataAttributes {
    /** Data attribute with index and type: data-0:string, data-1:int, etc. */
    [key: `data-${number}:${"string" | "str" | "int" | "integer" | "float" | "number" | "bool" | "boolean" | "ref" | "reference" | "json"}`]: string;
    /** Simple data attribute */
    data?: string;
  }

  // ============================================
  // DISCORD BUTTON
  // ============================================
  interface DiscordButtonAttributes extends DBIInteractiveAttributes, DBIDataAttributes {
    /** Button style: Primary, Secondary, Success, Danger, Link, Premium */
    style?: ButtonStyle;
    /** Alternative to style attribute */
    "button-style"?: ButtonStyle;
    /** Emoji to display on the button */
    emoji?: string;
    /** URL for Link style buttons */
    url?: string;
    /** SKU ID for Premium style buttons */
    "sku-id"?: string;
  }

  // ============================================
  // SELECT MENUS
  // ============================================
  interface DBISelectMenuAttributes extends DBIInteractiveAttributes, DBIDataAttributes {
    /** Placeholder text when nothing is selected */
    placeholder?: string;
    /** Minimum number of values that must be selected */
    "min-values"?: number | string;
    /** Maximum number of values that can be selected */
    "max-values"?: number | string;
  }

  interface StringSelectAttributes extends DBISelectMenuAttributes { }
  interface UserSelectAttributes extends DBISelectMenuAttributes { }
  interface RoleSelectAttributes extends DBISelectMenuAttributes { }
  interface ChannelSelectAttributes extends DBISelectMenuAttributes { }
  interface MentionableSelectAttributes extends DBISelectMenuAttributes { }

  // ============================================
  // SELECT OPTION
  // ============================================
  interface SelectOptionAttributes {
    /** The value sent when this option is selected */
    value?: string;
    /** Description shown below the label */
    description?: string;
    /** Emoji to display */
    emoji?: string;
    /** Whether this option is selected by default */
    default?: boolean | "";
    /** Option ID for non-string selects */
    id?: string;
    /** Option type for non-string selects */
    type?: string;
  }

  // ============================================
  // TEXT DISPLAY
  // ============================================
  interface TextDisplayAttributes {
    /** Content is the text inside the element */
  }

  // ============================================
  // SECTION
  // ============================================
  interface SectionAttributes {
    /** Section contains <components> and optionally an <accessory> */
  }

  // ============================================
  // THUMBNAIL
  // ============================================
  interface ThumbnailAttributes {
    /** URL of the thumbnail image */
    url?: string;
    /** Alternative to url attribute */
    media?: string;
  }

  // ============================================
  // MEDIA GALLERY
  // ============================================
  interface MediaGalleryAttributes {
    /** Contains <item> elements */
  }

  interface MediaGalleryItemAttributes {
    /** URL of the media */
    url?: string;
    /** Description of the media */
    description?: string;
    /** Whether the media is a spoiler */
    spoiler?: boolean | "";
  }

  // ============================================
  // FILE
  // ============================================
  interface FileAttributes {
    /** URL of the file */
    url?: string;
    /** Whether the file is a spoiler */
    spoiler?: boolean | "";
  }

  // ============================================
  // SEPARATOR
  // ============================================
  interface SeparatorAttributes {
    /** Whether to show a divider line */
    divider?: boolean | "";
    /** Spacing size (1-3) */
    spacing?: number | string;
  }

  // ============================================
  // CONTAINER
  // ============================================
  interface ContainerAttributes {
    /** Accent color (hex, rgb, or decimal) */
    "accent-color"?: string;
    /** Whether the container content is a spoiler */
    spoiler?: boolean | "";
  }

  // ============================================
  // ACTION ROW
  // ============================================
  interface ActionRowAttributes {
    /** Contains buttons or a single select menu */
  }

  // ============================================
  // COMPONENTS WRAPPER
  // ============================================
  interface ComponentsAttributes {
    /** Root wrapper for Discord components */
  }

  // ============================================
  // ACCESSORY WRAPPER
  // ============================================
  interface AccessoryAttributes {
    /** Wrapper for section accessory (thumbnail or button) */
  }

  // ============================================
  // TEXT INPUT (for Modals)
  // ============================================
  interface TextInputAttributes {
    /** Custom ID for the text input */
    "custom-id"?: string;
    /** Alternative to custom-id */
    id?: string;
    /** Label shown above the input */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Input style: Short or Paragraph */
    style?: TextInputStyle;
    /** Alternative to style */
    "input-style"?: TextInputStyle;
    /** Minimum character length */
    "min-length"?: number | string;
    /** Maximum character length */
    "max-length"?: number | string;
    /** Whether the input is required */
    required?: boolean | "";
    /** Default value */
    value?: string;
  }

  // ============================================
  // EXTEND SVELTE'S INTRINSIC ELEMENTS
  // ============================================
  export interface SvelteHTMLElements {
    // Layout & Structure
    /** Root wrapper containing all Discord components */
    "components": ComponentsAttributes;
    /** Row container for buttons or a single select menu */
    "action-row": ActionRowAttributes;
    /** Wrapper for section accessory element */
    "accessory": AccessoryAttributes;

    // Interactive Components
    /** Discord button component */
    "button": DiscordButtonAttributes;
    /** Alias for button */
    "discord-button": DiscordButtonAttributes;
    /** String select menu with custom options */
    "string-select": StringSelectAttributes;
    /** User select menu */
    "user-select": UserSelectAttributes;
    /** Role select menu */
    "role-select": RoleSelectAttributes;
    /** Channel select menu */
    "channel-select": ChannelSelectAttributes;
    /** Mentionable (user/role) select menu */
    "mentionable-select": MentionableSelectAttributes;
    /** Option for select menus */
    "option": SelectOptionAttributes;

    // Display Components
    /** Text display component - renders markdown text */
    "text-display": TextDisplayAttributes;
    /** Section with components and optional accessory */
    "section": SectionAttributes;
    /** Alias for section */
    "discord-section": SectionAttributes;
    /** Thumbnail image */
    "thumbnail": ThumbnailAttributes;
    /** Media gallery with multiple items */
    "media-gallery": MediaGalleryAttributes;
    /** Item in a media gallery */
    "item": MediaGalleryItemAttributes;
    /** File attachment */
    "file": FileAttributes;
    /** Visual separator between components */
    "separator": SeparatorAttributes;
    /** Container with accent color */
    "container": ContainerAttributes;

    // Modal Components
    /** Text input for modals */
    "text-input": TextInputAttributes;
  }
}

// ============================================
// SVELTE PROPS HELPER
// ============================================

declare module "svelte" {
  /**
   * Svelte 5 $props() rune for declaring component props.
   * Use with $bindable() for two-way binding.
   * 
   * @example
   * ```svelte
   * <script>
   *   let { data = $bindable(), otherProp } = $props();
   * </script>
   * ```
   */
  export function $props<T extends Record<string, any>>(): T;

  /**
   * Svelte 5 $bindable() rune for two-way bindable props.
   * 
   * @example
   * ```svelte
   * <script>
   *   let { value = $bindable() } = $props();
   * </script>
   * ```
   */
  export function $bindable<T>(initial?: T): T;

  /**
   * Svelte 5 $state() rune for reactive state.
   * 
   * @example
   * ```svelte
   * <script>
   *   let count = $state(0);
   * </script>
   * ```
   */
  export function $state<T>(initial: T): T;

  /**
   * Svelte 5 $derived() rune for derived/computed values.
   * 
   * @example
   * ```svelte
   * <script>
   *   let count = $state(0);
   *   let doubled = $derived(count * 2);
   * </script>
   * ```
   */
  export function $derived<T>(expression: T): T;
}

export { };

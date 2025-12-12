# API Reference

Complete API reference for DBI (Discord Bot Infrastructure).

---

## Table of Contents

- [createDBI](#createdbi)
- [DBI Class](#dbi-class)
- [Register API](#register-api)
- [Interaction Classes](#interaction-classes)
- [Event Classes](#event-classes)
- [Locale Classes](#locale-classes)
- [Utility Functions](#utility-functions)
- [Types](#types)

---

## createDBI

Creates a new DBI instance.

```typescript
function createDBI<TNamespace, TOtherType>(
  namespace: TNamespace,
  config: DBIConfigConstructor<TNamespace, TOtherType>
): DBI<TNamespace, TOtherType>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `namespace` | `string` | Unique identifier for this bot instance |
| `config` | `DBIConfigConstructor` | Configuration object |

### Config Options

```typescript
interface DBIConfigConstructor {
  // Discord client configuration
  discord: {
    token: string;
    options: Discord.ClientOptions;
  } | Array<{
    namespace: string;
    token: string;
    options: Discord.ClientOptions;
  }>;
  
  // Default settings
  defaults?: {
    locale?: {
      name?: string;
      invalidPath?: string | ((ctx: { path: string; locale: DBILocale }) => string);
    };
    directMessages?: boolean;
    defaultMemberPermissions?: Discord.PermissionsString[];
    messageCommands?: {
      deferReplyContent?: string | ((ctx) => string | Promise<string>);
    };
  };
  
  // Sharding mode
  sharding?: "hybrid" | "default" | "off";
  
  // Persistent store
  store?: DBIStore;
  
  // Reference auto-cleanup
  references?: {
    autoClear?: {
      check: number;  // Check interval in ms
      ttl: number;    // Time-to-live in ms
    };
  };
  
  // Inline listener auto-cleanup
  inlineListeners?: {
    autoClear?: {
      check: number;
      ttl: number;
    };
  };
  
  // Initial data
  data?: {
    other?: Record<string, any>;
    refs?: Map<string, { at: number; value: any; ttl?: number }>;
  };
  
  // Strict mode (throws on duplicates)
  strict?: boolean;
  
  // Message command configuration
  messageCommands?: {
    prefixes: string[] | ((ctx: { message: Discord.Message }) => string[] | Promise<string[]>);
    typeAliases?: {
      booleans?: Record<string, boolean>;
    };
  };
}
```

### Example

```javascript
const dbi = createDBI("my-bot", {
  strict: true,
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: { intents: ["Guilds"] }
  },
  defaults: {
    locale: { name: "en" },
    directMessages: false
  }
});
```

---

## DBI Class

Main DBI instance class.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `namespace` | `string` | Bot namespace |
| `config` | `DBIConfig` | Configuration object |
| `data` | `DBIData` | Data storage |
| `events` | `Events` | Event system |
| `cluster` | `ClusterClient \| undefined` | Hybrid sharding cluster |
| `loaded` | `boolean` | Whether DBI is loaded |

### data Object

```typescript
interface DBIData {
  interactions: Discord.Collection<string, TDBIInteractions>;
  events: Discord.Collection<string, DBIEvent>;
  locales: Discord.Collection<string, DBILocale>;
  interactionLocales: Discord.Collection<string, DBIInteractionLocale>;
  other: Record<string, any>;
  eventMap: Record<string, string[]>;
  customEventNames: Set<string>;
  unloaders: Set<() => void>;
  registers: Set<Function>;
  registerUnloaders: Set<Function>;
  refs: Map<string, { at: number; value: any; ttl?: number }>;
  clients: ClientsArray;
}
```

### Methods

#### register(callback)

Register bot features.

```typescript
async register(
  callback: (api: DBIRegisterAPI) => void | Promise<void>
): Promise<void>
```

#### load(...flags)

Load all registered features.

```typescript
async load(...flags: string[]): Promise<boolean>
```

#### unload()

Unload all features and cleanup.

```typescript
async unload(): Promise<boolean>
```

#### login()

Connect to Discord.

```typescript
async login(): Promise<void>
```

#### publish(type, guildId?, clear?)

Publish commands to Discord.

```typescript
async publish(type: "Global", clear?: boolean): Promise<void>
async publish(type: "Guild", guildId: string, clear?: boolean): Promise<void>
```

#### interaction(name)

Get a registered interaction.

```typescript
interaction<T>(name: T): TDBIInteractions
```

#### event(name)

Get a registered event.

```typescript
event(name: string): DBIEvent
```

#### locale(name)

Get a registered locale.

```typescript
locale(name: string): DBILocale
```

#### client(namespace?)

Get a client.

```typescript
client(namespace?: string): TDBIClientData
```

#### emit(name, args)

Emit a custom event.

```typescript
emit(name: string, args: object): void
```

#### get(key, defaultValue?)

Get from `data.other`.

```typescript
get<K>(key: K, defaultValue?: any): any
```

#### set(key, value)

Set in `data.other`.

```typescript
set<K>(key: K, value: any): void
```

#### has(key)

Check if key exists in `data.other`.

```typescript
has(key: string): boolean
```

#### delete(key)

Delete from `data.other`.

```typescript
delete(key: string): boolean
```

---

## Register API

Functions available in the register callback.

### ChatInput

Create a slash command.

```typescript
ChatInput(config: {
  name: string;
  description: string;
  options?: any[];
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  rateLimits?: DBIRateLimit[];
  flag?: string;
  publish?: string;
  other?: {
    messageCommand?: {
      aliases?: string[];
      ignore?: boolean;
    };
  };
  onExecute: (ctx: IDBIChatInputExecuteCtx) => void | Promise<void>;
}): DBIChatInput
```

### ChatInputOptions

Option builders for ChatInput.

```typescript
class ChatInputOptions {
  string(config): ApplicationCommandOption
  stringChoices(config): ApplicationCommandOption
  stringAutocomplete(config): ApplicationCommandOption
  integer(config): ApplicationCommandOption
  integerChoices(config): ApplicationCommandOption
  integerAutocomplete(config): ApplicationCommandOption
  number(config): ApplicationCommandOption
  numberChoices(config): ApplicationCommandOption
  numberAutocomplete(config): ApplicationCommandOption
  boolean(config): ApplicationCommandOption
  user(config): ApplicationCommandOption
  channel(config): ApplicationCommandOption
  role(config): ApplicationCommandOption
  mentionable(config): ApplicationCommandOption
  attachment(config): ApplicationCommandOption
}
```

### Button

Create a button component.

```typescript
Button(config: {
  name: string;
  options?: {
    style: Discord.ButtonStyle;
    label?: string;
    emoji?: string;
    disabled?: boolean;
    url?: string;
  };
  rateLimits?: DBIRateLimit[];
  flag?: string;
  ttl?: number;
  onExecute: (ctx: IDBIButtonExecuteCtx) => void | Promise<void>;
}): DBIButton
```

### StringSelectMenu

Create a string select menu.

```typescript
StringSelectMenu(config: {
  name: string;
  options?: {
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options: Array<{
      label: string;
      value: string;
      description?: string;
      emoji?: string;
      default?: boolean;
    }>;
  };
  rateLimits?: DBIRateLimit[];
  flag?: string;
  ttl?: number;
  onExecute: (ctx: IDBISelectMenuExecuteCtx) => void | Promise<void>;
}): DBIStringSelectMenu
```

### UserSelectMenu, RoleSelectMenu, ChannelSelectMenu, MentionableSelectMenu

Similar to StringSelectMenu but for user/role/channel/mentionable selection.

### Modal

Create a modal dialog.

```typescript
Modal(config: {
  name: string;
  options?: {
    title: string;
    components: Discord.ActionRowData<Discord.ModalActionRowComponentData>[];
  };
  rateLimits?: DBIRateLimit[];
  flag?: string;
  ttl?: number;
  onExecute: (ctx: IDBIModalExecuteCtx) => void | Promise<void>;
}): DBIModal
```

### MessageContextMenu

Create a message context menu command.

```typescript
MessageContextMenu(config: {
  name: string;
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  rateLimits?: DBIRateLimit[];
  flag?: string;
  publish?: string;
  onExecute: (ctx: IDBIMessageContextMenuExecuteCtx) => void | Promise<void>;
}): DBIMessageContextMenu
```

### UserContextMenu

Create a user context menu command.

```typescript
UserContextMenu(config: {
  name: string;
  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  rateLimits?: DBIRateLimit[];
  flag?: string;
  publish?: string;
  onExecute: (ctx: IDBIUserContextMenuExecuteCtx) => void | Promise<void>;
}): DBIUserContextMenu
```

### Event

Create an event handler.

```typescript
Event(config: {
  name: keyof ClientEvents;
  id?: string;
  disabled?: boolean;
  triggerType?: "OneByOne" | "OneByOneGlobal" | "Random" | "First";
  ordered?: {
    await?: boolean;
    delayBefore?: number;
    delayAfter?: number;
  };
  flag?: string;
  ttl?: number;
  onExecute: (ctx) => void | Promise<void>;
}): DBIEvent
```

### Locale

Create a content locale.

```typescript
Locale(config: {
  name: TDBILocaleString;
  data: Record<string, any>;
  flag?: string;
}): DBILocale
```

### InteractionLocale

Create an interaction locale (command translation).

```typescript
InteractionLocale(config: {
  name: string;  // Name of the interaction to translate
  data: Record<string, {
    name: string;
    description: string;
    options?: Record<string, {
      name: string;
      description: string;
      choices?: Record<string, string>;
    }>;
  }>;
  flag?: string;
}): DBIInteractionLocale
```

### CustomEvent

Define a custom event.

```typescript
CustomEvent(config: {
  name: string;
  map: Record<string, string>;
}): DBICustomEvent
```

### HTMLComponentsV2

Create a Svelte/Eta template component.

```typescript
HTMLComponentsV2(config: {
  name: string;
  mode?: "svelte" | "eta";
  template?: string;
  file?: string;
  handlers?: any[];
  rateLimits?: DBIRateLimit[];
  flag?: string;
  onExecute?: (ctx) => void;
}): DBIHTMLComponentsV2
```

### Inline Creators

Create one-time use components.

```typescript
createInlineButton(config): DBIButton
createInlineStringSelectMenu(config): DBIStringSelectMenu
createInlineUserSelectMenu(config): DBIUserSelectMenu
createInlineRoleSelectMenu(config): DBIRoleSelectMenu
createInlineChannelSelectMenu(config): DBIChannelSelectMenu
createInlineMentionableSelectMenu(config): DBIMentionableSelectMenu
createInlineModal(config): DBIModal
createInlineEvent(config): DBIEvent
```

### onUnload

Register a cleanup callback.

```typescript
onUnload(callback: () => void | Promise<void>): void
```

---

## Interaction Classes

### DBIBaseInteraction

Base class for all interactions.

```typescript
class DBIBaseInteraction {
  dbi: DBI;
  name: string;
  description: string;
  type: TDBIInteractionTypes;
  options?: any;
  other?: Record<string, any>;
  rateLimits?: DBIRateLimit[];
  flag?: string;
  publish?: string;
  ttl?: number;
  at?: number;
  
  toJSON(args?: IDBIToJSONArgs): any;
  onExecute(ctx: IDBIBaseExecuteCtx): void | Promise<void>;
}
```

### toJSON Options

```typescript
interface IDBIToJSONArgs {
  overrides?: Record<string, any>;
  reference?: {
    data?: any[];
    ttl?: number;
  };
}
```

### Execution Context

```typescript
interface IDBIBaseExecuteCtx {
  interaction: Discord.Interaction;
  locale: {
    user: DBILocale;
    guild?: DBILocale;
  };
  dbi: DBI;
  dbiInteraction: TDBIInteractions;
  setRateLimit: (type: TDBIRateLimitTypes, duration: number) => Promise<void>;
  other: Record<string, any>;
  clientNamespace: string;
  v2: boolean;
}
```

### Builder Methods

Each component class has a `createBuilder()` method:

```typescript
// Button
const builder = dbi.interaction("my-btn").createBuilder();
builder.setLabel("Label")
       .setEmoji("🎉")
       .setStyle(Discord.ButtonStyle.Primary)
       .setReference(["data"])
       .setTTL(60000)
       .toJSON();

// Select Menu
const builder = dbi.interaction("my-select").createBuilder();
builder.setPlaceholder("Select...")
       .setMinValues(1)
       .setMaxValues(3)
       .setOptions([...])
       .toJSON();
```

---

## Event Classes

### DBIEvent

Event handler class.

```typescript
class DBIEvent {
  type: "Event";
  id?: string;
  name: string;
  other?: Record<string, any>;
  triggerType?: "OneByOne" | "OneByOneGlobal" | "Random" | "First";
  ordered?: TDBIEventOrder;
  dbi: DBI;
  disabled: boolean;
  flag?: string;
  ttl?: number;
  at?: number;
  
  toggle(disabled?: boolean): this;
  onExecute(ctx): void | Promise<void>;
}
```

### Events Class

DBI event system.

```typescript
class Events {
  on(
    eventName: TDBIEventNames,
    handler: (data: any) => boolean | Promise<boolean>,
    options?: { once: boolean }
  ): () => void;  // Returns unsubscribe function
  
  trigger(
    name: TDBIEventNames,
    data?: any,
    ignoreResponse?: boolean
  ): Promise<boolean>;
}
```

### DBI Event Names

```typescript
type TDBIEventNames =
  | "beforeInteraction"
  | "afterInteraction"
  | "interactionRateLimit"
  | "beforeEvent"
  | "afterEvent"
  | "interactionError"
  | "eventError"
  | "messageCommandArgumentError"
  | "messageCommandDirectMessageUsageError"
  | "messageCommandDefaultMemberPermissionsError"
  | "clientsReady";
```

---

## Locale Classes

### DBILocale

Content locale class.

```typescript
class DBILocale {
  name: TDBILocaleString;
  data: InfinitePathProxy;  // Auto-callable nested object
  _data: Record<string, any>;  // Raw data
  dbi: DBI;
  flag?: string;
  
  mergeLocale(locale: DBILocale): DBILocale;
  get(path: string): string | null;
  format(path: string, ...args: any[]): string;
}
```

### Usage

```typescript
// Function-style access with variables
locale.data.greeting();           // "Hello!"
locale.data.welcome("John");      // "Welcome, John!"
locale.data.nested.path("a", "b"); // "a and b"

// Direct access
locale.get("greeting");           // "Hello!"
locale.format("welcome", "John"); // "Welcome, John!"
```

---

## Utility Functions

### Utils

```typescript
const { Utils } = require("@mostfeatured/dbi");

// Recursively import all files
await Utils.recursiveImport(path: string): Promise<void>

// Parse a custom ID
Utils.parseCustomId(dbi, customId: string): {
  name: string;
  data: any[];
  v2: boolean;
}

// Build a custom ID
Utils.buildCustomId(
  dbi,
  name: string,
  data: any[],
  ttl?: number,
  v2?: boolean
): string

// Unload a module from require cache
Utils.unloadModule(path: string): void

// Recursively unload modules
Utils.recursiveUnload(path: string): void
```

### MemoryStore

```typescript
class MemoryStore {
  async get(key: string, defaultValue?: any): Promise<any>
  async set(key: string, value: any): Promise<void>
  async delete(key: string): Promise<void>
  async has(key: string): Promise<boolean>
}
```

---

## Types

### Rate Limit Types

```typescript
type TDBIRateLimitTypes =
  | "User"
  | "Channel"
  | "Guild"
  | "Member"
  | "Message";

interface DBIRateLimit {
  type: TDBIRateLimitTypes;
  duration: number;  // milliseconds
}
```

### Interaction Types

```typescript
type TDBIInteractionTypes =
  | "ChatInput"
  | "UserContextMenu"
  | "MessageContextMenu"
  | "Modal"
  | "Autocomplete"
  | "StringSelectMenu"
  | "UserSelectMenu"
  | "ChannelSelectMenu"
  | "MentionableSelectMenu"
  | "RoleSelectMenu"
  | "Button"
  | "HTMLComponentsV2";
```

### Locale Strings

```typescript
type TDBILocaleString =
  | "en" | "bg" | "zh" | "hr" | "cs" | "da" | "nl"
  | "fi" | "fr" | "de" | "el" | "hi" | "hu" | "it"
  | "ja" | "ko" | "no" | "pl" | "pt" | "ro" | "ru"
  | "es" | "sv" | "th" | "tr" | "uk" | "vi";
```

### Store Interface

```typescript
interface DBIStore {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
```

### Client Data

```typescript
interface TDBIClientData {
  namespace: string;
  token: string;
  options: Discord.ClientOptions;
  client: Discord.Client<true>;
}

interface ClientsArray extends Array<TDBIClientData> {
  next(key?: string): TDBIClientData;
  random(): TDBIClientData;
  random(size: number): TDBIClientData[];
  first(): TDBIClientData;
  get(namespace: string): TDBIClientData;
  indexes: Record<string, number>;
}
```

### Referenced Data

```typescript
type TDBIReferencedData = 
  | string 
  | number 
  | {
      [key: string]: any;
      $ref: string;
      $unRef(): boolean;
    };
```

---

## HTMLComponentsV2 (Svelte)

### Component Methods

```typescript
class DBIHTMLComponentsV2 {
  // Send component to interaction or channel
  async send(
    target: Discord.Interaction | Discord.TextChannel,
    options?: {
      data?: Record<string, any>;
      flags?: string[];
      content?: string;
      ephemeral?: boolean;
      reply?: boolean;
      followUp?: boolean;
    }
  ): Promise<void>
  
  // Destroy a specific instance
  destroy(refId: string): void
  
  // Destroy all active instances
  destroyAll(): void
  
  // Get JSON representation
  toJSON(args?: { data?: Record<string, any> }): object
}
```

### Svelte Globals

Available in Svelte component scripts:

```typescript
// Props (Svelte 5 rune)
let { prop1, prop2 } = $props();

// Reactive data proxy
const data: Record<string, any>;

// Render control
function render(): void;
function update(): Promise<void>;
function rerender(): Promise<void>;
function noRender(): void;
function setThrottle(ms: number): void;

// Lifecycle
function onMount(callback: () => void | (() => void)): void;
function onDestroy(callback: () => void): void;
function destroy(): void;

// Handler context
interface HandlerContext {
  interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction;
  dbi: DBI;
  locale: { user: DBILocale; guild?: DBILocale };
}
```

---

## See Also

- [Getting Started](./GETTING_STARTED.md)
- [Chat Input Commands](./CHAT_INPUT.md)
- [Components](./COMPONENTS.md)
- [Events](./EVENTS.md)
- [Localization](./LOCALIZATION.md)
- [Svelte Components](./SVELTE_COMPONENTS.md)
- [Advanced Features](./ADVANCED_FEATURES.md)

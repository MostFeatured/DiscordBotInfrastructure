# DBI Svelte Components System

DBI provides a powerful Svelte 5-based component system for building interactive Discord UI with **Components V2**. This system brings modern reactive programming patterns to Discord bot development, allowing you to create dynamic, stateful interfaces with minimal boilerplate.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Component Structure](#component-structure)
- [Props and Reactivity](#props-and-reactivity)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Render Helpers](#render-helpers)
- [HTML Elements Reference](#html-elements-reference)
- [Handler Functions](#handler-functions)
- [Using External Modules](#using-external-modules)
- [Type Definitions](#type-definitions)
- [Complete Example](#complete-example)

---

## Overview

The DBI Svelte component system provides:

- **Svelte 5 Syntax** - Use modern `$props()` runes and reactive patterns
- **Auto-Reactivity** - UI automatically updates when data changes
- **Lifecycle Hooks** - `onMount` and `onDestroy` for managing timers, intervals, cleanup
- **Throttled Rendering** - Built-in rate limiting to prevent Discord API abuse
- **Type Safety** - Full TypeScript support with autocomplete for Discord components

---

## Quick Start

### 1. Register a Svelte Component

```typescript
import { createDBI } from "@mostfeatured/dbi";
import path from "path";

const dbi = createDBI("my-bot", { /* config */ });

dbi.register(({ HTMLComponentsV2 }) => {
  HTMLComponentsV2({
    name: "my-component",
    mode: "svelte",
    file: path.join(__dirname, "my-component.svelte"),
  });
});
```

### 2. Create the Svelte File

```svelte
<script>
  let { count = 0 } = $props();

  function increment() {
    data.count++;
  }
</script>

<components>
  <text-display>Count: {count}</text-display>
  <action-row>
    <button style="Primary" handler={increment}>+1</button>
  </action-row>
</components>
```

### 3. Send the Component

```typescript
ChatInput({
  name: "counter",
  description: "Interactive counter",
  async onExecute({ interaction, dbi }) {
    const component = dbi.interaction("my-component");
    
    await component.send(interaction, {
      data: { count: 0 }
    });
  }
});
```

---

## Component Structure

A DBI Svelte component consists of two main parts:

### Script Block

Contains your reactive state, handler functions, and lifecycle hooks.

```svelte
<script>
  // Type reference for IDE support
  /// <reference types="@mostfeatured/dbi/svelte" />
  
  // Import external modules
  import stuffs from "stuffs";
  
  // Declare props with Svelte 5 $props() rune
  let {
    products = [],
    currentIndex = 0,
    cart = [],
    view = "browse",
  } = $props();

  // Handler functions (automatically bound to buttons/selects)
  function nextProduct() {
    data.currentIndex = (currentIndex + 1) % products.length;
  }

  function addToCart(ctx) {
    const product = products[currentIndex];
    data.cart = [...cart, product];
    ctx.interaction.reply({
      content: "Added to cart!",
      flags: ["Ephemeral"],
    });
  }

  // Lifecycle
  onMount(() => {
    const interval = setInterval(() => {
      data.elapsedTime += 1;
    }, 1000);
    
    return () => clearInterval(interval); // Cleanup
  });
</script>
```

### Template Block

Contains your Discord UI components wrapped in `<components>`.

```svelte
<components>
  <container accent-color="5865F2">
    <components>
      <text-display>## Welcome!</text-display>
      <action-row>
        <button style="Primary" handler={nextProduct}>Next</button>
      </action-row>
    </components>
  </container>
</components>
```

---

## Props and Reactivity

### Declaring Props

Use Svelte 5's `$props()` rune to declare component props with default values:

```svelte
<script>
  let {
    count = 0,
    items = [],
    settings = { theme: "dark" },
  } = $props();
</script>
```

### The `data` Object

Inside handlers, use the global `data` object to update state. Changes automatically trigger re-renders:

```svelte
<script>
  let { count = 0 } = $props();

  function increment() {
    // Use 'data' to update - triggers auto-render
    data.count++;
  }
  
  function reset() {
    data.count = 0;
  }
</script>
```

### Reactive Updates

The `data` object is wrapped in a Proxy that:

1. Detects property changes
2. Automatically re-renders the component
3. Throttles updates (default: 250ms minimum between renders)

```svelte
<script>
  let { items = [] } = $props();

  function addItem(ctx) {
    // Arrays must be reassigned to trigger reactivity
    data.items = [...items, { name: "New Item" }];
  }
</script>
```

---

## Lifecycle Hooks

### onMount

Runs when the component is first sent. Perfect for setting up timers, intervals, or fetching data.

```svelte
<script>
  let { seconds = 0 } = $props();

  onMount(() => {
    console.log("Component mounted!");
    
    // Start a timer
    const interval = setInterval(() => {
      data.seconds++;
    }, 1000);
    
    // Return cleanup function (optional)
    return () => {
      clearInterval(interval);
      console.log("Timer cleared!");
    };
  });
</script>
```

### onDestroy

Runs when the component is destroyed (via `$unRef` or manual `destroy()` call).

```svelte
<script>
  let timer;

  onMount(() => {
    timer = setInterval(() => data.count++, 1000);
  });

  onDestroy(() => {
    clearInterval(timer);
    console.log("Component destroyed, cleanup complete!");
  });
</script>
```

### Manual Destruction

Call `destroy()` from any handler to manually clean up:

```svelte
<script>
  function handleClose() {
    destroy(); // Runs onDestroy callbacks, removes ref
  }
</script>

<components>
  <action-row>
    <button style="Danger" handler={handleClose}>Close</button>
  </action-row>
</components>
```

---

## Render Helpers

### render()

Force an immediate render of the component:

```svelte
<script>
  function forceUpdate() {
    data.value = computeExpensiveValue();
    render(); // Force immediate render
  }
</script>
```

### update()

Update the message using `interaction.update()`. Best for button clicks:

```svelte
<script>
  async function handleButton() {
    data.count++;
    await update(); // Uses interaction.update()
  }
</script>
```

### rerender()

Re-render using `message.edit()`. Use after `reply()` or `followUp()`:

```svelte
<script>
  async function processData(ctx) {
    await ctx.interaction.reply({ content: "Processing..." });
    
    data.result = await fetchData();
    await rerender(); // Uses message.edit()
  }
</script>
```

### noRender()

Disable auto-render for the current handler:

```svelte
<script>
  function backgroundTask() {
    noRender(); // Don't update UI
    data.internalState = calculate(); // Won't trigger render
  }
</script>
```

### setThrottle(ms)

Set minimum interval between renders:

```svelte
<script>
  // For a timer that updates every second
  setThrottle(1000);
  
  onMount(() => {
    setInterval(() => data.seconds++, 1000);
  });
</script>
```

### lowPriorityUpdate(callback)

Low-priority update for background tasks. If a user interaction handler is running, the callback executes but rendering is skipped (the handler's render will include the changes).

Use this to prevent interval/timeout updates from conflicting with button clicks:

```svelte
<script>
  onMount(() => {
    const interval = setInterval(() => {
      // If user clicks a button during this interval tick,
      // this update won't trigger a conflicting render
      lowPriorityUpdate(() => {
        data.elapsedTime += 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  });
</script>
```

---

## HTML Elements Reference

### Layout Components

#### `<components>`
Root wrapper for all Discord components.

```svelte
<components>
  <!-- Your components here -->
</components>
```

#### `<action-row>`
Container for buttons (max 5) or a single select menu.

```svelte
<action-row>
  <button style="Primary">Click Me</button>
  <button style="Secondary">Or Me</button>
</action-row>
```

#### `<container>`
Colored container with optional accent color.

```svelte
<container accent-color="5865F2" spoiler>
  <components>
    <!-- Content -->
  </components>
</container>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `accent-color` | string | Hex color (e.g., "5865F2", "#FF0000") |
| `spoiler` | boolean | Hide content behind spoiler |

#### `<section>`
Section with components and optional accessory (thumbnail/button).

```svelte
<section>
  <components>
    <text-display>Main content</text-display>
  </components>
  <thumbnail url="https://example.com/image.png"></thumbnail>
</section>
```

#### `<separator>`
Visual divider between components.

```svelte
<separator divider spacing="2"></separator>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `divider` | boolean | Show divider line |
| `spacing` | number | Spacing size (1-3) |

---

### Interactive Components

#### `<button>`
Discord button with various styles.

```svelte
<button 
  style="Primary"
  emoji="🚀"
  handler={handleClick}
  disabled
>
  Click Me
</button>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `style` | "Primary" \| "Secondary" \| "Success" \| "Danger" \| "Link" \| "Premium" | Button style |
| `handler` | function | Handler function reference |
| `emoji` | string | Emoji to display |
| `disabled` | boolean | Disable the button |
| `url` | string | URL for Link style |
| `sku-id` | string | SKU ID for Premium style |

**Note:** You can also use `onclick` as an alias for `handler`.

#### `<string-select>`
Dropdown menu with custom options.

```svelte
<string-select
  placeholder="Choose an option..."
  min-values="1"
  max-values="3"
  handler={handleSelect}
>
  <option value="a" description="First option" emoji="1️⃣" default>
    Option A
  </option>
  <option value="b" description="Second option">
    Option B
  </option>
</string-select>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `placeholder` | string | Placeholder text |
| `min-values` | number | Minimum selections |
| `max-values` | number | Maximum selections |
| `handler` | function | Handler function |
| `disabled` | boolean | Disable the menu |

#### `<option>`
Option for select menus.

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | string | Value sent when selected |
| `description` | string | Description below label |
| `emoji` | string | Emoji to display |
| `default` | boolean | Selected by default |

#### Other Select Menus

```svelte
<user-select placeholder="Select users..." handler={handleUsers}></user-select>
<role-select placeholder="Select roles..." handler={handleRoles}></role-select>
<channel-select placeholder="Select channels..." handler={handleChannels}></channel-select>
<mentionable-select placeholder="Select users/roles..." handler={handleMentionables}></mentionable-select>
```

---

### Display Components

#### `<text-display>`
Renders markdown text.

```svelte
<text-display>
  ## Heading
  **Bold** and *italic* text
  
  - List item 1
  - List item 2
</text-display>
```

#### `<thumbnail>`
Thumbnail image for sections.

```svelte
<thumbnail url="https://example.com/image.png"></thumbnail>
<!-- or -->
<thumbnail media="https://example.com/image.png"></thumbnail>
```

#### `<media-gallery>`
Gallery of images.

```svelte
<media-gallery>
  <item url="https://example.com/1.png" description="Image 1"></item>
  <item url="https://example.com/2.png" spoiler></item>
</media-gallery>
```

#### `<file>`
File attachment display.

```svelte
<file url="attachment://document.pdf" spoiler></file>
```

---

### Modal Components

Discord modals now support many interactive components beyond text inputs. Use the `<field>` wrapper component for the new structure.

#### `<components type="modal">`

Define a modal form that can be shown to users.

```svelte
<components
  type="modal"
  id="feedback-modal"
  title="Submit Feedback"
>
  <!-- New Field wrapper structure (recommended) -->
  <field label="Rating" description="How would you rate our service?">
    <string-select id="rating" placeholder="Select rating">
      <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
      <option value="4">⭐⭐⭐⭐ Great</option>
      <option value="3">⭐⭐⭐ Good</option>
      <option value="2">⭐⭐ Fair</option>
      <option value="1">⭐ Poor</option>
    </string-select>
  </field>
  <field label="Comments" description="Tell us more about your experience">
    <text-input id="comments" style="Paragraph" placeholder="Your feedback..." />
  </field>
</components>
```

#### `<field>`

Wrapper component for modal inputs (Discord's Label component, type 18). **Required for new modal structure.**

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | string | Label text shown above component |
| `description` | string | Optional description text |

#### `<text-input>`

Text input for modal forms.

```svelte
<field label="Username" description="Enter your display name">
  <text-input
    id="username"
    placeholder="Enter your username"
    style="Short"
    min-length="3"
    max-length="32"
    required
  />
</field>

<!-- Legacy format still supported -->
<text-input
  id="username"
  label="Username"
  placeholder="Enter your username"
  style="Short"
/>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` / `custom-id` / `name` | string | Input identifier |
| `label` | string | Label (legacy format only) |
| `placeholder` | string | Placeholder text |
| `style` | "Short" \| "Paragraph" | Input style |
| `min-length` | number | Minimum characters |
| `max-length` | number | Maximum characters |
| `required` | boolean | Is required |
| `value` | string | Default value |

#### `<string-select>` (in modals)

Dropdown select menu in modals. Returns an **array** of selected values.

```svelte
<field label="Choose Bug Type" description="Select the bug category">
  <string-select id="bug-type" placeholder="Select bug type">
    <option value="ant" emoji="🐜">Ant</option>
    <option value="beetle" emoji="🪲">Beetle</option>
    <option value="spider" emoji="🕷️">Spider</option>
  </string-select>
</field>
```

#### `<user-select>`, `<role-select>`, `<mentionable-select>`, `<channel-select>` (in modals)

Auto-populated select menus for modals. Returns an **array** of IDs.

```svelte
<field label="Assign To" description="Select team members">
  <user-select id="assignees" placeholder="Choose users" max-values="3" />
</field>

<field label="Notification Channel" description="Where to post updates">
  <channel-select id="channel" placeholder="Select channel" channel-types="0,5" />
</field>
```

#### `<file-upload>` (in modals)

File upload component for modals. Returns attachment objects.

```svelte
<field label="Attachments" description="Upload relevant files">
  <file-upload id="files" min-values="0" max-values="5" />
</field>
```

#### `<text-display>` (in modals)

Show static text content in modals.

```svelte
<text-display>Please fill out all required fields below.</text-display>
```

### Using Modals with `showModal()`

The `showModal()` function opens a modal and returns a Promise with the submitted values:

```svelte
<script>
  async function openFeedbackModal(ctx) {
    // Show modal and wait for submission
    const { fields, interaction } = await showModal("feedback-modal");
    
    // Extract values
    const rating = fields.rating[0]; // string-select returns array
    const comments = fields.comments; // text-input returns string
    
    // Respond to the submission
    interaction.reply({
      content: `Thanks for your ${rating}-star feedback!`,
      flags: ["Ephemeral"]
    });
  }
</script>
```

### Modal Field Types

Different modal components return different value types:

| Component | Return Type | Example |
|-----------|-------------|---------|
| `text-input` | `string` | `"Hello world"` |
| `string-select` | `string[]` | `["option1", "option2"]` |
| `user-select` | `string[]` | `["123456789"]` (user IDs) |
| `role-select` | `string[]` | `["987654321"]` (role IDs) |
| `channel-select` | `string[]` | `["111222333"]` (channel IDs) |
| `mentionable-select` | `{ values, users, roles }` | IDs with separated types |
| `file-upload` | `Attachment[]` | Uploaded file objects |

---

## Handler Functions

Handler functions receive a `ctx` object with the interaction context:

```svelte
<script>
  function handleButton(ctx) {
    // Access the Discord interaction
    const { interaction } = ctx;
    
    // Reply to the user
    ctx.interaction.reply({
      content: "Button clicked!",
      flags: ["Ephemeral"],
    });
    
    // Access DBI instance
    const { dbi } = ctx;
    
    // Access locale helpers
    const { locale } = ctx;
    const text = locale.user("greeting");
  }
  
  // Handler without ctx - just updates data
  function simpleHandler() {
    data.count++;
    // Auto-renders after handler completes
  }
</script>

<components>
  <action-row>
    <button handler={handleButton}>With Context</button>
    <button handler={simpleHandler}>Simple</button>
  </action-row>
</components>
```

### Context Object

| Property | Type | Description |
|----------|------|-------------|
| `interaction` | ButtonInteraction / SelectMenuInteraction | Discord.js interaction |
| `dbi` | DBI | DBI instance |
| `locale` | object | Locale helpers (`user()`, `guild()`) |

---

## Using External Modules

You can import external modules in your Svelte scripts:

```svelte
<script>
  import stuffs from "stuffs";
  import lodash from "lodash";
  import { someUtil } from "./utils";

  function formatTime(seconds) {
    return stuffs.formatSeconds(seconds);
  }
  
  function sortItems() {
    data.items = lodash.sortBy(items, "name");
  }
</script>
```

Modules are loaded via `require()` at runtime, so they must be installed in your project.

---

## Type Definitions

For full IDE support with autocomplete, add the type reference at the top of your script:

```svelte
<script>
  /// <reference types="@mostfeatured/dbi/svelte" />
  
  // Now you get autocomplete for:
  // - render(), update(), rerender(), noRender(), setThrottle()
  // - onMount(), onDestroy(), destroy()
  // - ctx, data
  // - All HTML elements (text-display, button, etc.)
</script>
```

---

## Complete Example

Here's a complete example of a product showcase component:

### Registration (index.ts)

```typescript
import { createDBI } from "@mostfeatured/dbi";
import path from "path";

const dbi = createDBI("shop-bot", {
  discord: {
    token: process.env.DISCORD_TOKEN,
    options: {
      intents: ["GuildMessages", "Guilds"],
    }
  },
  references: {
    autoClear: {
      ttl: 60000 * 60, // 60 minutes
      check: 60000     // Check every 60 seconds
    }
  }
});

dbi.register(({ ChatInput, HTMLComponentsV2 }) => {
  // Register Svelte component
  HTMLComponentsV2({
    name: "product-showcase",
    mode: "svelte",
    file: path.join(__dirname, "product-showcase.svelte"),
  });

  // Command to show the component
  ChatInput({
    name: "shop",
    description: "Browse our product catalog",
    async onExecute({ interaction, dbi }) {
      const showcase = dbi.interaction("product-showcase");
      
      await showcase.send(interaction, {
        data: {
          products: [
            { name: "Keyboard", price: 149, image: "https://..." },
            { name: "Mouse", price: 79, image: "https://..." },
          ],
          currentIndex: 0,
          cart: [],
          view: "browse",
          elapsedTime: 0,
        }
      });
    }
  });
});

dbi.load().then(() => console.log("Bot ready!"));
```

### Component (product-showcase.svelte)

```svelte
<script>
  /// <reference types="@mostfeatured/dbi/svelte" />
  import stuffs from "stuffs";

  let {
    products = [],
    currentIndex = 0,
    cart = [],
    view = "browse",
    elapsedTime = 0,
  } = $props();

  // Format elapsed time
  function formatTime(seconds) {
    return stuffs.formatSeconds(seconds);
  }

  // Navigation
  function nextProduct() {
    data.currentIndex = (currentIndex + 1) % products.length;
  }

  function prevProduct() {
    data.currentIndex = (currentIndex - 1 + products.length) % products.length;
  }

  // Cart actions
  function addToCart(ctx) {
    const product = products[currentIndex];
    data.cart = [...cart, product];
    ctx.interaction.reply({
      content: `✅ Added **${product.name}** to cart!`,
      flags: ["Ephemeral"],
    });
  }

  function clearCart(ctx) {
    data.cart = [];
    ctx.interaction.reply({
      content: "🗑️ Cart cleared!",
      flags: ["Ephemeral"],
    });
  }

  function checkout(ctx) {
    if (cart.length === 0) {
      ctx.interaction.reply({
        content: "Cart is empty!",
        flags: ["Ephemeral"],
      });
      noRender(); // Don't update UI
      return;
    }
    
    const total = cart.reduce((sum, p) => sum + p.price, 0);
    ctx.interaction.reply({
      content: `💳 **Order Placed!**\nTotal: $${total}`,
      flags: ["Ephemeral"],
    });
    
    data.cart = [];
    data.view = "browse";
  }

  // View switching
  function showCart() { data.view = "cart"; }
  function showBrowse() { data.view = "browse"; }
  function showDetails() { data.view = "details"; }

  // Lifecycle - start timer on mount
  onMount(() => {
    data.elapsedTime = 0;
    const interval = setInterval(() => {
      data.elapsedTime += 1;
    }, 1000);

    // Cleanup on destroy
    return () => clearInterval(interval);
  });
</script>

<components>
  {#if view === "browse"}
    <container accent-color="5865F2">
      <components>
        <section>
          <components>
            <text-display>## 🛍️ Product Showcase</text-display>
            <text-display>
              **{products[currentIndex]?.name}**
              {products[currentIndex]?.description}
            </text-display>
            <text-display>💰 **${products[currentIndex]?.price}**</text-display>
          </components>
          <thumbnail media={products[currentIndex]?.image}></thumbnail>
        </section>

        <separator></separator>

        <text-display>
          📦 Product {currentIndex + 1} of {products.length} | 🛒 Cart: {cart.length} items
        </text-display>

        <action-row>
          <button style="Secondary" handler={prevProduct}>◀️ Prev</button>
          <button style="Secondary" handler={nextProduct}>Next ▶️</button>
          <button style="Success" handler={addToCart}>🛒 Add to Cart</button>
          <button style="Primary" handler={showDetails}>📋 Details</button>
          <button style="Primary" handler={showCart}>🛒 View Cart ({cart.length})</button>
        </action-row>

        <separator></separator>
        <text-display>⏱️ Session: {formatTime(elapsedTime)}</text-display>
      </components>
    </container>

  {:else if view === "cart"}
    <container accent-color="57F287">
      <components>
        <text-display>## 🛒 Your Cart</text-display>

        {#if cart.length === 0}
          <text-display>*Your cart is empty*</text-display>
        {:else}
          {#each cart as item, i}
            <text-display>• **{item.name}** - ${item.price}</text-display>
          {/each}
          <separator></separator>
          <text-display>
            **Total: ${cart.reduce((sum, p) => sum + p.price, 0)}**
          </text-display>
        {/if}

        <action-row>
          <button style="Secondary" handler={showBrowse}>◀️ Back</button>
          <button style="Danger" handler={clearCart}>🗑️ Clear</button>
          <button style="Success" handler={checkout}>💳 Checkout</button>
        </action-row>

        <separator></separator>
        <text-display>⏱️ Session: {formatTime(elapsedTime)}</text-display>
      </components>
    </container>

  {:else if view === "details"}
    <container accent-color="FEE75C">
      <components>
        <section>
          <components>
            <text-display>## 📋 Product Details</text-display>
            <text-display>**{products[currentIndex]?.name}**</text-display>
          </components>
          <thumbnail media={products[currentIndex]?.image}></thumbnail>
        </section>

        <separator></separator>
        <text-display>{products[currentIndex]?.description}</text-display>

        <action-row>
          <button style="Secondary" handler={showBrowse}>◀️ Back</button>
          <button style="Success" handler={addToCart}>🛒 Add to Cart</button>
        </action-row>

        <separator></separator>
        <text-display>⏱️ Session: {formatTime(elapsedTime)}</text-display>
      </components>
    </container>
  {/if}
</components>
```

---

## API Reference

### Component Class Methods

```typescript
const component = dbi.interaction("my-component");

// Send to interaction or channel
await component.send(interaction, { data: { count: 0 } });
await component.send(channel, { data: { count: 0 } });

// Manually destroy a specific instance by ref
component.destroy(refId);

// Destroy all active instances
component.destroyAll();

// Get JSON representation
const json = component.toJSON({ data: { count: 0 } });
```

### Send Options

```typescript
interface SendOptions {
  data?: Record<string, any>;  // Initial data
  flags?: string[];            // Message flags
  content?: string;            // Text content
  ephemeral?: boolean;         // Ephemeral message
  reply?: boolean;             // Force reply
  followUp?: boolean;          // Use followUp instead
}
```

---

## Best Practices

1. **Use `$props()` for initial state** - Destructure with defaults for clean code
2. **Mutate `data` for updates** - Don't reassign the entire data object
3. **Return cleanup from `onMount`** - Prevents memory leaks
4. **Use `noRender()` for background tasks** - Avoid unnecessary renders
5. **Set appropriate throttle** - Match your update frequency
6. **Use `destroy()` for cleanup** - Clean up timers when done
7. **Add type reference** - Get full IDE support

---

## Troubleshooting

### Component not updating?
- Make sure you're using `data.property = value`, not reassigning `data`
- Check that `noRender()` wasn't called earlier

### Timer keeps running after message deleted?
- Return a cleanup function from `onMount`
- Or use `onDestroy` to clear intervals

### Rate limited by Discord?
- Increase throttle with `setThrottle(500)` or higher
- The system automatically retries on rate limits (max 3 retries)

### IDE not showing autocomplete?
- Add `/// <reference types="@mostfeatured/dbi/svelte" />` at top of script
- Make sure `@mostfeatured/dbi` is installed

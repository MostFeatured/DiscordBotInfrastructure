/// <reference path="./svelte-dbi.d.ts" />

/**
 * This file ensures Svelte files pick up the DBI type definitions.
 * 
 * The following functions are available globally in your .svelte files:
 * 
 * RENDER HELPERS:
 * - render()      - Force render the component
 * - update()      - Update message via interaction.update()
 * - rerender()    - Re-render via message.edit()
 * - noRender()    - Disable auto-render for current handler
 * - setThrottle() - Set minimum interval between renders
 * 
 * LIFECYCLE:
 * - onMount()     - Run on first render, can return cleanup function
 * - onDestroy()   - Run on component destroy
 * 
 * CONTROL:
 * - destroy()     - Manually destroy the component instance
 * 
 * REACTIVITY:
 * - $effect()     - Run when dependencies change
 * 
 * CONTEXT:
 * - ctx           - The interaction context (ctx.interaction, ctx.dbi, ctx.locale)
 * - data          - Reactive data object (via $props())
 */

export { };

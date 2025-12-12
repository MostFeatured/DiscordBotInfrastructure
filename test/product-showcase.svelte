<script>
  /// <reference types="@mostfeatured/dbi/svelte" />
  import stuffs from "stuffs";

  let {
    products = [],
    currentIndex = 0,
    cart = [],
    view = "browse", // 'browse' | 'cart' | 'details'
    elapsedTime = 0,
  } = $props();

  // Format elapsed time using stuffs
  function formatTime(seconds) {
    return stuffs.formatSeconds(seconds);
  }

  function nextProduct() {
    data.currentIndex = (currentIndex + 1) % products.length;
  }

  function prevProduct() {
    data.currentIndex = (currentIndex - 1 + products.length) % products.length;
  }

  function addToCart(ctx) {
    const product = products[currentIndex];
    data.cart = [...cart, product];
    ctx.interaction.reply({
      content:
        "✅ Added **" +
        product.name +
        "** to cart! (Cart: " +
        data.cart.length +
        " items)",
      flags: ["Ephemeral"],
    });
  }

  function showCart() {
    data.view = "cart";
  }

  function showBrowse() {
    data.view = "browse";
  }

  function showDetails() {
    data.view = "details";
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
      noRender(); // Cart boşsa UI güncellemeye gerek yok
      return;
    }
    const total = cart.reduce((sum, p) => sum + p.price, 0);
    ctx.interaction.reply({
      content:
        "💳 **Order Placed!**\\nItems: " + cart.length + "\\nTotal: $" + total,
      flags: ["Ephemeral"],
    });
    data.cart = [];
    data.view = "browse";
  }

  onMount(() => {
    data.elapsedTime = 0;
    const interval = setInterval(() => {
      data.elapsedTime += 1;
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<components>
  {#if view === "browse"}
    <container accent-color="5865F2">
      <components>
        <section>
          <components>
            <text-display>## 🛍️ Product Showcase</text-display>
            <text-display
              >**{products[currentIndex]?.name}**
              {products[currentIndex]?.description}</text-display
            >
            <text-display>💰 **\${products[currentIndex]?.price}**</text-display
            >
          </components>
          <thumbnail media={products[currentIndex]?.image}></thumbnail>
        </section>

        <separator></separator>

        <text-display
          >📦 Product {currentIndex + 1} of {products.length} | 🛒 Cart: {cart.length}
          items</text-display
        >

        <action-row>
          <button style="Secondary" onclick={prevProduct}>◀️ Prev</button>
          <button style="Secondary" onclick={nextProduct}>Next ▶️</button>
          <button style="Success" onclick={addToCart}>🛒 Add to Cart</button>
          <button style="Primary" onclick={showDetails}>📋 Details</button>
          <button style="Primary" onclick={showCart}
            >🛒 View Cart ({cart.length})</button
          >
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
            <text-display>• **{item.name}** - \${item.price}</text-display>
          {/each}
          <separator></separator>
          <text-display
            >**Total: \${cart.reduce(
              (sum, p) => sum + p.price,
              0
            )}**</text-display
          >
        {/if}

        <action-row>
          <button style="Secondary" onclick={showBrowse}
            >◀️ Back to Browse</button
          >
          <button style="Danger" onclick={clearCart}>🗑️ Clear Cart</button>
          <button style="Success" onclick={checkout}>💳 Checkout</button>
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

        <text-display
          >### Description
          {products[currentIndex]?.description}</text-display
        >

        <separator></separator>

        <text-display
          >### Specifications • **Category:** {products[currentIndex]?.category}
          • **Rating:** ⭐ {products[currentIndex]?.rating}/5 • **Stock:** {products[
            currentIndex
          ]?.stock} available • **Price:** 💰 **\${products[currentIndex]
            ?.price}**</text-display
        >

        <action-row>
          <button style="Secondary" onclick={showBrowse}>◀️ Back</button>
          <button style="Success" onclick={addToCart}>🛒 Add to Cart</button>
        </action-row>

        <separator></separator>
        <text-display>⏱️ Session: {formatTime(elapsedTime)}</text-display>
      </components>
    </container>
  {/if}
</components>

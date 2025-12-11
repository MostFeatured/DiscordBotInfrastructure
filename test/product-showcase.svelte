<script>
  let {
    products = [],
    currentIndex = 0,
    cart = [],
    view = "browse", // 'browse' | 'cart' | 'details'
  } = $props();

  function nextProduct(interaction) {
    data.currentIndex = (currentIndex + 1) % products.length;
    updateMessage(interaction);
  }

  function prevProduct(interaction) {
    data.currentIndex = (currentIndex - 1 + products.length) % products.length;
    updateMessage(interaction);
  }

  function addToCart(interaction) {
    const product = products[currentIndex];
    data.cart = [...cart, product];
    interaction.reply({
      content:
        "✅ Added **" +
        product.name +
        "** to cart! (Cart: " +
        data.cart.length +
        " items)",
      flags: ["Ephemeral"],
    });
    // Update main message to reflect cart count
    interaction.message.edit({
      components: self.toJSON({ data }),
      flags: ["IsComponentsV2"],
    });
  }

  function showCart(interaction) {
    data.view = "cart";
    updateMessage(interaction);
  }

  function showBrowse(interaction) {
    data.view = "browse";
    updateMessage(interaction);
  }

  function showDetails(interaction) {
    data.view = "details";
    updateMessage(interaction);
  }

  function clearCart(interaction) {
    data.cart = [];
    interaction.reply({
      content: "🗑️ Cart cleared!",
      flags: ["Ephemeral"],
    });
    // Update main message to reflect empty cart
    interaction.message.edit({
      components: self.toJSON({ data }),
      flags: ["IsComponentsV2"],
    });
  }

  function checkout(interaction) {
    if (cart.length === 0) {
      interaction.reply({ content: "Cart is empty!", flags: ["Ephemeral"] });
      return;
    }
    const total = cart.reduce((sum, p) => sum + p.price, 0);
    interaction.reply({
      content:
        "💳 **Order Placed!**\\nItems: " + cart.length + "\\nTotal: $" + total,
      flags: ["Ephemeral"],
    });
    data.cart = [];
    data.view = "browse";
    // Use message.edit instead of update since we already replied
    interaction.message.edit({
      components: self.toJSON({ data }),
      flags: ["IsComponentsV2"],
    });
  }

  function updateMessage(interaction) {
    interaction.update({
      components: self.toJSON({ data }),
      flags: ["IsComponentsV2"],
    });
  }
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
          <button name="prev" style="Secondary" onclick={prevProduct}
            >◀️ Prev</button
          >
          <button name="next" style="Secondary" onclick={nextProduct}
            >Next ▶️</button
          >
          <button name="add" style="Success" onclick={addToCart}
            >🛒 Add to Cart</button
          >
          <button name="details" style="Primary" onclick={showDetails}
            >📋 Details</button
          >
          <button name="cart" style="Primary" onclick={showCart}
            >🛒 View Cart ({cart.length})</button
          >
        </action-row>
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
          <button name="back" style="Secondary" onclick={showBrowse}
            >◀️ Back to Browse</button
          >
          <button name="clear" style="Danger" onclick={clearCart}
            >🗑️ Clear Cart</button
          >
          <button name="checkout" style="Success" onclick={checkout}
            >💳 Checkout</button
          >
        </action-row>
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
          <button name="back2" style="Secondary" onclick={showBrowse}
            >◀️ Back</button
          >
          <button name="add2" style="Success" onclick={addToCart}
            >🛒 Add to Cart</button
          >
        </action-row>
      </components>
    </container>
  {/if}
</components>

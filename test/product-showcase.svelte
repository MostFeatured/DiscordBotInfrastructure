<script>
  // <reference types="@mostfeatured/dbi/svelte" />
  
  import stuffs from "stuffs";
  import { add } from "./test.js";

  let {
    products = [],
    currentIndex = 0,
    cart = [],
    view = "browse", // 'browse' | 'cart' | 'details' | 'reviews'
    elapsedTime = 0,
    editingProduct = null, // Product being edited in modal
    reviewText = "", // Review text from modal
    reviews = [], // Array of { productId, productName, rating, review, date }
    selectedCategory = "all", // Category filter
    sortBy = "default", // Sorting option
  } = $props();

  // Get unique categories from products
  // Note: Uses local variables for SSR template rendering
  function getCategories() {
    const cats = [...new Set(products.map((p) => p.category))];
    return cats;
  }

  // Filter and sort products
  // Note: Uses local variables for SSR template rendering
  function getFilteredProducts() {
    let filtered = products;

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Apply sorting
    if (sortBy === "price-low") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rating") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }

  // Get current product from filtered list
  // Note: Uses local variables for SSR template rendering
  function getCurrentProduct() {
    const filtered = getFilteredProducts();
    if (filtered.length === 0) return null;
    const idx = Math.min(currentIndex, filtered.length - 1);
    return filtered[idx];
  }

  // Format elapsed time using stuffs
  function formatTime(seconds) {
    return stuffs.formatSeconds(seconds);
  }

  // Handle category selection
  function onCategoryChange(ctx) {
    const selected = ctx.interaction.values[0];
    data.selectedCategory = selected;
    data.currentIndex = 0; // Reset to first product when filter changes
    ctx.interaction.deferUpdate();
  }

  // Handle sort selection
  function onSortChange(ctx) {
    const selected = ctx.interaction.values[0];
    data.sortBy = selected;
    data.currentIndex = 0; // Reset to first product when sort changes
    ctx.interaction.deferUpdate();
  }

  function nextProduct() {
    // Get filtered length using data context
    let filtered = data.products || [];
    const category = data.selectedCategory ?? "all";
    if (category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }
    const currentIdx = data.currentIndex ?? 0;
    data.currentIndex = (currentIdx + 1) % filtered.length;
  }

  function prevProduct() {
    // Get filtered length using data context
    let filtered = data.products || [];
    const category = data.selectedCategory ?? "all";
    if (category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }
    const currentIdx = data.currentIndex ?? 0;
    data.currentIndex = (currentIdx - 1 + filtered.length) % filtered.length;
  }

  // Helper to get current product in handler context
  function getProductInHandler() {
    let filtered = data.products || [];
    const category = data.selectedCategory ?? "all";
    const sort = data.sortBy ?? "default";

    if (category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }
    // Apply sorting
    if (sort === "price-low") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "rating") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    }
    if (filtered.length === 0) return null;
    const idx = Math.min(data.currentIndex ?? 0, filtered.length - 1);
    return filtered[idx];
  }

  function addToCart(ctx) {
    const product = getProductInHandler();
    if (!product) return;
    data.cart = [...data.cart, product];
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

  function showReviews() {
    data.view = "reviews";
  }

  function clearCart(ctx) {
    data.cart = [];
    ctx.interaction.reply({
      content: "🗑️ Cart cleared!",
      flags: ["Ephemeral"],
    });
  }

  function checkout(ctx) {
    if (data.cart.length === 0) {
      ctx.interaction.reply({
        content: "Cart is empty!",
        flags: ["Ephemeral"],
      });
      noRender(); // Cart boşsa UI güncellemeye gerek yok
      return;
    }
    const total = data.cart.reduce((sum, p) => sum + p.price, 0);
    ctx.interaction.reply({
      content:
        "💳 **Order Placed!**\\nItems: " +
        data.cart.length +
        "\\nTotal: $" +
        total,
      flags: ["Ephemeral"],
    });
    data.cart = [];
    data.view = "browse";
  }

  // Open the review modal for current product
  async function openReviewModal(ctx) {
    // Store which product we're reviewing
    const product = getProductInHandler();
    if (!product) {
      ctx.interaction.reply({
        content: "No product selected!",
        flags: ["Ephemeral"],
      });
      noRender();
      return;
    }
    data.editingProduct = product;

    // Show the modal and await the response
    const { fields, interaction } = await showModal("review-modal");

    // Handle the response - rating now comes from string-select as an array
    const ratingArray = fields.rating || ["5"]; // string-select returns array
    const rating = Array.isArray(ratingArray) ? ratingArray[0] : ratingArray;
    const review = fields.review || "";

    // Add review to the reviews array (use data.reviews for current value after await)
    data.reviews = [
      ...data.reviews,
      {
        productId: currentIndex,
        productName: product?.name,
        rating: parseInt(rating),
        review: review,
        date: new Date().toLocaleDateString(),
      },
    ];

    interaction.reply({
      content: `⭐ **Review Submitted!**\n**Product:** ${product?.name}\n**Rating:** ${rating}/5\n**Review:** ${review}`,
      flags: ["Ephemeral"],
    });

    // Clear editing state
    data.editingProduct = null;
  }

  // Open quantity modal for adding to cart
  async function openQuantityModal(ctx) {
    const product = getProductInHandler();
    if (!product) {
      ctx.interaction.reply({
        content: "No product selected!",
        flags: ["Ephemeral"],
      });
      noRender();
      return;
    }
    data.editingProduct = product;

    // Show the modal and await the response
    const { fields, interaction } = await showModal("quantity-modal");

    const quantity = parseInt(fields.quantity) || 1;

    // Add multiple of the same product
    for (let i = 0; i < quantity; i++) {
      data.cart = [...data.cart, product];
    }

    interaction.reply({
      content: `✅ Added **${quantity}x ${product?.name}** to cart! (Cart: ${data.cart.length} items)`,
      flags: ["Ephemeral"],
    });

    data.editingProduct = null;
  }

  onMount(() => {
    console.log(add(2, 3)); // Test the imported function

    data.elapsedTime = 0;
    const interval = setInterval(() => {
      // Use lowPriorityUpdate to skip render if a user interaction is in progress
      lowPriorityUpdate(() => {
        data.elapsedTime += 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<!-- Main UI Components -->
<components>
  {#if view === "browse"}
    <container accent-color="5865F2">
      <components>
        <section>
          <components>
            <text-display>## 🛍️ Product Showcase</text-display>
            <text-display
              >**{getCurrentProduct()?.name || "No products"}**
              {getCurrentProduct()?.description || ""}</text-display
            >
            <text-display
              >💰 **\${getCurrentProduct()?.price || 0}**</text-display
            >
          </components>
          <thumbnail media={getCurrentProduct()?.image}></thumbnail>
        </section>

        <separator></separator>

        <!-- Category Filter -->
        <action-row>
          <string-select
            placeholder="🏷️ Filter by Category"
            onchange={onCategoryChange}
          >
            <option
              value="all"
              description="Show all products"
              default={selectedCategory === "all"}
            >
              📦 All Categories
            </option>
            {#each getCategories() as cat}
              <option
                value={cat}
                description="Filter by {cat}"
                default={selectedCategory === cat}
              >
                🏷️ {cat}
              </option>
            {/each}
          </string-select>
        </action-row>

        <!-- Sort Options -->
        <action-row>
          <string-select placeholder="📊 Sort Products" onchange={onSortChange}>
            <option
              value="default"
              description="Original order"
              default={sortBy === "default"}
            >
              📋 Default Order
            </option>
            <option
              value="price-low"
              description="Cheapest first"
              default={sortBy === "price-low"}
            >
              💰 Price: Low to High
            </option>
            <option
              value="price-high"
              description="Most expensive first"
              default={sortBy === "price-high"}
            >
              💎 Price: High to Low
            </option>
            <option
              value="name"
              description="A-Z alphabetically"
              default={sortBy === "name"}
            >
              🔤 Name: A-Z
            </option>
            <option
              value="rating"
              description="Best rated first"
              default={sortBy === "rating"}
            >
              ⭐ Rating: Best First
            </option>
          </string-select>
        </action-row>

        <separator></separator>

        <text-display
          >📦 Product {currentIndex + 1} of {getFilteredProducts().length} | 🛒 Cart:
          {cart.length}
          items {selectedCategory !== "all"
            ? `| 🏷️ ${selectedCategory}`
            : ""}</text-display
        >

        <action-row>
          <button style="Secondary" onclick={prevProduct}>◀️ Prev</button>
          <button style="Secondary" onclick={nextProduct}>Next ▶️</button>
          <button style="Success" onclick={openQuantityModal}
            >🛒 Add to Cart</button
          >
          <button style="Primary" onclick={showDetails}>📋 Details</button>
          <button style="Primary" onclick={showCart}
            >🛒 View Cart ({cart.length})</button
          >
        </action-row>

        <action-row>
          <button style="Secondary" onclick={openReviewModal}
            >⭐ Write Review</button
          >
          <button style="Secondary" onclick={showReviews}
            >📝 View Reviews ({reviews.length})</button
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
            <text-display>**{getCurrentProduct()?.name}**</text-display>
          </components>
          <thumbnail media={getCurrentProduct()?.image}></thumbnail>
        </section>

        <separator></separator>

        <text-display
          >### Description
          {getCurrentProduct()?.description}</text-display
        >

        <separator></separator>

        <text-display
          >### Specifications • **Category:** {getCurrentProduct()?.category}
          • **Rating:** ⭐ {getCurrentProduct()?.rating}/5 • **Stock:** {getCurrentProduct()
            ?.stock} available • **Price:** 💰 **\${getCurrentProduct()
            ?.price}**</text-display
        >

        <action-row>
          <button style="Secondary" onclick={showBrowse}>◀️ Back</button>
          <button style="Success" onclick={openQuantityModal}
            >🛒 Add to Cart</button
          >
          <button style="Secondary" onclick={openReviewModal}
            >⭐ Write Review</button
          >
        </action-row>

        <separator></separator>
        <text-display>⏱️ Session: {formatTime(elapsedTime)}</text-display>
      </components>
    </container>
  {:else if view === "reviews"}
    <container accent-color="EB459E">
      <components>
        <text-display>## 📝 Product Reviews</text-display>

        {#if reviews.length === 0}
          <text-display
            >*No reviews yet. Be the first to write one!*</text-display
          >
        {:else}
          {#each reviews as r, i}
            <text-display
              >**{r.productName}** - {"⭐".repeat(r.rating)}{"☆".repeat(
                5 - r.rating
              )} ({r.rating}/5)
              {r.review ? `> ${r.review}` : ""}
              *{r.date}*</text-display
            >
            {#if i < reviews.length - 1}
              <separator></separator>
            {/if}
          {/each}
        {/if}

        <separator></separator>
        <text-display>**Total Reviews:** {reviews.length}</text-display>

        <action-row>
          <button style="Secondary" onclick={showBrowse}
            >◀️ Back to Browse</button
          >
          <button style="Primary" onclick={openReviewModal}
            >⭐ Write Review</button
          >
        </action-row>

        <separator></separator>
        <text-display>⏱️ Session: {formatTime(elapsedTime)}</text-display>
      </components>
    </container>
  {/if}
</components>

<!-- Review Modal: Now using new Label component structure with String Select -->
<components
  type="modal"
  id="review-modal"
  title="Write a Review for {editingProduct?.name || 'Product'}"
>
  <field label="Rating" description="How would you rate this product?">
    <string-select id="rating" placeholder="Select a rating">
      <option value="5" emoji="⭐">5 Stars - Excellent!</option>
      <option value="4" emoji="⭐">4 Stars - Great</option>
      <option value="3" emoji="⭐">3 Stars - Good</option>
      <option value="2" emoji="⭐">2 Stars - Fair</option>
      <option value="1" emoji="⭐">1 Star - Poor</option>
    </string-select>
  </field>
  <field
    label="Your Review"
    description="Share your experience with this product"
  >
    <text-input
      id="review"
      placeholder="Write your detailed review here..."
      style="Paragraph"
    ></text-input>
  </field>
</components>

<!-- Quantity Modal: Opens when user clicks "Add to Cart" -->
<components
  type="modal"
  id="quantity-modal"
  title="Add {editingProduct?.name || 'Product'} to Cart"
>
  <field label="Quantity" description="How many would you like to add?">
    <text-input
      id="quantity"
      placeholder="Enter quantity (1-10)"
      style="Short"
      value="1"
      required
    ></text-input>
  </field>
</components>

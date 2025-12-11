# HTMLComponentsV2 - Svelte Integration Guide

HTMLComponentsV2 artık Svelte 5 component'lerini destekliyor! Bu sayede Discord component'lerini reactive ve declarative bir şekilde oluşturabilirsiniz.

## Özellikler

- ✅ **Svelte 5 Runes**: `$props` ile prop'ları alma
- ✅ **Event Handler'lar**: `onclick`, `onchange` gibi event'leri doğrudan yakalama
- ✅ **SSR Rendering**: Svelte component'leri Discord component'lerine dönüşüyor
- ✅ **Persistent State**: `data` objesi ile state korunur, her kullanıcı kendi state'ini görür
- ✅ **Otomatik Ref Yönetimi**: State otomatik olarak ref ile saklanır, tekrar kullanılır
- ✅ **Geriye Uyumlu**: Mevcut Eta template sistemi çalışmaya devam ediyor
- ✅ **Type Safe**: TypeScript desteği

## Temel Konseptler

### `data` Objesi

Svelte mode'da `data` objesi her zaman handler'larda otomatik olarak mevcuttur:
- Tüm state'i içerir
- `$ref` property'si ile otomatik olarak ref sistemine bağlanır
- State güncellemelerinde mutate edilip geri geçirilmelidir

```javascript
// data objesi şu şekilde görünür:
{
  count: 0,
  $ref: "abc12345"  // Otomatik eklenir, state'i korur
}
```

## Kullanım

### 1. Basit Counter Component

```javascript
dbi.register(({ HTMLComponentsV2, ChatInput }) => {
  HTMLComponentsV2({
    name: "counter",
    mode: 'svelte',
    template: \`
<script>
  // Props'ları $props() ile al - data otomatik olarak mevcut
  let { count = 0 } = $props();
  
  function increment(interaction) {
    // data objesini mutate et ve geri geç
    data.count = count + 1;
    interaction.update({ 
      components: this.toJSON({ data }) 
    });
  }
  
  function decrement(interaction) {
    data.count = count - 1;
    interaction.update({ 
      components: this.toJSON({ data }) 
    });
  }
</script>

<components>
  <action-row>
    <button name="dec" style="Danger" onclick={decrement}>-</button>
    <button name="count" style="Secondary" disabled>Count: {count}</button>
    <button name="inc" style="Success" onclick={increment}>+</button>
  </action-row>
</components>
    \`
  });

  // Command ile kullan
  ChatInput({
    name: "counter",
    description: "Interactive counter",
    onExecute({ interaction, dbi }) {
      const counter = dbi.interaction("counter");
      interaction.reply({
        content: "Counter:",
        components: counter.toJSON({ data: { count: 0 } }),
        flags: ["Ephemeral"]  // Her kullanıcı kendi state'ini görür
      });
    }
  });
});
```

### 2. Dosyadan Component Yükleme

```javascript
HTMLComponentsV2({
  name: "counter",
  mode: 'svelte',
  file: './src/components/Counter.svelte'
});
```

### 3. Kompleks State ile Kullanım

```javascript
HTMLComponentsV2({
  name: "shopping-cart",
  mode: 'svelte',
  template: \`
<script>
  let { items = [], total = 0 } = $props();
  
  function removeItem(interaction) {
    // İlk item'ı kaldır
    data.items = items.slice(1);
    data.total = data.items.reduce((sum, i) => sum + i.price, 0);
    
    interaction.update({
      content: \\\`Total: $\\\${data.total}\\\`,
      components: this.toJSON({ data })
    });
  }
  
  function clearCart(interaction) {
    data.items = [];
    data.total = 0;
    
    interaction.update({
      content: "Cart cleared!",
      components: this.toJSON({ data })
    });
  }
</script>

<components>
  <action-row>
    <button name="remove" style="Danger" onclick={removeItem}>
      Remove First ({items.length} items)
    </button>
    <button name="clear" style="Secondary" onclick={clearCart}>
      Clear All
    </button>
  </action-row>
</components>
  \`
});

// Kullanım
const cart = dbi.interaction("shopping-cart");
interaction.reply({
  content: "Your cart:",
  components: cart.toJSON({ 
    data: { 
      items: [
        { name: "Item 1", price: 10 },
        { name: "Item 2", price: 20 }
      ],
      total: 30
    } 
  })
});
```

### 4. Select Menu ile Kullanım

```javascript
HTMLComponentsV2({
  name: "item-selector",
  mode: 'svelte',
  template: \`
<script>
  let { items = [], selectedId = null } = $props();
  
  function onSelect(interaction) {
    // Select menu'den seçilen değer interaction.values[0]'da
    const selectedValue = interaction.values[0];
    data.selectedId = selectedValue;
    
    const item = items.find(i => i.id === selectedValue);
    
    interaction.update({
      content: \\\`Selected: \\\${item?.name || 'None'}\\\`,
      components: this.toJSON({ data })
    });
  }
</script>

<components>
  <action-row>
    <string-select name="select-item" placeholder="Choose an item" onchange={onSelect}>
      {#each items as item}
        <option value={item.id}>{item.name}</option>
      {/each}
    </string-select>
  </action-row>
</components>
  \`
});
```

## Event Handler'lar

### Desteklenen Event'ler

- `onclick` - Button'lara tıklandığında
- `onchange` - Select menu'ler değiştiğinde

### Handler İmzası

```javascript
function handlerName(interaction, ...additionalData) {
  // interaction: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
  // additionalData: data-X:type attribute'larından gelen ek veriler
  
  // 'this' = DBIHTMLComponentsV2 instance
  // 'data' = State objesi ($ref ile)
}
```

### Önemli: State Güncelleme Paterni

```javascript
function myHandler(interaction) {
  // 1. data objesini mutate et
  data.myValue = newValue;
  
  // 2. Aynı data objesini geri geç (ref korunur)
  interaction.update({
    components: this.toJSON({ data })
  });
}
```

## `this` Context

Handler'larda `this` DBIHTMLComponentsV2 instance'ına bağlıdır:

```javascript
function myHandler(interaction) {
  // this.toJSON() - Component'i yeniden render et
  // this.name - Component adı
  // this.dbi - DBI instance
  // this.template - Template string
}
```

## Data Attributes (Opsiyonel)

Ek veri geçirmek için data attributes kullanabilirsiniz:

```svelte
<button 
  name="delete-item" 
  data-0:string="{item.id}"
  data-1:int="{item.index}"
  onclick={deleteItem}>
  Delete
</button>
```

Handler'da:
```javascript
function deleteItem(interaction, itemId, itemIndex) {
  // itemId: string
  // itemIndex: number
}
```

Desteklenen tipler:
- `string`, `str` - String değer
- `int`, `integer`, `float`, `number` - Sayısal değer
- `bool`, `boolean` - Boolean değer
- `json` - JSON parse edilmiş obje
- `ref` - Ref sisteminden obje

## Geriye Uyumluluk (Eta Mode)

Mevcut Eta template sistemi çalışmaya devam ediyor:

```javascript
HTMLComponentsV2({
  name: "old-style",
  mode: 'eta', // veya boş bırak (default: 'eta')
  template: \`
<components>
  <action-row>
    <button name="my-btn">Click me</button>
  </action-row>
</components>
  \`,
  handlers: [
    {
      name: "my-btn",
      onExecute({ interaction }) {
        interaction.reply("Clicked!");
      }
    }
  ]
});
```

## Desteklenen Discord Component'ler

Svelte template'lerinde tüm Discord component'lerini kullanabilirsiniz:

- `<button>` - style: Primary, Secondary, Success, Danger, Link, Premium
- `<string-select>` / `<user-select>` / `<role-select>` / `<channel-select>` / `<mentionable-select>`
- `<action-row>`
- `<section>`
- `<text-display>`
- `<thumbnail>`
- `<media-gallery>`
- `<file>`
- `<separator>`
- `<container>`

## Svelte Syntax Desteği

```svelte
<!-- Conditional rendering -->
{#if condition}
  <button name="show">Visible</button>
{:else}
  <button name="hidden">Hidden</button>
{/if}

<!-- List rendering -->
{#each items as item, index}
  <button name="item-{index}">{item.name}</button>
{/each}

<!-- Expressions -->
<button name="btn" disabled={count >= 10}>
  Count: {count}
</button>
```

## Limitasyonlar

1. **Server-Side Only**: Component'ler server-side render edilir
2. **No $state/$effect in Handlers**: Handler'larda Svelte rune'ları çalışmaz, sadece `$props()` desteklenir
3. **State = data objesi**: State'i korumak için `data` objesini mutate edin ve geri geçin

## Troubleshooting

### "Handler not found" hatası
- Component'te `name` attribute'u var mı kontrol edin
- Handler fonksiyonu `<script>` içinde tanımlı mı kontrol edin

### State korunmuyor
- `data` objesini mutate edip `this.toJSON({ data })` ile geri geçtiğinizden emin olun
- Yeni obje oluşturmayın: `{ count }` ❌ → `data.count = count` ✅

### Her kullanıcı aynı state'i görüyor
- Mesajı `ephemeral: true` / `flags: ["Ephemeral"]` ile gönderin
- Her kullanıcının kendi instance'ı olur

### Type errors
- `ctx: any` type assertion kullanın onExecute için
- Svelte paketi yüklü olmalı: `bun add svelte`

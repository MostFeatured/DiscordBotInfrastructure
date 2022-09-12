# DiscordBotInfrastructure - [Turkish]

İnternet üzerinde bulabileceğiniz en gelişmiş, güncel ve kullanımı basit Discord bot altyapısı.

# Kullanım Senaryosu

MostFeatured/DiscordBotInfrastructure projesi diğer alışık olduğunuz altyapılar gibi kendi halinde bir proje değil, bir NPM modülüdür. Bu bağlamda kullanmaya başlamadan önce bir klasör açmanız ve içerisine `npm install @mostfeatured/dbi discord.js` komutunu girerek altyapıyı ve discord.js'i indirmeniz gerekmektedir.

# Başlarken

İlk olarak `3 dosya` ve `1 klasöre` ihitiyacımız olacak. Bu yapı tamamen sizin çalışma düzeninize uygun olarak konfigüre edilebilmektedir. Lakin bizim önerdiğimiz senaryo aşağıdaki gibidir.

Açılması gereken dosyalar ve klasörler; `dbi.js`, `login.js`, `publish.js` dosyaları ve `src` klasörü.

1. adım olarak `dbi.js` adındaki dosyamızı açıyoruz ve içerisine altyapının temellerini atıyoruz.
```js
const { createDBI } = require("@mostfeatured/dbi");

let dbi = createDBI("xd", {
  strict: true,
  discord: {
    token: "<yourTokenHere>",
    options: {
      intents: [
        "Guilds"
      ]
    }
  },
  defaults: {
    locale: "en",
    defaultMemberPermissions: ["SendMessages"],
    directMessages: false
  },
  references: {
    autoClear: {
      ttl: 60 * 1000 * 60,
      check: 60 * 1000
    }
  }
});

module.exports = dbi;
```

`createDBI()` fonksiyonu ile altyapıyı başlatıyoruz. Fonksiyonun ilk parametresi botunuzun `kodAdı`, ikinci parametresi ise botunuzun konfigürasyonudur.

2. adım olarak `login.js` dosyamızı açıyoruz ve içerisine botu açmak için kullanacağımız kod gurubunu yazıyoruz.
```js
const { recursiveImport } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await recursiveImport("./src");

  await dbi.load();
  await dbi.login();

  await dbi.client.user.setActivity({
    name: "MostFeatured ❤️ TheArmagan"
  });

  console.log(`Logged in! ${dbi.client.user.tag} (${dbi.client.user.id})`);
})();
```

İçeriye `recursiveImport()` fonksiyonunu alıyoruz. Bu fonksiyon ile sonsuz bir şekilde `x` klasöründeki bütün dosyaları `import`/`require` edebiliyoruz. Bu sayede altyapı bu dosyalardan haberdar oluyor.
Ana `dbi.js` dosyamızdan altyapımıza ulaşıyoruz ve `async` bir ortam oluşturup ilk önce tüm proje dosylarını altyapıya tanımlıyoruz. Tanımlamanın ardından tanımladığımız tüm özellikleri altyapıya `load()` fonksiyonunu ile yüklüyoruz. Hemen ardından `login()` fonksiyonu ile Discord'a giriş sağlıyoruz.


3. adım olarak `publish.js` dosyamızı açıyoruz ve ikinci aşamada yaptığımız tüm işlemleri tekrardan uyguluyoruz.
```js
const { recursiveImport } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await recursiveImport("./src");

  await dbi.load();
  await dbi.publish("Guild", "<yourGuildId>");
  // await dbi.publish("Global");
  await dbi.unload();

  console.log("Published!");
})();
```

Ancak `login()` fonksiyonunu çağırmak yerine, `publish()` fonksiyonunu çağrıyoruz ve bu fonksiyon ile botumuzun komutlarını istediğimiz yere tanıtıyoruz.

# Harika! 

Artık altyapıyı kullanabilmek için gerekli olan bütün dosyalara sahibiz. (Bilgilendirme: Detaylı bir şekilde anlattığımız bu adımlar size karmaşık ve zor geliyorsa üzgünüz ki bu altyapı size uygun değil.)

# Detaylı Kullanım Senaryosu

Özel olarak geliştirdiğimiz ve v14'ü eksiksiz bir şekilde destekleyen altyapımız ile Discord'un her türlü özelliğini tam anlamıyla kullanabiliyorsunuz. (`ChatInput`, `Event`, `Locale`, `Button`, `SelectMenu`, `MessageContextMenu`, `UserContextMenu`, `Modal`, `InteractionLocale`)

Şimdi sizlere altyapıya özellik tanımlamayı göstermek istiyoruz. Örnek: (ChatInput/Button vb.)

İlk olarak ilgili özelliği altyapımıza dahil ediyoruz.
```js
const dbi = require("../dbi");
```
Ve devamında altyapının üzerindeki `register()` fonksiyonunu çağırıp içerisine bir `callback` fonksiyonu koyuyoruz. Bu `callback` fonksiyonu ilk parametre olarak size altyapı üzerine tanımlayabilceğiniz tüm her şeyi bir obje olarak sunuyor. Bu obje içerisinden istediğiniz özellik fonksiyonunu çağırarak altyapıya tanımlama işlemini gerçekleştirebiliyorsunuz.
```js
dbi.register(({ ChatInput, Event })=>{
  ChatInput({ ... });
  Event({ ... });
})
```
Unutmayın ki aynı anda istediğiniz kadar özelliği çağırabilirsiniz!

#ChatInput & ChatInputOptions

`ChatInput` sizin anlayacağınız şekilde "Slash Komut" olarak tanımlanmaktadır.

<sub>`src/chatInput.js` dosyası:</sub>

```js
const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions })=>{
  ChatInput({
    name: "cinsiyet seç",
    description: "Cinsiyet seçmenizi sağlar.",
    onExecute({ interaction, locale }) {
      let gender = interaction.options.get("cinsiyet").value;
      let genderNames = locale.user.data.genders;
      let genderText = locale.user.data.genderText(interaction.user, genderNames[gender]());
      interaction.reply({ 
        content: genderText,
        components: [
          {
            type: Discord.ComponentType.ActionRow,
            components: [
              dbi.interaction("viewGender").toJSON({ gender }),
            ]
          }
        ]
      });
    },
    options: [
      ChatInputOptions.stringChoices({
        name: "cinsiyet",
        description: "Seçeceğiniz cinsiyet.",
        required: true,
        choices: [
          { name: "Erkek", value: "erkek" },
          { name: "Kadın", value: "kadın" },
          { name: "Diğer", value: "diğer" },
        ]
      })
    ],
  });
});
```
Genel olarak `ChatInput`'un yapısı gözünüze `options` dışında tanıdık gelmiş olabilir. Direkt olarak options içerisine bir şey doldurmaya çalıştığınızda otomatik tamamlama alamayacaksınız. Çünkü options içerisinde ChatInputOptions class'ındaki statik fonksiyonlardan beklemekte. Fonksiyonlar ise şunlara benzemekte; `stringChoices`, `user`, `numberAutocomplete` vb.
Ayrıca yukarıda göstermiş olduğumuz Locale ve Component sisteminin nasıl kullanıldığıyla ilgili örnek gösterim için aşağıdan daha fazla örneğe ulaşabilirsiniz.

# Event

<sub>`src/event.js` dosyası:</sub>

```js
const dbi = require("../dbi");

dbi.register(({ Event })=>{
  Event({
    name: "ready",
    id: "botIsReady",
    onExecute() {
      console.log(`Bot ready!`);
    }
  });
});
```
Event yani olay tanımlarken `name` kısmına istediğiniz olayın ismini yazabilirsiniz. Ancak eğer aynı olaydan birden fazla açmak istiyorsanız o olaya bir `id` tanımlamanız gerekmektedir.

# Locale

<sub>`src/locales.js` dosyası:</sub>

```js
const dbi = require("../dbi");

dbi.register(({ Locale })=>{
  Locale({
    name: "tr",
    data: {
      genders: {
        erkek: "Erkek",
        kadın: "Kadın",
        diğer: "Diğer"
      },
      genderText: "{0} adlı üye {1} cinsiyetini seçti."
    }
  });

  Locale({
    name: "en",
    data: {
      genders: {
        erkek: "Male",
        kadın: "Female",
        diğer: "Other"
      },
      genderText: "{0}, picked {1} gender."
    }
  });
});
```

Locale sayesinde her interaksiyon içerisinde kullanıcının veya sunucunun diline göre cevap vermenizi kolaylaştıracak bilgiler bulunmakta. Locale içerisindeki `name` hangi dil için tanımlama yaptığınız `data` kısmı ise tutmak istediğiniz değerleri içermekte. Yazı içerisindeki `{0}` ve `{1}` işaretleri aynı şekilde yazı içerisindeki değişkenlerimiz. Locale kullanırken istediğimiz değeri alıp onu bir fonksiyon gibi çağırabiliyoruz. Ve içerisine sırasıyla parametreleri veriyoruz. Örneğin `locale.data.genderText(user, gender)`.

# Button & SelectMenu & Modal

Bu bölümde ise üç adet özelliğimize bakacağız. (Aslında arka planda hepsi aynı özellik.)

<sub>`src/components.js` dosyası:</sub>

```js
const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ Button, SelectMenu, Modal })=>{
  Button({
    name: "viewGender",
    onExecute({ interaction, data }) {
      interaction.reply(`\`${data[0].gender}\``);
    },
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "View Gender"
    }
  });
});
```
Button & SelectMenu & Modal hakkında çok güzel ve havalı bir özelliği sizlerle buluşturuyoruz. Artık bunların üzerinde istediğiniz değeri taşıyabilirsiniz. (Referans/Obje veya yazı/sayı gibi.) Örneğin `dbi.interaction("viewGender").toJSON("male")` bize Discord.js tarafından desteklenen geçerli bir component sunacaktır. Ve to json içerisinde sunulan değere hem `options` kısmını bir fonksiyona çevirerek ulaşabilir hem de interaksiyonun kendisi çağırıldığında ulaşabilirsiniz. Bu konuyla ilgili unutmamanız gereken bir şey var. Eğer düz yazı veya sayı taşıyacaksanız bu yazı veya sayıların toplam uzunluğu 100 karakteri geçmemeli. Çünkü bu değerler direkt olarak düğmenin üzerinde taşınmakta ve siz botu kapatıp açsanız bile orada kalacak şekilde çalışmaktadırlar.

# MessageContextMenu & UserContextMenu

`ChatInput` ile birebir aynı özelliklere sahip ancak `options` değeri almamaktadır.

# InteractionLocale

Bir eşsiz özelliği daha sizlere sunuyoruz. Artık her kullanıcıya özel komut dili tanımlamanızı sağlayabilirsiniz.
Örneğin Türk bir kullanıcıya `/cinsiyet seç` şeklinde gözüken komut yabancı bir kullanıcıya `/select gender` olarak gözükebilir. (Dilediğiniz gibi konfigüre edebilirsiniz.)

<sub>`src/interactionlocales.js` dosyası:</sub>

```js
dbi.register(({ InteractionLocale })=>{
  InteractionLocale({
    name: "cinsiyet seç",
    data: {
      en: {
        name: "select gender",
        description: "Allows you to select a gender.",
        options: {
          cinsiyet: {
            name: "gender",
            description: "Select your gender correctly.",
            choices: {
              "Erkek": "Male",
              "Kadın": "Female",
              "Diğer": "Other"
            }
          }
        }
      }
    }
  });
});
```

Son not: `InteractionLocale` için `name` değeri sizin tanımladığınız diğer interaksiyonlardan birinin ismi olacaktır. Örneğin `cinsiyet seç`. Data'nın yapısını en basit hale getirmeye çalıştık. ilk önce istediğiniz dili seçiyorsunuz ve sonrasında içerisini örnekteki gibi uygun bir şekilde dolduruyorsunuz. İçerisine aynı anda istediğin kadar dilde nasıl gözükeceğini ekleyebilirsiniz.

Karşılacağınız hatalar ya da benzer konular için Discord üzerinden tarafıma ulaşabilirsiniz. (Armagan#4869)

Unutmayın ki: "Yeryüzünde her zaman ücretsiz ve değerli bir şeyler olacaktır."

<sub>12.09.2022: Orjinal metin TheArmagan tarafından yazıldı, Maschera tarafından düzenlendi. </sub>
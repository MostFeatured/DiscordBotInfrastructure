# DiscordBotInfrastructure - [English]

The most advanced, up-to-date and simple to use Discord bot infrastructure you can find on the internet.

# Usage Scenario

The MostFeatured/DiscordBotInfrastructure project is not a stand-alone project like other infrastructures you are used to, it is an NPM module. In this context, before you start using it, you need to open a folder and download the infrastructure and discord.js by entering the `npm install @mostfeatured/dbi discord.js` command.

# While Starting

First we will need `3 files` and `1 folder`. This structure can be configured completely in accordance with your working order. However, the scenario we propose is as follows.

Files and folders that need to be opened; Files `dbi.js`, `login.js`, `publish.js` and `src` folder.

As the first step, we open our file named `dbi.js` and lay the foundations of the infrastructure in it.
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
  },
  // Message Commands are optional. Message Commands work trough emulating the slash commands..
  messageCommands: {
    prefixes: ["!", "."],
    typeAliases: { 
      booleans: {
        "true": true,
        "false": false,
        "yes": true,
        "no": false,
      }
    }
  }
});

dbi.events.on("messageCommandArgumentError", (data) => {
  data.message.reply(`‼️ Invalid argument \`${data.error.option.name}\` (Index: \`${data.error.index}\`). Error Kind: \`${data.error.type}\`. Expected: \`${ApplicationCommandOptionType[data.error.option.type]}\`${data.error.extra ? ` with any of \`${data.error.extra.map(i => i.name).join(", ")}\`` : ""}.`);
  return false;
});

module.exports = dbi;
```

We start the infrastructure with the `createDBI()` function. The first parameter of the function is your bot's 'codeName' and the second parameter is your bot's configuration.

As the second step, we open our `login.js` file and write the code group that we will use to open the bot.
```js
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");
(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  await dbi.login();
  await dbi.client.user.setActivity({
    name: "MostFeatured ❤️ TheArmagan"
  });
  console.log(`Logged in! ${dbi.client.user.tag} (${dbi.client.user.id})`);
})();
```

We import the `Utils.recursiveImport()` function into it. With this function we can `import`/`require` all files in `x` folder endlessly. In this way, the infrastructure is aware of these files.
We access our infrastructure from our main `dbi.js` file and create an `async` environment and first define all project files to the infrastructure. After the definition, we load all the features we have defined to the infrastructure with the `load()` function. Right after, we log in to Discord with the `login()` function.

As the 3rd step, we open our `publish.js` file and repeat all the operations we did in the second step.
```js
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");
(async () => {
  await Utils.recursiveImport("./src");
  await dbi.load();
  await dbi.publish("Guild", "<yourGuildId>");
  // await dbi.publish("Global");
  await dbi.unload();
  console.log("Published!");
})();
```

However, instead of calling the `login()` function, we call the `publish()` function and with this function we introduce the commands of our bot wherever we want.

# Fantastic!

We now have all the necessary files to use the infrastructure. (Information: If these steps that we have explained in detail are complex and difficult for you, we are sorry that this infrastructure is not suitable for you.)

# Detailed Usage Scenario

You can fully use all kinds of Discord's features with our specially developed infrastructure that fully supports v14. (`ChatInput`, `Event`, `Locale`, `Button`, `SelectMenu`, `MessageContextMenu`, `UserContextMenu`, `Modal`, `InteractionLocale`)

Now we want to show you how to define properties in infrastructure. Example: (ChatInput/Button etc.)

First, we include the relevant feature in our infrastructure.
```js
const dbi = require("../dbi");
```
And then we call the `register()` function on the infrastructure and put a `callback` function in it. This `callback` function presents as the first parameter everything you can define on the infrastructure as an object. You can perform the definition to the infrastructure by calling the feature function you want from this object.
```js
dbi.register(({ ChatInput, Event }) => {
  ChatInput({ ... });
  Event({ ... });
})
```
Remember, you can summon as many features as you want at the same time!

# ChatInput & ChatInputOptions

`ChatInput` is defined as "Slash Command" as you can understand.

<sub>`src/chatInput.js` file:</sub>

```js
const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions }) => {
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
                            dbi.interaction("viewGender").toJSON({ overrides: { label: locale.user.data.clickText() }, reference: { ttl: 1000 * 60 * 10, data: [gender] } }),
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
In general, the structure of `ChatInput` may seem familiar to you, except for `options`. When you try to fill something in options directly, you will not get autocomplete. Because options expect static functions in ChatInputOptions class. The functions are similar to: `stringChoices`, `user`, `numberAutocomplete` etc.
You can also find more examples below for a sample demonstration of how the Locale and Component system we have shown above is used.

# Event

<sub>`src/event.js` file:</sub>

```js
const dbi = require("../dbi");
dbi.register(({ Event }) => {
  Event({
    name: "ready",
    id: "botIsReady",
    onExecute() {
      console.log(`Bot ready!`);
    }
  });
});
```
When defining an event, you can write the name of the event you want in the `name` field. However, if you want to open more than one of the same event, you need to define an 'id' for that event.

# Locale

<sub>`src/locales.js` file:</sub>

```js
const dbi = require("../dbi");
dbi.register(({ Locale }) => {
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

Thanks to Locale, there is information in each interaction that will make it easier for you to respond according to the language of the user or the server. The `name` in Locale contains the values you want to keep, and the `data` part for which language you define. The `{0}` and `{1}` signs in the text are also our variables in the text. When using locale, we can take the value we want and call it like a function. And in it we give the parameters respectively. For example `locale.data.genderText(user, gender)`.

# Button & SelectMenu & Modal

In this section, we will look at three of our features. (Actually, it's all the same feature in the background.)

<sub>`src/components.js` file:</sub>

```js
const dbi = require("../dbi");
const Discord = require("discord.js");
dbi.register(({ Button, SelectMenu, Modal }) => {
  Button({
    name: "viewGender",
    onExecute({ interaction, data }) {
      interaction.reply(`\`${data[0]}\``);
    },
    options: {
      style: Discord.ButtonStyle.Primary,
      label: "View Gender"
    }
  });
});
```
We bring you a very cool and cool feature about Button & SelectMenu & Modal. Now you can move the value you want on them. (Like Reference/Object or text/number.) For example `dbi.interaction("viewGender").toJSON("male")` will provide us a valid component powered by Discord.js. And you can reach the value presented in the json both by turning the `options` part into a function and when the interaction itself is called. There is one thing you should not forget about this subject. If you are going to carry plain text or numbers, the total length of these texts or numbers should not exceed 100 characters. Because these values ​​are carried directly on the button and they work in such a way that they remain there even if you turn the bot off and on.

# MessageContextMenu & UserContextMenu

It has exactly the same properties as `ChatInput` but does not take `options` value.

# InteractionLocale

We offer you another unique feature. You can now define a custom script language for each user.
For example, the command that appears as `/select gender` to a Turkish user may appear as `/select gender` to a foreign user. (You can configure it as you wish.)

<sub>`src/interactionlocales.js` file:</sub>

```js
const dbi = require("../dbi");
dbi.register(({ InteractionLocale }) => {
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

Final note: The value `name` for `InteractionLocale` will be the name of one of the other interactions you define. For example `select gender`. We tried to simplify Data's structure. First you select the language you want and then you fill in the content as in the example. You can add how it will appear in as many languages as you want at the same time.

You can contact me via Discord for errors or similar issues. (Armagan#4869)

Remember: "There will always be something free and valuable on earth."

<sub>12.09.2022: Original text written by TheArmagan, edited by Maschera. </sub>

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
  },
  // Mesaj Komutları isteğe bağlıdır. Mesaj Komutları slash komutlarını taklit ederek çalışır. Yani siz sadece slash komut kodlasanız bile uyumlu olarak çalışacaktır.
  messageCommands: {
    prefixes: ["!", "."],
    typeAliases: { 
      booleans: {
        "true": true,
        "false": false,
        "yes": true,
        "no": false,
      }
    }
  }
});

dbi.events.on("messageCommandArgumentError", (data) => {
  data.message.reply(`‼️ Hatalı argument \`${data.error.option.name}\` (Konum: \`${data.error.index}\`). Hata Tipi: \`${data.error.type}\`. Beklenen: \`${ApplicationCommandOptionType[data.error.option.type]}\`${data.error.extra ? ` şunlardan herhangi biri \`${data.error.extra.map(i => i.name).join(", ")}\`` : ""}.`);
  return false;
});

module.exports = dbi;
```

`createDBI()` fonksiyonu ile altyapıyı başlatıyoruz. Fonksiyonun ilk parametresi botunuzun `kodAdı`, ikinci parametresi ise botunuzun konfigürasyonudur.

2. adım olarak `login.js` dosyamızı açıyoruz ve içerisine botu açmak için kullanacağımız kod gurubunu yazıyoruz.
```js
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");

  await dbi.load();
  await dbi.login();

  await dbi.client.user.setActivity({
    name: "MostFeatured ❤️ TheArmagan"
  });

  console.log(`Logged in! ${dbi.client.user.tag} (${dbi.client.user.id})`);
})();
```

İçeriye `Utils.recursiveImport()` fonksiyonunu alıyoruz. Bu fonksiyon ile sonsuz bir şekilde `x` klasöründeki bütün dosyaları `import`/`require` edebiliyoruz. Bu sayede altyapı bu dosyalardan haberdar oluyor.
Ana `dbi.js` dosyamızdan altyapımıza ulaşıyoruz ve `async` bir ortam oluşturup ilk önce tüm proje dosylarını altyapıya tanımlıyoruz. Tanımlamanın ardından tanımladığımız tüm özellikleri altyapıya `load()` fonksiyonunu ile yüklüyoruz. Hemen ardından `login()` fonksiyonu ile Discord'a giriş sağlıyoruz.


3. adım olarak `publish.js` dosyamızı açıyoruz ve ikinci aşamada yaptığımız tüm işlemleri tekrardan uyguluyoruz.
```js
const { Utils } = require("@mostfeatured/dbi");
const dbi = require("./dbi");

(async () => {
  await Utils.recursiveImport("./src");

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
dbi.register(({ ChatInput, Event }) => {
  ChatInput({ ... });
  Event({ ... });
})
```
Unutmayın ki aynı anda istediğiniz kadar özelliği çağırabilirsiniz!

# ChatInput & ChatInputOptions

`ChatInput` sizin anlayacağınız şekilde "Slash Komut" olarak tanımlanmaktadır.

<sub>`src/chatInput.js` dosyası:</sub>

```js
const dbi = require("../dbi");
const Discord = require("discord.js");

dbi.register(({ ChatInput, ChatInputOptions }) => {
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
              dbi.interaction("viewGender").toJSON({ overrides: { label: locale.user.data.clickText() }, reference: { ttl: 1000 * 60 * 10, data: [gender] } }),
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

dbi.register(({ Event }) => {
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

dbi.register(({ Locale }) => {
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

dbi.register(({ Button, SelectMenu, Modal }) => {
  Button({
    name: "viewGender",
    onExecute({ interaction, data }) {
      interaction.reply(`\`${data[0]}\``);
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
const dbi = require("../dbi");

dbi.register(({ InteractionLocale }) => {
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
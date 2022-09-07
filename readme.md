# DiscordBotInfrastructure

Büyük ihtimalle internette bulabileceğiniz kullanımı basit ve en kullanışlı altyapı bu olabilir.

## Hemen Kullanımına Geçelim
Unutmadan söyleyeyim bu altyapı diğer alışık olduğunuz altyapılar gibi kendi halinde bir proje değil, bir NPM modülüdür. Bu yüzden kullanmaya başlamak için bir klasör açıyoruz ve içerisine `npm install @mostfeatured/dbi` komutunu kullanarak altyapıyı indiriyoruz.

Önce `3 dosya` ve `1 klasöre` ihitiyacımız var. Bu yapı tamamen sizin keyfinize kalmış bir durumda ancak ben bu şekilde kullanıyorum ve tavsiye ediyorum.

Neyse, açacağamız dosyalar ve klasörler şunlar; `dbi.js`, `login.js`, `publish.js` dosyaları ve `src` klasörü.

İlk olarak `dbi.js` adındaki dosyamı açıyorum ve içerisine altyapının temellerini atıyorum.
![1](https://i.imgur.com/I3NV7MD.png)

`createDBI()` fonksiyonu ile altyapıyı başlatıyorum. Fonksiyonun ilk parametresi botunuzun `kodAdı`, ikinci parametresi ise botunuzun konfigürasyonudur.



İkinci olarak `login.js` dosyamı açıyorum ve içerisine botu açmak için kullanacağım kod gurubunu yazıyorum.
![2](https://i.imgur.com/Kn9ELps.png)

İçeriye `recursiveImport()` fonksiyonunu alıyorum. Bu fonksiyon ile sonsuz bir şekilde `x` klasöründeki bütün dosyaları `import`/`require` edebiliyoruz, bu sayede altyapı bu dosyalardan haberdar oluyor.
Ana `dbi.js` dosyamdan altyapıma ulaşıyorum. Ve `async` bir ortam oluşturup ilk önce tüm proje dosylarını altyapıya tanımlıyorum. Tanımlamanın ardından tanımladığım tüm özellikleri altyapıya `load()` fonksiyonunu ile yüklüyorum. Hemen ardından `login()` fonksiyonu ile Discord'a giriş sağlıyorum.


Üçüncü olarak `publish.js` dosyamı açıyorum ve ikinci aşamada yaptığım tüm herşeyi tekrardan yapıyorum.
![3](https://i.imgur.com/p2VI6Js.png)

Ancak `login()` fonksiyonunu çağırmak yerine, `publish()` fonksiyonunu çağrıyorum bu fonksiyon ile botumun komutlarını istediğim yere tanıtıyorum.


<sub>Devamı gelecek..</sub>



# DiscordBotInfrastructure # [Turkish]

İnternet üzerinde bulabileceğiniz en gelişmiş, güncel ve kullanımı basit Discord bot altyapısı.

# Kullanım Senaryosu

MostFeatured/DiscordBotInfrastructure projesi diğer alışık olduğunuz altyapılar gibi kendi halinde bir proje değil, bir NPM modülüdür. Bu bağlamda kullanmaya başlamadan önce bir klasör açmanız ve içerisine `npm install @mostfeatured/dbi` komutunu girerek altyapıyı indirmeniz gerekmektedir.

İlk olarak `3 dosya` ve `1 klasöre` ihitiyacımız olacak. Bu yapı tamamen sizin çalışma düzeninize uygun olarak konfigüre edilebilir. Fakat bizim önerdiğimiz senaryo aşağıdaki gibidir.

Açılması gereken dosyalar ve klasörler; `dbi.js`, `login.js`, `publish.js` dosyaları ve `src` klasörü.

1. adım olarak `dbi.js` adındaki dosyamızı açıyoruz ve içerisine altyapının temellerini atıyoruz.
![1](https://i.imgur.com/I3NV7MD.png)

`createDBI()` fonksiyonu ile altyapıyı başlatıyoruz. Fonksiyonun ilk parametresi botunuzun `kodAdı`, ikinci parametresi ise botunuzun konfigürasyonudur.



2.adım olarak `login.js` dosyamızı açıyoruz ve içerisine botu açmak için kullanacağımız kod gurubunu yazıyoruz.
![2](https://i.imgur.com/Kn9ELps.png)

İçeriye `recursiveImport()` fonksiyonunu alıyoruz. Bu fonksiyon ile sonsuz bir şekilde `x` klasöründeki bütün dosyaları `import`/`require` edebiliyoruz, bu sayede altyapı bu dosyalardan haberdar oluyor.
Ana `dbi.js` dosyamızdan altyapımıza ulaşıyoruz. Ve `async` bir ortam oluşturup ilk önce tüm proje dosylarını altyapıya tanımlıyoruz. Tanımlamanın ardından tanımladığımız tüm özellikleri altyapıya `load()` fonksiyonunu ile yüklüyoruz. Hemen ardından `login()` fonksiyonu ile Discord'a giriş sağlıyoruz.


3.adım olarak `publish.js` dosyamızı açıyoruz ve ikinci aşamada yaptığımız tüm işlemleri tekrardan yapıyoruz.
![3](https://i.imgur.com/p2VI6Js.png)

Ancak `login()` fonksiyonunu çağırmak yerine, `publish()` fonksiyonunu çağrıyoruz bu fonksiyon ile botumuzun komutlarını istediğimiz yere tanıtıyoruz.


<sub>Devamı gelecek..</sub>



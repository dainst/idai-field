# İlk adımlar

Uygulamayı ilk başlattığınızda adınızı girmeniz istenecektir. Adınızı ve soyadınızı girmeniz önerilir. Girdiğiniz ad, yaptığınız tüm değişiklikler için veritabanında saklanır ve veri senkronizasyonu sırasında değişikliklerin kimin yaptığını belirterek proje veri kayıtlarında ortak çalışmayı kolaylaştırır. Daha sonra, gezinme çubuğunun sağ üst köşesindeki adınıza tıklayarak veya "Field" (MacOS) veya "Araçlar" (Windows) menüsü üzerinden erişebileceğiniz **Ayarlar** alt menüsü aracılığıyla kullanıcı adını değiştirebilirsiniz.

Başlangıçta, test projesi etkin olacak ve bir dizi örnek veri kullanarak uygulamanın işlevselliğini denemenize olanak tanıyacaktır. Lütfen unutmayın; test projesi seçili olduğu sürece, yeni oluşturulan tüm veri kümelerinin silinecek ve uygulama yeniden başlatıldığında tüm değişikliklerin sıfırlanacaktır. Bu nedenle, test projesi için diğer Field Desktop projeleri veya veritabanlarıyla senkronizasyon gerçekleştirilmez.

Field Desktop ile üretken bir şekilde çalışabilmek ve kendi projenizi oluşturabilmek için öncelikle şu adımları izlemelisiniz:

1. "Proje" menüsünde, kendi projenizi oluşturmak için **Yeni...** menü öğesini seçin. Proje yapılandırması için çeşitli ön ayarlar arasından seçim yapabilirsiniz: Kapsamlı arazi araştırmalarına yönelik varsayılan konfigürasyon için "Standart"ı veya yalnızca ön ayar kategorileri ve alanlarından oluşan temel ayarlarla başlamak istiyorsanız "Temel" seçeneklerinden birini seçin. Ayrıca, proje içinde verilerin girileceği dilleri belirtin. Son olarak, istenen proje tanımlayıcısını ve isteğe bağlı olarak seçilen dillerin her biri için bir proje adı girin.

2. Yeni proje yüklenir yüklenmez, "Proje" ➝ "Özellikler" menüsü üzerinden temel proje verilerini girebilirsiniz. Öncelikle, **personel üyelerinin** listelerini oluşturmalısınız.
"Proje" bölümünde "Ekip"i ve **sezonları** ("Proje" bölümünün "Sezonlar" alanı) detaylandırabilirsiniz.
Bu listeleri istediğiniz zaman değiştirebilirsiniz.

"Proje" menüsü üzerinden erişilebilen **Yedek oluştur...** menü seçeneğini kullanarak yedekleme dosyalarını oluşturun.
Projenizin verilerini düzenli olarak güncelleyin.


<hr>


# Girdiler

**(ç.n. Esas uygulamadaki 'Resource' ifadesi 'Girdi' olarak verilmiştir)**

Bir proje oluşturduktan veya mevcut bir projeyi açtıktan sonra, **Genel Bakış** sekmesinden başlayabilirsiniz 
(Projenin tüm operasyonlarının ve yerlerinin yönetildiği yer (ev sembolü).

Yeni bir işlem oluşturmak için girdiler listesinin altındaki yeşil artı butonu kullanın.

<p align="center"><img src="images/tr/resources/create_operation.png" alt="İşlem girdisi oluştur"/></p>

Yeni girdi için, öncelikle işlemin kategorisini seçersiniz, ardından isteğe bağlı olarak bir geometri oluşturabilirsiniz. 
Daha sonra işlemin tüm verilerinin doldurulabildiği editör açılacaktır.
Seçilen işlem kategorisine bağlı olarak, gruplar halinde düzenlenmiş farklı alanlar mevcuttur.
Sol taraftaki butonlara tıklayarak alan grupları arasında geçiş yapabilirsiniz.

Girdiyi yeşil kaydet butonuyla kaydetmeden önce, en azından **tanımlayıcı** alanının
temel bilgiler bölümünün doldurulması gerekmektedir.

<p align="center"><img src="images/tr/resources/save_operation.png" alt="İşlem girdisini kaydet"/></p>

Yeni işlem artık girdi listesinde görüntüleniyor. Yeni bir sekmede açmak için "İşleme geç" butonunu kullanın 
(Yukarı sağa ok işareti).

<p align="center"><img src="images/tr/resources/goto_operation.png" alt="İşlem girdisini aç"/></p>

İşlemin kategorisine bağlı olarak, bir girdi sekmesi içinde artı butonu ile farklı kategorilerde (örneğin bir açmadaki stratigrafik birimler veya bir yapının odaları)
gibi alt girdiler oluşturulabilir.


## Hiyerarşik sıralama

Girdiler örneğin buluntuları bir stratigrafik birime atamak için, hiyerarşik yapılar halinde düzenlenebilir. 
Alt hiyerarşi seviyesine geçmek için "Alt girdileri göster" (aşağı sağa köşeli ok) butonunu kullanın. Alt girdiler artık görüntülenecek ve artı butonuyla yeni oluşturulan girdiler (örneğin, bir stratigrafik birimin buluntuları) buna göre bu hiyerarşi seviyesinde görünecektir.

Girdiler listesinin üstündeki gezinme yolu, şu anda seçili olan hiyerarşi düzeyini gösterir. Her zaman
Gezinme yolundaki butonlardan birine tıklayarak bir sonraki seviyeye geçebilirsiniz.

<p align="center"><img src="images/tr/resources/navpath.png" alt="Gezinme yolu"/></p>


## Girdilerin yönetilmesi

Listedeki girdiler tıklanarak seçilebilir. Ctrl/Cmd veya Shift tuşuna basılı tutarak birden fazla girdi
aynı anda seçilebilir. Listedeki bir veya daha fazla seçili girdiye sağ tıklayarak aşağıdaki seçenekleri içeren
bir içerik menüsü açılır:

* *Uyarıları göster*: Bu girdi için mevcut uyarıları görüntüler (sadece uyarı içeren girdiler için geçerlidir, *Uyarılar* bölümüne bakın)
* *Düzenle*: Düzenleyiciyi açar (ayrıca listedeki girdiye çift tıklanarak da kullanılabilir)
* *Görselleri bağla*: Görsellerin seçili girdiye bağlanabileceği veya bağlı görsellerin kaldırılabileceği bir pencere açar
* *QR kodu ekle*: Girdi için yeni bir QR kodunun oluşturulabileceği veya mevcut bir QR kodunun kamera taraması yoluyla bağlanabileceği bir pencere açar
* *QR kodunu yönet*: Girdinin QR kodunu görüntüler ve bir QR kodu etiketi yazdırmaya olanak tanır (alternatif olarak kaynağın liste öğesinin sağ tarafındaki QR kodu düğmesinden de erişilebilir)
* *Taşı*: Girdilerin geçerli içeriklerinden kaldırılmasına ve başka bir üst girdiye atanmasını sağlar
* *Sil*: Bir güvenlik kontrolünden sonra girdileri kaldırır (isteğe bağlı olarak, yalnızca silmek istediğiniz girdilere bağlı
tüm görselleri de silebilirsiniz)
* *Depolama yerini tara*: Kamera taramasıyla depolama yerinin QR kodunu tarayarak girdi için yeni bir depolama yeri ayarlar (yalnızca "Bul", "Koleksiyonu bul" ve "Örnek" kategorilerinin girdileri ile ilgili alt kategoriler için kullanılabilir)

Ayrıca, içerik menüsü geometrileri oluşturma ve düzenleme seçenekleri içerir. Lütfen şunu unutmayın:
birden fazla girdi seçildiğinde, yalnızca *Taşı* ve *Sil* seçenekleri kullanılabilir. QR kodlarını ekleme veya yönetme seçenekleri yalnızca konfigürasyon düzenleyicisinde karşılık gelen kategori için QR kodlarının kullanımı ayarlanmışsa kullanılabilir (bkz. *Konfigürasyon* bölümündeki *Kategorileri düzenle* bölümü).

<p align="center"><img src="images/tr/resources/context_menu.png" alt="İçerik menüsü"/></p>


<hr>


# Görüntüler

Görüntüler daha sonra girdilere bağlanmak veya harita katmanları olarak kullanılmak üzere bir Field projesine aktarılabilir. Her içe aktarılan görüntü için, görüntünün meta verilerinin girilebileceği bir görüntü kaydı otomatik olarak oluşturulur.

Görüntü dosyaları isteğe bağlı olarak bir senkronizasyon bağlantısı aracılığıyla diğer bilgisayarlarla paylaşılabilir (bkz. *Senkronizasyon* bölümü). Bilgisayarda bir görüntü dosyası yoksa, bunun yerine bir yer tutucu grafik görüntülenir.


## Görüntüleri içe aktarma

Görüntüler uygulamaya iki farklı şekilde aktarılabilir: "Araçlar" ➝ "Görüntü yönetimi" menüsü ve bir girdinin içerik menüsündeki "Görüntüleri bağla" seçeneği (istenen girdiye sağ tıklanarak erişilebilir). İkinci durumda, görüntü içe aktarma işleminden sonra otomatik olarak ilgili girdiye bağlanacaktır (bkz. *Görüntüleri girdilere bağla* bölümü).

<p align="center"><img src="images/tr/images/droparea.png" alt="İçe aktar butonu"/></p>

İçe aktarmayı başlatmak için artı düğmesine tıklayın ve projeye eklemek istediğiniz dosyaları seçin. Alternatif olarak, dosyaları doğrudan bir dosya yöneticisi uygulamasından artı düğmesini çevreleyen alana sürükleyip bırakabilirsiniz. Proje için birden fazla görsel kategorisi (yani "Görüntü" kategorisinin alt kategorileri) tanımlanmışsa, açılır menüden istediğiniz kategoriyi seçebilirsiniz. Ayrıca, "Oluşturucu" alanının içeriğinin resim dosyası meta verilerinden otomatik olarak okunmasını veya manuel olarak ayarlanmasını seçebilirsiniz. Proje özelliklerinde bulunan, "Ekip" alanına girilen kişi isimleri seçim için kullanılabilir. Her iki durumda da, resmin oluşturulma tarihi, yüksekliği ve genişliği dosya meta verilerinden otomatik olarak okunur.
Desteklenen görsel formatları *jpg/jpeg*, *png* ve *tif/tiff*'tir.


## Görüntü varyasyonları

Her içe aktarılan görüntü için uygulama bir kopya ve önizleme görüntüsü olarak daha küçük bir varyasyonunu oluşturur ve bunu **Görüntüler dizinine** kaydeder; bu dosya yolunu "Gelişmiş ayarlar"daki ayarlarda görebilirsiniz. Bu klasördeki dosyalar uygulama tarafından yönetildiği için manuel olarak düzenlenmemeli, yeniden adlandırılmamalı veya silinmemelidir. Aksi takdirde görüntüleri ön izlemede veya senkronize ederken hatalar oluşabilir.

Uygulama her görüntü için toplamda üç farklı varyasyonu yönetir:
* *Orijinal görüntü*: Projeye aktarıldığı haliyle değiştirilmemiş görüntü dosyası
* *Küçük resim*: Uygulamada (örneğin, görüntü yönetiminde veya bağlantılı görüntülere sahip girdiler için) ön izleme görüntüsü olarak görüntülenen görselin otomatik olarak oluşturulmuş düşük çözünürlüklü bir çeşidi 
* *Görüntüleme için optimize edilmiş görüntü*: Belirli görüntüler için uygulamada görüntülenmek üzere başka bir varyasyon oluşturulur. TIFF formatındaki dosyalar JPEG'e dönüştürülür ve çok yüksek çözünürlüklü görüntülerin boyutu küçültülür. Bu adım, proje yüklenirken gerçekleşir ve mevcut görüntü dosyalarının miktarına bağlı olarak yükleme süresinin birkaç dakika uzamasına yol açabilir.

Görüntü dizininde bulunan verilerin genel görünümünü "Proje" ➝ "Verilere genel bakış" menüsünden açabilirsiniz.


## Görüntü yönetimi

Görüntüleri yönetmek için "Araçlar" ➝ "Görüntü yönetimi" menüsünü açın. Burada projedeki tüm görselleri görüntüleyebilir ve arayabilirsiniz (ayrıca *Arama* bölümüne bakın).


### Meta verileri düzenle

İstediğiniz görüntüye çift tıklayarak görüntü ön izlemesini açarak bir görüntünün meta verilerini görüntüleyebilirsiniz. Düzenleyiciyi açmak ve meta verileri eklemek veya değiştirmek için düzenle düğmesine tıklayın. Burada, görüntü kategorisine karşılık gelen bilgiler için konfigürasyon düzenleyicisinde yapılandırılan alanlar mevcuttur.


### Görüntüleri sil

Projeden içe aktarılan görüntüleri kaldırmak için, görüntü yönetiminde karşılık gelen görüntüleri seçin. Daha sonra "Sil" düğmesiyle kaldırılabilirler:

<p align="center"><img src="images/tr/images/delete_button.png" alt="'Sil' Butonu"/></p>

Lütfen unutmayın; bu aynı zamanda projenin görüntüler dizinindeki (ve bir senkronizasyon bağlantısı kurulmuşsa diğer bilgisayarlardaki) ilgili dosyaları da **silebilir**. Bir görüntü silindiğinde girdilerle bağlantıları kaybolacaktır.


## Görselleri girdilere bağlayın

Bir veya daha fazla görüntüyü bir girdiye bağlamak için, ilgili girdinin içerik menüsünde "Görselleri bağla" seçeneğini seçin ve artı düğmesine tıklayın. Artık iki seçenek arasında seçim yapabilirsiniz:

* *Yeni görseller ekle*: Yeni görseller projeye aktarılacak ve girdiye bağlanacak.
* *Mevcut görselleri bağla*: Projede halihazırda mevcut olan görsellerden bir veya daha fazlasını seçerek girdiye bağla.

Listedeki görüntüleri seçin ve görüntüleri girdiden ayırmak için "Bağlantıyı kaldır" seçeneğini seçin. Görüntülerin kendisi projede kalır.

Bağlantılar ayrıca görüntü yönetimi aracılığıyla eklenebilir veya kaldırılabilir. Bunu yapmak için, istediğiniz görüntüleri seçin ve üst çubuktaki "Bağla" (mavi düğme) veya "Bağlantıları kaldır" (kırmızı düğme) düğmesine tıklayın:

<p align="center"><img src="images/tr/images/link_buttons.png" alt="'Bağla' ve 'Bağlantı Kaldır' Butonları"/></p>


### Ana görüntü ayarla

Bir girdi birden fazla görüntüye bağlıysa, görüntülerden biri **ana görüntü** olarak bir yıldız simgesiyle işaretlenir. Bu ana görüntü, girdi için bir önizleme görseli olarak görüntülenir. Girdinin içerik menüsünde "Görüntüleri bağla" seçeneğini belirleyerek ve bağlı görüntüler listesinde istediğiniz görüntüyü seçerek ana görüntüyü değiştirebilirsiniz. Ardından "Ana görüntü olarak ayarla" düğmesine tıklayın:

<p align="center"><img src="images/tr/images/main_image.png" alt="'Ana görüntü olarak ayarla' Butonu"/></p>


## Harita katmanları

### Coğrafi referanslama

Bir görüntü harita katmanı olarak kullanılmadan önce, öncelikle coğrafi referans bilgisi sağlanmalıdır. Desteklenen biçimler; *tif/tiff* dosya uzantılı GeoTIFF dosyaları ve *wld*, *jpgw*, *jpegw*, *jgw*, *pngw*, *pgw*, *tifw*, *tiffw* ve *tfw* uzantılı 'world' dosyalarıdır.

Görüntü dosyası GeoTIFF biçimindeyse başka bir işlem yapılmasına gerek yoktur. Görüntü içe aktarıldığında coğrafi referanslama bilgileri otomatik olarak uygulanır.

World dosyaları iki farklı şekilde içe aktarılabilir: Uzantıdan önceki dosya adı, karşılık gelen görüntü dosyasının adıyla aynıysa, dosya görüntü içe aktarma (artı düğmesi) yoluyla eklenebilir. Görüntüye atama otomatik olarak gerçekleşir. Alternatif olarak, bir world dosyası görüntü yönetiminde karşılık gelen görüntüye çift tıklayarak ulaşabileceğiniz ön izleme menüsü ile içe aktarılabilir. "Coğrafi referans verileri" bölümünü açın ve istediğiniz dosyayı seçmek için "World dosyasını yükle" düğmesine tıklayın.

<p align="center"><img src="images/tr/images/worldfile_import.png" alt="Coğrafi referans ekle"/></p>


### Harita katmanlarını düzenle

Bir harita katmanı belirli bir işlem veya tüm proje için ayarlanabilir. Harita katmanının tüm projede kullanılabilir olmasını istiyorsanız genel bakış sekmesine (ev simgesi) veya istediğiniz işlemin sekmesine geçin. Orada, haritanın sağ üst köşesindeki düğme aracılığıyla harita katmanı menüsünü açın ve düzenle düğmesine tıklayın. Artık artı düğmesi aracılığıyla yeni harita katmanları ekleyebilirsiniz. Coğrafi referans verisi eklenmiş tüm görüntüler kullanılabilir.

<p align="center"><img src="images/tr/images/layer_menu.png" alt="Harita katmanlarını düzenle"/></p>

Harita katmanlarının sırasını, sürükle ve bırak yoluyla listede yukarı veya aşağı taşıyarak değiştirin. Bu sıralama, haritada birden fazla (coğrafi olarak) üst üste gelen görüntünün hangisinin üstte görüntüleneceğini belirler: Listede daha yukarıda olan bir katman, haritada daha aşağıda olan bir katmanın üstünde görüntülenir ve onu tamamen veya kısmen gizleyebilir.

Her liste girişinin sağında bulunan mavi renkli "Varsayılan harita katmanı olarak ayarla" (yıldız simgesi) butonu, proje ilk açıldığında haritada varsayılan olarak görüntülenmesi gereken bir veya daha fazla görselin seçilmesine olanak tanır.

Kırmızı "Harita katmanını kaldır" butonuna tıklayarak listeden bir katmanı kaldırabilirsiniz. Görüntünün kendisi projeden silinmeyecek ve tekrar harita katmanı olarak eklenebilecektir.

Değişiklikleri veri tabanına kaydetmek için "Kaydet" butonuna tıklayın.


### Harita katmanlarını görüntüle

Ayarlanan harita katmanları, harita katmanı menüsü üzerinden her an gösterilebilir veya gizlenebilir. Bunu yapmak için listedeki ilgili katmanın solundaki göz düğmesine tıklayın. Burada yapılan ayarlar (sekme için kullanılabilen harita katmanları listesinin aksine) veritabanına kaydedilmez ve bu nedenle bir senkronizasyon bağlantısı üzerinden paylaşılmaz. Böylece farklı harita katmanları farklı bilgisayarlarda gösterilebilir ve gizlenebilir.


<hr>


# Arama

**Genel Bakış**'ta, **İşlem sekmelerinde** ve **Görüntü Yönetimi**'nde bir **Arama Filtresi** mevcuttur. Bunu, halihazırda görüntülenen kayıtları ayırt etmek için kullanabilirsiniz:
Bazı temel arama kriterlerinin (tanımlayıcı, kısa açıklama, kategori) araçları.

Daha karmaşık arama sorguları işletmek istiyorsanız **Genel Bakış** veya **İşlem sekmelerinden** birindeyken **gelişmiş arama moduna** geçebilirsiniz.
Bu mod, hiyerarşik sıralamaları atlayarak 
aramayı detaylandırmanıza, tüm projede arama yapmanıza 
ve ek alan özel arama ölçütleri tanımlamanıza olanak tanır.

## Arama filtresi

Arama filtresi, belirli ölçütlere göre girdileri göstermenin veya gizlemenin hızlı bir yoludur. Şunlardan oluşur:
*metin filtresi* (bir arama kutucuğu) ve bir *kategori filtresi* (mavi buton).

<p align="center"><img src="images/tr/search/search_filter.png" alt="Arama filtresi"/></p>

Bir arama terimi girdikten ve/veya bir kategori seçtikten sonra, yalnızca bu filtre kriterlerine uyan kayıtlar gösterilir. 
**Genel bakış** ve **işlem sekmelerinde**, bu durum sol kenar çubuğundaki tüm girdiler 
ile sırasıyla haritadaki (harita görünümünde) tüm girdileri ve listenin öğelerini (liste görünümünde) etkiler. 
**Görüntü yönetiminde**, ızgarada gösterilen tüm görüntüler arama filtresinden etkilenir.


### Kategori filtresi

<p align="center"><img src="images/tr/search/filter_menu.png" alt="Kategori filtre seçimi"/></p>

Kategori filtre düğmesi bir girdi kategorisi seçmenize olanak tanır. Üst ve alt kategoriler bulunmaktadır: Bir alt kategori seçerseniz (örneğin "Tabaka"),
yalnızca ilgili kategorinin girdileri gösterilir. 
Buna karşılık, bir üst kategori seçerseniz (örneğin "Stratigrafik birim"), 
seçili kategorinin girdileri ve tüm alt kategorileri (örneğin "Tabaka", "Mezar", "Mimari", "Zemin" vb.) dahil edilir.
Yalnızca üst kategoriyi seçmek için tekrar tıklayın.

Mevcut içerik hangi kategorilerin kullanılabileceğini belirler: Genel bakışta işlem kategorilerini, 
görüntü yönetiminde görüntü kategorilerini vb. düzenleyebilirsiniz.


### Metin filtresi

Arama terimleri mevcut "Tanımlayıcı" ve "Kısa açıklama" girdi alanlarıyla karşılaştırılır.
 
*Örnek:*
 
Genel görünümde aşağıdaki üç açma gösterilmektedir:

    (1)
    Tanımlayıcı: "T01"
    Kısa açıklama: "Açma-01"
    
    (2)
    Tanımlayıcı:  "T02"
    Kısa açıklama: "Açma-02"
    
    (3)
    Tanımlayıcı:  "mt1"
    Kısa açıklama: "Benim Açmam 1" 

**Uygun arama terimleri** tanımlayıcıların ve kısa açıklamaların metin dizeleridir ve her biri boşluk karakterleri veya tirelerle ayrılmıştır, 
örnekte olduğu gibi: "T01", "T02", "mt1", "Açma", "01", "02", "Benim", "1".

Bu nedenle, sonuçlarda "t01" terimi için yapılan bir arama (1) girdisini verir ve "benim" için yapılan bir arama (3) değerini verir.
**Büyük-küçük harf kullanımı** göz ardı edilir.
  
Yapılan arama, her durumda arama teriminin başlangıcının kontrol edildiği bir çeşit **(başlangıç terimi) aramasıdır**: 
(1) ve (2) tanımlayıcıları "t0" metin dizesiyle başladığından, "t0" terimi için yapılan bir arama (1) ve (2) sonuçlarını döndürür. 
"aç" için yapılan bir arama (1), (2) ve (3) sonuçlarını döndürürken, 
"çm" veya "çma" için yapılan bir arama hiçbir şey döndürmez.


### Yer tutucu arama

Metin filtresi alanına metin girerken, yer tutucular kullanılabilir: 
Tek bir karakter yerine, köşeli parantez içinde izin verilen farklı karakterler kümesi belirtebilirsiniz. 
Böyle bir yer tutucu, arama sorgusu başına bir kez kullanılabilir.

*Örnek:*

    (1) Tanımlayıcı: "Arazi-0001"
    (2) Tanımlayıcı: "Arazi-0009"
    (3) Tanımlayıcı: "Arazi-0010"
    (4) Tanımlayıcı: "Arazi-0011"
    (5) Tanımlayıcı: "Arazi-0022"

"Arazi-00[01]" için yapılan bir arama (1), (2), (3), (4) döndürür çünkü 0 ve 1 üçüncü basamak için 
izin verilen karakterler olarak tanımlanmıştır. Başlangıç terimi araması nedeniyle tüm takip eden karakterlere izin verilir.

"Arazi-00[01]1" araması (1) ve (4) değerlerini döndürür, çünkü yer tutucudan sonraki rakam 1 olmalıdır.


### Diğer içeriklerden gelen arama sonuçları

Mevcut içerikte hiçbir arama sonucu bulunamazsa, metin giriş alanının altında diğer içeriklerden 
gelen arama sonuçları gösterilir.

<p align="center"><img src="images/tr/search/other_contexts.png" alt="Diğer içeriklerden arama sonuçları"/></p>

Girdilerden birine tıklayarak hemen ilgili bağlama geçebilir 
ve girdiyi seçebilirsiniz.


## Detaylı arama modu

**Genel bakış** ve **İşlem sekmelerinde** genişletilmiş arama moduna geçmek için
büyüteç butonuna tıklayın.
 
<p align="center"><img src="images/tr/search/extended_search_button.png" alt="Detaylı arama modu butonu"/></p>

Detaylı arama modu, daha büyük miktardaki veriler üzerinde arama yapmanıza olanak tanır:

* **Genel Bakış** kısmında, arama projenin tüm girdileri üzerinden gerçekleştirilir.
* **İşlem sekmelerinde**, işlemin tüm girdileri üzerinde arama yapılır.

Her iki durumda da bulunan tüm girdiler sol taraftaki listede gösterilir. "içerikte göster" 
(Yukarı ok işareti) ve sırasıyla "Bir işlemin içeriğinde göster" (Sağ yukarı ok işareti) butonları 
bir kaydın hiyerarşik içeriğine geçmenizi sağlar; bunu yaparken genişletilmiş arama modu sonlandırılır ve 
gerekirse yeni bir sekme açılır.

<p align="center"><img src="images/tr/search/show_in_context.png" alt="İçerikte göster"/></p>

Detaylı arama modundayken, devre dışı bırakılmış oluştur düğmesiyle girdi oluşturmak mümkün değildir. 
Yeni girdiler oluşturmak için lütfen detaylı arama modundan çıkın.

Performans nedenleriyle aynı anda gösterilen arama sonuçlarının sayısı en fazla **200** ile sınırlandırılmıştır. 
Diğer girdiler uygulama tarafından görüntülenmez ve bunun yerine limitin aşıldığına dair bir bildirim gösterilir. 
Bu girdilere erişmek için daha fazla arama kriteri ekleyin 
veya genişletilmiş arama modundan çıkın.


### Alana özel arama kriterleri
 
Detaylı arama modu etkinleştirilirse, kategori filtresi düğmesinin solundaki artı düğmesine tıklayarak
bir girdinin belirli alanlarında arama başlatabilirsiniz. 
Arama için kullanılabilir alanlar, seçili kategoriye karşılık gelen alanlardır. 
Birden fazla arama kriterini birleştirmek için istediğiniz kadar alan seçebilirsiniz. 
Elbette, alan belirli arama kriterini metin filtresiyle birlikte de kullanabilirsiniz. 

<p align="center"><img src="images/tr/search/criteria_search.png" alt="Alana özel arama kriterleri"/></p>

Metin alanı olması durumunda, doğrudan arama terimini girmeniz yeterlidir.
Değer listeleri olan alanlar için, açılır menüdeki tüm izin verilen değerlerin listesinden terimi seçin.

**Önemli:** Arama filtresinin aksine, bu durumda başlangıç terimi araması yapılmaz. 
Girdinin arama sonuçları listesinde görünmesi için seçilen arama teriminin 
girdi alanının içeriğiyle tam olarak eşleşmesi gerekir.

Belirli bir arama terimi belirtmek yerine, alanın ayarlandığı 
("Herhangi bir değer" seçeneği) veya ayarlanmadığı ("Değer yok" seçeneği) ile tüm girdilerde de arama yapabilirsiniz.

Kategori filtresi düğmesinin yanında görünen sayı, etkin arama kriteri sayısını gösterir.
Numaraya tıklayarak arama kriterini kaldırabilirsiniz. 
Bu işlem, menüyü tekrar açar ve kaldırılacak arama kriterini seçebilirsiniz.


<hr>


# Senkronizasyon

Veriler farklı bilgisayarlardaki birden fazla Field Desktop kurulumu arasında, tek bir proje üzerinde ortak çalışabilmek için senkronize edilebilir. Bu, başka bir makinede çalışan bir Field Desktop uygulamasından gelen değişikliklerin (yeni girdiler, silinen girdiler, mevcut girdilerin düzenlenmesi, eklenen veya silinen resimler...) otomatik olarak yerel veritabanına aktarılacağını veya kaldırılacağı anlamına gelir. Bu, tüm kullanıcıların projenin en son kayıtlı haliyle aynı anda çalışmasını sağlar. Senkronizasyon hem internet üzerinden hem de yerel ağ üzerinden çalışır. Çevrimdışıyken bir proje üzerinde çalışmaya devam edebilirsiniz - bu durumda veritabanları ağ bağlantısı tekrar kurulduğunda senkronize edilecektir.


## Projeyi indir

Başka bir Field Desktop kurulumunda veya bir Field sunucusunda bulunan mevcut bir projeyle çalışmak için önce proje indirilmelidir. Bunu yapmak için "Proje" ➝ "İndir..." menü öğesini seçin ve erişim bilgilerini girin:

* *Adres*: Projeyi indirmek istediğiniz bilgisayarın adresini girin. Bu, Field Desktop'ın şu anda açık olduğu başka bir bilgisayarın ağ adresi olabilir (bu adres ayarlar bölümünde *Adresiniz* kısmında görülebilir). İnternet veya yerel ağ üzerinden erişilebilen bir Field sunucusunun adresi olabilir (örneğin DAI sunucusu için *https://server.field.idai.world*).
* *Proje adı*: İndirmek istediğiniz projenin adı.
* *Şifre*: Projeyi indirmek istediğiniz projenin veya Field Desktop kurulumunun şifresi.
* *Küçük resimleri indir*: Bu seçenek varsayılan olarak etkindir. Zayıf bir internet bağlantınız varsa ve mümkün olduğunca az veri indirmek istiyorsanız, bunu devre dışı bırakmak isteyebilirsiniz.
* *Orijinal görselleri indir*: Görüntüleri orijinal görüntü çözünürlüklerinde indirmek istiyorsanız bu seçeneği etkinleştirin. Projede yönetilen görüntü sayısına ve boyutuna bağlı olarak, birkaç gigabayt verinin indirilmesi gerekebilir. Bu seçeneği etkinleştirmeden önce yeterli bir internet bağlantınız ve sabit disk alanınız olduğundan emin olun.
* *Aynı tanımlayıcıda mevcut projenin üzerine yaz*: Bu seçenek etkinleştirilirse, bilgisayarda aynı adlı bir proje zaten mevcut olsa bile proje indirilir. Mevcut proje bu işlem sırasında silinir.

Geçerli bir adres, proje adı ve şifre girdiğinizde, kısa bir hesaplama süresinin ardından ilgili seçeneklerin yanında indirilecek görüntü verisinin miktarı gösterilecektir.

Lütfen unutmayın; daha büyük projelerin indirmesi daha uzun sürebilir. İndirilen proje daha sonra otomatik olarak açılacak ve aynı kimlik bilgileri kullanılarak bir senkronizasyon bağlantısı kurulacaktır.


## Senkronizasyonu konfigüre etme

Hem indirilen hem de yeni oluşturulan projeler her zaman diğer veritabanlarıyla senkronize edilebilir. Senkronizasyon "Proje" ➝ "Senkronize et..." menüsü üzerinden yapılandırılabilir.

* *Adres*: Eşitleme bağlantısı kurmak istediğiniz veritabanının adresi. Bu, Field Desktop'ın şu anda açık olduğu başka bir bilgisayarın ağ adresi olabilir (bu adres ayarlar bölümünde *Adresiniz* olarak görüntülenebilir) veya internet veya yerel ağ üzerinden erişilebilen bir Field Hub sunucusunun adresi olabilir (örneğin DAI'nin Field Hub sunucusu için *https://server.field.idai.world*).
* *Şifre*: Senkronizasyon bağlantısını kurmak istediğiniz projenin veya Field Desktop kurulumunun şifresi.
* *Senkronizasyonu etkinleştir*: Bağlantıyı başlatmak veya kesmek için bu anahtarı kullanın.
* *Küçük resimleri senkronize et*: Bu seçenek varsayılan olarak etkindir. Zayıf bir internet bağlantınız varsa ve mümkün olduğunca az veri yüklemek/indirmek istiyorsanız, bunu devre dışı bırakmak isteyebilirsiniz.
* *Orijinal görselleri yükleyin*: Görüntüleri orijinal çözünürlüklerinde yüklemek istiyorsanız bu seçeneği etkinleştirin.
* *Orijinal görselleri indir*: Görüntüleri orijinal çözünürlüklerinde indirmek istiyorsanız bu seçeneği etkinleştirin. Projede yönetilen görüntü sayısına ve boyutuna bağlı olarak, birkaç gigabayt verinin indirilmesi gerekebilir. Bu seçeneği etkinleştirmeden önce yeterli bir internet bağlantınız ve sabit disk alanınız olduğundan emin olun.

Geçerli bir adres ve doğru şifreyi girer girmez, kısa bir hesaplama süresinden sonra ilgili seçeneklerin yanında yüklenecek/indirilecek görüntü verisi miktarı gösterilecektir. Lütfen unutmayın; daha sonra projeye ek görüntüler aktarılırsa veri miktarının artabilecektir.

Son olarak **Ayarları uygula** butonuna tıklayarak ayarlarınızı onaylayın.

## Senkronizasyon durumu

Gezinme çubuğunun sağ üst köşesindeki bulut simgesi, yapılandırılmış senkronizasyon bağlantınızın geçerli durumunu gösterir.

<p align="center"><img src="images/tr/synchronization/synchronization_icon.png" alt="Senkronizasyon simgesi"/></p>

Bağlantı başarıyla kurulmuşsa, simge bir onay işareti gösterir. Veriler yüklenirken veya indirilirken bu bir okla gösterilir. Hatalar durumunda bir ünlem işareti gösterilir. Eşitleme durumuyla ilgili ek bilgiler, fare işaretçisini simgenin üzerine getirerek görülebilir.

## Çakışmalar

Çakışmalar, bir girdinin birden fazla bilgisayarda aynı anda düzenlendiğinde veya bilgisayarlar bağlı değilken aynı girdinin düzenlendiği iki veritabanı senkronize edildiğinde ortaya çıkabilir . Bu durumlarda aynı girdinin iki farklı sürümü vardır: *geçerli sürüm* (girdi yönetiminde ve uygulamanın diğer alanlarında görüntülenir) ve *rekabet eden sürüm* (çakışma durumu görüntülene kadar arka planda saklanır). İki sürüm, doldurulan veri alanlarının sayısı bakımından farklılık gösterebilir veya aynı alanlarda farklı değerlere sahip olabilir.

Çatışmaları olan her girdi için bir uyarı gösterilir (bkz. *Uyarılar* bölümü). Girdi düzenleyicisinin **Çakışmalar** sekmesinde etkilenen bir kaydı temizleyebilirsiniz.

Çakışmaları çözmek için, farklı değerlere sahip her alan için hangi sürümün geçerli olduğuna karar verilmelidir. Alternatif olarak, *geçerli sürümü* veya *rekabet eden sürümü* bir bütün olarak seçebilirsiniz. **Çakışmayı çöz**'e tıklayarak kararı onaylayın. Tek bir girdide birden fazla çakışma olması durumunda, tüm çakışmalar çözülene kadar bu işlem tekrarlanmalıdır. Düzenleyici açıkken diğer düzenleyici gruplarında da değişiklik yapmak mümkündür. Değişiklikleri uygulamak için, girdi son olarak **Kaydet** butonuyla kaydedilmelidir.

## Kendi Field Desktop kurulumunuza senkronizasyon bağlantılarına izin verme

Başkalarının projenizle senkronizasyon bağlantısı kurmasına izin vermek için, **Ayarlar** menüsündeki **Senkronizasyon** bölümünde bulunan kimlik bilgilerini onlara sağlayabilirsiniz:

* *Adresiniz*: Başkalarının kendi Field Desktop kurulumlarından veri tabanınıza bağlanmak için kullanabileceği ağ adresinizdir. Bu adresi, başkalarının proje verilerini sizinle senkronize etmelerine izin vermek için şifrenizle birlikte paylaşabilirsiniz.
* *Şifreniz*: Veri tabanı yetkisiz erişime karşı rastgele oluşturulmuş varsayılan bir şifreyle korunur. Dilerseniz şifreyi değiştirebilirsiniz.
* *Orijinal görüntüleri al*: Bu seçenek etkinleştirilirse, başkaları tarafından gönderilen görüntü dosyaları orijinal görüntü çözünürlüklerinde kabul edilir ve görüntü dizininde saklanır. Görüntü dosyaları birkaç gigabayt veri içerebileceğinden, görüntü dizininde yeterli depolama alanı olduğundan emin olmalısınız. Varsayılan olarak bu seçenek devre dışıdır, bu nedenle orijinal görüntüler kabul edilmez. Seçenek yalnızca diğer bilgisayarlarda ayarlanmış olan senkronizasyon bağlantılarını etkiler; kendi kendine yapılandırılmış bir senkronizasyon bağlantısı bu ayardan etkilenmez.


<hr>


# Proje konfigürasyonu

Field Desktop ile yönetilen bir veri tabanı, her zaman belirli bir **kategoriye** ait olan bir dizi girdi içerir, örneğin "Yer", "Buluntu" veya "Görüntü". **Üst kategorilerde** (örneğin "Buluntu") ve **alt kategorilerde** (örneğin "Tuğla" veya "Pişmiş Toprak") arasında bir ayrım yapılır. Alt kategorinin bir girdisi her zaman üst kategoriye de aittir (bir tuğla da bir buluntudur).

Her kategoride, girdinin özelliklerini ve meta verilerini tanımlamak için kullanılabilen (örneğin "ağırlık", "renk", "sorumlu" vb.) bir dizi **alan** bulunur. Alanların her biri, hangi verilerin hangi şekilde girilebileceğini belirleyen (örneğin: metin alanı, sayı girişi, tarihleme girişi gibi) belirli bir tiptedir. Bazı giriş türlerindeki alanlarda, bir dizi metin değeri önceden tanımlanmış seçenekler halinde veren bir **değer listesi** belirebilir.

Girdi düzenleyicide bir kategori için hangi alanların özel olarak kullanılabilir olduğu, kullanılabilir alanlardan bir seçim yapan ve bunları **gruplar halinde** sıralayan **form** seçiminde belirlenir. Her kategori için, yalnızca birkaç zorunlu alan içeren aynı adlı temel bir form mevcuttur. Buna ek olarak daha kapsamlı bir alan seçimine sahip (örneğin, "Çanak Çömlek:default", "Çanak Çömlek" kategorisinde Field veri modelinin standart alanlarıyla) bir veya daha fazla form bulunmaktadır. Formlar, alan grupları ile alanları, yapılandırma düzenleyicisi kullanılarak istenildiği gibi özelleştirilebilir ve genişletilebilir. Bir alt kategorinin formu, her zaman ilgili üst kategorinin seçili formunun alanlarını devralır.

**İlişkiler**, girdiler arasındaki (örneğin: "A1" katmanı, "A2" katmanının konumsal olarak altında yer alır) gibi ilişkileri belirtmek için kullanılır. İlişkiler konfigürasyon düzenleyicisinde gizlenebilir, ancak yeni bir tane oluşturulamaz.

Projede bulunan kategorileri, alanları ve değer listelerini ayarlamanıza ve genişletmenize olanak tanıyan yapılandırma düzenleyicisine "Araçlar" ➝ "Proje konfigürasyonu" menüsü üzerinden erişebilirsiniz. Bir senkronizasyon bağlantısı kurulmuş ise konfigürasyondaki değişiklikler "Kaydet" düğmesiyle onaylanır onaylanmaz diğer kullanıcılara aktarılır.


## Tanımlayıcılar ve etiketler

Proje yapılandırmasının tüm öğeleri (kategoriler, alanlar, değer listeleri, vb.) her biri, benzersiz tanımlama için bir **tanımlayıcı**ya sahiptir. Bu tanımlayıcı veri tabanında kaydedilir ve ayrıca girdileri içe veya dışa aktarırken kullanılır. Konfigürasyon düzenleyicisinde fuşya renginde görüntülenir.

Ek olarak, yapılandırılmış proje dillerinin her biri için **etiketler** eklenebilir. Bu metinler uygulamanın diğer tüm alanlarında görüntülenmek üzere kullanılır ve yapılandırma düzenleyicisinde siyah olarak da görüntülenir. Etiket yoksa bunun yerine tanımlayıcısı görüntülenir.


## Kategoriler ve formlar

Editörün sol kenar çubuğu, proje için mevcut yapılandırılmış kategorileri listeler. Sol üstteki filtre menüsünü kullanarak, görüntülenen kategorilerin seçimini uygulamanın belirli bir kısmıyla (örneğin, bir açma sekmesi içinde oluşturulabilecek kategorilerle filtrelemek için "Açma") sınırlayabilirsiniz. "Tümü" seçeneğini seçerseniz, projenin tüm kategorileri listelenir.

<p align="center"><img src="images/tr/configuration/categories_filter.png" alt="Kategori filtre menüsü"/></p>

Listede bir kategoriyi seçtiğinizde, o kategori için yapılandırılmış form, ilgili alan grupları ve alanlarıyla birlikte sağ tarafta görüntülenir.


### Üst kategoriler ekleme

Listenin altındaki yeşil artı düğmesini kullanarak projeye yeni bir üst kategori ekleyebilirsiniz. Proje için henüz yapılandırılmamış olan Field Desktop kategori listesinden, tüm üst kategoriler arasından seçim yapabileceğiniz yeni bir pencere açılır. Listenin üstündeki metin alanını kullanarak görüntülenen kategorileri ve formları filtreleyebilirsiniz. Her kategori için kullanılabilir formlar listelenir; formlardan birini seçtiğinizde, sağ tarafta karşılık gelen alan gruplarını ve alanları göreceksiniz. "Kategori ekle" düğmesine tıklayarak seçiminizi onaylayın.

Lütfen unutmayın; konfigürasyon düzenleyicisi üzerinden yeni üst kategoriler eklenemeyecektir.


### Alt kategoriler ekleme

Mevcut bir üst kategoriye yeni bir alt kategori eklemek istiyorsanız ilgili üst kategorinin sağında görüntülenen küçük artı düğmesine tıklayın. Artı düğmesi görünmüyorsa bu kategori için alt kategoriler oluşturmak mümkün değildir.

Üst kategori eklemeye benzer şekilde, her kategori için farklı formlar arasında seçim yapabilirsiniz. Kendi kategorinizi oluşturmak istiyorsanız, listenin üstündeki metin alanına istediğiniz kategori adını girin ve "Yeni kategori oluştur" seçeneğini belirleyin. Kategori düzenleyicisi açılır ve burada kategorinin özelliklerini ayarlayabilirsiniz (bkz. *Kategorileri düzenleme* bölümü). Yeni oluşturulan bir kategoride üst kategorinin seçili form alanlarını devralan yeni bir form otomatik olarak oluşturulur.

"Proje konfigürasyonu" menüsünde "Özel kategorileri/alanları vurgula" seçeneği etkinleştirildiği takdirde, listede proje özel kategorileri mavi renkle vurgulanır.


### Kategorileri yönetme

Bir kategoriye sağ tıklandığında aşağıdaki seçenekleri sunan bir içerik menüsü açılır:

* *Düzenle*: Kategori düzenleyicisini açar (bkz. *Kategorileri düzenleme* bölümü).
* *Formu değiştir*: Bu kategori için başka bir form seçmek üzere bir menü açar. Lütfen unutmayın; mevcut form ve kategoride yapılan tüm değişiklikler bu işlem sırasında kaybolacaktır. Bir üst kategori üzerinde işlem yapılıyorsa bu durum tüm alt kategorileri ve formlarını da etkileyecektir.
* *Sil*: Onayladıktan sonra kategoriyi kaldırır. Projede zaten bu kategoride girdiler mevcutsa silinmezler ancak kategori tekrar eklenene kadar görüntülenmezler. Ayrıca silme işlemi kategoride seçilen formun tüm özelleştirmelerini kaldıracaktır. Söz konusu forma göre oluşturulan girdileriniz varsa ilgili kategoriler silinmemelidir.


### Kategorileri düzenleme

İçerik menüsü üzerinden veya kategori listesindeki bir girişe çift tıklanarak, kategorinin özelliklerinin düzenlenebileceği pencere açılabilir:

* *Etiket*: Uygulamanın tüm alanlarında gösterilecek kategorinin görüntüleme etiketi. Farklı diller için etiketler girebilirsiniz.
* *Renk*: Kategori simgesinin ve haritada bu kategorideki girdiler için gösterilen geometrilerin rengi.
* *QR kodları*: Bu kategorideki girdilerde QR kodlarının kullanılmasını sağlar (bkz. *QR kodları* bölümü).
* *Tanımlayıcı ön eki*: İsteğe bağlı olarak bu kategorinin girdi tanımlayıcısının her zaman başlaması gereken bir metni buraya girin. Lütfen unutmayın; halihazırda var olan tanımlayıcılar otomatik olarak güncellenmeyecektir.
* *Girdi sınırı*: İsteğe bağlı olarak bu kategori için oluşturulabilecek en fazla girdi sayısını belirtmek için buraya bir sayı girin. Giriş alanı boş bırakılırsa, herhangi bir sayıda girdi oluşturulabilir. Bu seçenek yalnızca işlem kategorileri ve "Yer" kategorisi için kullanılabilir.

Projeye özel kategoriler için aşağıdaki özellikleri de belirtebilirsiniz:
* *Açıklama*: Kategorinin hangi bağlamlarda kullanılması gerektiğini belirten bir açıklama metni.
* *Referanslar*: Kategori veya kategori tanımları hakkında diğer sistemlerde daha fazla bilgiye ulaşmak istiyorsanız, burada kaynak URL'leri belirtin.

#### QR kodları

Bir kategori için QR kodlarının kullanımı etkinleştirilirse, kategorinin her girdisine benzersiz bir QR kodu atanabilir. Yeni bir kod oluşturulabilir, mevcut bir kod kamera taramasıyla okunabilir veya ilgili girdiye bağlanabilir. QR kodu daha sonra çeşitli şekillerde kullanılabilir:
* Kamera taramasıyla (arama çubuğundaki QR kod butonu) girdiye erişim
* QR kod etiketlerinin yazdırılması (girdinin içerik menüsü aracılığıyla)
* Depolama yerine bağlı QR kodunun (girdinin içerik menüsü üzerinden) kamera taraması yoluyla bir girdinin depodaki yerinin ayarlanması
Lütfen unutmayın; QR kodları yalnızca "Buluntu", "Buluntu Koleksiyonu", "Numune" ve "Depolama yeri" kategorileri ile bunların alt kategorileri için kullanılabilecektir.

QR kodlarını konfigüre etmek için kategori düzenleyicide aşağıdaki seçenekler kullanılabilir:
* *Tanımlama için QR kodlarını kullan*: Kategorinin girdilerinde QR kodlarının kullanılmasına izin vermek için bu seçeneği etkinleştirin
* *Yeni girdiler için otomatik olarak oluştur*: Her yeni oluşturulan girdi için otomatik olarak bir QR kodu oluşturulması gerekiyorsa bu seçeneği etkinleştirin
* *Yazdırılacak alanlar*: Girdi tanımlayıcısına ek olarak QR kod etiketinde yazdırılacak en fazla üç alanı seçin. Alan etiketinin yazdırılan etikette, içerik bilgisinden önce görünmesini istiyorsanız "Alan etiketini yazdır" seçeneğini etkinleştirin.


### Hiyerarşi

Kategori, bir girdinin, hiyerarşik olarak nerede oluşturulabileceğini belirler: Örneğin, buluntular stratigrafik birimler içinde oluşturulabilir, ancak tersi mümkün değildir. Form görüntüsünün hemen üstündeki sağ üstteki iki düğmeyle, seçili kategorinin hangi kategorilerdeki girdilerinin oluşturulabileceğini ve hangi kategorilerdeki girdileri içerebileceğini aşağıda görebilirsiniz.

<p align="center"><img src="images/tr/configuration/hierarchy.png" alt="Hiyerarşi bilgi butonları"/></p>

Kategori hiyerarşisi mevcut konfigürasyon düzenleyicisinde değiştirilemez. Yeni oluşturulan alt kategoriler için, üst kategorinin hiyerarşik kısıtlamaları geçerlidir.


## Gruplar

Kategori listesinin sağında, şu anda seçili kategori formunun alan grupları görüntülenir. Bir gruba tıklayarak sağındaki ilgili alanları görüntüleyin.


### Grupları ekleyin

Listenin altındaki yeşil artı düğmesini kullanarak forma yeni bir grup ekleyebilirsiniz. Proje için yapılandırılmış diğer formlarda bulunan gruplardan birini seçebilir veya yeni bir grup oluşturabilirsiniz. Bunu yapmak için listenin üstündeki metin alanına yeni grubun adını girin ve "Yeni grup oluştur" seçeneğine tıklayın. Yeni grubun görüntü etiketini girebileceğiniz grup düzenleyicisi açılır.


### Grupları yönetme

Bir gruba sağ tıklandığında aşağıdaki seçeneklerin bulunduğu bir içerik menüsü açılır:

* *Düzenle*: Grubun görüntü etiketini girebileceğiniz grup düzenleyicisini açar. Farklı diller için etiketler girebilirsiniz. Grup düzenleyicisi ayrıca gruba çift tıklanarak da açılabilir.
* *Sil*: Grubu formdan kaldırır. Lütfen unutmayın; bir grup yalnızca herhangi bir alan içermiyorsa silinebilir. Grubu silmeden önce tüm alanları diğer gruplara taşıyın veya kaldırın.


## Alanlar

Grup listesinin sağında, seçili gruba dahil olan alanlar görüntülenir. Alanlar listesindeki bir girdiye tıklayarak alan hakkında daha fazla bilgi (açıklama, giriş türü ve varsa atanmış değer listesi) görüntüleyin.

Üst kategori formundan devralınan alanlar üst kategori simgesiyle işaretlenir ve düzenlenemez veya silinemez. Bunu yapmak için, karşılık gelen üst kategorinin formuna geçin.


### Alanlar ekleyin

Gruba yeni bir alan eklemek için alan listesinin altındaki artı düğmesine tıklayın. Seçili kategori için henüz forma eklenmemiş tüm alanlar arasından seçim yapabilirsiniz. Sağ tarafta alan hakkında bilgi göstermek için listede bir giriş seçin. Yeni bir alan oluşturmak için, listenin üstündeki giriş alanına istediğiniz tanımlayıcıyı girin ve "Yeni alan oluştur" seçeneğini seçin. Alan düzenleyicisi açılır ve burada alanın özelliklerini belirleyebilirsiniz (bkz. *Alanları düzenleme* bölümü).

"Proje konfigürasyonu" menüsünde "Özel kategorileri/alanları vurgula" seçeneği etkinleştirildiği takdirde, listede proje özelindeki alanlar mavi renkle vurgulanır.


### Alanları yönetme

Bir alana sağ tıklandığında aşağıdaki seçenekleri sağlayan bir içerik menüsü açılır:

* *Düzenle*: Alan düzenleyicisini açar (bkz. *Alanları düzenleme* bölümü).
* *Sil*: Onaydan sonra alanı siler. Bu alan için veriler girdilere daha önce eklenmişse silinmez ancak alan tekrar eklenene kadar artık görüntülenemez. Bu seçenek yalnızca projeye özgü alanlar için kullanılabilir. Alan form listesinden seçilen bir forma ait alanlar silinemez, yalnızca alan düzenleyicisinde gizlenir.
 

### Alanları düzenleme

İçerik menüsü üzerinden veya alan listesindeki bir girişe çift tıklanarak, alanın özelliklerinin düzenlenebileceği pencere açılabilir:

* *Etiket*: Uygulamanın tüm alanlarında gösterilen etiketi. Farklı diller için etiketler girebilirsiniz.
* *Açıklama*: Alana hangi verilerin girilmesi gerektiğini bildiren bir açıklama metni. Bu metin, girdi düzenleyicide alan etiketinin yanındaki bilgi simgesinin araç ipucu olarak görüntülenir ve veri girişi konusunda yardımcı olur.
* *Referanslar*: Diğer sistemlerdeki alan veya alan tanımları hakkında daha fazla bilgiye başvurmak için buraya URL'leri belirtin.


### Giriş türünü değiştir

Alan düzenleyicisindeki *Giriş türü* onay kutusu, alanın giriş türünü değiştirmenize olanak tanır. Field Desktop ile gelen alanlar için yalnızca veri biçimi varsayılan giriş türüyle uyumlu olan giriş türlerini seçebileceğinizi lütfen unutmayın (örneğin, tek satırlık bir metin alanından çok satırlık bir metin alanına geçmek mümkündür, ancak bir tarihleme alanından bir onay kutusu seçim alanına geçmek mümkün değildir). Projeye özgü alanlar için, giriş türünü istediğiniz zaman özgürce değiştirebilirsiniz.

Zaten girilmiş olan alan verileri, giriş türü değiştirilse bile görüntülenmeye devam edecektir. Ancak girdi düzenleyicide, geçerli giriş türüyle uyumsuz olan veriler buna göre işaretlenir ve artık orada düzenlenemez, yalnızca silinebilir.


#### Tek satırlık metin
Tek satırlık bir metnin girişi (isteğe bağlı olarak tek dilli veya çok dilli olabilir)
<p align="center"><img src="images/tr/configuration/input_type_input.png" alt="Input type 'Tek satırlık metin'"/></p>

#### Çoklu seçimli tek satırlık metin
Birden fazla tek satırlık metnin girişi (isteğe bağlı olarak tek dilli veya çok dilli olabilir)
<p align="center"><img src="images/tr/configuration/input_type_multi_input.png" alt="Giriş türü 'Çoklu seçimli tek satırlık metin'"/></p>
  
#### Çok satırlı metin
Çok satırlı, çok dilli bir metnin girişi
<p align="center"><img src="images/tr/configuration/input_type_text.png" alt="Giriş türü 'Çok satırlı metin'"/></p>

#### Tam sayı
Pozitif veya negatif tam sayı girişi
<p align="center"><img src="images/tr/configuration/input_type_int.png" alt="Giriş türü 'Tam sayı'"/></p>

#### Pozitif tam sayı
Pozitif tam sayı girişi
<p align="center"><img src="images/tr/configuration/input_type_unsigned_int.png" alt="Giriş türü 'Pozitif tam sayı'"/></p>

#### Ondalık sayı
Pozitif veya negatif ondalık sayı girişi
<p align="center"><img src="images/tr/configuration/input_type_float.png" alt="Giriş türü 'Ondalık sayı'"/></p>

#### Pozitif ondalık sayı
Pozitif ondalık sayı girişi
<p align="center"><img src="images/tr/configuration/input_type_unsigned_float.png" alt="Giriş türü 'Pozitif ondalık sayı'"/></p>

#### URL
Bir URL girişi
<p align="center"><img src="images/tr/configuration/input_type_url.png" alt="Giriş türü 'URL'"/></p>

#### Açılır liste
Değer listesinden bir değerin seçilmesi
<p align="center"><img src="images/tr/configuration/input_type_dropdown.png" alt="Giriş türü 'Açılır liste'"/></p>

#### Açılır liste (aralık)
Değer listesinden bir değerin veya değer aralığının (iki değer arasından) seçilmesi
<p align="center"><img src="images/tr/configuration/input_type_dropdown_range.png" alt="Giriş türü 'Açılır liste (aralık)'"/></p>

#### Radyo düğmesi
Değer listesinden bir değerin seçilmesi
<p align="center"><img src="images/tr/configuration/input_type_radio.png" alt="Giriş türü 'Radyo düğmesi'"/></p>

#### Evet / Hayır
Evet veya Hayır Seçimi
<p align="center"><img src="images/tr/configuration/input_type_boolean.png" alt="Giriş türü 'Evet / Hayır'"/></p>

#### Onay Kutuları
Bir değer listesinden bir veya daha fazla değerin seçimi
<p align="center"><img src="images/tr/configuration/input_type_checkboxes.png" alt="Giriş türü 'Onay Kutuları'"/></p>

#### Tarih
Takvimden bir tarih seçimi. Giriş alanı yalnızca ay veya yıl bilgilerini girmek için de kullanılabilir.
<p align="center"><img src="images/tr/configuration/input_type_date.png" alt="Giriş türü 'Tarih'"/></p>

#### Tarihleme
Bir veya daha fazla tarihlemenin belirtilmesi. Olası tarihleme türleri şunlardır: Dönem, Tek yıl, Önce, Sonra, Bilimsel.
<p align="center"><img src="images/tr/configuration/input_type_dating.png" alt="Giriş türü 'Tarihleme'"/></p>

#### Boyut
Bir veya daha fazla boyutun belirtilmesi. Tek bir değer veya bir aralık belirtilebilir. "Ölçüldüğü şekilde" seçeneği açılır alt alanının seçenekleri arasından değerler seçilebilir.
<p align="center"><img src="images/tr/configuration/input_type_dimension.png" alt="Giriş türü 'Boyut'"/></p>

#### Bibliyografik referans
Bir veya daha fazla bibliyografik referansın belirtilmesi. İsteğe bağlı olarak Zenon ID, DOI, sayfa numarası ve şekil numarası belirtilebilir.
<p align="center"><img src="images/tr/configuration/input_type_literature.png" alt="Giriş türü 'Bibliografik referans'"/></p>

#### Bileşik alan
Bileşik alanlar, her biri herhangi sayıda alt alandan oluşan birden fazla giriş içerebilir. Her alt alanın kendi adı ve giriş türü vardır (bkz. *Alt Alanlar* bölümü).
<p align="center"><img src="images/tr/configuration/input_type_composite_field.png" alt="Giriş türü 'Bileşik alan'"/></p>

#### İlişki
Konfigüre edilmiş hedef kategorilerinden birine ait bir veya daha fazla başka girdiye bağlantı (bkz. *İzin verilen hedef kategorileri* bölümü). İsteğe bağlı olarak, hedef girdilerde otomatik olarak ayarlanan bir ters ilişki konfigüre edilebilir (bkz. *Ters ilişki* bölümü).
<p align="center"><img src="images/tr/configuration/input_type_relation.png" alt="Giriş türü 'İlişki'"/></p>



### Alanları gizleme

Alanlar, alan düzenleyicisindeki *Alanı göster* ayarı devre dışı bırakılarak gizlenebilir. Alan daha sonra ne girdi görünümünde ne de girdi düzenleyicisinde görüntülenir. Gizli alanların yapılandırma düzenleyicisinde görüntülenip görüntülenmeyeceği, "Proje konfigürasyonu" menüsündeki "Gizlenmiş alanları göster" ayarına bağlıdır. Önceden girilmiş olan veriler gizlendikten sonra bile korunur ve *Alanı göster* seçeneği tekrar etkinleştirildiğinde tekrar görüntülenir. Uygulamanın işlevselliği için önemli olan bazı alanlar (girdi tanımlayıcısı gibi) gizlenemez; bu durumlarda seçenek görüntülenmez.


### Birden fazla dilde girişe izin verme

*Birden fazla dilde girişe izin ver* seçeneği etkinleştirilirse, konfigüre edilmiş proje dillerinin her biri için alana ayrı bir metin girilebilir. Ayar varsayılan olarak etkindir ve yalnızca "Tek satır metin", "Çoklu seçimli tek satır metin" ve "Çok satırlı metin" giriş türlerinin alanları için kullanılabilir.


### Alana özel arama

Alan düzenleyicisindeki *Alana özel aramaya izin ver* ayarı, genişletilmiş arama modundaki bir alan için alana özgü bir arama yapılıp yapılamayacağını belirler (bkz. *Arama* bölümündeki *Detaylı arama modu* bölümü). "Proje" kategorisindeki alanlar ve bazı giriş türlerindeki alanlar için bu ayar etkinleştirilemez; bu durumda gri renktedir.


### Değer listesini değiştirme

Halihazırda seçili olan değer listesi, "Değer listesini değiştir" düğmesine tıklanarak başka bir değer listesiyle değiştirilebilir. Hazır bir değer listesi seçilebilir veya yeni bir liste oluşturulabilir (bkz. *Değer Listeleri* bölümü).

Alana daha önce veri girilmişse, girilen değerler yeni değer listesine dahil edilmese bile görüntülenmeye devam edecektir. Bu durumda, çakışan değerler girdi düzenleyicide uyumsuz olarak işaretlenir ve orada silinebilir.


### Alt alanlar

Bu bölüm yalnızca "Bileşik alan" giriş türü seçildiğinde görünür ve bileşik alanın her girişinin hangi alt alanlardan oluştuğunu tanımlamaya izin verir. Alt alanların sıralaması sürükle ve bırak yoluyla değiştirilebilir.

Yeni bir alt alan oluşturmak için, giriş alanına istediğiniz adı girin ve artı düğmesine tıklayarak onaylayın. Alt alanı normal bir alana benzer şekilde  (giriş türü, etiket, açıklama, vb.) konfigüre edebileceğiniz yeni bir düzenleyici penceresi açılacaktır.


#### Alt alan koşulları

İsteğe bağlı olarak, alt alan düzenleyicisinde alt alanı görüntülemek için bir koşul ayarlanabilir. Bir koşul ayarlandığı zaman, alt alan yalnızca başka bir alt alanın belirli bir değeri (veya birkaç değerden biri) ayarlanmışsa veri girişi sırasında kullanılabilir.

Bir koşul belirlemek için, önce "Alt alanın görüntülenme koşulu" olarak açılan kısımda bir alt alanını seçin. "Açılır liste", "Açılır liste (aralık)", "Radiobutton", "Evet / Hayır" ve "Onay kutuları" giriş türlerinin alt alanları seçilebilir. Artık seçilen alt alanın olası değerleri görüntülenecek ve seçilebilecektir. Geçerli alt alan, yalnızca koşul alanı olarak seçilen alt alanda seçilen değerlerden en az biri ayarlandığı takdirde veri girişi sırasında görüntülenir.


### İzin verilen hedef kategorileri

Bu bölüm yalnızca "İlişki" giriş türü seçildiğinde görünür. İlişkinin hedefleri olarak, yalnızca burada seçilen kategorilerin girdileri seçilebilir. Bir üst kategori seçilirse, tüm alt kategorileri de otomatik olarak izin verilen hedef kategoriler olarak kabul edilir.

Lütfen unutmayın; alana girilen hedef girdiler, bir kategori izin verilen hedef kategorileri listesinden kaldırılırsa bile otomatik olarak kaldırılmayacaktır. Bu durumda, etkilenen girdilere ilişkin bir uyarı görüntülenir.


### Ters ilişki

Bu bölüm yalnızca "İlişki" giriş türü seçildiğinde görünür. İsteğe bağlı olarak, burada "İlişki" giriş türünde başka bir alan seçilebilir ve bu, girilen hedef girdilerde ilişkinin zıt yönünü yansıtacak şekilde otomatik olarak güncellenir.

*Örnek:* "Üstünde" ters ilişkisi "Altında" ilişkisi için yapılandırılmıştır. Hedef girdi "B", "Altında" ilişki alanında girdi "A"ya kaydedilirse, hedef girdi "A" otomatik olarak "Üstünde" ilişki alanında girdi "B"ye kaydedilir.

*Ters ilişki* seçim alanında yalnızca daha önce oluşturulmuş ve aşağıdaki ölçütleri karşılayan alanlar görünür:

* Söz konusu alanın giriş tipi "İlişki" olmalıdır.
* Düzenlenen alanın tüm izin verilen hedef kategorileri, söz konusu alanın aynı tanımlayıcısı altında konfigüre edilmesi gerekir.
* Düzenlenen alanın ait olduğu kategori, söz konusu alan için izin verilen hedef kategori olarak ayarlanmalıdır.
* Düzenlenmekte olan alanın, bu kriterlere uygun olarak söz konusu alanın tüm izin verilen hedef kategorileri için ters ilişki olarak girilmesine izin verilmesi gerekmektedir.

Ters ilişki seçilip *Tamam* butonu ile değişiklikler onaylandığında, diğer alanlardaki ters ilişkiler de otomatik olarak eklenir veya güncellenir.

Lütfen unutmayın; daha önce kaydedilmiş girdi verileri, başka bir ters ilişki seçildiğinde otomatik olarak güncellenmeyecektir.


## Sıralama ve grup atamasını ayarlama

Üst kategorilerin, alt kategorilerin, grupların ve alanların sırası sürükle bırak işlemiyle değiştirilebilir. Bunu yapmak için, liste girişinin solundaki tutamak simgesine tıklayın, fare düğmesini basılı tutun ve öğeyi istediğiniz konuma taşıyın.

<p align="center"><img src="images/tr/configuration/drag_and_drop_handle.png" alt="Sürükle ve bırak tutamağı"/></p>

Alanlar aynı şekilde başka bir gruba da atanabilir: Alanı grup listesindeki ilgili grubun girişine sürüklemeniz yeterlidir. Lütfen unutmayın; alan/grup sırasındaki veya grup atamasındaki değişiklikler otomatik olarak bir üst kategorinin formundan ilgili alt (veya tam tersi) kategorilerin formlarına aktarılmaz.


## Değer Listeleri

"Proje konfigürasyonu" ➝ "Değer listesi yönetimi" menüsü, Field ile birlikte gelen tüm değer listelerinin genel görünümünü açar. Burada listelenen değer listeleri, standart formların alanları tarafından kullanılır veya Field'da daha önce kullanmış projeler bağlamında oluşturulmuştur.

Listenin üstündeki metin alanını kullanarak değer listelerini herhangi bir arama terimine göre filtreleyin. Aramada değer listesi tanımlayıcılarının yanı sıra tanımlayıcıları ve tekil değerlerin görüntüleme etiketlerini de bulunacaktır. Arama alanının sağındaki düğmeyi kullanarak, yalnızca projeye özgü (yani yeni oluşturulmuş) değer listelerini ve/veya projede şu anda kullanılan değer listelerini seçilebilir halde görüntülemenize olanak tanıyan filtre menüsünü açabilirsiniz.

<p align="center"><img src="images/tr/configuration/valuelists_filter.png" alt="Değer listesi filtre menüsü"/></p>

Lütfen unutmayın; değer listesi yönetim penceresinde yapılan tüm değişiklikler projeye uygulanması için konfigürasyon düzenleyicisinin "Kaydet" butonuna tıklanarak onaylanması gerekmektedir.


### Değer listeleri oluşturma ve genişletme

Yeni bir değer listesi oluşturmak için, metin alanına istediğiniz tanımlayıcıyı girin ve "Yeni değer listesi oluştur" seçeneğini seçin. İstediğiniz değerleri girebileceğiniz ve daha fazla ayar yapabileceğiniz değer listesi düzenleyicisi açılır (bkz. *Değer listelerini düzenleme* bölümü).

Tamamen yeni bir değer listesi oluşturmak yerine, alternatif olarak halihazırda var olan bir listeyi düzenleyebilirsiniz. Bunu yapmak için, ilgili liste girişine sağ tıklayarak içerik menüsünü açın, *Değer listesini genişlet* seçeneğini seçin ve genişletme listeniz için bir tanımlayıcı girin. Seçilen değer listesinin tüm değerleri devralınır ve artık düzenleyicide ek değerlerle desteklenebilir. Ayrıca, var olan değerleri gizleyebilir ve sıralarını ayarlayabilirsiniz. Lütfen unutmayın; genişletme listeleri ve projeye özgü listeler genişletilemeyecektir.


### Projeye özgü değer listelerini yönetin

Projeye özgü bir değer listesine sağ tıklandığında aşağıdaki seçenekleri sağlayan bir içerik menüsü açılır:

* *Düzenle*: Değer listesi düzenleyicisini açar (bkz. *Değer listelerini düzenleme* bölümü).
* *Sil*: Onay isteminden sonra değer listesini siler. Bir veya daha fazla alan tarafından kullanıldığı sürece bir değer listesini silmek mümkün değildir. Bu durumda, önce karşılık gelen alanlar için başka bir değer listesi seçin.


### Değer listelerini düzenleme

İçerik menüsü aracılığıyla veya bir değer listesine çift tıklanarak, listenin özelliklerinin düzenlenebileceği bir düzenleyici açılabilir:

* *Değer listesi açıklaması*: Değer listesi hakkında daha ayrıntılı bilgi belirtebileceğiniz bir açıklama metni. Bu metin, liste seçildiğinde değer listesi yönetiminde görüntülenir.
* *Referanslar*: Diğer sistemlerdeki değer listesi veya tanımlar hakkında daha fazla bilgiye başvurmak için burada URL'leri belirtin.
* *Değerler*: Değer listesine dahil edilecek yeni bir değerin istenen tanımlayıcısını girmek için "Yeni değer" metin alanını kullanın. Her durumda değer düzenleyicisi açılır ve bu düzenleyici daha sonra her değerin yanındaki düzenleme düğmesine tıklanarak da çağrılabilir (bkz. *Değerleri düzenleme* bölümü).
* *Otomatik sıralama*: Bu seçenek etkinleştirilirse, değerler her zaman alfanümerik sırayla görüntülenir. Değerleri daha sonra istediğiniz sıraya sürükleyip bırakmak için bu seçeneği devre dışı bırakabilirsiniz.


### Değerleri düzenleme

Değer düzenleyici, bir değeri özelleştirmenize olanak tanır:

* *Etiket*: Değerin görüntü etiketi. Farklı diller için etiketler girebilirsiniz.
* *Açıklama*: Değer hakkında daha ayrıntılı bilgi belirtebileceğiniz bir açıklama metni. Bu metin, konfigürasyon düzenleyicisinde ilgili değer için bir araç ipucu olarak görüntülenir.
* *Referanslar*: Diğer sistemlerdeki tanımlara referans vermek için burada URL'leri belirtin.


## Proje dillerini değiştirme

"Proje konfigürasyonu" ➝ "Proje dillerini seç..." menüsü, projeye veri girilecek dilleri belirtmenize olanak tanır. Konfigürasyon düzenleyicisinde "Birden fazla dilde girişe izin ver" seçeneğinin etkinleştirildiği metin alanlarında, her proje dili için ayrı bir metin girilebilir.
Ayrıca her proje dili için kategori, alan, grup, değer listesi ile değerlerin etiketleri ve açıklamaları için boş giriş alanları otomatik olarak konfigürasyon düzenleyicisinde görüntülenir.

Lütfen unutmayın; daha önce girilmiş olan metinler, ilgili proje dilleri listesinden kaldırılırsa artık görüntülenmeyecektir. Ancak bunlar veri tabanında kalacaklar ve söz konusu dil daha sonra bir kez daha proje dili olarak seçilirse tekrar görüntüleneceklerdir.


## Konfigürasyonu içe aktarma

Mevcut bir konfigürasyonu başka bir projeden içe aktarmak için "Proje konfigürasyonu" ➝ "Konfigürasyonu içe aktar..." menü seçeneğini kullanın .
"Kaynak" açılır menüsünde iki farklı içe aktarma seçeneği arasından seçim yapabilirsiniz:

* *Dosya*: Daha önce başka bir projede oluşturulmuş bir Alan yapılandırma dosyasını (dosya uzantısı *.configuration*) "Proje konfigürasyonu" ➝ "Konfigürasyonu içe aktar..." menüsü üzerinden içe aktarın.
* *Proje*: Aynı bilgisayarda bulunan başka bir projenin konfigürasyonunu içe aktar.

İçe aktarmanın sonucu artık düzenleyicide kontrol edilebilir ve "Kaydet" düğmesine tıklanarak kabul edilebilir. Lütfen unutmayın; tüm önceki ayarlar içe aktarılan konfigürasyonla değiştirilecektir.


## Konfigürasyonu dışa aktarma

Açılan projenin konfigürasyonunu Field yapılandırma dosyası (dosya uzantısı *.configuration*) olarak kaydetmek için "Proje konfigürasyonu" ➝ "Konfigürasyonu dışa aktar..." menü seçeneğini kullanın. Bu, yapılandırma düzenleyicisinde mevcut görüntülenen durumu, kaydedilmemiş değişiklikler dahil olmak üzere dışa aktaracaktır. Oluşturulan dosya ayrıca tüm projeye özgü değer listelerini içerir.

Daha sonra konfigürasyonu başka bir projeye aktarmak veya aynı projede kaydedilmiş yapılandırma durumunu geri yüklemek için dosya "Proje konfigürasyonu" ➝ "Konfigürasyonu içe aktar..." menü seçeneği üzerinden tekrar içe aktarılabilir.


## JSON dışa aktarma API'si

Proje konfigürasyonu bir API erişim noktası aracılığıyla JSON formatında alınabilir. "Konfigürasyonu dışa aktar..." menü seçeneği aracılığıyla oluşturulabilen konfigürasyon dosyaları yalnızca yapılandırmanın projeye özgü kısmını içerir. Öte yandan API erişim noktası, projede kullanılan Field kitaplıklarından (standart formlar, değer listeleri vb.) gelen tüm konfigürasyon öğeleri dahil, tam konfigürasyonu çıktı olarak verir.

Uygulama açıkken erişim noktasına aşağıdaki URL üzerinden ulaşılabilir:

http://localhost:3000/configuration/PROJE

"PROJE" ifadesini, yapılandırmasına erişmek istediğiniz projenin adıyla değiştirin.

API erişim noktasına bağlanırken "Ayarlar" menüsünün "Senkronizasyon" bölümünde "Şifreniz" olarak girilen şifre girilmelidir. Şifre *Temel Kimlik Doğrulama* yoluyla iletilir; tarayıcıya URL girildiğinde bir giriş iletişim kutusu görüntülenir. Kullanıcı adını girmek gerekli değildir, ilgili alan boş kalabilir.

Lütfen unutmayın; API erişim noktasının JSON çıktısı "Konfigürasyonu içe aktar..." menü seçeneği üzerinden içe aktarılamaz. Buna uygun bir konfigürasyon dosyası elde etmek için "Konfigürasyonu dışa aktar..." menü seçeneğini kullanın.


<hr>


# Matris

**Matris** görünümü ("Araçlar" menüsü üzerinden erişilebilir), projenin her bir açmasında, 
ilgili açmanın stratigrafik birimlerinden otomatik olarak oluşturulan bir matris görüntüler. 
Matrisin kenarları, birimler arası ilişkiler esas alınarak oluşturulur.

<p align="center"><img src="images/tr/matrix/trench_selection.png" alt="Açma seçimi"/></p>

Araç çubuğunun sol tarafındaki açılır menü butonunu kullanarak 
matrisin oluşturulacağı açmayı seçin.


## Seçenekler

Matris görünümünün sağ üst köşesindeki **Seçenekler** düğmesi aracılığıyla, farklı ayarları yaparak matris
görselleştirmesini özelleştirebilirsiniz. Seçilen ayarlar, projenin tüm
açmalarındaki tüm matrislere uygulanır ve uygulama yeniden başlatıldığında korunur.

<p align="center"><img src="images/tr/matrix/matrix_tools.png" alt="Seçenekler menüsü"/></p>


### İlişkiler

* *Zamansal*: Kenarlar, "Önce", "Sonra" ve "ile Çağdaş" (alan grubu
"Zaman") ilişkilerine dayanarak oluşturulur.
* *Konumsal*: Kenarlar, "Üstünde", "Altında", "Kes(iş)mektedir", "Tarafından kesilmiştir" ve "Benzer"
(alan grubu "Konum") ilişkilerine dayanarak oluşturulur.


### Kenarlar

* *Düz*: Tüm kenarlar düz çizgilerden oluşur.
* *Eğri*: Matrisin iki birimi arasında doğrudan bir bağlantı çizgisi yoksa kenarlar eğri olabilir.


### Döneme göre gruplandırma

Matrisin stratigrafik birimlerini "Dönem" alanının değerine göre gruplamak için bu seçeneği etkinleştirin. Alan için iki değer (başlangıç/bitiş) ayarlanırsa, her durumda "Dönem (başlangıç)" değeri kullanılır.
Alan için iki değer (başlangıç/bitiş) ayarlanırsa, her durumda "Dönem (başlangıç)" değeri kullanılır.
Eşit dönem değerlerine sahip stratigrafik birimler birbirine yakın yerleştirilir ve bir dikdörtgenle çerçevelenir.

<p align="center"><img src="images/tr/matrix/matrix_phases.png" alt="Döneme göre gruplandır"/></p>


## Gezinme

Görüntüleme alanındaki matrisin konumunu değiştirmek için **sağ fare düğmesi** basılıyken fareyi hareket ettirin. 
Yakınlaştırma seviyesini ayarlamak için görüntüleme alanının sol üst köşesindeki **fare tekerleğini** veya **yakınlaştırma düğmelerini** kullanın. 
**Sol fare düğmesini** kullanarak matrisin birimleriyle etkileşim kurabilirsiniz; 
etkileşim türü (düzenleme veya seçim) seçilen etkileşim moduna bağlıdır.

Fare imleci bir birim üzerine getirildiğinde, bu birimden başlayan kenarlar renkle vurgulanır: 
Yeşil çizgiler daha yüksek seviyelerdeki birimlere, mavi çizgiler daha düşük seviyelerdeki birimlere ve 
turuncu çizgiler ise matrisin aynı seviyesindeki birimlere olan bağlantıları gösterir.


## Düzenleme

Varsayılan olarak, **düzenleme modu** etkindir: 
İlgili girdide değişiklik yapmanıza olanak tanıyan düzenleyiciyi açmak için matristeki bir birime tıklayın. 
Bu şekilde, sırasıyla "Zaman" ve "Konum" alan gruplarındaki ilişkileri düzenleyerek matris içindeki birimin konumunu da değiştirebilirsiniz. 
**Kaydet**'e tıkladıktan sonra, matris değiştirilen verilere göre otomatik olarak güncellenir.


## Alt matrislerin gösterimi

Büyük matrislerde genel bakışı kolaylaştırmak için, alt matrisler matrisin seçili birimlerinden de üretilebilir. 
Birimleri seçmek ve geçerli seçimden yeni bir alt matris oluşturmak
için araç çubuğunun sağ tarafındaki düğmeleri kullanın: 

<p align="center"><img src="images/tr/matrix/interaction_mode_buttons.png" alt="Etkileşim modu düğmeleri"/></p>

* *Düzenleme modu*: Birimler sol tıklamayla düzenlenebilir.
* *Tek seçim modu*: Birimler sol tıklamayla ayrı ayrı seçilebilir ve seçimleri kaldırılabilir.
* *Grup seçim modu*: Birimler fare kullanılarak bir dikdörtgen çizilerek gruplar halinde seçilebilir.

<p align="center"><img src="images/tr/matrix/subgraph_buttons.png" alt="Alt matris oluşturma butonu"/></p>

* *Seçimi kaldır*: Tüm birimlerin seçimini kaldırır.
* *Seçimden matris oluştur*: Yalnızca seçili birimlerden oluşan yeni bir matris oluşturulur.
  Kenarlar hala açmanın tüm stratigrafik birimlerine göre oluşturulur;
  bu işlev ile iki birimin birden fazla ilişki/girdi boyunca bağlı olup olmadığı hızlıca kontrol edilebilir.
* *Matrisi yeniden yükle*: Seçili açmanın tüm stratigrafik birimlerini içeren esas matris geri yüklenir.


## Dışa aktarma

Şu anda görüntülenen matrisi bir dosya olarak dışa aktarmak için araç çubuğunun en sağındaki dışa aktarma düğmesini kullanın.

<p align="center"><img src="images/tr/matrix/export_matrix.png" alt="Dışa aktarma butonu"/></p>

İki farklı dosya biçimi arasından seçim yapabilirsiniz:

* *Dot (Graphviz)*: Açık kaynak Graphviz yazılımı (ve benzerleri) tarafından okunabilen grafikleri tanımlamak için kullanılan bir format. (Dosya uzantısı *gv*)
* *SVG*: Vektör grafiklerini görüntülemek için bir format. (Dosya uzantısı *svg*)


<hr>


# İçe ve dışa aktarma

## İçe aktarma

Halihazırda açık olan projeye girdileri içe aktarmak için "Araçlar" ➝ "İçe aktar" menü öğesini seçin.

* *Kaynak*: İçe aktarma kaynağının türünü seçin. Seçebileceğiniz iki seçenek vardır:
* *Dosya*: İçe aktarılacak veriler bilgisayarınızda bulunan bir dosyadan, bağlı bir depolama ortamından veya ağ üzerinden erişilebilen başka bir bilgisayardan okunur.
* *HTTP*: İçe aktarılacak veriler bir URL kullanılarak HTTP veya HTTPS üzerinden yüklenir. Bu seçenek seçildiğinde *Shapefile* ve *Catalog* formatlarındaki dosyaları içe aktarmanın mümkün olmadığını lütfen unutmayın.
* *Dosya yolu*: Bir dosya seçimi iletişim kutusu aracılığıyla istenen içe aktarma dosyasını seçin (yalnızca "Dosya" kaynak seçeneği için kullanılabilir)
* *URL*: İçe aktarılacak verilerin bulunabileceği URL'yi girin (yalnızca "HTTP" kaynak seçeneği için kullanılabilir)

Seçilen dosyanın dosya uzantısına göre tanınan biçimine bağlı olarak, daha fazla seçenek mevcut olabilir (*Formatlar* bölümündeki ilgili dosya biçimine ilişkin alt bölüme bakın).

**İçe aktarmayı başlat** düğmesini kullanarak içe aktarma işlemini başlatın.

Desteklenen içe aktarma biçimleri şunlardır:
* CSV (.csv)
* GeoJSON (.geojson, .json)
* Shapefile (.shp)
* JSON Lines (.jsonl)
* Catalog (.catalog)

*CSV* ve *JSON Lines* formatları yeni girdiler oluşturmak veya mevcut girdileri düzenlemek için uygundur. Geometriler *GeoJSON*, *Shapefile* veya *JSON Lines* formatları kullanılarak eklenebilir veya düzenlenebilir. *Catalog* formatı Field tipi katalogları değiştirmek için kullanılabilir.

Lütfen yeni resimlerin yalnızca "Araçlar" ➝ "Görüntü yönetimi" menüsü üzerinden içe aktarılabileceğini unutmayın. Ancak önceden içe aktarılan resimlerin girdi verileri CSV veya JSON Satırları içe aktarımı yoluyla düzenlenebilir.


## Dışa aktarma

Halihazırda açık olan projeden girdileri dışa aktarmak için "Araçlar" ➝ "Dışa Aktar" menü öğesini seçin.

İlk olarak, açılır menüden **Format** ile istediğiniz dışa aktarma biçimini seçin. Dosya biçimine bağlı olarak, daha fazla seçenek mevcut olabilir (*Formatlar* bölümündeki ilgili dosya biçimine ilişkin alt bölüme bakın).

**Dışa Aktarmayı Başlat** düğmesine tıkladıktan sonra, oluşturulacak dosyanın adını ve hedef dizinini belirtebileceğiniz bir dosya seçimi iletişim kutusu açılır. Ardından dışa aktarma işlemi başlar.

Desteklenen dışa aktarma biçimleri şunlardır:
* CSV (.csv)
* GeoJSON (.geojson, .json)
* Shapefile (.zip)
* Catalog (.catalog)


## Formatlar (ç.n. Dosya Biçimleri)

### CSV

CSV (dosya uzantısı *csv*), Field Desktop bağlamında girdi verilerini içe ve dışa aktarmak için kullanılan ana dosya biçimidir. CSV dosyaları tüm yaygın elektronik tablo uygulamaları tarafından okunabilir ve düzenlenebilir.

CSV dosyaları **coğrafi veri içermez**. Coğrafi verileri dışa aktarmak veya içe aktarma yoluyla mevcut girdilere eklemek için iki formattan birini kullanın: *GeoJSON* veya *Shapefile*.


#### Yapısı

Bir CSV dosyası yalnızca tek bir kategorinin girdilerini içerir. Her sütun, bu kategori için projede kullanılan form için yapılandırılmış alanlardan birine karşılık gelir. Lütfen unutmayın; sütun başlığı, "Proje konfigürasyonu" menüsünde ilgili alan için fuşya renginde görüntülenen benzersiz alan tanımlayıcısına sahip olması zorunludur. Uygulamanın diğer alanlarında görüntülenen çok dilli görüntüleme adları CSV dosyalarında **kullanılamaz**.

*identifier* sütununda tanımlayıcıyı belirtmek zorunludur. Diğer tüm alanlar isteğe bağlıdır.

Veriye hızlı bir genel bakış veya CSV içe aktarma için bir şablon olarak, bir kategorinin tüm alanlarının önceden doldurulmuş sütun başlıklarına sahip boş bir CSV dosyası oluşturmak için "Araçlar" ➝ "Dışa aktar" menüsündeki *Yalnızca şema* seçeneğini kullanabilirsiniz (bkz. *Dışa aktarma seçenekleri* bölümü).


##### Değer listesi alanları

Bir değer listesinden seçim yapılmasına izin veren alanlar için, karşılık gelen değerin tanımlayıcısı girilmelidir. Değer tanımlayıcısı, "Proje konfigürasyonu" menüsündeki ilgili değer listesinin görüntülendiği tüm yerlerde, her değer için fuşya renginde görüntülenir. Çok dilli görüntüleme metinleri (değer tanımlayıcısının dillerden birindeki görüntüleme metniyle aynı olduğu durumlar hariç) **kullanılamaz**.


##### Evet/Hayır alanları

"Evet/Hayır" giriş türündeki alanlar için *true* (Evet) ve *false* (Hayır) değerleri girilebilir.


##### Çok dilli alanlar

Bir alana farklı dillerde değerler girilebiliyorsa, CSV dosyasında her dil için ayrı bir sütun oluşturulur. Sütun başlığı, her dil için "Ayarlar" menüsünde fuşya renginde gösterilen (bir nokta ile alan tanımlayıcısından ayrılmış) dil kodunu içerir (örneğin, kısa açıklamanın İngilizce metni için "shortDescription.en").

Field Desktop'ın eski sürümleriyle oluşturulan projelerde ve proje yapılandırmasındaki değişiklikler nedeniyle, çok dilli bir alanda, dil belirtimi olmayan bir değer bulunabilir. Bu durumlarda, sütun başlığına dil kodu yerine "unspecifiedLanguage" metni eklenir.

*Örnek:*

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>description.de</th>
        <th>description.tr</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>Beispieltext</td>
        <td>Örnek metin</td>
      </tr>
    </tbody>
  </table>
</div>


##### Açılır listeler (aralık)

"Açılır liste (aralık)" giriş türündeki alanlar, her biri için ayrı bir sütun oluşturulan en fazla iki alt alandan oluşur:

* *value*: Seçili değerin tanımlayıcısı; iki değer seçilirse, iki değerden ilki
* *endValue*: İki değer seçilirse, ikinci seçili değerin tanımlayıcısı

*Örnek:*

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>period.value</th>
        <th>period.endValue</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>Demir Çağı</td>
        <td></td>
      </tr>
      <tr>
        <td>B</td>
        <td>Erken Tunç Çağı</td>
        <td>Geç Tunç Çağı</td>
      </tr>
    </tbody>
  </table>
</div>


##### Tarih alanları

"Tarih (Date)" giriş türündeki alanlar için "Gün.Ay.Yıl" biçiminde bir değer girilir. Gün ve ay girişleri isteğe bağlıdır, böylece yalnızca belirli bir ay veya yıl girilebilir.

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>12.01.2025</td>
      </tr>
      <tr>
        <td>B</td>
        <td>09.2008</td>
      </tr>
      <tr>
        <td>C</td>
        <td>1995</td>
      </tr>
    </tbody>
  </table>
</div>


##### Liste alanları

"Onay kutuları" ve "Tek satırlık metin (Liste)" (birden fazla dilde giriş olmadan) giriş türlerindeki alanlar için, alan için yalnızca bir sütun oluşturulur. Alan değerleri birbirinden noktalı virgülle ayrılır (örneğin "Granit; Kireçtaşı; Kayrak Taşı").

"Tarih", "Boyut", "Bibliyografik referans", "Bileşik alan" ve "Tek satırlık metin (Liste)" (birden fazla dilde giriş ile) giriş türlerindeki alanlar için, ilgili alt alanlar veya diller için karşılık gelen sütunlar **her liste girişi için** oluşturulur. İlgili girişi tanımlamak için alan adından sonra bir sayı eklenir (0'dan başlar ve noktalarla ayrılır).

*Birden fazla dilde giriş ile "Tek satırlık metin (Liste)" giriş türündeki bir alana örnek:*

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>exampleField.0.de</th>
        <th>exampleField.0.tr</th>
        <th>exampleField.1.de</th>
        <th>exampleField.1.tr</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>Wert A1</td>
        <td>Değer A1</td>
        <td>Wert A2</td>
        <td>Değer A2</td>
      </tr>
      <tr>
        <td>B</td>
        <td>Wert B1</td>
        <td>Değer B1</td>
        <td>Wert B2</td>
        <td>Değer B2</td>
      </tr>
    </tbody>
  </table>
</div>


##### İlişkiler

Sütun başlığı, ilişkinin adından önce "ilişkiler (relations)" ön ekini içerir (bir noktayla ayrılmış). Hedef girdilerin tanımlayıcıları, noktalı virgülle ayrılmış şekilde girilir.

Proje yapılandırmasında ilgili kategori biçiminde listelenen ilişkilere ek olarak, aşağıdaki sütunlar kullanılabilir:
* *relations.isChildOf*: Hiyerarşideki doğrudan üst girdiyi belirtir; en üst düzey girdilerde boş kalır
* *relations.depicts* (yalnızca görüntü girdileri için): Görüntüyü bir veya daha fazla girdiye bağlar
* *relations.isDepictedIn* (görüntü girdileri için değil): Girdiyi bir veya daha fazla görüntüye bağlar
* *relations.isMapLayerOf* (yalnızca görüntü girdileri için): Görüntüyü, hedef olarak belirtilen girdi bağlamında bir harita katmanı olarak ekler
* *relations.hasMapLayer* (görüntü girdileri için değil): Bu girdi bağlamında bir veya daha fazla görüntüyü harita katmanı olarak ekler

Görüntüleri projeye bağlamak veya proje düzeyinde harita katmanları olarak ayarlamak için *relations.depicts* veya *relations.isMapLayerOf* sütununa proje tanımlayıcısını girin.

*Örnek:*

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>relations.isAbove</th>
        <th>relations.isChildOf</th>
        <th>relations.isDepictedIn</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>B;C;D</td>
        <td>E</td>
        <td>Goruntu1.png;Goruntu2.png</td>
      </tr>
    </tbody>
  </table>
</div>


##### Tarihlendirme

"Tarihlendirme" giriş türündeki alanlar, her biri birkaç tarihlendirme girişi içerebilen liste alanlarıdır. Bir tarihlendirme, her tarihlendirme değeri için ayrı bir sütun oluşturulan aşağıdaki alt alanlardan oluşur:

* *type*: Tarihlendirme türü. Olası değerler şunlardır: *range* (Dönem), *single* (Tek yıl), *before* (Önce), *after* (Sonra), *scientific* (Bilimsel)
* *begin*: Tarihlendirme türü *after* ve tarihlendirme türü *range* için başlangıç ​​tarihi için ayarlanan yıl belirtimi
* *end*: Tarihlendirme türü *single*, *before* ve *scientific* için ve tarihlendirme türü *range* için bitiş tarihi için ayarlanan yıl belirtimi
* *margin*: Tarihlendirme türü *scientific* için yıl cinsinden tolerans aralığı
* *source*: Tarihlendirmenin kaynağı, çok dilli metin alanı
* *isImprecise*: "Hassas olmayan". *scientific* (Bilimsel) tarihleme türü için ayarlanamaz. Olası değerler şunlardır: *true* (evet), *false* (hayır)
* *isUncertain*: "Belirsiz". *scientific* (Bilimsel) tarihleme türü için ayarlanamaz. Olası değerler şunlardır: *true* (evet), *false* (hayır)

Yıl özellikleri *begin* ve *end* iki alt alandan oluşur:

* *inputType*: Zaman ölçeği. Olası değerler şunlardır: *bce* (MÖ.), *ce* (MS.), *bp* (GÖ.)
* *inputYear*: Yıl

*Örnek:*

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>dating.0.type</th>
        <th>dating.0.begin.inputType</th>
        <th>dating.0.begin.inputYear</th>
        <th>dating.0.end.inputType</th>
        <th>dating.0.end.inputYear</th>
        <th>dating.0.margin</th>
        <th>dating.0.source.de</th>
        <th>dating.0.source.tr</th>
        <th>dating.0.isImprecise</th>
        <th>dating.0.isUncertain</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>range</td>
        <td>bce</td>
        <td>100</td>
        <td>ce</td>
        <td>200</td>
        <td></td>
        <td>Beispieltext</td>
        <td>Örnek metin</td>
        <td>false</td>
        <td>false</td>
      </tr>
      <tr>
        <td>B</td>
        <td>single</td>
        <td></td>
        <td></td>
        <td>ce</td>
        <td>750</td>
        <td></td>
        <td></td>
        <td></td>
        <td>true</td>
        <td>false</td>
      </tr>
      <tr>
        <td>C</td>
        <td>before</td>
        <td></td>
        <td></td>
        <td>bp</td>
        <td>20</td>
        <td></td>
        <td></td>
        <td></td>
        <td>false</td>
        <td>true</td>
      </tr>
      <tr>
        <td>D</td>
        <td>after</td>
        <td>bce</td>
        <td>350</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>false</td>
        <td>false</td>
      </tr>
      <tr>
        <td>E</td>
        <td>scientific</td>
        <td></td>
        <td></td>
        <td>ce</td>
        <td>1200</td>
        <td>50</td>
        <td></td>
        <td></td>
        <td>false</td>
        <td>false</td>
      </tr>
    </tbody>
  </table>
</div>


##### Boyutlar

"Boyut" giriş türündeki alanlar, her biri birkaç boyut girişi içerebilen liste alanlarıdır. Bir boyut girişi, her boyut için ayrı bir sütun oluşturulan aşağıdaki alt alanlardan oluşur:

* *inputValue*: Ölçülen sayısal değer
* *inputRangeEndValue*: Boyutta bir aralık verilecekse ölçülen ikinci sayısal değer
* *inputUnit*: Ölçüm birimi. Olası değerler: *mm*, *cm*, *m*
* *measurementPosition*: Alan "Ölçüldüğü gibi". Alan için yapılandırılmış değer listesinden bir değerin tanımlayıcısı girilmelidir.
* *measurementComment*: Yorum/açıklama, çok dilli metin alanı
* *isImprecise*: "Hassas olmayan". Olası değerler şunlardır: *true* (evet), *false* (hayır)

*Örnek:*
<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>dimensionLength.0.inputValue</th>
        <th>dimensionLength.0.inputRangeEndValue</th>
        <th>dimensionLength.0.inputUnit</th>
        <th>dimensionLength.0.measurementPosition</th>
        <th>dimensionLength.0.measurementComment.de</th>
        <th>dimensionLength.0.measurementComment.tr</th>
        <th>dimensionLength.0.isImprecise</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>50</td>
        <td></td>
        <td>cm</td>
        <td>En kısa tarafından</td>
        <td>Beispieltext</td>
        <td>Örnek metin</td>
        <td>false</td>
      </tr>
      <tr>
        <td>B</td>
        <td>10</td>
        <td>15</td>
        <td>m</td>
        <td>En uzun tarafından</td>
        <td></td>
        <td></td>
        <td>true</td>
      </tr>
    </tbody>
  </table>
</div>


##### Bibliyografik referanslar

"Bibliyografik referans" giriş türündeki alanlar, her biri birkaç referans girişi içerebilen liste alanlarıdır. Bir giriş, her bibliyografik referans için ayrı bir sütun oluşturulan aşağıdaki alt alanlardan oluşur:

* *quotation*: Literatür alıntısı
* *zenonId*: Zenon ID
* *doi*: DOI
* *page*: Sayfa
* *figure*: Şekil

*Örnek:*

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>identifier</th>
        <th>literature.0.quotation</th>
        <th>literature.0.zenonId</th>
        <th>literature.0.doi</th>
        <th>literature.0.page</th>
        <th>literature.0.figure</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A</td>
        <td>Hohl S., Kleinke T., Riebschläger F., Watson J. 2023, iDAI.field: developing software for the documentation of archaeological fieldwork, in Bogdani J., Costa S. (eds.), ArcheoFOSS 2022. Proceedings of the 16th International Conference on Open Software, Hardware, Processes, Data and Formats in Archaeological Research (Rome, 22-23 September 2022), «Archeologia e Calcolatori», 34.1, 85-94</td>
        <td>002038255</td>
        <td>https://doi.org/10.19282/ac.34.1.2023.10</td>
        <td>90</td>
        <td>3</td>
      </tr>
    </tbody>
  </table>
</div>


##### Bileşik alanlar

"Bileşik alan" giriş türündeki alanlar, her biri birkaç giriş içerebilen liste alanlarıdır. Her yapılandırılmış alt alan için giriş başına (çok dilli metin alanları için her dil için ayrı) bir sütun oluşturulur. Alt alanın tanımlayıcısı sütun başlığında belirtilir.


#### İçe aktarma seçenekleri

CSV içe aktarmayı kullanarak yeni girdiler oluşturabilir veya mevcut girdileri düzenleyebilirsiniz. Aşağıdaki iki seçenek arasından seçim yapabilirsiniz:

* *Yeni girdileri içe aktar*: Bu seçenek etkinleştirilirse, CSV tablosunun her satırından yeni bir girdi oluşturulur. Tanımlayıcıları (*identifier* sütunu) daha önce atanmış olan girdiler yok sayılır.
* *Mevcut girdileri güncelle*: Bu seçenek etkinleştirilirse, mevcut girdiler CSV tablosundaki verilerle birleştirilir. İçe aktarma kaydındaki alanlar, mevcut veri kaydındaki aynı tanımlayıcıya sahip alanların üzerine yazar. İçe aktarma kaydında bulunmayan mevcut kayıtlardaki alanlar değişmeden kalır. Kategori değiştirilemez. Kayıtların atanması, tanımlayıcı alanına (*identifier* sütununa) göre gerçekleştirilir. Atanamayan CSV tablosundaki kayıtlar yok sayılır.

Aşağıdaki ek seçenekler kullanılabilir:

* *Silmelere izin ver*: Bu seçenek etkinleştirilirse, alanlar yalnızca değiştirilemez, aynı zamanda silinebilir. İçe aktarma dosyasındaki alanın boş olduğu tüm alanlar (ilişkiler dahil) silinir. CSV tablosunda sütun olarak listelenmeyen alanlar değişmeden kalır. Bu seçenek yalnızca *Mevcut girdileri güncelle* tercihi seçildiğinde kullanılabilir.
* *Konfigüre edilmemiş alanları yoksay*: Bu seçenek etkinleştirilirse içe aktarma dosyasındaki proje konfigürasyonunun parçası olmayan alanlar içe aktarma sırasında yok sayılır. Aksi takdirde, dosyada konfigüre edilmemiş alanlar bulunur bulunmaz içe aktarma işlemi iptal edilir.
* *Kategori seç*: Kategorinin tanımlayıcısı, dosya adının bir parçasıysa (dosya adının geri kalanından noktalarla ayrılmışsa), kategori otomatik olarak tanınır (ör. "Buluntu" kategorisinin girdilerini içeren bir CSV dosyası için "example.find.csv"). Dosya adı bir kategori tanımlayıcısı içermiyorsa, kategori bu açılır menü kullanılarak manuel olarak seçilmelidir.
* *Bir işleme veri atayın*: Projede oluşturulan ve tüm yeni oluşturulan girdilerin atanacağı işlemlerden birini seçin. CSV dosyasının *relations.isChildOf* sütununda tüm kayıtlar için bir üst girdi zaten belirtilmişse veya kategorinin girdilerinin bir işlem içinde oluşturulması gerekmiyorsa (örneğin "Yer", "İşlem" ve "Görüntü" kategorileri için geçerlidir) bir işlem belirtmeniz gerekmez. Bu seçenek yalnızca *Yeni girdileri içe aktar* seçeneği seçiliyse kullanılabilir.
* *Alan ayırıcı*: CSV dosyasında alan ayırıcı olarak kullanılan karakteri girin (varsayılan ayar virgüldür). CSV dosyasını oluştururken (örneğin Field Desktop'ta "Dışa Aktar" menüsü aracılığıyla veya bir elektronik tablo uygulamasında) seçtiğiniz karakteri girin. Çoğu durumda, CSV dosyaları için alan ayırıcı olarak virgül veya noktalı virgül kullanılır. Eğer içe aktarma sırasında hata oluşursa, lütfen öncelikle doğru alan ayırıcısını doğru girip girmediğinizi kontrol edin, aksi takdirde dosya doğru okunamaz.


#### Dışa aktarma seçenekleri

Önce CSV dışa aktarma türünü seçin. Aşağıdaki iki seçenek arasından seçim yapabilirsiniz:

* *Tümü*: Tüm girdiler, kontekst ve kategori için seçilen ayarlara göre dışa aktarılır (aşağıya bakın).
* *Yalnızca şema*: Yalnızca seçili kategori için konfigüre edilmiş tüm alanların sütun başlıklarını içeren başlık satırı dışa aktarılacaktır. Dışa aktarılan dosya, bir içe aktarma dosyası oluşturmak için şablon olarak kullanılabilir.

Aşağıdaki ek seçenekler kullanılabilir::

* *Kontekst*: İsteğe bağlı olarak girdileri dışa aktarılacak bir işlemi burada seçin. Varsayılan seçenek "Kısıtlama yok" olarak seçilirse, seçilen kategorinin tüm girdileri dışa aktarılır. Bu seçenek yalnızca *Tümü* seçeneği seçildiğinde kullanılabilir.
* *Kategori*: Burada istediğiniz kategoriyi seçin. Yalnızca seçilen kategorinin girdileri dışa aktarılır. Bu açılır menüde, yalnızca seçilen kontekstte girdileri bulunan kategoriler seçilebilir. Seçilen kontekstte bulunan girdi sayısı parantez içinde gösterilir.
* *Alan ayırıcı*: Oluşturulacak CSV dosyasında alan ayırıcı olarak kullanılacak karakteri girin (varsayılan ayar virgüldür).
* *Hiyerarşik ilişkileri birleştirin*: Bu seçenek etkinleştirilirse, hiyerarşik ilişkiler her durumda doğrudan üst girdiyi belirten basitleştirilmiş *isChildOf* ilişkisine birleştirilir. Bu seçenek varsayılan olarak etkinleştirilir ve çoğu durumda devre dışı bırakılmamalıdır. Seçenek devre dışı bırakılırsa, *relations.liesWithin* ve *relations.isRecordedIn* sütunları *relations.isChildOf* sütunu yerine oluşturulur. *relations.liesWithin* sütununda, doğrudan (üst girdi bir işlem değilse) üst girdi ayarlanır, girdinin kaydedildiği işlem ise *relations.isRecordedIn* sütununda ayarlanır.


### GeoJSON

GeoJSON (dosya uzantıları *geojson* ve *json*), JSON formatına dayalı vektör coğrafi verilerini değiştirmek için açık bir formattır. Field Desktop'ta geometrileri içe ve dışa aktarmak için kullanılabilir.

GeoJSON dosyalarını içe aktarırken, **yeni girdi** oluşturulmaz. Bunun yerine, mevcut girdilere **geometriler eklenir**. Yeni girdileri içe aktarmak için, *CSV* veya *JSON Lines* formatlarından birini kullanın ve ardından GeoJSON içe aktarmayı kullanarak yeni oluşturulan girdilere geometriler ekleyin.


#### Yapısı

Bir GeoJSON dosyasının yapısı <a href="https://geojson.org" target="_blank">GeoJSON Specification</a> şartnamesine dayanır. Field Desktop bağlamında içe veya dışa aktarım için aşağıdaki ek kurallar geçerlidir:

Bir GeoJSON dosyası her zaman en üst düzeyde "FeatureCollection" türünde bir nesne içermelidir. Bu nesne de sırayla "Feature" türünde tekil nesneler içerir.

*Örnek:*

    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          ...
        },
        {
          "type": "Feature",
          ...
        }
      ]
    }


"Feature" türündeki her nesne, Field'daki bir girdiye ve ilişkili geometriye karşılık gelir. Bir feature her zaman *geometry* ve *properties* alanlarını içerir: *geometry* alanı geometri verilerini içerirken, *properties* alanındaki veriler Field'daki girdiye bağlantı kurar.


##### Geometri

Aşağıdaki geometri türleri desteklenmektedir:

* *Point* (Nokta)
* *MultiPoint* (Çoklu Nokta)
* *LineString* (Çizgi)
* *MultiLineString* (Çoklu Çizgi)
* *Polygon* (Poligon/Alan)
* *MultiPolygon* (Çoklu Poligon)

Koordinatlar GeoJSON spesifikasyonuna uygun olarak belirtilmiştir.


##### Özellikler

İlgili girdinin aşağıdaki alanları, dışa aktarma sırasında nesne *properties*ine yazılır:

* *identifier*: Girdinin tanımlayıcısı
* *category*: Girdi için seçilen kategorinin tanımlayıcısı
* *shortDescription*: Girdinin kısa açıklaması. Çıktı, ilgili kategorinin *shortDescription* alanının konfigürasyonuna bağlıdır:
    * Birden fazla dilde girişi olmayan tek satırlık metin: Kısa açıklamanın "string" olarak metni
    * Birden fazla dilde girişi olan tek satırlık metin / Çok satırlı metin: Alan adları olarak dil kodlarına sahip bir nesne
    * Açılır liste / Radyo düğmesi: Konfigüre edilmiş değer listesinden seçilen değerin tanımlayıcısı

İçe aktarma sırasında, veri kayıtları tanımlayıcı aracılığıyla atanır. Bu nedenle, GeoJSON verilerini başarıyla içe aktarmak için nesne *properties*'inde *identifier* alanını ayarlamak zorunludur. *properties* nesnesinin diğer alanları içe aktarma sırasında **dikkate alınmaz**; yalnızca ilgili girdideki geometri güncellenir. Lütfen unutmayın; içe aktarma sırasında mevcut geometrilerin üzerine yazılacaktır. İçe aktarma dosyasındaki atanamayan kayıtlar yok sayılır.


##### Örnek

Bu örnek, nokta geometrisi olan bir girdiden bir GeoJSON dışa aktarma dosyasının içeriğini gösterir. Nesne *properties* içindeki iki alanın *category* ve *shortDescription* içe aktarma için ayarlanması gerekmez.

    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [
              28.189335972070695,
              40.14122423529625
            ]
          },
          "properties": {
            "identifier": "F1",
            "category": "Find",
            "shortDescription": {
              "de": "Beispielfund",
              "tr": "Örnek buluntu"
            }
          }
        }
      ]
    }


### Shapefile

Shapefile, vektör coğrafi verilerini değiştirmek için yaygın olarak kullanılan bir formattır ve Field Desktop bağlamında GeoJSON formatına alternatif olarak kullanılabilir.

GeoJSON içe aktarımında olduğu gibi, Shapefile verileri içe aktarılırken **yeni girdi** oluşturulmaz. Bunun yerine, mevcut girdilere **geometriler** eklenir. Yeni girdileri içe aktarmak için, *CSV* veya *JSON Lines* biçiminden birini kullanın ve ardından Shapefile içe aktarımını kullanarak yeni oluşturulan girdilere geometriler ekleyin.


#### Yapısı

Bir Shapefile, bazıları isteğe bağlı olan birkaç dosyadan oluşan bir gruptan oluşur. Field Desktop'tan dışa aktarırken, aşağıdaki uzantılara sahip dosyalar oluşturulur:

* *shp*: Esas coğrafi verileri içerir
* *dbf*: Öznitelik tablosu verilerini, yani ilişkili girdinin verilerini içerir (bkz. *Öznitelik tablosu* bölümü).
* *shx*: Coğrafi veriler ile öznitelik verileri arasındaki bağlantıyı kurar
* *cpg*: *dbf* dosyasında kullanılan kodlamayı belirtir.
* *prj*: Projeksiyonu belirtir. Bu dosya yalnızca proje özelliklerinin *Koordinat referans sistemi* alanında bir seçim yapılmışsa dışa aktarılır.

Bir Shapefile yalnızca tek bir türdeki geometrileri içerebildiğinden, Field Desktop'tan dışa aktarırken her bir geometri türü için toplam üç Shapefile (her biri yukarıda belirtilen dört veya beş dosyadan oluşur) oluşturulur. Tekil türler, Shapefile'da birden fazla tür olarak kaydedilir ve aşağıdaki türden dosyalar üretilir:

  * Dosya adı "multipoints.\*", *Nokta* ve *Çoklu nokta* tiplerinde geometriler içerir
  * Dosya adı "multipolylines.\*", *Çizgi* ve *Çoklu çizgi* tiplerinde geometriler içerir
  * Dosya adı "multipolygons.\*", *Poligon* ve *Çoklu poligon* tiplerinde geometriler içerir

Tüm dosyalar bir zip arşivinde toplanmaktadır.

İçe aktarırken, Shapefile'a ait tüm dosyalar aynı dizinde olmalıdır. İçe aktarma menüsünün dosya seçimi iletişim kutusunda, *shp* uzantılı dosyayı seçin; diğer tüm dosyalar otomatik olarak tanınacaktır. Lütfen unutmayın; zip arşivleri içe aktarma sırasında **desteklenmez**. Field Desktop'tan dışa aktarılan bir Shapefile'ı başka bir projeye içe aktarmak için, önce ilgili zip dosyasının paketinden çıkarılması gerekir.


##### Öznitelik tablosu

Aşağıdaki alanlar, dışa aktarma sırasında Shapefile'ın öznitelik tablosuna dahil edilir:

* *identifier*: Girdinin tanımlayıcısı
* *category*: Girdi için seçilen kategorinin tanımlayıcısı
* *sdesc*: Girdinin kısa açıklaması. Çıktı, ilgili kategorinin *short description* alanının konfigürasyonuna bağlıdır:
    * Birden fazla dilde giriş yapılmayan tek satırlık metin: Kısa açıklamanın metni
    * Birden fazla dilde giriş yapılan tek satırlık metin / Çok satırlı metin: Alan adında dil kodu bulunan ve alt çizgiyle ayrılmış her dil için ayrı bir alan (örn. *sdesc\_de* veya *sdesc\_tr*)
    * Açılır liste / Radyo düğmesi: Konfigüre edilmiş değer listesinden seçilen değerin tanımlayıcısı
  
İçe aktarma sırasında, veri kayıtları tanımlayıcı aracılığıyla atanır. Bu nedenle, Shapefile verilerini başarıyla içe aktarmak için nitelik tablosunda *identifier* alanını ayarlamak zorunludur. Öznitelik tablosundaki diğer alanlar içe aktarma sırasında **dikkate alınmaz**; yalnızca ilgili girdideki geometri güncellenir. Lütfen unutmayın; içe aktarma sırasında mevcut geometrilerin üzerine yazılacaktır. İçe aktarma dosyasındaki atanamayan kayıtlar yok sayılır.


### JSON Lines

JSON Lines (dosya uzantısı *jsonl*), dosyanın her satırının bir JSON nesnesine karşılık geldiği JSON tabanlı bir metin biçimidir. Field Desktop'ta (geometriler dahil) girdileri oluşturmak ve düzenlemek için kullanılabilir.

JSON Lines formatı, doğrudan dışa aktarmada **kullanılamaz**. Lütfen unutmayın; "Proje" ➝ "Yedek oluştur..." menüsü aracılığıyla oluşturulan yedekleme dosyaları da JSON Lines biçimini ve *jsonl* dosya uzantısını kullanmaktadır. Ancak "İçe Aktar" menüsü aracılığıyla içe aktarılamaz. Yedeklemeler yalnızca "Proje" ➝ "Yedeği geri yükle..." menüsüyle geri yüklenebilir.


#### Yapısı

JSON Lines dosyasının temel biçimi <a href="https://jsonlines.org" target="_blank">JSON Lines Documentation</a> şartnamesine dayanır. Her JSON nesnesi Field'daki bir girdiye karşılık gelir ve aşağıdaki zorunlu alanları içerir:

* *identifier*: Girdinin tanımlayıcısı
* *category*: Girdi için seçilen kategorinin tanımlayıcısı

Bir nesne ayrıca aşağıdaki isteğe bağlı alanları da içerebilir:

* *relations*: *İlişki* giriş türünün tüm alanlarını içerir (bkz. *İlişkiler* bölümü)
* *geometry*: Girdinin geometrisi (bkz. *Geometri* bölümü)

Ek olarak, nesne bu kategoride, projede kullanılan form için yapılandırılmış herhangi bir sayıda alan içerebilir. Lütfen unutmayın; benzersiz alan tanımlayıcısının ilgili alanı, "Proje konfigürasyonu" menüsünde fuşya renginde görüntülendiği şekilde belirtilmelidir. Uygulamanın diğer alanlarında görüntülenen çok dilli görüntüleme adları JSON Lines dosyalarında alan adı olarak **kullanılamaz**.

Açıklama: aşağıdaki örneklerin her biri birkaç satırda gösterilmektedir. Gerçek içe aktarma dosyalarında, içe aktarma işleminin başarılı olması için her JSON nesnesinin **tam olarak bir satır** olması gerekir.


##### İlişkiler

*İlişki* giriş türündeki alanlar *relations* nesnesinde bir araya getirilir. Nesnenin alan adları ilişkilerin tanımlayıcılarına karşılık gelir; her durumda hedef girdilerin tanımlayıcılarını içeren bir dizi alan değeri olarak girilir.

Proje konfigürasyonunda, ilgili kategori biçiminde listelenen ilişkilere ek olarak aşağıdaki ilişkiler kullanılabilir:

* *isChildOf*: Hiyerarşideki doğrudan üst girdiyi belirtir; en üst düzey girdiler boş kalır
* *depicts* (yalnızca görüntü girdileri için): Görüntüyü bir veya daha fazla girdiye bağlar
* *isDepictedIn* (görüntü girdileri için değil): Girdiyi bir veya daha fazla görüntüye bağlar
* *isMapLayerOf* (yalnızca görüntü girdileri için): Görüntüyü, hedef olarak belirtilen girdi bağlamında bir harita katmanı olarak ekler
* *hasMapLayer* (görüntü girdileri için değil): Bu girdi bağlamında bir veya daha fazla görüntüyü harita katmanı olarak ekler

Görüntüleri projeye bağlamak veya proje düzeyinde harita katmanları olarak ayarlamak için, *depicts* veya *isMapLayerOf* ilişkisinin dizisine proje tanımlayıcısını ekleyin.

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature",
      "relations": { "isAbove": ["B", "C", "D"], "isChildOf": ["E"], "isDepictedIn": ["Goruntu1.png", "Goruntu2.png"] }
    }


##### Geometri

Geometriler GeoJSON şartnamesine uygun olarak belirtilebilir. *Geometri* alanına, bir GeoJSON özelliği içindeki *geometry* nesnesinin yapısına karşılık gelen bir nesne girilir (bkz. *GeoJSON* bölümü).

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          28.189335972070695,
          40.14122423529625
        ]
      }
    }


##### Değer listesi alanları

Bir değer listesinden seçim yapılmasına izin veren alanlarda, bu alana karşılık gelen değerin tanımlayıcısı girilmelidir. Değer tanımlayıcısı, "Proje konfigürasyonu" menüsündeki ilgili değer listesinin görüntülendiği tüm yerlerde, her değer için fuşya rengi olarak görüntülenir. Çok dilli görüntüleme metinleri (değer tanımlayıcısının dillerden birindeki görüntüleme metniyle aynı olduğu durumlar hariç) **kullanılamaz**.


##### Numerik alanlar

"Tam sayı", "Pozitif tam sayı", "Ondalık sayı" ve "Pozitif ondalık sayı" giriş türlerinin alanlarına sayısal bir değer (tırnak işaretleri olmadan) girilebilir.

*Örnek:*

    {
      "identifier": "A",
      "category": "FindCollection",
      "amount": 12
    }


##### Evet/Hayır alanları

"Evet / Hayır" giriş türündeki alanlara *true* (evet) ve *false* (hayır) değerleri girilebilir.


*Örnek:*

    {
      "identifier": "A",
      "category": "Feature",
      "hasDisturbance": true
    }

##### Çok dilli alanlar

Farklı dillerde değer girilebilen alanlarda, kullanılan dillerin kodlarına karşılık gelen alan adlarına sahip bir nesne oluşturulmalıdır. Dil kodları her dil için "Ayarlar" menüsünde fuşya renginde görüntülenir.

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature",
      "description": { "de": "Beispieltext", "tr": "Örnek metin" }
    }


##### Açılır listeler (aralık)

"Açılır liste (aralık)" giriş türündeki alanlar için, aşağıdaki iki alt alanı içeren bir nesne girilir:

* *value*: Seçilen değerin tanımlayıcısı; iki değer seçilirse, iki değerden ilki
* *endValue*: İki değer seçilirse, ikinci seçilen değerin tanımlayıcısı

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature",
      "period1": { "value": "Demir Çağı" },
      "period2": { "value": "Erken Tunç Çağı", "endValue": "Geç Tunç Çağı" }
    }


##### Tarih alanları

"Gün.Ay.Yıl" (GG.AA.YYYY) biçimindeki bir değer, "date" giriş türündeki alanlar için girilir. Gün ve ay girişleri isteğe bağlıdır, böylece yalnızca yılın belirli bir ayını veya belirli bir yılı girmek mümkündür.

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature",
      "date1": "12.01.2025",
      "date2": "09.2008",
      "date3": "1995"
    }


##### Liste alanları

"Tek satır metin (liste)", "Onay kutuları", "Tarih", "Boyut", "Bibliyografik referans" ve "Bileşik alan" giriş türlerinin alanları birkaç giriş içerebilir. Bu nedenle bu alanlar için bir dizi girilir.


##### Tarihlendirme

"Tarihlendirme" giriş türündeki alanlar, her biri birkaç tarihlendirme girişi içerebilen liste alanlarıdır. Tarihlendirme, aşağıdaki alt alanlardan oluşan bir nesnedir:

* *type*: Tarihlendirme türü. Olası değerler şunlardır: *range* (Dönem), *single* (Tek yıl), *before* (Önce), *after* (Sonra), *scientific* (Bilimsel)
* *begin*: Tarihlendirme türü *after* ve tarihlendirme türü *range* için başlangıç ​​tarihi için ayarlanan yıl belirtimi
* *end*: Tarihlendirme türü *single*, *before* ve *scientific* için ve tarihlendirme türü *range* için bitiş tarihi için ayarlanan yıl belirtimi
* *margin*: Tarihlendirme türü *scientific* için yıl cinsinden tolerans aralığı
* *source*: Tarihlendirmenin kaynağı, çok dilli metin alanı
* *isImprecise*: "Hassas olmayan". *scientific* (Bilimsel) tarihleme türü için ayarlanamaz. Olası değerler şunlardır: *true* (evet), *false* (hayır)
* *isUncertain*: "Belirsiz". *scientific* (Bilimsel) tarihleme türü için ayarlanamaz. Olası değerler şunlardır: *true* (evet), *false* (hayır)

Yıl özellikleri *begin* ve *end* iki alt alandan oluşur:

* *inputType*: Zaman ölçeği. Olası değerler şunlardır: *bce* (MÖ.), *ce* (MS.), *bp* (GÖ.)
* *inputYear*: Yıl

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature", 
      "dating": [
        { "type": "range", "begin": { "inputType": "bce", "inputYear": 100 }, "end": { "inputType": "ce", "inputYear": 200 }, "source": { "de": "Beispieltext", "tr": "Örnek metin" }, "isImprecise": false, "isUncertain": false },
        { "type": "single", "end": { "inputType": "ce", "inputYear": 750 }, "isImprecise": true, "isUncertain": false },
        { "type": "before", "end": { "inputType": "bp", "inputYear": 20 }, "isImprecise": false, "isUncertain": true },
        { "type": "after", "begin": { "inputType": "bce", "inputYear": 350 }, "isImprecise": false, "isUncertain": false },
        { "type": "scientific", "end": { "inputType": "ce", "inputYear": 1200 }, "margin": 50, "isImprecise": false, "isUncertain": false }
      ]
    }


##### Boyutlar

"Boyut" giriş türündeki alanlar, her biri birkaç boyut ölçüsü içerebilen liste alanlarıdır. Bir boyut girişi, aşağıdaki alt alanlardan oluşan bir nesnedir:

* *inputValue*: Ölçülen sayısal değer
* *inputRangeEndValue*: Bir aralık boyutuysa ölçülen ikinci sayısal değer
* *inputUnit*: Ölçüm birimi. Olası değerler: *mm*, *cm*, *m*
* *measurementPosition*: Alan "Ölçüldüğü gibi". Alan için yapılandırılmış değer listesinden bir değerin tanımlayıcısı girilmelidir.
* *measurementComment*: Yorum, çok dilli metin alanı
* *isImprecise*: "Hassas olmayan". Olası değerler şunlardır: *true* (evet), *false* (hayır)

*Örnek:*

    {
      "identifier": "A",
      "category": "Feature", 
      "dimensionLength": [
        { "inputValue": 50, "inputUnit": "cm", "measurementPosition": "En kısa tarafından", "measurementComment": { "de": "Beispieltext", "tr": "Örnek metin" }, "isImprecise": false },
        { "inputValue": 10, "inputRangeEndValue": 15, "inputUnit": "m", "measurementPosition": "En uzun tarafından", "isImprecise": true }
      ]
    }

##### Bibliyografik referanslar

"Bibliyografik referans" giriş türündeki alanlar, her biri birkaç referans girişi içerebilen liste alanlarıdır. Bir giriş aşağıdaki alt alanlardan oluşur:

* *quotation*: Literatür alıntısı
* *zenonId*: Zenon ID
* *doi*: DOI
* *page*: Sayfa
* *figure*: Şekil

*Örnek:*

    {
      "identifier": ‘A’,
      "category": ‘Type’, 
      "literature": [
        {
          "quotation": ‘Hohl S., Kleinke T., Riebschläger F., Watson J. 2023, iDAI.field: developing software for the documentation of archaeological fieldwork, in Bogdani J., Costa S. (eds.), ArcheoFOSS 2022. Proceedings of the 16th International Conference on Open Software, Hardware, Processes, Data and Formats in Archaeological Research (Rome, September 22-23, 2022), ’Archeologia e Calcolatori", 34.1, 85-94",
          "zenonId": ‘002038255’,
          "doi": ‘https://doi.org/10.19282/ac.34.1.2023.10’,
          "page": ‘90’,
          "figure": "3"
        }
      ]
    }


##### Bileşik alanlar

"Bileşik alan" giriş türündeki alanlar, her biri birkaç giriş içerebilen liste alanlarıdır. Her giriş, alan adları bileşik alan için konfigüre edilmiş alt alanların tanımlayıcılarına karşılık gelen bir nesnedir.


#### İçe aktarma seçenekleri

JSON Lines içe aktarmayı kullanarak yeni girdiler oluşturabilir veya mevcut girdileri düzenleyebilirsiniz. Aşağıdaki iki seçenek arasından seçim yapabilirsiniz:

* *Yeni girdileri içe aktar*: Bu seçenek etkinleştirildiğinde JSON Lines dosyasının her satırı için yeni bir girdi oluşturulur. Tanımlayıcıları (*identifier* sütununda) daha önce atanmış olan girdiler yok sayılır.
* *Mevcut girdileri güncelle*: Bu seçenek etkinleştirildiğinde mevcut girdiler JSON Lines dosyasındaki verilerle birleştirilir. İçe aktarma kaydındaki alanlar, mevcut veri kaydındaki aynı tanımlayıcıya sahip alanların üzerine yazar. İçe aktarma kaydında bulunmayan mevcut kayıttaki alanlar değişmeden kalır. Kategori değiştirilemez. Kayıtların atanması, *identifier* alanına göre gerçekleştirilir. Atanamayan JSON Lines dosyasındaki kayıtlar yok sayılır.

Aşağıdaki ek seçenekler kullanılabilir:

* *Silmelere izin ver*: Bu seçenek etkinleştirilirse, alanlar yalnızca değiştirilemez, aynı zamanda silinebilir. İçe aktarma dosyasında *null* değerinin atandığı tüm alanlar (ilişkiler dahil) silinir. Listelenmeyen alanlar değişmeden kalır. Bu seçenek yalnızca *Mevcut girdileri güncelle* seçeneği seçiliyse kullanılabilir.
* *Konfigüre edilmemiş alanları yoksay*: Bu seçenek etkinleştirilirse, içe aktarma dosyasındaki proje konfigürasyonunun parçası olmayan alanlar içe aktarma sırasında yok sayılır. Aksi takdirde, dosyada yapılandırılmamış alanlar bulunur bulunmaz içe aktarma işlemi iptal edilir.
* *Bir işleme veri ata*: Projede oluşturulan tüm girdilerin atanacağı işlemlerden birini seçin. JSON Lines dosyasındaki tüm kayıtlar için *isChildOf* ilişkisi aracılığıyla bir üst girdi zaten belirtilmişse veya kategori girdilerinin bir işlem içinde oluşturulması gerekmiyorsa (örneğin "Yer", "İşlem" ve "Görüntü" kategorileri için geçerlidir) bir işlem belirtmek gerekli değildir. Bu seçenek yalnızca *Yeni girdileri içe aktar* tercihi seçiliyse kullanılabilir.


### Catalog

Yalnızca Field Desktop tarafından kullanılan Katalog formatı (dosya uzantısı *catalog*), "Araçlar" ➝ "Tip yönetimi" menüsü aracılığıyla oluşturulan tip kataloglarını farklı projeler arasında paylaşmak için kullanılabilir.

Bir tip kataloğu, tüm türleriyle ve bağlantılı görselleriyle birlikte dışa aktarılır. Bağlantılı buluntular **dışa aktarılmaz**.

Katalog dosyası başka bir projeye içe aktarıldıktan sonra, tip kataloğu, tip yönetiminde her zamanki gibi görüntülenebilir ve buluntu tanımlaması için kullanılabilir. Başka bir projeden içe aktarılan bir kataloğu düzenlemek **mümkün değildir**: İçe aktarılan tip katalogları ve bunların bağlantılı görselleri projeden bir bütün olarak silinebilir, ancak düzenlenemez, genişletilemez veya (yalnızca belirli bazı türler veya bağlantılı görseller) kısmen silinemez. Ancak, yeni bir katalog dosyası içe aktarılarak tip kataloğunun güncellenmiş bir sürümle değiştirilmesi mümkündür. Buluntulara yönelik önceden oluşturulmuş tüm bağlantılar korunur. Bu kısıtlama, dışa aktarmadan sonra daha sonraki bir tarihte aynı projeye geri aktarılan tip katalogları için de geçerli değildir. Bu durumlarda, katalog tamamen düzenlenebilir ve genişletilebilir.

Lütfen unutmayın; tip kataloglarını başka bir projeye aktarırken, her iki projede de dışa aktarılan girdilerin kategorileri ("Tip kataloğu", "Tip", "Görüntü" veya kullanılan herhangi bir alt kategori) aynı konfigürasyona sahip olmalıdır. Hedef projede konfigüre edilmeyen alanlar **görüntülenmez**. Katalog dosyası hedef projede bulunmayan bir alt kategoriye ait girdiler içeriyorsa, içe aktarma işlemi başarısız olur.


#### Dışa aktarma seçenekleri

Katalog dosyalarını dışa aktarırken aşağıdaki seçenek kullanılabilir:

* *Katalog*: Buradan dışa aktarılacak katalog türünü seçin. Bu seçenek yalnızca şu anda açık olan projede katalog türleri varsa görüntülenir. Diğer projelerden içe aktarılan kataloglar seçilemez.


<hr>


# Uyarılar

Proje konfigürasyonunun değiştirilmesi gibi çeşitli nedenlerle, projede tutarsız veya farklı şekillerde yanlış veriler oluşabilir. Bu durumlarda, uygulama bir uyarı görüntüler ve sorunu çözmek için seçenekler sunar. Hatalı girdiler, ilgili girdi kutucuğunun yanında ince kırmızı dik bir çubukla işaretlenir. Ayrıca, sağ üstteki gezinme çubuğunda, veri sorunları nedeniyle uyarı verilen girdi sayısını belirten bir simge görüntülenir:

<p align="center"><img src="images/tr/warnings/warnings_icon.png" alt="Uyarı ikonu"/></p>

Etkilenen bir girdinin simgesine tıklamak veya içerik menüsünü kullanmak sizi "Uyarılar" menüsüne götürür. Burada hatalı girdilerin listesini görüntüleyebilir ve uyarı türüne göre filtreleyebilirsiniz. Ayrıca tanımlayıcıya,  (metin girişi yoluyla) kısa açıklamaya ve kategoriye göre filtreleme seçenekleri kullanılabilir.

Görüntülenen girdilerden birini seçerek söz konusu girdi için mevcut uyarıların listesini görüntüleyin. Çoğu uyarıda hataları çözmek için kullanılabilecek araçlar uygulama tarafından önerilir. Birçok uyarı, proje konfigürasyonunu ayarlayarak da çözülebilir. Her ihtimale karşın, öncelikle lütfen "Proje" ➝ "Yedek oluştur..." menüsü aracılığıyla projenin bir **yedeğini** oluşturun. Aşağıda tekil uyarı türlerine göre nedenleri ve olası çözümleri hakkında daha fazla bilgiye göz atabilirsiniz.

## Uyarı türleri
### Çakışma
Birbirleriyle çakışan birden fazla girdi sürümü var.

#### Olası nedenler
* Girdi, mevcut bir senkronizasyon bağlantısıyla aynı anda farklı bilgisayarlarda düzenlenmiş olabilir.
* Girdi, mevcut bir senkronizasyon bağlantısı olmadan farklı bilgisayarlarda düzenlendi. Aynı veriler farklı bilgisayarlarda düzenlendikten çok sonra senkronizasyon başlatıldı.

#### Olası çözümler
* *Çakışmayı çöz* Butonu: Girdi düzenleyicisindeki çakışmaları çözün (bkz. *Senkronizasyon* bölümünün *Çakışmalar* kısmı).

### Konfigüre edilmemiş kategori
Bir girdiye proje konfigürasyonunda bulunamayan bir kategori ayarlandı. Bu nedenle girdi görüntülenmiyor.

#### Olası nedenler
* Kategori, konfigürasyon düzenleyicisinde silinmiş olabilir.

#### Olası çözümler
* *Yeni kategori seç* Butonu: Proje için konfigüre edilmiş kategorilerden birini seçin. Seçilen kategori daha sonra etkilenen girdi için ayarlanacaktır. İsteğe bağlı olarak, söz konusu kategorinin belirtildiği tüm girdiler için yeni kategoriyi ayarlayabilirsiniz.
* *Girdiyi sil* Butonu: Etkilenen girdi tamamen silinir.
* Konfigürasyon düzenleyicisinde aynı adı taşıyan bir kategori ekleyin.

### Konfigüre edilmemiş alan
Veriler, proje konfigürasyonunda bulunamayan bir alana girildi. Bu nedenle girilen veriler görüntülenmiyor.

#### Olası nedenler
* Alan, konfigürasyon düzenleyicisinde silinmiş olabilir.

#### Olası çözümler
* *Yeni alan seç* Butonu: Girdinin kategorisi için konfigüre edilmiş alanlardan birini seçin. Girilen veriler daha sonra bu alana taşınacaktır. Lütfen unutmayın, veriler hedef alanda mevcut olan tüm verilerin üzerine yazılacaktır. İsteğe bağlı olarak, aynı konfigüre edilmemiş alana veri girilen tüm kayıtlardaki yeni alanı ayarlayabilirsiniz.
* *Alan verilerini sil* Butonu: Alana girilen veriler tamamen silinir. İsteğe bağlı olarak, aynı konfigüre edilmemiş alana veri girilen tüm kayıtlardaki alan verilerini silebilirsiniz.
* Konfigürasyon düzenleyicisinde etkilenen girdinin kategorisinde aynı adı taşıyan bir alan ekleyin.

### Geçersiz alan verileri
Bir alana girilen veriler, alan için seçilen giriş türüne uymuyor.

#### Olası nedenler
* Alanın giriş türü konfigürasyon düzenleyicisinde değiştirilmiş olabilir.

#### Olası çözümler
* *Düzenle* Butonu: Geçersiz alan verilerini kaldırmak ve gerekirse yeniden girmek için girdiyi düzenleyicide açın.
* *Alan verilerini dönüştür* Butonu: Veriler, ilgili giriş türü için otomatik olarak doğru biçime dönüştürülür. İsteğe bağlı olarak, aynı alana geçersiz verilerin girildiği tüm girdilerde verilerin dönüştürülmesini sağlayabilirsiniz. Lütfen unutmayın; otomatik dönüştürme her durumda mümkün değildir ve bu nedenle bu düğme her zaman kullanılamaz.
* *Yeni alan seç* Butonu: Girdi kategorisi için konfigüre edilmiş alanlardan birini seçin. Girilen veriler daha sonra bu alana taşınacaktır. Lütfen unutmayın; veriler, hedef alanda mevcut olan tüm verilerin üzerine yazılacaktır. İsteğe bağlı olarak, aynı alana geçersiz verilerin girildiği tüm girdilerde yeni alanı ayarlayabilirsiniz (geçerli veriler orijinal alanda kalır).

### Değer listesinde yer almayan değer
Alana girilen, bir veya daha fazla (alan için konfigüre edilmiş) değer listesinde bulunmayan veri. 

#### Olası nedenler
* Alanın değer listesi, konfigürasyon düzenleyicisinde farklı bir değer listesiyle değiştirilmiş olabilir.
* Değerler, değer listesi düzenleyicisinde, projeye özel bir değer listesinden kaldırılmış olabilir.
* Alanın giriş türü, konfigürasyon düzenleyicisinde metnin serbestçe girilmesine izin veren bir giriş türünden değer listesi olan bir giriş türüne değiştirilmiş olabilir.
* Proje özelliklerinin *Ekip* ve *Sezonlar* alanlarına girilen değerleri kullanan alanlar için: Proje özelliklerindeki ekip veya sezon alanından girişler kaldırılmış olabilir
* *Sezon* alanı için: Üst girdide aynı adlı alandan değerler kaldırılmış olabilir (yalnızca üst girdide ayarlanan değerler *Sezon* alanı için seçilebilir).

#### Olası çözümler
* *Düzenle* Butonu: Değer listesinde yer almayan değerleri kaldırmak ve gerekirse bunları başka değerlerle değiştirmek için, girdiyi, düzenleyicide açın.
* *Değeri düzelt* Butonu: Alan için konfigüre edilen değer listesinden yeni bir değer seçin. Önceki değer, seçilen değerle değiştirilir. İsteğe bağlı olarak, aynı değerin girildiği ve aynı değer listesini kullanan tüm girdilerin tüm alanları için (toplu olarak) yeni değeri ayarlayabilirsiniz.
* *Değeri sil* Butonu: Alana girilen değer tamamen silinir. İsteğe bağlı olarak, aynı değerin eklendiği tüm girdilerin tüm alanlarından silebilirsiniz.
* Konfigürasyon düzenleyicisindeki değer listesini, karşılık gelen değeri içeren uygun bir değer listesiyle değiştirin.
* Değer listesindeki ilgili alana, (konfigürasyon düzenleyicisinde) eksik değeri ekleyin. Projeye özel olmayan değer listelerinde, önce *Değer listesini genişlet* seçeneğini kullanarak bir uzantı listesi oluşturmanız gerekir (bkz. *Proje konfigürasyonu* bölümündeki *Değer listeleri oluşturma ve genişletme*). 
* Proje özelliklerinde *Ekip* ve *Sezonlar* alanlarına girilen değerlere bağlı alanlarda: Eksik değeri proje özelliklerindeki ilgili alana ekleyin.
* *Sezon* alanı için: Değer zaten orada yoksa, ana girdide ayarlayın.

### Bir ilişkinin eksik hedef girdisi
Bir ilişkinin hedefi olarak belirtilen bir girdi bulunamadı.

#### Olası nedenler
* Bir senkronizasyon işlemi tam olarak tamamlanmamış olabilir.

#### Olası çözümler
* Field projesiyle çalışan tüm ekip üyelerinin verilerinin senkronize olduğundan emin olun.
* *İlişkiyi temizle* Butonu: İlişkide var olmayan girdilere yapılan tüm bağlantılar silinir.

### Bir ilişkinin geçersiz hedef girdisi
Bir ilişkinin hedefi olarak belirtilen bir girdinin kategorisi, bu ilişkinin geçerli bir hedef kategorisi değildir.

#### Olası nedenler
* İlişkinin izin verilen hedef kategori listesi, konfigürasyon düzenleyicisinde düzenlenmiş olabilir.
* Girdinin kategorisi değiştirilmiş olabilir.

#### Olası çözümler
* *Düzenle* Butonu: İlişkide geçersiz hedef girdiye olan bağlantıyı kaldırmak için girdiyi, düzenleyicisinde açın.
* *İlişkiyi temizle* Butonu: Geçersiz hedef girdilere olan tüm bağlantılar ilişkiden silinir.
* Hedef girdinin kategorisini, konfigürasyon düzenleyicisinde, söz konusu ilişkinin geçerli bir hedef kategorisi olarak tanımlatın.

### Eksik veya geçersiz üst girdi
Girdinin geçerli bir üst girdisi yok. Bu, girdi için hiçbir üst girdinin ayarlanmadığı, belirtilen üst girdinin bulunamadığı veya kategorisi nedeniyle geçerli bir üst girdi olmadığı anlamına gelebilir. Bu nedenle girdi görüntülenmiyor.

#### Olası nedenler
* Bir senkronizasyon işlemi tam olarak tamamlanmamış olabilir.
* Girdi, Field Desktop'ın eski bir sürümüyle oluşturulmuş olabilir.

#### Olası çözümler
* Field projesiyle çalışan tüm ekip üyelerinin verilerinin senkronize edildiğinden emin olun.
* *Yeni üst girdi ayarla* Butonu: Üst girdi olarak yeni bir girdi seçin. Girdi, seçilen girdinin kontekstine taşınır.
* Düğme *Girdiyi sil*: Etkilenen girdi tamamen silinir.

### Eksik tanımlayıcı öneki
Girdinin tanımlayıcısı, ilgili kategori için konfigüre edilmiş bir ön ek içermiyor.

#### Olası nedenler
* Girdi, tanımlayıcı ön eki konfigüre edilmeden önce oluşturulmuş olabilir.

#### Olası çözümler
* *Düzenle* Butonu: Tanımlayıcıyı yeniden girmek için girdi düzenleyicisini açın.

### Belirsiz tanımlayıcı
Girdinin tanımlayıcısı bir veya daha fazla başka girdi tarafından kullanılıyor. Bu nedenle, veri içe ve dışa aktarılırken hatalar oluşabilir.

#### Olası nedenler
* Tanımlayıcılar, mevcut bir senkronizasyon bağlantısı olmadan farklı bilgisayarlara girildi; veriler başka bir zamanda senkronize edildi.

#### Olası çözümler
* *Düzenle* Butonu: Yeni bir tanımlayıcı girmek için girdi düzenleyicisini açın.

### Girdi sınırı aşıldı
Bu kategori için konfigüre edilmiş girdi sınırının izin verdiğinden daha fazla girdi var.

#### Olası nedenler
* Girdiler, girdi sınırı yapılandırılmadan önce oluşturulmuş olabilir.
* Girdiler, mevcut bir senkronizasyon bağlantısı olmadan farklı bilgisayarlarda oluşturuldu; veriler başka bir zamanda senkronize edildi.

#### Olası çözümler
* Girdi sınırı karşılanana kadar ilgili kategorinin girdilerini silin.
* Konfigürasyon düzenleyicisinde girdi sınırını artırın.

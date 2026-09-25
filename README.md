# Learnie

Türkçe, görsel ağırlıklı bir öğrenme akışı. GitHub Pages üzerinde çalışan, sunucusuz bir PWA.

## Kullanım

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Node.js 24 önerilir. Yayın dizini `dist/`, repo tabanı `/Learnie/`.

## Neler var?

- Her oturumda yeniden sıralanan, kategori çeşitliliği gözeten ve görülenleri hatırlayan sonsuz akış.
- Dokunmatik kaydırmalı gönderiler (Swiper), hikâyeler ve Remotion Player ile kısa anlatımlar.
- Sanallaştırılmış akış ve reels; ekranda olmayan anlatım oynatıcıları durur.
- Beğeniler, kayıtlar, yanıtlar, görülen gönderiler ve kişisel yorumlar için cihazda IndexedDB / Dexie.
- Keşfet, Türkçe arama, konu seçimi, okuma paneli, iki etkileşimli deney ve açıklamalı sorular.
- Profilde kurgu sosyal etkileşim açıklaması ve bunları kapatma ayarı. Gerçek ortak yorum hizmeti yoktur.
- JSON yedek indirme / geri yükleme.
- PWA manifesti, build sırasında üretilen yükleme simgeleri, sürümlenmiş service worker ve çevrimdışı uygulama kabuğu.
- Her gönderi için `/Learnie/p/<id>/` statik sayfası; Open Graph etiketleri ve kart numarasıyla paylaşım.
- Kaynak, görsel kredisi ve kullanım bilgisini içeren 339 gönderi.

## GitHub Pages

Repository **Settings → Pages → Build and deployment → Source: GitHub Actions** olarak seçilir. `main` dalına gönderilen değişiklikler `.github/workflows/deploy.yml` ile test edilir, derlenir ve yayımlanır. Pages etkin değilse ilk deploy başarısız olabilir; ayarı yaptıktan sonra workflow yeniden çalıştırılabilir.

Beklenen adres: https://dgdfurkan.github.io/Learnie/

## İçerik eklemek

[CONTENT_GUIDE.md](CONTENT_GUIDE.md) dosyasına bak. Yeni bir JSON paketi ve `public/content/index.json` listesine bir kayıt yeterlidir. Mevcut gönderilerin `id` alanlarını değiştirmemek, paylaşılan bağlantıları korur. Yapı doğrulaması build sürecinin zorunlu adımıdır; tarihsel/bilimsel doğruluk kontrolünü otomatik yapmaz.

## Görseller ve çevrimdışı kullanım

İçerik görselleri bu repoya indirilmez. JSON içinde doğrulanmış dış HTTPS adresleri, kaynak sayfaları ve atıfları bulunur. Görsel yüklenemezse açıklama ve yeniden deneme sunulur. Dış sağlayıcıdaki silinme veya bağlantı kesintisi görselleri etkileyebilir.

Service worker sadece bu sitenin uygulama dosyalarını ve JSON içerik paketlerini saklar. Dış görseller, Google Fonts ve videolar zorunlu çevrimdışı önbelleğe alınmaz. İlk başarılı çevrimiçi ziyaretten sonra metinler ve yerel kayıtlar çevrimdışı kullanılabilir. Yerel veri tarayıcı/cihaz ile sınırlıdır; tarayıcı temizliği veya depolama tahliyesinde kaybolabilir. Uygulamada yedekleme bulunur.

PWA yükleme, tarayıcı desteğine bağlıdır. iOS'ta Safari paylaş menüsü, destekleyen Android/masaüstü tarayıcılarında yükleme istemi kullanılır. Uygulama simgesi kaynak SVG'den build sırasında PNG olarak üretilir; içerik fotoğraflarıyla aynı depolama işleyişini kullanmaz.

## Mimari

- `src/App.tsx`: görünüm, akış, arama, paylaşım, yerel kullanıcı deneyimi.
- `src/components.tsx`: gönderi, okuma, kaynak, yorum, deney ve soru bileşenleri.
- `src/Film.tsx`: tembel yüklenen Remotion anlatımları ve dikey reels.
- `src/engine.mjs`: karıştırma, benzersiz sıra, sabit etkileşim tohumu ve URL üretimi.
- `src/data.ts`: içerik paketlerini okuma, yerel veritabanı ve yedek doğrulama.
- `scripts/validate-content.mjs`: içerik şemasının ve benzersiz kimliklerin kontrolü.
- `scripts/postbuild.mjs`: gönderi sayfaları, uygulama simgeleri ve service worker üretimi.

İçerik havuzu tükenince akış devam eder. Görüntülenme öğrenme başarısı sayılmaz. Mevcut arşiv 339 gönderidir; 10.000 kayda yönelik test yalnızca sıra motorunun benzersizlik davranışını doğrular.

## Bağımlılık lisansları

React, Motion, Swiper, TanStack Virtual ve Dexie kendi lisanslarına tabidir. Remotion özel lisanslıdır; kurumsal kullanıma geçmeden ilgili sürümün koşullarını inceleyin: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md . Görsel lisansları ve atıfları her içerikte ayrıca bulunur.

## Odak, koyu tema ve kişisel arşiv

- Açık / koyu / sistem teması; ilk çizimden önce uygulanan tercih ve PWA tema rengi.
- Anlatımın sağ üstündeki odak düğmesinden kelime/harf akışı, hız ve yazı boyutu. Ayarlar `learnie-preferences-v1` anahtarında yerel saklanır.
- Hareketli fotoğraflar, konuya özel SVG sahneleri ve kısa metin parçaları; azaltılmış hareket tercihi gözetilir.
- İsteğe bağlı Türkçe cihaz seslendirmesi ve uygulamanın kendi ürettiği hafif ambient tonlar. Tarayıcı kısıtları nedeniyle ses, kullanıcının dokunuşuyla başlar. Ses kalitesi ve Türkçe ses bulunması cihaza bağlıdır.
- Kaydedilenlerde ızgara/liste, arama, sonra okunacaklar ve okunanlar. Okundu işareti kullanıcıya aittir; sadece ekranda görünmek okuma sayılmaz.
- Eski kişisel veriler korunur; yeni yedekler görünüm ve odak tercihlerini de içerir.
- Toplam 339 kaynaklı gönderi; 17 otomatik kontrol.

## Keşif atlası güncellemesi

331 gönderi (309 yeni), 103 yeni konu başlığı, 37 farklı sunum düzeni. Kaynak bağlantıları ve dış görsel kredileri her gönderide bulunur. Keşfet konu filtresi ve rastgele keşif içerir. Reels üst/alt uygulama gezinmesi olmadan açılır; yorumlar yazma alanı sabit kalan alt paneldedir. Paylaşım yalnız kalıcı URL gönderir. Kaydedilenler kullanıcı koleksiyonlarıyla düzenlenir; koleksiyonlar yerel yedeğe dahildir.

`npm test` içerik çeşitliliğini, koleksiyon göçünü/üyeliğini, paylaşım kimliklerini, anlatım bütünlüğünü ve 10.000 öğelik sıra davranışını denetler. `npm run build` 339 kalıcı paylaşım sayfasını ve sürümlü PWA önbelleğini üretir. Gerçek iOS/Android ekran klavyesi ve ana ekrana yükleme, ilgili cihazda ayrıca kontrol edilmelidir.

## Eylül 2026: arayüz ve anlatım yenilemesi

Mevcut 331 gönderinin kimlikleri korunarak bütün anlatımlar yeniden yazıldı. Tanım, mekanizma ve somut örneklerle ilerleyen paragraflar artık her kartta büyük bir başlıkla kesilmiyor. Gönderi paleti ve fontu uygulama temasından bağımsız; karanlık uygulama zemini `#000`. Fotoğraf kullanılan 64 eski kapakta aynı URL ikinci kez kullanılmıyor; diğer kapaklar tipografik veya çizimli. 37 tek sayfalık gönderi, 37 sunum düzeni ve farklı yazı tipleri var.

Keşfet üç sütunlu sanal sonsuz ızgaradır; seçilen gönderiden başlayan tam ekran Reels açılır. Ana Sayfa/Keşfet sekmesine yeniden dokunma sadece en üste götürür; aynı düğmeyi basılı tutup yukarı sürükleme sıralamayı yeniler. Kaydet ilk dokunuşta kaydeder ve koleksiyon seçiciyi açar. Yeni koleksiyon oluşturulduğunda gönderi içine doğrudan eklenir. Profilde beğenilen gönderiler bulunur. Yorum sayıları paneldeki yorumlarla eşleşir; paylaşım yalnız URL içerir.

Beş yeni spor anlatımı (basketbol, hentbol, Amerikan futbolu, beyzbol, curling) ve üç video gönderisi eklendi. Video süreleri 2:11, 4:20 ve 4:58; TED-Ed videolarında Türkçe altyazı mevcut. Gömülü videolar görünür olunca otomatik başlar, ekran dışına çıkınca durur. Dış yayıncı erişimi, reklam ve altyazı kullanılabilirliği yayıncının kontrolündedir.

### 24 Eylül 2026 · Kaynak çeşitliliği ve kesintisiz oynatma

- 50 yeni YouTube kanalından 200 yeni video: toplam 899 gönderi, 563 video gönderisi, yayıncısı adlandırılmış 56 kanal. Yeni videolar 18–179 saniye. Gerçek Türkçe altyazı kaydı, gömme izni, Türkiye erişimi, süre ve kanal kimliği `docs/video-audit-2026-09-24-sources.json` içinde kayıtlı. Otomatik altyazılar hatalar içerebilir; erişim yayıncı tarafından sonradan değiştirilebilir.
- Keşfet'te yayıncı filtresi ve kanal adıyla arama. Yeni yayıncılar arasında Bebar Bilim, Khan Academy Türkçe, müzeler, Borusan Sanat, DiyanetTV, BibleProject Türkçe, matematik/müzik kanalları, Socrates, TEMA ve yemek kanalları var. Görseller ve medya dış kaynakta kalır.
- Görünen alanının yarısından fazlası ekranda olan, merkeze en yakın tek video otomatik başlar. Başlangıç sessizdir; ses tercihi yerelde tutulur. Tarayıcı sesli otomatik oynatmayı reddederse sessiz denenir, tamamen engellenirse sağlayıcının kendi oynat düğmesi kullanılabilir. Ekrandan çıkınca duraklar; oturum içinde geri dönünce süre korunur.
- Göz modu, yorumlar ve koleksiyon paneli YouTube oynatıcısını yeniden oluşturmaz. Göz modunda önceki/sonraki düğmeleri ve oynatıcının dışındaki sağ kenar kaydırma alanı kullanılabilir. YouTube iframe'inin içindeki dokunma hareketleri uygulamaya aktarılamaz; videonun üstünü kapatan katman kullanılmaz.
- Gönderi, profil, yorum ve Reels ekranlarında kenardan içeri yatay kaydırma geri götürür. Üst başlıklardaki bulanıklık kaldırıldı.
- Gerçek cihaz sesleri arasından Türkçe anlatıcı ve konuşma hızı seçilir, seçim saklanır. Ses örneği dinlenebilir. Yazı konuşma sınırı olaylarını izler; kelime sınırı bildirmeyen cihaz seslerinde cümle takibi kullanılır. Sonraki anlatım kartı konuşma bitince açılır. Ses kalitesi ve kullanılabilir sesler işletim sistemine bağlıdır.
- Tek kontrol katmanı YouTube'un kendi `controls=1` oynatıcısıdır. İkinci bir Learnie oynat/ses/ilerletme çubuğu veya posteri başlatma düğmesi yoktur. YouTube logosu, reklamları ve sağlayıcının iç düğmeleri zorla kaldırılmaz, kırpılmaz veya başka bir katmanla örtülmez.

Doğrulama: `npm test` (30 kontrol), `npm run build`, kalıcı gönderi yolları ve içerik şeması. Tarayıcıda düzen ve etkileşim kontrolü, her fiziksel telefonda medya/ses oynatma garantisi değildir.

### Oynatıcı düzeltmesi · 24 Eylül 2026

Reels boyunca tek iframe korunur; sonraki video `loadVideoById` ile aynı oynatıcıya yüklenir. Önceki videoların konumları ayrı saklanır. Göz modu ve yorum/kolleksiyon panelleri oynatıcıya başlat/duraklat komutu göndermez. Otomatik başlatma için hazır olunca yükleme yapılır; yüklemeyi izleyen ikinci oynat/duraklat döngüsü kaldırılmıştır.

Sağlayıcının kendi ses düğmesindeki değişiklikler ve ses seviyesi izlenip yerelde kaydedilir. Her klipte yeniden sessize alma yapılmaz. İlk ziyaret sessiz otomatik oynar; sesli otomatik oynatmanın engellenmesi kullanıcının kayıtlı tercihini değiştirmez. Mobil tarayıcı izinleri, YouTube erişimi ve sağlayıcının sunduğu hız/dokunma hareketleri uygulamanın kontrolünde değildir.

`tests/youtube-session.test.mjs` tek başlatma, kullanıcı duraklatması, sonraki videoda ses, hızlı geçiş, panel güncellemeleri, görünürlük, kaldığı yer ve engellenen otomatik oynatma sıralarını sahte API ile sınar. Gerçek medya testi yerine geçmez.


## 25 Eylül 2026 güncellemesi

40 yeni kısa video, toplam 939 gönderi ve 603 doğrudan video gönderisi. İlk iframe açılışında autoplay, video geçişinde ses tercihinin yeniden uygulanması ve mevcut iframe oturumunu koruma. Paylaşılan gönderiler Reels'te açılır; okuma görünümü `mode=read` kullanır.

Ana sayfadaki **Öğrenme molan**: 3/5/7 keşif, konu seçimi, isteğe bağlı hatırlama kartı, kendi cümlelerin ve uygulama notların, 1/3/7/14/30 günlük tekrar programı. Yerel kayıt ve yedekle uyumlu. [Tasarım kararları, araştırma dayanakları ve ölçüm planı](docs/learning-design-2026-09-25.md).

Tarayıcı ilk sesli oynatma için kullanıcı hareketi isteyebilir. YouTube'un yerel kontrolleri ve görüntü üzerindeki hareketleri üçüncü taraf iframe'e aittir; uygulama bunları kaplayarak gizlemez. Testlerde gerçek telefondaki ses/video teslimatı ayrıca doğrulanmalıdır.

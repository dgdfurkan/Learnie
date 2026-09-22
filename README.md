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
- Kurgu sosyal etkileşimlerin görünür etiketi ve bunları kapatma ayarı. Gerçek ortak yorum hizmeti yoktur.
- JSON yedek indirme / geri yükleme.
- PWA manifesti, build sırasında üretilen yükleme simgeleri, sürümlenmiş service worker ve çevrimdışı uygulama kabuğu.
- Her gönderi için `/Learnie/p/<id>/` statik sayfası; Open Graph etiketleri ve kart numarasıyla paylaşım.
- Kaynak, görsel kredisi ve kullanım bilgisini içeren 22 gönderi (13 başlangıç + 9 yeni keşif).

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

İçerik havuzu tükenince akış devam eder; tekrar eden kartlar “Yeniden keşif” etiketi taşır. Görüntülenme öğrenme başarısı sayılmaz. Mevcut arşiv 22 gönderidir; 10.000 kayda yönelik test yalnızca sıra motorunun benzersizlik davranışını doğrular.

## Bağımlılık lisansları

React, Motion, Swiper, TanStack Virtual ve Dexie kendi lisanslarına tabidir. Remotion özel lisanslıdır; kurumsal kullanıma geçmeden ilgili sürümün koşullarını inceleyin: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md . Görsel lisansları ve atıfları her içerikte ayrıca bulunur.

## Odak, koyu tema ve kişisel arşiv

- Açık / koyu / sistem teması; ilk çizimden önce uygulanan tercih ve PWA tema rengi.
- Anlatımın sağ üstündeki odak düğmesinden kelime/harf akışı, hız ve yazı boyutu. Ayarlar `learnie-preferences-v1` anahtarında yerel saklanır.
- Hareketli fotoğraflar, konuya özel SVG sahneleri ve kısa metin parçaları; azaltılmış hareket tercihi gözetilir.
- İsteğe bağlı Türkçe cihaz seslendirmesi ve uygulamanın kendi ürettiği hafif ambient tonlar. Tarayıcı kısıtları nedeniyle ses, kullanıcının dokunuşuyla başlar. Ses kalitesi ve Türkçe ses bulunması cihaza bağlıdır.
- Kaydedilenlerde ızgara/liste, arama, sonra okunacaklar ve okunanlar. Okundu işareti kullanıcıya aittir; sadece ekranda görünmek okuma sayılmaz.
- Eski kişisel veriler korunur; yeni yedekler görünüm ve odak tercihlerini de içerir.
- Toplam 22 kaynaklı gönderi; 9 otomatik kontrol.

## Keşif atlası güncellemesi

331 gönderi (309 yeni), 103 yeni konu başlığı, 37 farklı sunum düzeni. Kaynak bağlantıları ve dış görsel kredileri her gönderide bulunur. Keşfet konu filtresi ve rastgele keşif içerir. Reels üst/alt uygulama gezinmesi olmadan açılır; yorumlar yazma alanı sabit kalan alt paneldedir. Paylaşım yalnız kalıcı URL gönderir. Kaydedilenler kullanıcı koleksiyonlarıyla düzenlenir; koleksiyonlar yerel yedeğe dahildir.

`npm test` içerik çeşitliliğini, koleksiyon göçünü/üyeliğini, paylaşım kimliklerini, anlatım bütünlüğünü ve 10.000 öğelik sıra davranışını denetler. `npm run build` 331 kalıcı paylaşım sayfasını ve sürümlü PWA önbelleğini üretir. Gerçek iOS/Android ekran klavyesi ve ana ekrana yükleme, ilgili cihazda ayrıca kontrol edilmelidir.

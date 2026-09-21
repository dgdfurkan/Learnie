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
- Kaynak, görsel kredisi ve kullanım bilgisini içeren 13 başlangıç gönderisi.

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

İçerik havuzu tükenince akış devam eder; tekrar eden kartlar “Yeniden keşif” etiketi taşır. Görüntülenme öğrenme başarısı sayılmaz. Başlangıç arşivi 13 gönderidir; 10.000 kayda yönelik test yalnızca sıra motorunun benzersizlik davranışını doğrular.

## Bağımlılık lisansları

React, Motion, Swiper, TanStack Virtual ve Dexie kendi lisanslarına tabidir. Remotion özel lisanslıdır; kurumsal kullanıma geçmeden ilgili sürümün koşullarını inceleyin: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md . Görsel lisansları ve atıfları her içerikte ayrıca bulunur.

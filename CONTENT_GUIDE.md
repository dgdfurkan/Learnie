# Learnie içerik paketi rehberi

Yeni içerikler uygulama kodundan bağımsız JSON dosyalarıdır. Görseller dış HTTPS URL'leriyle kullanılır; fotoğraf veya video dosyasını repoya koymayın.

1. `public/content/starter-001.json` biçimini izleyerek `public/content/kesif-002.json` oluşturun.
2. `public/content/index.json` içindeki `packs` dizisine `{"file":"kesif-002.json","title":"Yeni keşifler","count":20}` ekleyin.
3. `npm run validate`, `npm test` ve `npm run build` çalıştırın.
4. `main` dalına gönderin. GitHub Actions siteyi günceller.

Her pakette `version: 1` ve `posts` dizisi bulunur. Her gönderinin gerekli alanları:

| Alan | Açıklama |
| --- | --- |
| `id` | Benzersiz ve kalıcı: `bilim-isik-001`. Yalnızca küçük Latin harf, rakam ve tire. Paylaşılmış kimliği değiştirmeyin. |
| `category` | Bilim, Uzay, Sanat, Tarih, Coğrafya, Felsefe, İnanç, Doğa, Teknoloji, Spor, Gündelik, Sağlık, Soru, Finans veya Edebiyat. |
| `title`, `subtitle` | Doğal Türkçe başlık ve kısa giriş. Başlık tercihen 8–10 kelimeyi aşmasın. |
| `account`, `handle` | Editoryal konu hesabının adı ve kısa kullanıcı adı. Gerçek kurum hesabı izlenimi vermeyin. |
| `accent` | Altı haneli hex renk, ör. `#699eab`. |
| `format` | `carousel`, `story`, `experiment`, `perspective` veya `reel`. |
| `minutes` | Tahmini okuma süresi. |
| `cover` | `url`, `alt`, `credit`, `source`, `license`; isteğe bağlı `licenseUrl`, `position`. |
| `slides` | 1–8 öğe; her birinde `title`, `text`; isteğe bağlı `kicker`. Metin teknik üst sınırı 650 karakter; kısa kartlar için 200–300 karakter önerilir. |
| `sources` | En az bir `{label,url}`. İddiayı gerçekten destekleyen birincil/kurumsal kaynaklar. |
| `updatedAt` | İçeriğin en son kontrol edildiği tarih: `YYYY-MM-DD`. |
| `comments` | `{name,text}` öğeleri. Sosyal görünüm ayarında kurgu olduğu açıklanır; editoryal doğruluk kontrolünden geçmelidir. |

İsteğe bağlı alanlar:

- `quiz`: `question`, `options`, sıfırdan başlayan doğru seçenek `answer`, gerekçeli `explanation`.
- `experiment`: `pressure` veya `light`. Yeni deney davranışları için kod bileşeni eklemek gerekir; yalnızca JSON yeni bir deney motoru oluşturmaz.
- `video`: `{kind:"youtube",url:"11-karakter-ID",title:"...",language:"Türkçe"}` veya `{kind:"file",url:"https://.../video.mp4",title:"...",language:"..."}`. Gerçek videoyu, dilini, süresini ve dışarıda/gömülü oynatılmasını kontrol edin.

## Editoryal kontrol

- Bir gönderi bir ana fikri öğretsin; gerekli önbilgiyi varsaymasın.
- Araştırma bulgusunu, tarihsel yorumu, inancı ve kişisel yorumu ayırın.
- Alıntıları ve görsel kullanım koşullarını kontrol edin; kaynakta olmayan kişi, tarih, etki veya kesinlik eklemeyin.
- Dini içerikte gelenek/mezhep/metin referansını açıkça belirtin. Bir yorum bütün gelenek adına sunulmamalı.
- Görsel açıklaması görülen şeyi doğru anlatsın; temsili görselse söyleyin.
- CC lisanslı görsellerde sanatçı, kaynak, lisans bağlantısı ve kadraj değişikliği bilgisi bulunsun.
- Aynı metnin küçük değişikliklerini yeni içerik saymayın. Tekrarları `id` kadar anlam bakımından da kontrol edin.

## Büyütme

20–100 gönderilik paketler pratik bir başlangıçtır. Arayüzden bütün görseller bir anda yüklenmez; akış sanallaştırılır. Şu an metin paketleri oturum başında okunur. Binlerce içerik eklendiğinde metin indeksini/gövde paketlerini ayrı yükleme yaklaşımıyla genişletmek mümkündür. Bu ölçeğe geçişte gerçek cihaz belleği, başlangıç yükü ve arama süresi ayrıca ölçülmelidir.

Statik gönderi sayfaları build sırasında otomatik üretilir. Her gönderi için ayrı HTML düzenlemek gerekmez. Dış görsel adreslerinin çalışması otomatik şema doğrulamasının kapsamı dışındadır; yayından önce kontrol edilmelidir.

## Hareketli anlatım ve yeni konular

`motion` alanı isteğe bağlıdır: `tennis`, `football`, `bottle`, `orbit`, `geometry`, `art`, `particles`. Sahne çizimleri Remotion içinde kareye göre hareket eder. Bunlar ölçekli bilimsel simülasyonlar değil, anlatıma eşlik eden şemalardır. Alan verilmezse kategoriye uygun varsayılan seçilir.

Yeni kategoriler: `Spor`, `Gündelik`, `Sağlık`, `Soru`. `discoveries-002.json` farklı konulardan 9 örnek içerir. Anlatım biçimini konuya göre seç; her gönderiye aynı başlık/açıklama şablonunu dayatma. Soru eklemek isteğe bağlıdır. Sağlık metinlerinde mekanizma ile kişiye özel kullanım önerisini ayır; dinî metinlerde meal/rivayet ile editoryal yorumu açıkça ayır. Televizyonda sorulduğu doğrulanmayan soruları belirli bir programa atfetme.

Uzun paragraflar anlatımda sözcükler kaybolmadan kısa sahnelere bölünür. Odak modunda kelime/harf hızı ve yazı boyutu izleyicinin genel tercihidir. Seslendirme cihazın Türkçe Web Speech sesine bağlıdır; ses yoksa kontrol açıklamayla pasif olur. Seslendirme bu Türkçe açıklamaları okur, Kur’an tilaveti değildir. Arka plan müziği Web Audio ile oluşturulan özgün sinüs tonlarıdır; dış müzik kaydı veya sample içermez. Dış fotoğraflar ve kredileri JSON içinde kalır.

## Keşif atlası · Eylül 2026

14 yeni JSON paketi, 309 yeni gönderi ve 103 konu başlığı içerir. İlk 22 gönderinin kimlikleri korunur; toplam 331 içerik vardır. `topic` keşfetteki konu filtresini, `layout` kapak/kart/okuma düzenini belirler. `format` oynatma biçimini belirtir; `layout` ile aynı şey değildir. Kaynaklı metinler özgün, kısa Türkçe özetlerdir; fotoğraflar Wikimedia Commons üzerindeki dış adreslerden gelir. Her fotoğrafın kendi üretici ve lisans bilgisi korunur. Çizimler temsilidir.

37 sunum düzeni: `diagram`, `process`, `comparison`, `punchline`, `chat`, `sequence`, `cutaway`, `equation`, `poster`, `notebook`, `sticky`, `layers`, `number`, `reveal`, `postcard`, `newspaper`, `route`, `gallery`, `profile`, `split`, `terminal`, `puzzle`, `glossary`, `door`, `beforeafter`, `timeline`, `balance`, `mosaic`, `network`, `prism`, `receipt`, `comic`, `checklist`, `book`, `casefile`, `growth`, `myth`. Türün anlamını içerikle eşleştir; örneğin karşılaştırmayı rastgele bir konuya atama. `myth` otomatik olarak metni doğru/yanlış diye etiketlemez. `reveal`, `puzzle` ve `door` soru odaklı kapaklardır. Metinler ekran okuyucularda da okunabilir.

Yeni hareket türleri: `wave`, `prism`, `pendulum`, `flow`, `layers`, `network`, `helix`, `growth`, `balance`, `gears`, `mosaic`, `pulse`, `probability`. Okuma ekranındaki çizim elle başlatılır, duraklatılır ve 0,5–2× hızda izlenir. Ekran dışında güncelleme durur. Kapak hareketleri azaltılmış hareket tercihini izler.

Yorum sayısı sıfırdan kalabalık sohbetlere kadar değişebilir. Bunların kurgu olduğu Profil → Sosyal görünüm bölümünde açıklanır; kişisel yorumlar cihazda saklanır. Yeni bilgi iddialarını kurgu yorumlara saklama.

İçerik yükleyici aynı anda en fazla dört metin paketi ister. Keşfet üç sütunlu, kaydırdıkça devam eden sanal ızgaradır. Binlerce içerikte gövde paketlerini ihtiyaç anında yükleme yaklaşımı hâlâ sonraki ölçek adımıdır.

## Koleksiyonlar ve uyumluluk

Koleksiyonlar `UserState.collections` içinde `{id,name,postIds,createdAt}` olarak yerel saklanır. Bir gönderi birkaç koleksiyona girebilir. Kaydı kaldırmak bütün koleksiyon üyeliklerini temizler; koleksiyonu silmek gönderilerin kaydını silmez. Eski yedeklerde koleksiyon yoksa boş listeyle açılır. Yedek dışa/içe aktarımı koleksiyonları da taşır. Yayımlanan gönderi kimliklerini değiştirirsen kayıtlar ve paylaşım bağlantıları kırılabilir.

## Gönderinin görünümü

- `display`: `single` (tek kart, ilk anlatım parçası kapakta; tam metin açıklamada), `carousel` (kapak + paragraflar), `video` (doğrudan oynatılabilir video).
- `art`: `kind` (`photo`, `type`, `diagram`), `font`, `paper`, `ink`, `align`, `position`; yayınlanmış tasarım temayla değişmez. Koyu kağıtta açık, açık kağıtta koyu mürekkep kullanın. Fotoğrafların üzerinde beyaz yazıyı bileşen uygular; `ink` devam kartlarının okunabilir rengi olmalı.
- `avatar`: editoryal hesabın dış HTTPS görseli. `avatarCredit`: `{label,url}` kaynak ve atıf.
- `video.duration`: saniye olarak süre; video gönderilerinde zorunlu, en fazla 300. YouTube için `url` yalnız 11 karakterlik video kimliğidir. Gömme iznini, süreyi ve altyazıyı yayıncının kaynağından kontrol edin.
- `slides[].title` boş bırakılabilir. Her parça, önceki paragrafın devamı olarak tek somut fikri açıklamalı. Telefonda 300 karakteri aşmayın. Anlatıma nesnenin/olayın adı ve temel tanımıyla başlayın. Yalnız başlık değiştirerek aynı metni çoğaltmayın.

Örnekler: `public/content/field-and-screen-003.json`. Yeni görselleri repoya indirmeyin; yeni fotoğraflarda dış adres, hak bilgisi ve kaynak sayfası bulunmalı. Kodla çizilmiş açıklayıcı SVG sahneleri `src/SportScene.tsx` gibi bileşenlerde tutulabilir.

## Kısa video seçkisi · 23 Eylül 2026

`short-videos-001/002/003.json`: 60 yeni YouTube videosu, her biri 60–118 saniye; toplam arşiv 399 gönderi. Kaynaklar TÜBİTAK Bilim Genç, TRT Belgesel, Evrim Ağacı ve Barış Özcan. Videolar kopyalanmaz; yayıncının gömülü oynatıcısı kullanılır. Kapak görselleri de dış URL olarak kalır.

`video` alanında `publisher`, `duration`, `orientation`, `poster`, `audioLanguage`, `captionLanguage`, `captionKind` ve `verifiedAt` saklanır. `captionKind: automatic`, gerçekten mevcut Türkçe otomatik altyazı kanalını belirtir; YouTube'un sonradan otomatik çeviri sunabilmesi doğrulama sayılmaz. Seçkideki tüm videolarda `tr` altyazı kanalı görüldü. Oynatıcı Türkçe arayüz ve altyazı ister; çok sesli videolarda kullanıcı YouTube ayarlarından Türkçe ses kanalını seçebilir.

Kontrol kaydı: `docs/video-audit-2026-09-23.json`. Süre, Türkiye erişimi, gömme izni ve dil kanalları YouTube'un herkese açık oynatıcı verilerinden kontrol edildi. Bu, her cihazda görüntü/ses aktarımının test edildiği veya yayıncının videoyu gelecekte kaldırmayacağı anlamına gelmez. Yayıncı bağlantısı her zaman oynatıcının altında kalır. Yeni paketlerde aynı kontrolleri tekrarlayın; altyazı veya Türkçe ses yoksa içerik eklemeyin. El yapımı Türkçe altyazı bu sürümde kullanılmıyor.

## Marka

Ana vektör kaynak `src/assets/brand.svg`. Uygulama içindeki simge, açılış animasyonu, favicon, PWA ve Apple ikonları bu kaynaktan üretilir. `scripts/postbuild.mjs`, SVG'yi `/icon.svg` olarak da yayımlar; maskable ikonun güvenli alanını korur. Açılış animasyonu yaklaşık 1 saniyedir, azaltılmış hareket tercihinde ve doğrudan gönderi bağlantılarında gösterilmez; gezinmede tekrar etmez.

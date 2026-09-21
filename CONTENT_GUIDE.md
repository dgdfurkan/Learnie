# Learnie içerik paketi rehberi

Yeni içerikler uygulama kodundan bağımsız JSON dosyalarıdır. Görseller dış HTTPS URL'leriyle kullanılır; fotoğraf veya video dosyasını repoya koymayın.

1. `public/content/starter-001.json` biçimini izleyerek `public/content/kesif-002.json` oluşturun.
2. `public/content/index.json` içindeki `packs` dizisine `{"file":"kesif-002.json","title":"Yeni keşifler","count":20}` ekleyin.
3. `npm run validate`, `npm test` ve `npm run build` çalıştırın.
4. `main` dalına gönderin. GitHub Actions siteyi günceller.

Her pakette `version: 1`, `title` ve `posts` dizisi bulunur. Her gönderinin gerekli alanları:

| Alan | Açıklama |
| --- | --- |
| `id` | Benzersiz ve kalıcı: `bilim-isik-001`. Yalnızca küçük Latin harf, rakam ve tire. Paylaşılmış kimliği değiştirmeyin. |
| `category` | Bilim, Uzay, Sanat, Tarih, Coğrafya, Felsefe, İnanç, Doğa veya Teknoloji. |
| `title`, `subtitle` | Doğal Türkçe başlık ve kısa giriş. Başlık tercihen 8–10 kelimeyi aşmasın. |
| `account`, `handle` | Editoryal konu hesabının adı ve kısa kullanıcı adı. Gerçek kurum hesabı izlenimi vermeyin. |
| `accent` | Altı haneli hex renk, ör. `#699eab`. |
| `format` | `carousel`, `story`, `experiment`, `perspective` veya `reel`. |
| `minutes` | Tahmini okuma süresi. |
| `cover` | `url`, `alt`, `credit`, `source`, `license`; isteğe bağlı `licenseUrl`, `position`. |
| `slides` | 2–8 öğe; her birinde `kicker`, `title`, `text`. Metin teknik üst sınırı 650 karakter; kısa kartlar için 200–300 karakter önerilir. |
| `sources` | En az bir `{label,url}`. İddiayı gerçekten destekleyen birincil/kurumsal kaynaklar. |
| `updatedAt` | İçeriğin en son kontrol edildiği tarih: `YYYY-MM-DD`. |
| `comments` | `{name,text}` öğeleri. Uygulamada “Örnek yorum” olarak gösterilir; editoryal doğruluk kontrolünden geçmelidir. |

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

Yeni kategoriler: `Spor`, `Gündelik`, `Sağlık`, `Soru`. `discoveries-002.json` farklı konulardan 9 örnek içerir. Her pakette ana fikir, kısa açıklama, kaynak ve açıklamalı soru düzenini koru. Sağlık metinlerinde mekanizma ile kişiye özel kullanım önerisini ayır; dinî metinlerde meal/rivayet ile editoryal yorumu açıkça ayır. Televizyonda sorulduğu doğrulanmayan soruları belirli bir programa atfetme.

Uzun paragraflar anlatımda sözcükler kaybolmadan kısa sahnelere bölünür. Odak modunda kelime/harf hızı ve yazı boyutu izleyicinin genel tercihidir. Seslendirme cihazın Türkçe Web Speech sesine bağlıdır; ses yoksa kontrol açıklamayla pasif olur. Seslendirme bu Türkçe açıklamaları okur, Kur’an tilaveti değildir. Arka plan müziği Web Audio ile oluşturulan özgün sinüs tonlarıdır; dış müzik kaydı veya sample içermez. Dış fotoğraflar ve kredileri JSON içinde kalır.

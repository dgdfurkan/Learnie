# Learnie: keşiften kalıcı öğrenmeye

## Sorun ve ürün kararı

İzlemek kolay; bir fikri hatırlamak ve gündelik hayatta kullanmak ayrı bir iş. Sonsuz akış içerik keşfetmeye yarıyor, fakat tek başına öğrenme ilerlemesi sayılmıyor. Yeni “Öğrenme molan” alanı, akışın yanında sonu belli bir yol sunuyor.

1. **Başlama:** Kullanıcı 3, 5 veya 7 keşif ve isterse bir konu seçer. Tarihe bağlı seçki gün içinde aynı kalır; mümkün olduğunca konu ve yayıncı çeşitliliği sağlar.
2. **Keşif:** Seçki Reels'te açılır. Seçkideki son içerikten sonra kullanıcı kendi molasına dönebilir; araya rastgele içerik eklenmez.
3. **Hatırlama:** “Aklımda tut” ana fikri cevabı göstermeden önce sorar. Kullanıcı yazabilir ya da sesli düşünebilir. Referans anlatımı açtıktan sonra “Hatırladım” veya “Yeniden bakacağım” seçer. Bu bir otomatik bilgi ölçümü değil, açıkça kişisel değerlendirmedir.
4. **Uygulama:** İsteğe bağlı kısa not, bilgiyi gerçek bir duruma bağlar. Konuya uygun yönlendirme vardır; 10 yeni videonun ayrıca elle yazılmış soru, yanıt ve uygulama adımı vardır.
5. **Geri dönüş:** İlk tekrar ertesi güne, başarılı tekrarlar sırasıyla 3, 7, 14 ve 30 gün sonrasına konur. “Yeniden bakacağım” bir günlük aralığa döner. Kullanıcı notlarını ve “Hayatta denedim” kayıtlarını görür.

## Ödül neye bağlı?

Anlık geri bildirim, tamamlanan bir hatırlama adımı ve kullanıcının kendi cümlesi üzerinden gelir. Günlük halka, adım işaretleri ve son yedi gün görünümü gerçek yerel işlemlerden hesaplanır. Sırf kaydırmak, like atmak ya da ekranda beklemek hedefi doldurmaz. Aynı kartın aynı gün tekrar kaydı hedefi iki kez ilerletmez. Bir gün ara vermek önceki notları veya toplam öğrenme kaydını silmez. Hedef tamamlanınca görünür bir bitiş ve mola mesajı bulunur.

Bu tasarım bir “dopamin garantisi” veya kanıtlanmış Learnie tutundurma artışı değildir. Küçük başarı, özerklik, çeşitlilik ve ilerlemeyi görünür kılma üzerine ürün hipotezidir.

## Dayanaklar ve sınırları

- Duolingo, günlük hedef ile seriyi ayırma deneyimini ve başlama eşiğini azaltma yaklaşımını kendi ürün deneyleriyle anlatıyor: https://blog.duolingo.com/improving-the-streak/
- Araştırmacılar tarafından hazırlanan Retrieval Practice kaynakları, aralıklı hatırlama ve yeniden öğrenmenin rolünü açıklıyor: https://www.retrievalpractice.org/spacing ve https://www.retrievalpractice.org/summary
- Bilimsel inceleme: Carpenter ve ark., *The science of effective learning with spacing and retrieval practice*, Nature Reviews Psychology (2022), https://doi.org/10.1038/s44159-022-00089-1

Bu kaynaklar Learnie'nin seçilen aralıklarını veya mevcut arayüzünü test etmiş değildir. 1/3/7/14/30 gün, bu sürümün anlaşılır başlangıç programıdır; kişiselleştirilmiş hafıza modeli değildir.

## Nasıl değerlendirilmeli?

İlk kullanıcı çalışmasında 8–12 kişiye mevcut akış ve yeni mola akışı gösterilebilir. Ölçülecekler:

- Bir günlük seçkiye başlama ve ilk hatırlama kartını tamamlama oranı.
- 24 saat sonra bir fikri yardım almadan açıklayabilme; yalnızca uygulamayı açma sayısı değil.
- Yedi gün içinde geri dönülen günler ve kendi isteğiyle tamamlanan molalar.
- Kullanıcının “Hayatta denedim” diye işaretlediği somut örnekler.
- Oynatma için gereken dokunuşlar, kaydırma sonrası kesinti, sesi tekrar açma ihtiyacı.
- “Burada durmak kolay mı?” ve “Gerçekten bir şey öğrendim mi?” sorularına verilen yanıtlar.

Bu sürümde uzaktan analitik, izleme SDK'sı, push bildirimi ya da yapay kullanıcı etkinliği eklenmedi. Kayıtlar mevcut IndexedDB yedeğine dahil; eski yedekler güvenli varsayılanlarla açılır.

## Oynatma değişiklikleri

- İlk video doğrudan iframe URL'siyle, `autoplay=1`, `playsinline=1` ve iframe yüklenmeden tanımlanan autoplay izniyle açılır. API hazır olunca aynı video yeniden yüklenmez.
- Reels boyunca aynı iframe korunur. Geçiş, mümkün olduğunda kaydırma/tıklama olayı içinde API'ye gönderilir.
- Kaydedilen ses tercihi yeni video yüklemesinden sonra yeniden uygulanır. Tarayıcının geçici sessiz başlangıcı ayrı tutulur.
- İlk yüklemede `CUED` durumunda kalan oynatıcı için sınırlı yeniden başlatma vardır; kullanıcı duraklatmışsa zorla oynatılmaz.
- Aktif olmayan video ve gizlenen sekme duraklar. Yorumlar ve göz modu iframe'i değiştirmez.
- YouTube yerel denetimleri tek oynatma denetimidir. Sağdaki ayrı işlem şeridi kaydırmayı destekler; YouTube görüntüsünün üstüne hareket yakalayan bir kaplama konmaz.
- YouTube'un iframe'i kendi içindeki dokunmaları üst sayfaya iletmez. Tam video yüzeyinde Instagram ile aynı kaydırmayı sağlamak, izinli bir doğrudan medya kaynağı/oynatıcı gerektirir. Tarayıcıların ilk sesli autoplay kısıtları da uygulama tarafından kaldırılamaz.

Resmî kaynaklar: https://developers.google.com/youtube/iframe_api_reference ; https://developer.chrome.com/blog/autoplay ; https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/

## İçerik ve performans

40 ek video; gerçek Türkçe altyazı kanalı, 34–116 saniye süre, gömme izni ve Türkiye erişimi 25 Eylül 2026'da kamuya açık kaynak metadatasından kontrol edildi. Otomatik altyazı açıkça etiketli. Ayrıntılı denetim `video-audit-2026-09-25.json` içindedir. Medya oynatımı ve altyazı doğruluğu, metadata kontrolünden ayrı tutulur.

Üretim derlemesi, içerik paketlerinden tek bir sürümlenmiş katalog üretir; ilk açılışta çok sayıda paket isteği yerine bu katalog alınır. Eski dağıtımlar ve geliştirme ortamı için paket yükleme yolu korunur. Mevcut PWA ve kullanıcı yedeği korunur. Bütün gönderi bağlantıları varsayılan olarak Reels açar; uygulama içi okuma modu açık `mode=read` parametresi kullanır.

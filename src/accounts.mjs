import {seedNumber} from './engine.mjs';

export function normalizeFollowing(value){return Array.isArray(value)?[...new Set(value.filter(v=>typeof v==='string'&&v.length>0&&v.length<=100))]:[];}
export function accountPosts(posts,handle){return posts.filter(p=>p.handle===handle).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export function accountStats(handle,simulation,followed){const seed=seedNumber(handle);return {followers:(simulation?1800+seed%87000:0)+(followed?1:0),following:simulation?45+seed%430:0};}
export const accountBios={
 Tümü:'Merak ettiğimiz şeyleri burada biriktiriyoruz.',
 Bilim:'Bir sorunun peşinden gidiyoruz. Bazen bir atomun, bazen masadaki en sıradan eşyanın.',
 Uzay:'Başını kaldır. Gökyüzünde konuşacak çok şey var.',
 Sanat:'Atölyeden, perdeden, sahneden. Bir eserin nasıl ortaya çıktığını merak ediyoruz.',
 Tarih:'Eski bir fotoğraf, bir kazı, bir tanıklık. Geçmişin izlerini birlikte okuyalım.',
 Coğrafya:'Haritanın ötesine geçelim. Şehirlere, köylere ve orada yaşayanlara uğrayalım.',
 Doğa:'Dışarıda sandığımızdan çok daha fazla hikâye var.',
 Teknoloji:'Kapağını açıp içine bakasımız geliyor. Eşyalar ve fikirler nasıl çalışıyor?',
 Felsefe:'Biraz durup düşünmek için. Sorulara ve farklı bakışlara yer var.',
 İnanç:'Metinler, gelenekler, ibadet mekânları. Kaynağı ve anlatıcının bakışını birlikte gözeterek.',
 Spor:'Sahanın içi de dışı da ilgimizi çekiyor. Oyun, hareket ve spor kültürü.',
 Edebiyat:'Kitap aralarından, yazarların sesinden. Birkaç sayfa daha.',
 Gündelik:'Her gün gördüğümüz şeylerin fark etmediğimiz tarafı.',
 Finans:'Paranın ve ekonominin gündelik hayattaki karşılığı.',
 Sağlık:'İnsan bedenine yakından bakıyoruz. Kaynaklı açıklamalar, temel kavramlar.',
 Soru:'Tahmin et, düşün, sonra birlikte bakalım.'
};

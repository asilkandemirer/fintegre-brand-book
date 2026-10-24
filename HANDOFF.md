# Devir notu · Fintegre brand book

Bu dosya, işe başka bir makinede ya da yeni bir Claude Code oturumunda devam etmek için. Dalın adı `claude/brand-book-v2`.

## Genel akış

1. **Brand book (tek dosya HTML).** Sabit sahnede, kaydırmanın zamanı oynattığı bir film. Üç.js ile logo ve cihazlar, TR/EN katmanı (`src/i18n.js`), Playwright ile QA. Yapı için README'ye bak.
2. **Figma inceleme panosu.** 92 kare, her birinde Not ve Referans alanı. Dosya `js7Dvrbg9srLbWgWIW5yE6`, düğüm `2255:30940`. Kare kodları F01–F94.
3. **Marka objeleri filmi** (defter, kalem, kupa, sticker). Higgsfield çıktısı, `assets/film/objects-film.mp4`. Sayfaya gömülü, kaydırmayla ileri geri oynar. İki sticker'ın amblemi hatalı (eğim 65°'den dik); düzeltilmedi.
4. **Kampanya filmi.** Kling 4.0 parçalarının kurgusu, `assets/film/kampanya-filmi.mp4`. Şimdiki hali 38 sn: önce cihaz zinciri (`eskiyi-yenile.mp4`, 18 sn, eski telefondan kulaklığa), ardından billboard, otobüs, reklam silindiri, bina, kapanış billboard'u (`kampanya-parca.mp4`, 20 sn). İkisi 0,25 sn'lik geçişle birleşiyor (kulaklık karesi ortak).
5. **Blockout videoları** (`video/`): Genjutsu ve Kling'e kaynak olarak verilen kaba kutu/çizgi/nokta videoları. `video/blockout.js` (30 sn şehir ve ürünler), `video/devices.js` (18 sn, her dönüşümde 360° dönen cihaz zinciri). Çizim ve kodlama için README'deki komutlar.

## Son durum

- Kod, kampanya sahnesini 38 sn'lik birleşik filmle gösterecek şekilde güncellendi: sahne süresi 30,4, yeni altyazılar (Eskiden yeniye, Bilgisayarlar, Saat ve kulaklık), TR çevirileri.
- Masaüstünde ekran görüntüleriyle doğrulandı. **Tam QA (`node q3.mjs <desktop|mobile|small|laptop> check`) bu son değişiklik için çalıştırılmadı.**
- **Yayın (artifact) güncel değil:** yayındaki sürüm (Version 5) eski, 20 sn'lik kampanya filmini gösteriyor. Link: https://claude.ai/artifact/KEWZw4KJvBZ6m4NhCDNjWb
- Derleme iki çıktı veriyor: `dist/fintegre-brand-book.html` (artifact sayfası; kampanya filmi sayfanın yanında `media/kampanya.mp4` ve `.webm` olarak yayınlanır, 16 MB sınırı yüzünden) ve `dist/fintegre-brand-book-tek-dosya.html` (her şey gömülü, ~30 MB, git'e girmez). Yeniden üretmek için `npm install && sh scripts/web-film.sh && node build.mjs`.

## Yapılacaklar

1. `q3.mjs` ile dört ekran boyutunda QA çalıştır (masaüstü, mobil, küçük, laptop). Hedef: 0 sorun, 0 hata.
2. Artifact'i aynı linke yayınla: `dist/fintegre-brand-book.html` dosyası ve `files` olarak `media/kampanya.mp4` ile `media/kampanya.webm` (`assets/web/kampanya.*`).
3. Yayında filmin oynadığını doğrula (sayfa filmi `media/` klasöründen çeker; yerelde denenemedi). Oynamıyorsa kampanya filmini gömme yoluna dön ve boyutu düşür.
4. **Otobüsteki Apple logosu:** kampanya filminde (otobüs yan paneli ve kırmızı telefonun sırtı) Apple logosu görünüyor; Apple'ın marka kurallarına takılır. Kling'de "no Apple logo" ile yeniden üretilmeli.
5. **Hatalı iki sticker** (objeler filmi): yeniden üret ya da filmi kupada bitir.
6. Figma panosunu güncelle: yeni film kareleri, kampanya filminin kareleri ve cihaz zinciri.
7. Fatih'in açabilmesi için artifact'in Share menüsünden paylaşım ver (yalnızca sahibi yapabilir).
8. Billboard'daki yazı bir yerde "mcre" diye bozuluyor (~10. sn); isteğe bağlı düzeltme.
9. iOS Safari'de film oynatma denenmedi; gerçek bir iPhone'da bak.

## Devam için prompt (yeni oturuma yapıştır)

```
Fintegre brand book'unda kaldığımız yerden devam ediyoruz. Önce HANDOFF.md ve README.md'yi oku. Dal: claude/brand-book-v2.
Durum: kampanya sahnesi 38 sn'lik birleşik filmle güncellendi (src/template.html, src/main.js, src/i18n.js, assets/film, assets/web/kampanya.*), ama tam QA çalışmadı ve artifact (https://claude.ai/artifact/KEWZw4KJvBZ6m4NhCDNjWb) hâlâ eski sürümde.
Sırayla yap: 1) npm install, sh scripts/web-film.sh, node build.mjs; 2) Playwright ile dört ekranda QA (q3.mjs mantığı: masaüstü 1440×900, laptop 1280×720, mobil 390×844, küçük 375×667) ve sorun varsa düzelt; 3) artifact'i aynı URL'ye yayınla, dist/fintegre-brand-book.html + media/kampanya.mp4 ve media/kampanya.webm; 4) HANDOFF.md'deki diğer maddelere geç.
Kurallar: Türkçe yaz; tasarım ve teknoloji terimleri İngilizce kalabilir; iddiaları kaynağıyla destekle. Ücretli üretim araçlarında (Higgsfield, Krea, Adobe) toplam harcama 82 doları geçmesin ve harcamadan önce bana maliyeti göster.
```

# Proje Yönetimi Yazılımı

Bu proje artık React + Vite tabanlı bir arayüz ile Node.js/Express + MySQL tabanlı gerçek bir backend içerir.

## Teknolojiler

- Frontend: React 19, TypeScript, Vite
- Backend: Express, TypeScript
- Veritabanı: MySQL 8+

## Ortam Değişkenleri

`.env` dosyası hazırlandı. Varsayılan backend ayarları:

- `PORT=4000`
- `MYSQL_HOST=127.0.0.1`
- `MYSQL_PORT=3306`
- `MYSQL_USER=root`
- `MYSQL_DATABASE=proje_yonetimi_app`

## Kurulum

1. MySQL servisinizin çalıştığından emin olun.
2. Bağımlılıkları kurun:
   `npm install`
3. Backend'i başlatın:
   `npm run server`
4. Ayrı bir terminalde frontend'i başlatın:
   `npm run dev`

Frontend varsayılan olarak `http://localhost:3000`, backend ise `http://localhost:4000` üzerinde çalışır.

## Hazır Özellikler

- MySQL üzerinde otomatik veritabanı ve tablo oluşturma
- İlk açılışta örnek veri seed işlemi
- Dashboard için gerçek istatistik ve liste verileri
- Proje oluşturma
- Görev oluşturma
- Takvim, ekip ve bildirim verilerinin API üzerinden yüklenmesi
- Bildirimleri toplu okundu işaretleme

## Doğrulama

- Frontend tip kontrolü: `npm run lint`
- Backend tip kontrolü: `npm run lint:server`
- Production build: `npm run build`

# Proje Yönetimi Uygulaması

React + Vite arayüzü ve **Node.js/Express + MySQL** backend’i ile çalışan proje yönetimi uygulaması.

**Önemli:** Uygulama **MySQL veritabanı olmadan çalışmaz**. Tüm oturum, proje, görev ve ayar verileri veritabanında tutulur.

## Gereksinimler

- **Node.js** 20+ (önerilir)
- **MySQL 8.0+** (yerelde çalışan bir sunucu)
- **npm** veya uyumlu paket yöneticisi

## 1. MySQL’i hazırlayın

1. MySQL servisinin çalıştığından emin olun.
2. Uygulama ilk çalıştırmada `MYSQL_DATABASE` adıyla veritabanını **otomatik oluşturur**; kullanıcının bu işlem için yetkisi olmalı (genelde `root` veya `CREATE` yetkili kullanıcı).

## 2. Ortam değişkenleri (`.env`)

Proje kökünde `.env` dosyası oluşturun. Şablon için `.env.example` dosyasına bakın.

| Değişken | Açıklama | Örnek |
|----------|----------|--------|
| `PORT` | Backend HTTP portu | `4000` |
| `MYSQL_HOST` | MySQL sunucu adresi | `127.0.0.1` |
| `MYSQL_PORT` | MySQL portu | `3306` |
| `MYSQL_USER` | MySQL kullanıcı adı | `root` |
| `MYSQL_PASSWORD` | MySQL şifresi (**zorunlu**) | Kendi şifreniz |
| `MYSQL_DATABASE` | Veritabanı adı | `proje_yonetimi_app` |
| `VITE_API_PROXY_TARGET` | Vite’nin `/api` isteklerini yönlendireceği backend | `http://localhost:4000` |

**Not:** Backend başlarken `PORT` doluysa bir sonraki port denenebilir. Konsolda farklı bir port yazıyorsa `.env` içindeki `PORT` ve `VITE_API_PROXY_TARGET` değerlerini o porta göre güncelleyin.

## 3. Kurulum ve çalıştırma

```bash
npm install
```

Ardından **iki terminal** kullanın:

**Terminal 1 — Backend (veritabanı + API)**

```bash
npm run server
```

İlk çalıştırmada:

- Veritabanı yoksa oluşturulur
- Tablolar oluşturulur / güncellenir
- Gerekirse örnek veri (seed) eklenir

MySQL bağlantısı veya şifre hatalıysa süreç burada durur; `.env` içindeki `MYSQL_*` değerlerini kontrol edin.

**Terminal 2 — Frontend**

```bash
npm run dev
```

- Arayüz: **http://localhost:3000**
- API istekleri Vite proxy ile backend’e gider (`/api` → `VITE_API_PROXY_TARGET`)

Geliştirme sırasında backend’i dosya değişiminde yeniden başlatmak için:

```bash
npm run server:dev
```

## 4. Mevcut bir veritabanı yedeğinden başlamak (isteğe bağlı)

Projede veya `db_backup/` (veya `backups/`) altında `.sql` yedeğiniz varsa, önce boş bir veritabanı oluşturup yedeği içe aktarabilirsiniz:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p -e "CREATE DATABASE IF NOT EXISTS proje_yonetimi_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h 127.0.0.1 -P 3306 -u root -p proje_yonetimi_app < db_backup/proje_yonetimi_app_backup.sql
```

`.env` içindeki `MYSQL_DATABASE` adı, içe aktardığınız veritabanı adıyla aynı olmalı. Sonra `npm run server` ile backend’i başlatın (şema zaten yedekte olduğu için init çoğunlukla mevcut tablolarla uyumludur).

## 5. Doğrulama ve üretim

| Komut | Açıklama |
|--------|-----------|
| `npm run lint` | Frontend TypeScript kontrolü |
| `npm run lint:server` | Backend TypeScript kontrolü |
| `npm run build` | Production frontend derlemesi (`dist/`) |

## Teknolojiler

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Express, TypeScript, mysql2
- **Veritabanı:** MySQL 8+

## Özet akış

1. MySQL çalışıyor → `.env` içinde `MYSQL_PASSWORD` ve diğer `MYSQL_*` doğru
2. `npm install` → `npm run server` (DB hazır)
3. `npm run dev` → tarayıcıda http://localhost:3000

# Kongre Bildiri Yönetim Sistemi

Sağlık alanında farklı temalarla düzenlenen kongreler için bildiri/makale
gönderme ve hakem değerlendirme sistemi.

## Teknolojiler

- **Backend:** Node.js + Express
- **Veritabanı:** PostgreSQL
- **Kimlik doğrulama:** JWT (JSON Web Token)
- **Dosya yükleme:** Multer
- **Frontend:** React (bir sonraki adımda ekleyeceğiz)

## Sistem Mantığı

1. Kullanıcı kayıt olur (rol: `author` = yazar, `reviewer` = hakem, `admin`)
2. Admin, kongreleri ve altındaki temaları oluşturur
3. Yazar, bir temaya bildiri/makale yükler (PDF/Word) — istediği kadar
   bildiri, istediği kadar farklı temaya gönderebilir
4. Bildiri yüklenince sistem otomatik olarak 10 hakem atar
5. Her hakem bildiriye "onay" veya "red" oyu verir
6. 10 hakemin tamamı oy verdiğinde, çoğunluk kuralına göre
   (6/10 ve üzeri onay = kabul) bildirinin nihai durumu belirlenir

> **Not:** Çoğunluk kuralı (6/10) varsayılan olarak ayarlandı — mentorunla
> konuşup gerçek kuralı öğrendikten sonra `review.controller.js` içindeki
> `finalizeDecisionIfComplete` fonksiyonunu güncelleyebilirsin.

## Kurulum

### 1. PostgreSQL kurulumu ve veritabanı oluşturma

```bash
# PostgreSQL kurulu değilse kur, sonra:
createdb kongre_yonetim
psql kongre_yonetim < backend/schema.sql
```

### 2. Backend kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını kendi veritabanı bilgilerinle düzenle
npm run dev
```

Sunucu `http://localhost:5000` adresinde çalışacak.

### 3. Test etmek için (Postman veya curl ile)

**Kayıt ol:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Ahmet Yılmaz","email":"ahmet@example.com","password":"123456"}'
```

**Giriş yap:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmet@example.com","password":"123456"}'
```
Dönen `token`'ı kopyala, sonraki isteklerde `Authorization: Bearer <token>`
header'ında kullan.

## Proje Yapısı

```
backend/
  schema.sql              -> veritabanı tabloları
  src/
    index.js              -> uygulamanın giriş noktası
    config/db.js           -> PostgreSQL bağlantısı
    middleware/
      auth.middleware.js   -> JWT doğrulama + rol kontrolü
    routes/                -> API uç noktaları (endpoints)
    controllers/           -> asıl iş mantığı (business logic)
    uploads/               -> yüklenen bildiri dosyaları
```

## Sıradaki Adımlar

- [ ] React ile frontend (kayıt, giriş, bildiri yükleme, hakem paneli ekranları)
- [ ] Admin panelinden hakem atamayı manuel de yapabilme seçeneği
- [ ] E-posta bildirimleri (bildiri kabul/red olunca yazara mail)
- [ ] Bildiri durumunu takip etme sayfası (yazar kendi bildirisinin kaçtane
      onay/red aldığını görebilsin)

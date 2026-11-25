# Mavr Kids — PMT landing page (mavrkids.uz)

Prezident va Al-Xorazmiy maktablariga tayyorlov kursi uchun bir sahifali,
mobile-first landing. Build kerak emas — sof HTML, CSS va vanilla JS, hech
qanday npm paketi ishlatilmaydi.

## Ishga tushirish

```bash
cp .env.example .env
node server.js
```

Brauzer: [http://localhost:4600](http://localhost:4600)

## Tuzilma

```
mavrkids/
├── index.html               # butun landing (9 ta blok)
├── 404.html
├── server.js                # statik server + ariza qabul qilish (paketlarsiz)
├── google-apps-script.js    # Google Sheets zaxirasi uchun Apps Script kodi
├── assets/
│   ├── css/styles.css       # dizayn tizimi (CSS o'zgaruvchilari)
│   ├── js/config.js         # ⚙️ TAHRIRLANADI: telefon, manzil, xarita, tracking ID
│   └── js/app.js            # maska, validatsiya, forma, modal, UTM, tracking
└── arizalar/                # zaxira nusxalar (git'ga tushmaydi)
```

## ⚠️ To'ldirilishi kerak — `assets/js/config.js`

| Maydon | Nima yoziladi | Holat |
|---|---|---|
| `phone`, `phoneHref` | +998 90 772 32 32 | ✅ kiritilgan |
| `telegram` | @mavr_admin havolasi | ✅ kiritilgan |
| `workHours` | Dushanba – Shanba, 08:00 – 18:00 | ✅ kiritilgan |
| `address` | Markazning haqiqiy manzili | ⛔ to'ldiring |
| `mapEmbed` | Yandex/Google xarita iframe havolasi | ⛔ to'ldiring |
| `metaPixelId` | Meta Pixel ID | ⛔ to'ldiring |
| `ga4Id` | GA4 o'lchov ID (`G-...`) | ⛔ to'ldiring |
| `yandexMetrikaId` | Yandex Metrika raqami | ⛔ to'ldiring |

> Tracking ID bo'sh bo'lsa — skript **umuman yuklanmaydi** (sayt tezligiga
> ta'sir qilmaydi). ID qo'yilgach, muvaffaqiyatli arizada avtomatik ravishda
> Meta `Lead`, GA4 `generate_lead` va Metrika `lead` hodisalari yuboriladi.

## Ariza qayerga tushadi

Bitta ariza **uch joyga** parallel yuboriladi (`server.js` → `POST /api/ariza`):

**1. Telegram guruh** — TZ dagi format bo'yicha:

```
🔔 Yangi PMT Ariza!
👤 Ism: Dilnoza
📞 Tel: +998901112233
🎓 Sinf: 3-sinf
🌐 Sahifa: mavrkids.uz/
⏱ Vaqt: 07.09.2026 | 01:35
🏷 UTM: instagram / pmt_sentabr
```

**2. CRM** — `POST /api/leads` orqali **"PMT voronkasi" → "Yangi lidlar"**
ustuniga. Sinf, forma nomi va UTM lidga izoh bo'lib qo'shiladi, UTM esa
alohida maydonlarga ham yoziladi.

**3. Google Sheets** — Apps Script webhooki orqali zaxira jadval
(`google-apps-script.js` faylida o'rnatish yo'riqnomasi bor).

Uchalasidan biri ishlamay qolsa ham ariza `arizalar/` papkasiga JSON bo'lib
saqlanadi va foydalanuvchi baribir "qabul qilindi" javobini oladi — **hech bir
ariza yo'qolmaydi**.

`.env` sozlamalari:

```
TG_BOT_TOKEN=...            # @BotFather dan
TG_CHAT_ID=-1001234567890   # guruh ID si (bot guruhda admin bo'lishi shart)
CRM_URL=https://crm.mavr.uz
CRM_WEBHOOK_SECRET=...      # CRM .env dagi LEADS_WEBHOOK_SECRET bilan bir xil
SHEETS_WEBHOOK_URL=...      # Apps Script "Web app URL"
```

## Forma UX (TZ 4.1)

- Telefon maskasi: `+998 (__) ___ - __ - __` — foydalanuvchi qanday yozsa ham
  shu ko'rinishga keltiriladi.
- Ism kamida 2 ta harf bo'lishi shart, aks holda maydon qizarib xato chiqadi.
- Yuborilayotganda tugmada spinner aylanadi, tugma bloklanadi va **dubl bosish
  ishlamaydi**.
- Muvaffaqiyatda modal oyna: "Rahmat! Arizangiz qabul qilindi — 15 daqiqada
  siz bilan bog'lanamiz".
- UTM teglar sessiyada saqlanadi (sahifa yangilansa ham yo'qolmaydi) va
  yashirin maydonlar orqali arizaga qo'shiladi.

## Dizayn tizimi

`assets/css/styles.css` boshidagi `:root`:

```css
--navy: #1E2568;     /* matn va jiddiy sarlavhalar */
--cobalt: #2563EB;   /* asosiy CTA tugmalar */
--gold: #F59E0B;     /* urg'u, natijalar, medallar */
--magenta: #E11D48;  /* bolalar quvvati (badjlar) */
--violet: #7C3AED;   /* qo'shimcha urg'u */
--slate: #F8FAFC;    /* bloklarni ajratuvchi fon */
```

Shrift — Plus Jakarta Sans. Kartochkalar 16–20px yumaloqlangan, nozik soyalar.

## Tezlik (TZ 6)

- Framework yo'q: 1 ta CSS (~14 KB) va 1 ta JS (~9 KB) fayl.
- Rasmlar **WebP** (`<picture>` orqali PNG zaxirasi bilan) va `loading="lazy"`.
- Shrift `preconnect` + `display=swap` bilan, render'ni bloklamaydi.
- Semantik HTML5: bitta `h1`, `header`/`nav`/`section`/`footer`.
- Statik fayllarga uzoq kesh (`max-age=604800`), HTML/CSS/JS ga `no-cache`.

## Deploy

**A) Node bilan (tavsiya)** — `node server.js`, oldiga Nginx yoki Cloudflare
tunnel. Formalar, Telegram, CRM va Sheets tayyor holda ishlaydi.

```nginx
server {
    server_name mavrkids.uz;
    location / { proxy_pass http://127.0.0.1:4600; }
}
```

**B) Statik hosting** — HTML/CSS/JS shundoq ishlaydi, lekin `server.js`
ishlamaydi: `config.js` dagi `leadEndpoint` ni ishlaydigan boshqa endpointga
o'zgartirish kerak.

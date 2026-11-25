/* ============================================================================
   Mavr Kids — sayt sozlamalari.  ⚠️ FAQAT SHU FAYL TAHRIRLANADI.
   ========================================================================= */
window.MAVR_CONFIG = {
    // ── Aloqa ────────────────────────────────────────────────────────────────
    phone: '+998 90 772 32 32',
    phoneHref: '+998907723232',
    telegram: 'https://t.me/mavr_admin',
    workHours: 'Dushanba – Shanba, 08:00 – 18:00',

    // TODO: markazning haqiqiy manzili
    address: "Toshkent sh., (ko'cha nomi), (uy raqami)",
    // Yandex/Google Maps → "Ulashish → Kodni ko'chirish" dagi iframe src havolasi.
    // Bo'sh bo'lsa — o'rniga placeholder ko'rinadi.
    mapEmbed: '',

    // ── Arizalar qayerga ketadi ─────────────────────────────────────────────
    // Sayt serveri (server.js) qabul qiladi va uchta joyga tarqatadi:
    // Telegram guruh + CRM "PMT voronkasi" + Google Sheets zaxirasi.
    leadEndpoint: '/api/ariza',

    // ── Tracking (bo'sh qoldirilsa — skript umuman yuklanmaydi) ─────────────
    metaPixelId: '',        // masalan '1234567890'
    ga4Id: '',              // masalan 'G-XXXXXXX'
    yandexMetrikaId: '',    // masalan '98765432'
};

/* ============================================================================
   Mavr Kids — statik server + ariza qabul qilish.
   Qo'shimcha npm paketi YO'Q (faqat Node 20+ standart kutubxonasi).

   Ishga tushirish:  node server.js   ->  http://localhost:4600

   POST /api/ariza  bir arizani UCH joyga yuboradi:
     1) Telegram guruh   — TZ dagi format bo'yicha, darhol
     2) CRM              — "PMT voronkasi" -> "Yangi lidlar" ustuni
     3) Google Sheets    — Apps Script webhooki orqali zaxira nusxa
   Ularning birortasi ishlamay qolsa ham ariza `arizalar/` papkasiga yoziladi
   va foydalanuvchiga baribir "qabul qilindi" javobi qaytadi.
   ========================================================================= */

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

// ── .env ────────────────────────────────────────────────────────────────────
(function loadEnv() {
    const file = path.join(__dirname, '.env');
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
        if (!m) continue;
        if (!(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
})();

const PORT = Number(process.env.PORT) || 4600;
const ROOT = __dirname;
const SITE = process.env.SITE_NAME || 'mavrkids.uz';

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID = process.env.TG_CHAT_ID || '';
const CRM_URL = (process.env.CRM_URL || '').replace(/\/+$/, '');
const CRM_WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || '';
const SHEETS_WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL || '';

const INBOX_DIR = path.join(ROOT, 'arizalar');
const MAX_BODY = 64 * 1024;

const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};

// ── Yordamchilar ────────────────────────────────────────────────────────────

function sendJson(res, code, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
    });
    res.end(body);
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', c => {
            size += c.length;
            if (size > MAX_BODY) { reject(new Error('So\'rov hajmi juda katta')); req.destroy(); return; }
            chunks.push(c);
        });
        req.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
            catch { reject(new Error('JSON formati noto\'g\'ri')); }
        });
        req.on('error', reject);
    });
}

function clean(value, max = 200) {
    return String(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

// 901234567 / +998901234567 / 998901234567  ->  +998901234567
function normalizePhone(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.startsWith('998')) d = d.slice(3);
    d = d.slice(0, 9);
    return d.length === 9 ? '+998' + d : '';
}

function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

async function saveToInbox(data) {
    await fsp.mkdir(INBOX_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(INBOX_DIR, `${stamp}-ariza.json`);
    await fsp.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
    return file;
}

// ── 1) Telegram guruhga xabar (TZ dagi format) ──────────────────────────────
async function sendTelegram(lead) {
    if (!TG_BOT_TOKEN || !TG_CHAT_ID) return { ok: false, reason: 'sozlanmagan' };

    const utmLine = [lead.utm.utm_source, lead.utm.utm_campaign].filter(Boolean).join(' / ') || '—';
    const text = [
        '🔔 <b>Yangi PMT Ariza!</b>',
        `👤 Ism: ${escapeHtml(lead.name)}`,
        `📞 Tel: ${escapeHtml(lead.phone)}`,
        `🎓 Sinf: ${escapeHtml(lead.sinf || '—')}`,
        `🌐 Sahifa: ${escapeHtml(lead.page || SITE)}`,
        `⏱ Vaqt: ${lead.vaqt}`,
        `🏷 UTM: ${escapeHtml(utmLine)}`,
    ].join('\n');

    const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TG_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error('Telegram: ' + res.status);
    return { ok: true };
}

// ── 2) CRM — "PMT voronkasi" ────────────────────────────────────────────────
// CRM'da PMT yo'nalishi `language: 'pmt'` kaliti bilan saqlanadi
// (Sotuv bo'limidagi "🎓 PMT" tabi), status esa "Yangi lidlar".
async function sendCrm(lead) {
    if (!CRM_URL || !CRM_WEBHOOK_SECRET) return { ok: false, reason: 'sozlanmagan' };

    const utmText = Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(' ');
    const note = [
        'PMT ariza (mavrkids.uz)',
        lead.sinf ? 'Sinf: ' + lead.sinf : '',
        lead.formName ? 'Forma: ' + lead.formName : '',
        utmText ? 'UTM: ' + utmText : '',
    ].filter(Boolean).join(' | ');

    const res = await fetch(CRM_URL + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': CRM_WEBHOOK_SECRET },
        body: JSON.stringify({
            name: lead.name,
            phone: lead.phone,
            language: 'pmt',              // = CRM'dagi "🎓 PMT" yo'nalishi
            source: 'organik',
            status: 'yangi-lidlar',
            note,
            utmSource: lead.utm.utm_source,
            utmCampaign: lead.utm.utm_campaign,
            utmContent: lead.utm.utm_content,
            fbclid: lead.utm.fbclid,
            externalId: 'mavrkids_' + Date.now().toString(36),
        }),
        signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'CRM: ' + res.status);
    return { ok: true, id: data.id };
}

// ── 3) Google Sheets zaxirasi (Apps Script webhooki) ────────────────────────
async function sendSheets(lead) {
    if (!SHEETS_WEBHOOK_URL) return { ok: false, reason: 'sozlanmagan' };
    const res = await fetch(SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(12000),
        redirect: 'follow',
    });
    if (!res.ok) throw new Error('Sheets: ' + res.status);
    return { ok: true };
}

// ── Ariza ───────────────────────────────────────────────────────────────────

async function handleAriza(req, res) {
    let body;
    try {
        body = await readJson(req);
    } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
    }

    const name = clean(body.name, 80);
    const phone = normalizePhone(body.phone);
    if (name.replace(/[^\p{L}]/gu, '').length < 2) {
        return sendJson(res, 400, { ok: false, error: 'Ismni to\'liq kiriting' });
    }
    if (!phone) return sendJson(res, 400, { ok: false, error: 'Telefon raqami noto\'g\'ri' });

    const utm = {};
    for (const [k, v] of Object.entries(body.utm || {})) {
        if (/^(utm_[a-z]+|fbclid|gclid)$/.test(k) && v) utm[k] = clean(v, 120);
    }

    const lead = {
        name,
        phone,
        sinf: clean(body.sinf, 20),
        formName: clean(body.formName, 60),
        page: clean(body.page, 80) || SITE,
        utm,
        vaqt: new Date().toLocaleString('uz-UZ', {
            timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }).replace(',', ' |'),
    };

    // Zaxira nusxa — har doim, birinchi navbatda
    const savedFile = await saveToInbox(lead).catch(() => null);

    // Uchala kanal parallel: biri yiqilsa boshqalari baribir ishlaydi
    const [tg, crm, sheets] = await Promise.allSettled([
        sendTelegram(lead), sendCrm(lead), sendSheets(lead),
    ]);

    const holat = r => r.status === 'fulfilled'
        ? (r.value.ok ? 'ok' : r.value.reason)
        : 'XATO: ' + r.reason.message;

    console.log(`[ariza] ${lead.name} ${lead.phone} ${lead.sinf} · telegram=${holat(tg)} · crm=${holat(crm)} · sheets=${holat(sheets)}`);
    if (savedFile) console.log('        zaxira: ' + path.basename(savedFile));

    // Foydalanuvchi uchun ariza har doim qabul qilingan hisoblanadi
    return sendJson(res, 200, { ok: true });
}

// ── Statik fayllar ──────────────────────────────────────────────────────────

function serveStatic(req, res, urlPath) {
    let rel = decodeURIComponent(urlPath);
    if (rel === '/' || rel.endsWith('/')) rel += 'index.html';

    let file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('Ruxsat yo\'q'); return; }
    if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';

    const relOut = path.relative(ROOT, file);
    if (/(^|[\\/])(server\.js|\.env|arizalar|README\.md|package\.json|google-apps-script\.js)([\\/]|$)/i.test(relOut)) {
        res.writeHead(404).end('Topilmadi');
        return;
    }

    fs.readFile(file, (err, buf) => {
        if (err) {
            fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(e2 ? '<h1>404</h1>' : page);
            });
            return;
        }
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            // HTML/CSS/JS — har safar tekshiriladi; rasm va shriftlar uzoq keshlanadi
            'Cache-Control': /\.(html|css|js)$/.test(ext) ? 'no-cache' : 'public, max-age=604800',
            'X-Content-Type-Options': 'nosniff',
        });
        res.end(buf);
    });
}

// ── Server ──────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/health') {
        return sendJson(res, 200, {
            status: 'ok', service: 'Mavr Kids landing',
            telegram: Boolean(TG_BOT_TOKEN && TG_CHAT_ID),
            crm: Boolean(CRM_URL && CRM_WEBHOOK_SECRET),
            sheets: Boolean(SHEETS_WEBHOOK_URL),
        });
    }
    if (url.pathname === '/api/ariza' && req.method === 'POST') return handleAriza(req, res);
    if (url.pathname.startsWith('/api/')) return sendJson(res, 404, { ok: false, error: 'Topilmadi' });

    return serveStatic(req, res, url.pathname);
});

if (!TG_BOT_TOKEN || !TG_CHAT_ID) console.warn('[mavrkids] OGOHLANTIRISH: TG_BOT_TOKEN/TG_CHAT_ID yo\'q — Telegramga yuborilmaydi.');
if (!CRM_URL || !CRM_WEBHOOK_SECRET) console.warn('[mavrkids] OGOHLANTIRISH: CRM_URL/CRM_WEBHOOK_SECRET yo\'q — CRM\'ga tushmaydi.');
if (!SHEETS_WEBHOOK_URL) console.warn('[mavrkids] Eslatma: SHEETS_WEBHOOK_URL yo\'q — Google Sheets zaxirasi o\'chirilgan.');

server.listen(PORT, () => console.log(`Mavr Kids: http://localhost:${PORT}`));

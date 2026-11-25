/* ============================================================================
   Mavr Kids — landing mantiqi (kutubxonasiz)
   • aloqa ma'lumotlari, mobil menyu, xarita
   • UTM teglarni ushlab qolish
   • telefon maskasi +998 (__) ___ - __ - __ va validatsiya
   • forma yuborish: spinner, dubl bosishdan himoya, muvaffaqiyat oynasi
   • Meta Pixel / GA4 / Yandex Metrika (ID berilgan bo'lsa) va "Lead" hodisasi
   ========================================================================= */
(function () {
    'use strict';

    const CFG = window.MAVR_CONFIG || {};

    // ── 1. Aloqa ma'lumotlari ────────────────────────────────────────────────
    document.querySelectorAll('[data-mavr]').forEach(el => {
        const key = el.dataset.mavr;
        if (key === 'phone') {
            el.textContent = CFG.phone || el.textContent;
            if (el.tagName === 'A') el.href = 'tel:' + (CFG.phoneHref || '');
        } else if (key === 'phone-icon') {
            if (el.tagName === 'A') el.href = 'tel:' + (CFG.phoneHref || '');
        } else if (key === 'telegram') {
            if (el.tagName === 'A') el.href = CFG.telegram || '#';
        } else if (CFG[key]) {
            el.textContent = CFG[key];
        }
    });

    const mapBox = document.getElementById('mapBox');
    if (mapBox && CFG.mapEmbed) {
        const frame = document.createElement('iframe');
        frame.src = CFG.mapEmbed;
        frame.loading = 'lazy';
        frame.title = 'Mavr Kids markazi joylashuvi';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        mapBox.innerHTML = '';
        mapBox.appendChild(frame);
    }

    // ── 2. Mobil menyu ───────────────────────────────────────────────────────
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            const open = nav.classList.toggle('is-open');
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                nav.classList.remove('is-open');
                burger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ── 3. Tracking kodlari (faqat ID berilgan bo'lsa yuklanadi) ────────────
    function loadScript(src, attrs) {
        const s = document.createElement('script');
        s.async = true;
        s.src = src;
        Object.entries(attrs || {}).forEach(([k, v]) => s.setAttribute(k, v));
        document.head.appendChild(s);
        return s;
    }

    // Meta Pixel
    if (CFG.metaPixelId) {
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
            t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', CFG.metaPixelId);
        window.fbq('track', 'PageView');
    }

    // Google Analytics 4
    if (CFG.ga4Id) {
        loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ga4Id));
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', CFG.ga4Id);
    }

    // Yandex Metrika
    if (CFG.yandexMetrikaId) {
        /* eslint-disable */
        (function (m, e, t, r, i, k, a) {
            m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) }; m[i].l = 1 * new Date();
            k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
        })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
        /* eslint-enable */
        window.ym(CFG.yandexMetrikaId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }

    // ── 4. UTM teglar ────────────────────────────────────────────────────────
    // Reklamadan kelgan tashrifchi keyin sahifani yangilasa ham teglar
    // yo'qolmasligi uchun sessiyada saqlanadi va arizaga qo'shib yuboriladi.
    const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    const utm = (function () {
        const params = new URLSearchParams(location.search);
        const saved = (() => { try { return JSON.parse(sessionStorage.getItem('mk_utm') || '{}'); } catch { return {}; } })();
        const data = { ...saved };
        UTM_KEYS.forEach(k => { const v = params.get(k); if (v) data[k] = v.slice(0, 120); });
        try { sessionStorage.setItem('mk_utm', JSON.stringify(data)); } catch { /* private rejim */ }
        return data;
    })();

    // Har bir formaga yashirin maydonlar sifatida qo'shamiz
    document.querySelectorAll('form[data-form="lead"]').forEach(form => {
        UTM_KEYS.forEach(k => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = utm[k] || '';
            form.appendChild(input);
        });
    });

    // ── 5. Telefon maskasi: +998 (__) ___ - __ - __ ─────────────────────────
    function maskPhone(value) {
        let digits = String(value || '').replace(/\D/g, '');
        if (digits.startsWith('998')) digits = digits.slice(3);
        digits = digits.slice(0, 9);
        let out = '+998';
        if (digits.length) out += ' (' + digits.slice(0, 2);
        if (digits.length >= 2) out += ')';
        if (digits.length > 2) out += ' ' + digits.slice(2, 5);
        if (digits.length > 5) out += ' - ' + digits.slice(5, 7);
        if (digits.length > 7) out += ' - ' + digits.slice(7, 9);
        return out;
    }

    function phoneDigits(value) {
        let d = String(value || '').replace(/\D/g, '');
        if (d.startsWith('998')) d = d.slice(3);
        return d.slice(0, 9);
    }

    document.querySelectorAll('input[type="tel"]').forEach(input => {
        const apply = () => { input.value = maskPhone(input.value); };
        input.addEventListener('focus', () => { if (!input.value) input.value = '+998 ('; });
        input.addEventListener('input', apply);
        input.addEventListener('blur', () => {
            if (phoneDigits(input.value).length === 0) input.value = '';
            else apply();
        });
        // Kursorni har doim oxiriga qo'yamiz — maska o'rtasiga yozib bo'lmaydi
        input.addEventListener('click', () => {
            const end = input.value.length;
            input.setSelectionRange(end, end);
        });
    });

    // ── 6. Validatsiya ───────────────────────────────────────────────────────
    function setError(form, field, show) {
        const input = form.querySelector('[name="' + field + '"]');
        const err = form.querySelector('[data-err="' + field + '"]');
        if (input) input.classList.toggle('is-invalid', show);
        if (err) err.classList.toggle('is-shown', show);
    }

    function validate(form) {
        const name = (form.querySelector('[name="name"]').value || '').trim();
        const digits = phoneDigits(form.querySelector('[name="phone"]').value);
        const nameOk = name.replace(/[^\p{L}]/gu, '').length >= 2;
        const phoneOk = digits.length === 9;
        setError(form, 'name', !nameOk);
        setError(form, 'phone', !phoneOk);
        if (!nameOk) form.querySelector('[name="name"]').focus();
        else if (!phoneOk) form.querySelector('[name="phone"]').focus();
        return nameOk && phoneOk;
    }

    // Yozishni boshlaganda xato belgisi olib tashlanadi
    document.querySelectorAll('form[data-form="lead"] .input').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            const err = input.closest('.field')?.querySelector('.field__err');
            if (err) err.classList.remove('is-shown');
        });
    });

    // ── 7. Muvaffaqiyat oynasi ───────────────────────────────────────────────
    const modal = document.getElementById('okModal');
    function openModal() {
        if (!modal) return;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        modal.querySelector('[data-modal-close]')?.focus();
    }
    function closeModal() {
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }
    modal?.addEventListener('click', e => {
        if (e.target === modal || e.target.hasAttribute('data-modal-close')) closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // ── 8. Formani yuborish ──────────────────────────────────────────────────
    async function submitForm(form) {
        if (form.dataset.busy === '1') return;          // dubl bosishdan himoya
        if (!validate(form)) return;

        const btn = form.querySelector('[type="submit"]');
        const label = btn?.querySelector('.btn__text');
        const oldLabel = label ? label.textContent : '';

        form.dataset.busy = '1';
        if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
        if (label) label.textContent = 'Yuborilmoqda...';

        const payload = {
            name: (form.querySelector('[name="name"]').value || '').trim(),
            phone: '+998' + phoneDigits(form.querySelector('[name="phone"]').value),
            sinf: form.querySelector('[name="sinf"]:checked')?.value || '',
            formName: form.dataset.formName || 'Sayt formasi',
            page: location.hostname + location.pathname,
            utm: {},
        };
        UTM_KEYS.forEach(k => {
            const v = form.querySelector('[name="' + k + '"]')?.value;
            if (v) payload.utm[k] = v;
        });

        try {
            const res = await fetch(CFG.leadEndpoint || '/api/ariza', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.error || 'Server javob bermadi');

            form.reset();
            document.querySelectorAll('input[type="tel"]').forEach(i => { i.value = ''; });
            openModal();

            // Konversiya hodisalari
            if (window.fbq) window.fbq('track', 'Lead', { content_name: payload.formName });
            if (window.gtag) window.gtag('event', 'generate_lead', { form_name: payload.formName, grade: payload.sinf });
            if (window.ym && CFG.yandexMetrikaId) window.ym(CFG.yandexMetrikaId, 'reachGoal', 'lead');
        } catch (err) {
            alert('Yuborishda xatolik: ' + err.message + '\n\nIltimos, ' + (CFG.phone || '') + ' raqamiga qo\'ng\'iroq qiling.');
        } finally {
            form.dataset.busy = '';
            if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
            if (label) label.textContent = oldLabel;
        }
    }

    document.querySelectorAll('form[data-form="lead"]').forEach(form => {
        form.addEventListener('submit', e => { e.preventDefault(); submitForm(form); });
    });
})();

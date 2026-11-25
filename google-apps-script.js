/**
 * Mavr Kids — arizalarni Google Sheets'ga zaxira yozish.
 *
 * O'RNATISH:
 *  1. Google Sheets'da yangi jadval oching, nomini "Mavr Kids arizalar" qo'ying.
 *  2. Kengaytmalar (Extensions) → Apps Script.
 *  3. Shu fayldagi kodni nusxalab, Code.gs ichiga qo'ying va saqlang.
 *  4. Deploy → New deployment → Type: Web app.
 *       Execute as:      Me
 *       Who has access:  Anyone
 *  5. Chiqqan "Web app URL" ni nusxalab, saytning .env fayliga qo'ying:
 *       SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/..../exec
 *
 * Birinchi ariza kelganda sarlavha qatori avtomatik yaratiladi.
 */

const SHEET_NAME = 'Arizalar';

const HEADERS = [
  'Vaqt', 'Ism', 'Telefon', 'Sinf', 'Forma', 'Sahifa',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = getSheet_();
    const utm = data.utm || {};

    sheet.appendRow([
      data.vaqt || new Date(),
      data.name || '',
      data.phone || '',
      data.sinf || '',
      data.formName || '',
      data.page || '',
      utm.utm_source || '',
      utm.utm_medium || '',
      utm.utm_campaign || '',
      utm.utm_content || '',
      utm.utm_term || '',
      utm.fbclid || '',
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'Mavr Kids — Sheets webhook' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Expert Clinic — Google Apps Script Web App
 * ---------------------------------------------------------
 * Приймає POST від форми на сайті expert-clinic та дописує
 * рядок у Google Sheet:
 * https://docs.google.com/spreadsheets/d/1kGuYMOE8h-fn1bqhUr2Kg0XpcwfZeVM3g9Q3N8R6Wsg
 *
 * === ПЕРШИЙ ЗАПУСК (одноразово, обовʼязково!) ============
 *   1) Замініть весь код у Code.gs на цей файл. Save (💾).
 *   2) У верхньому dropdown "Select function" виберіть runOnce.
 *   3) Натисніть ▶ Run. Google запитає дозволи:
 *      - See, edit, create, and delete your spreadsheets in Google Drive
 *      - Send email as you
 *      → Advanced → Go to "Expert Clinic form" (unsafe) → Allow.
 *   4) У логах (View → Logs / Ctrl+Enter) має зʼявитись
 *      "runOnce: OK — access granted".
 *   5) Тепер Deploy → Manage deployments → ✏️ Edit → New version → Deploy.
 *      URL Web App залишиться той самий.
 * ==========================================================
 *
 * Якщо запис не зʼявляється — перевірте вкладку "_errors" у таблиці:
 * туди пишеться причина будь-якої помилки в doPost.
 */

const SHEET_ID     = '1kGuYMOE8h-fn1bqhUr2Kg0XpcwfZeVM3g9Q3N8R6Wsg';
const SHEET_NAME   = 'ExpertClinic';   // куди пишемо заявки
const ERRORS_SHEET = '_errors';        // сюди пишемо помилки для дебагу
const NOTIFY_EMAIL = 'expertclinicdot@gmail.com';  // сповіщення про кожну нову заявку. '' щоб вимкнути.

/* ---------------- Web App entrypoints ---------------- */

function doPost(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const name    = String(params.name    || '').trim();
    const contact = String(params.contact || '').trim();
    const message = String(params.message || '').trim();

    appendSubmission(name, contact, message);

    if (NOTIFY_EMAIL) {
      try { sendMail(name, contact, message); }
      catch (mailErr) { logError('MailApp', mailErr); }
    }

    return json({ ok: true });
  } catch (err) {
    logError('doPost', err);
    return json({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  // Відкрийте у браузері: <URL>/exec?debug=1 — побачите останні 5 записів і помилок.
  if (e && e.parameter && e.parameter.debug) {
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const data = ss.getSheetByName(SHEET_NAME);
      const errs = ss.getSheetByName(ERRORS_SHEET);
      const dataLast = data ? data.getRange(Math.max(1, data.getLastRow() - 4), 1, Math.min(5, data.getLastRow()), 4).getValues() : [];
      const errsLast = errs ? errs.getRange(Math.max(1, errs.getLastRow() - 4), 1, Math.min(5, errs.getLastRow()), 3).getValues() : [];
      return json({
        ok: true,
        sheet_id: SHEET_ID,
        data_sheet: SHEET_NAME,
        data_last_rows: dataLast,
        errors_last_rows: errsLast,
      });
    } catch (err) {
      return json({ ok: false, where: 'doGet debug', error: String(err) });
    }
  }
  return json({ ok: true, service: 'Expert Clinic form endpoint' });
}

/* ---------------- Core ---------------- */

function appendSubmission(name, contact, message) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата', "Ім'я", 'Контакт', 'Що вас турбує?']);
    sheet.getRange(1, 1, 1, 4)
         .setFontWeight('bold')
         .setBackground('#293F84')
         .setFontColor('#ffffff');
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 240);
    sheet.setColumnWidth(4, 480);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([new Date(), name, contact, message]);
}

function sendMail(name, contact, message) {
  const now = new Date();
  const subject = 'Expert Clinic — нова заявка з сайту';
  const body =
    'Нова заявка з сайту Expert Clinic\n\n' +
    'Час:     ' + now.toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }) + '\n' +
    "Ім'я:    " + name + '\n' +
    'Контакт: ' + contact + '\n\n' +
    'Що турбує:\n' + message + '\n';
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, body });
}

function logError(where, err) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sh = ss.getSheetByName(ERRORS_SHEET);
    if (!sh) sh = ss.insertSheet(ERRORS_SHEET);
    if (sh.getLastRow() === 0) sh.appendRow(['Час', 'Де', 'Помилка']);
    sh.appendRow([new Date(), where, String(err && err.stack || err)]);
  } catch (_) { /* якщо навіть це не працює — далі логувати нема куди */ }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- One-time authorization helper ---------------- */

/**
 * Запустіть цю функцію одноразово з редактора Apps Script,
 * щоб Google запитав усі потрібні дозволи (Spreadsheets + Mail).
 * Після цього Web App почне працювати з сайту.
 */
function runOnce() {
  appendSubmission('runOnce-test', 'runOnce-test', 'Перевірка авторизації. Цей рядок можна видалити.');
  if (NOTIFY_EMAIL) {
    try { sendMail('runOnce-test', 'runOnce-test', 'Тестовий лист. Ігноруйте.'); }
    catch (e) { Logger.log('MailApp warning: ' + e); }
  }
  Logger.log('runOnce: OK — access granted. Тепер зробіть Deploy → Manage deployments → Edit → New version.');
}

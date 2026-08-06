/**
 * Expert Clinic — Google Apps Script Web App
 * ---------------------------------------------------------
 * Приймає POST від форми на сайті expert-clinic та дописує
 * рядок у Google Sheet:
 * https://docs.google.com/spreadsheets/d/1kGuYMOE8h-fn1bqhUr2Kg0XpcwfZeVM3g9Q3N8R6Wsg
 *
 * ЯК РОЗГОРНУТИ (робиться один раз):
 *
 *   1) Відкрити таблицю → меню Extensions → Apps Script.
 *   2) Замінити весь код у файлі Code.gs на цей.
 *   3) Зверху натиснути "Deploy" → "New deployment".
 *   4) Іконка ⚙️ → тип "Web app".
 *   5) Description: Expert Clinic form
 *      Execute as:      Me (ваш акаунт)
 *      Who has access:  Anyone
 *   6) Натиснути "Deploy". Дати дозволи (потрібен ваш акаунт).
 *   7) Скопіювати "Web app URL" (виглядає як
 *      https://script.google.com/macros/s/AKfycb…/exec)
 *      і вставити його в index.html у атрибут
 *      data-endpoint="…" на формі #contactForm.
 *
 * Якщо змінюєте код — робіть "Deploy" → "Manage deployments"
 * → редагуєте існуюче розгортання (олівець) → "New version".
 */

const SHEET_ID   = '1kGuYMOE8h-fn1bqhUr2Kg0XpcwfZeVM3g9Q3N8R6Wsg';
const SHEET_NAME = 'Заявки з сайту'; // назва вкладки в таблиці (створиться, якщо немає)
const NOTIFY_EMAIL = '';             // напр. 'expertclinicdot@gmail.com' — або залиште '' щоб не слати

function doPost(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const name    = String(params.name    || '').trim();
    const contact = String(params.contact || '').trim();
    const message = String(params.message || '').trim();

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Заголовки один раз
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

    const now = new Date();
    sheet.appendRow([now, name, contact, message]);

    // Опційно — надіслати листа
    if (NOTIFY_EMAIL) {
      const subject = 'Expert Clinic — нова заявка з сайту';
      const body =
        'Нова заявка з сайту Expert Clinic\n\n' +
        'Час:     ' + now.toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }) + '\n' +
        "Ім'я:    " + name + '\n' +
        'Контакт: ' + contact + '\n\n' +
        'Що турбує:\n' + message + '\n';
      MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, body });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  // Швидкий пінг у браузері, щоб перевірити, що деплой живий.
  return json({ ok: true, service: 'Expert Clinic form endpoint' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

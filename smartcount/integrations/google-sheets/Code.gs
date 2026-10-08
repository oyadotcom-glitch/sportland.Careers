/**
 * SmartCount – קליטת לידים מדף הנחיתה לגיליון Google Sheets
 *
 * התקנה: Extensions → Apps Script בתוך הגיליון, להדביק את הקובץ הזה ולפרוס כ-Web App.
 * הוראות מלאות: README.md באותה תיקייה.
 */

// שם הלשונית שאליה נכתבים הלידים. אם היא לא קיימת – תיווצר.
var SHEET_NAME = 'לידים';

// כתובת מייל להתראה על כל ליד חדש (לא חובה). להשאיר ריק כדי לא לשלוח.
var NOTIFY_EMAIL = '';

var COLUMNS = [
  ['submittedAt', 'תאריך ושעה'],
  ['fullName', 'שם מלא'],
  ['phone', 'טלפון'],
  ['businessTypeLabel', 'סוג העסק'],
  ['notes', 'הערות'],
  ['status', 'סטטוס טיפול'],
  ['marketingConsent', 'אישור דיוור'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['utm_term', 'utm_term'],
  ['utm_content', 'utm_content'],
  ['gclid', 'gclid'],
  ['gbraid', 'gbraid'],
  ['wbraid', 'wbraid'],
  ['fbclid', 'fbclid'],
  ['fbp', 'fbp'],
  ['fbc', 'fbc'],
  ['landingPage', 'עמוד נחיתה'],
  ['firstLandingPage', 'עמוד כניסה ראשון'],
  ['referrer', 'מקור הפניה (referrer)'],
  ['consent', 'אישור מדיניות פרטיות'],
  ['consentText', 'נוסח ההסכמה'],
  ['leadId', 'מזהה ליד']
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // ולידציה בצד השרת – לא סומכים על הדפדפן בלבד
    var fullName = String(data.fullName || '').trim();
    var phone = String(data.phone || '').replace(/[^\d]/g, '');
    if (fullName.length < 2) return json({ ok: false, error: 'invalid_name' });
    if (!/^0\d{8,9}$/.test(phone)) return json({ ok: false, error: 'invalid_phone' });
    if (data.consent !== true) return json({ ok: false, error: 'no_consent' });

    var sheet = getSheet();

    // מניעת כפילות אם אותו ליד נשלח פעמיים
    if (data.leadId && isDuplicate(sheet, String(data.leadId))) return json({ ok: true, duplicate: true });

    var attr = data.attribution || {};
    var first = attr.first_touch || {};
    var row = {
      submittedAt: new Date(),
      fullName: fullName,
      phone: "'" + phone, // שומר על ה-0 בתחילת המספר
      businessTypeLabel: data.businessTypeLabel || data.businessType || '',
      notes: data.notes || '',
      status: 'חדש',
      marketingConsent: data.marketingConsent ? 'כן' : 'לא',
      landingPage: data.pageUrl || '',
      firstLandingPage: first.landingPage || '',
      referrer: data.referrer || first.referrer || '',
      consent: 'כן',
      consentText: data.consentText || '',
      leadId: data.leadId || ''
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
     'gclid', 'gbraid', 'wbraid', 'fbclid', 'fbp', 'fbc'].forEach(function (k) { row[k] = attr[k] || ''; });

    sheet.appendRow(COLUMNS.map(function (c) { return clean(row[c[0]]); }));

    if (NOTIFY_EMAIL) notify(row);

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

// בדיקה מהדפדפן: פתיחת כתובת ה-/exec אמורה להחזיר {"ok":true,"service":"smartcount-leads"}
function doGet() {
  return json({ ok: true, service: 'smartcount-leads' });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#062448').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
    sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  }
  return sheet;
}

function isDuplicate(sheet, leadId) {
  var col = COLUMNS.length; // מזהה הליד בעמודה האחרונה
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var from = Math.max(2, last - 199);
  var ids = sheet.getRange(from, col, last - from + 1, 1).getValues();
  return ids.some(function (r) { return r[0] === leadId; });
}

// מונע הזרקת נוסחאות (ערך שמתחיל ב- = + - @) ומגביל אורך
function clean(v) {
  if (v instanceof Date) return v;
  v = String(v == null ? '' : v).slice(0, 2000);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function notify(row) {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'ליד חדש מ-SmartCount: ' + row.fullName,
    body: [
      'שם: ' + row.fullName,
      'טלפון: ' + String(row.phone).replace(/^'/, ''),
      'סוג העסק: ' + row.businessTypeLabel,
      'הערות: ' + (row.notes || '-'),
      'מקור: ' + [row.utm_source, row.utm_medium, row.utm_campaign].filter(String).join(' / ')
    ].join('\n')
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

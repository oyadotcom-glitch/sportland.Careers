# SmartCount – דף נחיתה

דף נחיתה סטטי (HTML/CSS/JS, בלי build ובלי תלויות) למותג SmartCount – רואה חשבון דיגיטלי לעסק שלך.
אפשר להעלות את התיקייה כמו שהיא לכל אחסון סטטי (Netlify, Vercel, Cloudflare Pages, S3 וכו׳).

## מבנה

```
server.js / railway.json <- שרת ופריסה ל-Railway
index.html              <- כל הקופי של הדף (טקסטים, כותרות, FAQ, SEO)
privacy.html            <- מדיניות פרטיות (טיוטה – להשלמה ע"י עו"ד)
terms.html              <- תנאי שימוש (טיוטה)
accessibility.html      <- הצהרת נגישות (טיוטה)
assets/js/config.js     <- כל ההגדרות: מדידה, Webhook, המלצות, מצב production
assets/js/tracking.js   <- טעינת GTM/GA4/Ads/Pixel, שמירת UTM/GCLID, אירוע Lead
assets/js/app.js        <- קרוסלה, טופס, CTA צף, אנימציות
assets/css/style.css    <- עיצוב (צבעי המותג מוגדרים כמשתנים בראש הקובץ)
integrations/google-sheets/  <- סקריפט Apps Script לשמירת הלידים בגיליון + הוראות
assets/img/             <- לוגו, פביקון, תמונת שיתוף (og-image.png)
```

הרצה מקומית: `cd smartcount && npm start` ולפתוח `http://localhost:8080`.

## פריסה ב-Railway

התיקייה כוללת שרת Node קטן בלי תלויות (`server.js`) והגדרות Railway (`railway.json`).
השרת מגיש רק את קבצי האתר: README, קוד השרת והסקריפטים לא נגישים מבחוץ.

1. ב-Railway: **New Project** (או פרויקט קיים) → **Deploy from GitHub repo** → `sportland.careers`.
2. בהגדרות השירות (**Settings**):
   - **Source → Branch**: `smartcount-landing` (או `main` אחרי מיזוג).
   - **Source → Root Directory**: `/smartcount` ← חשוב, אחרת Railway יפרוס את אתר הגיוס של Sportland.
3. **Networking → Generate Domain** לקבלת כתובת זמנית, או **Custom Domain** לדומיין משלכם.
4. אחרי שיש דומיין סופי: לעדכן `canonical` ו-`og:image` ב-`index.html` לכתובת המלאה.

בדיקת תקינות: `https://<הדומיין>/healthz` מחזיר `ok`.

## לפני עלייה לאוויר – צ'קליסט

1. **Google Sheets** – הלידים נשמרים בגיליון דרך Google Apps Script. הוראות התקנה ב-`integrations/google-sheets/README.md`,
   ואז להדביק את כתובת ה-`/exec` ב-`lead.endpoint` ב-`config.js`.
   הודעת התודה ואירוע ה-Lead מופעלים **רק** אחרי שהסקריפט החזיר `{ ok: true }`. בלי endpoint הטופס מציג הודעה שהוא לא מחובר.
   מעבר בעתיד ל-CRM / Webhook אחר: להחליף endpoint, ולשנות `contentType` ו-`requireOk` לפי מה שהמערכת מחזירה.
2. **מדידה** – למלא `tracking.gtmId` ולהגדיר את התגים ב-GTM (מומלץ), או לחלופין מזהים ישירים (GA4 / Ads / Pixel). לא את שניהם.
   ב-`index.html` יש בלוק `noscript` של GTM בהערה – להחליף מזהה ולהסיר את ההערה.
3. **המלצות** – להחליף את ההמלצות ב-`config.js` בהמלצות אמיתיות ומאושרות, ולשנות `isDemo: false`.
   כוכבים מוצגים רק אם מוגדר `rating` לאותה המלצה.
4. **מצב production** – לשנות `site.env` ל-`"production"`. במצב זה תוכן שמסומן כדמה לא יוצג בכלל (גם אם נשכח `isDemo: true`).
5. **דומיין** – לעדכן `canonical` ו-`og:image` (כתובת מלאה) ב-`index.html`.
6. **משפטי** – להשלים את דפי המדיניות ולהסיר מהם `noindex`; להוסיף את שם המשרד השותף ושם החברה המפעילה במקומות שמסומנים `TODO` ב-`index.html`.

## אירועים ב-dataLayer

| אירוע | מתי |
|---|---|
| `cta_click` | לחיצה על כל כפתור שמוביל לטופס (`cta_location`: hero / header / audience / how / floating) |
| `lead_form_start` | פוקוס ראשון בטופס |
| `generate_lead` | **רק** אחרי שהשרת אישר את הליד. כולל `lead_id`, `business_type` |
| `lead_submit_error` | שליחה נכשלה (`error_code`) |

ב-GTM: טריגר Custom Event בשם `generate_lead` → תגי GA4 `generate_lead`, Google Ads Conversion ו-Meta `Lead`.
מומלץ להעביר את `lead_id` כ-`transaction_id` ב-Google Ads וכ-`eventID` ב-Meta (מאפשר דה-דופליקציה מול Conversions API).

## מבנה הליד שנשלח (JSON)

```json
{
  "leadId": "uuid",
  "brand": "SmartCount",
  "fullName": "…", "phone": "05XXXXXXXX",
  "businessType": "osek-patur", "businessTypeLabel": "עוסק פטור",
  "notes": "…",
  "consent": true, "consentText": "…",
  "submittedAt": "ISO", "pageUrl": "…", "referrer": "…", "userAgent": "…",
  "attribution": {
    "utm_source": "", "utm_medium": "", "utm_campaign": "", "utm_term": "", "utm_content": "", "utm_id": "",
    "gclid": "", "gbraid": "", "wbraid": "", "fbclid": "", "msclkid": "",
    "fbp": "", "fbc": "",
    "first_touch": { "params": {}, "landingPage": "", "referrer": "", "at": "" },
    "last_touch":  { "params": {}, "landingPage": "", "referrer": "", "at": "" }
  }
}
```

פרמטרי השיוך נשמרים ב-localStorage למשך `tracking.attributionDays` (ברירת מחדל 90 יום), כך שליד שחוזר בביקור מאוחר יותר עדיין משויך לקמפיין.
הטלפון מנורמל לפורמט `05XXXXXXXX`. שדה honeypot חוסם בוטים פשוטים (בלי שליחה ובלי המרה).

## עריכת תוכן

- **טקסטים** – ישירות ב-`index.html`. כל אזור מסומן בהערה (`<!-- 1. Hero -->` וכו׳).
- **צבעים** – משתני CSS בראש `style.css` (`--navy`, `--blue`, `--teal`).
- **סוגי עסק בטופס** – ה-`<select id="f-type">` ב-`index.html`. כפתורי "למי זה מתאים" בוחרים מראש את הערך דרך `data-business-type`.

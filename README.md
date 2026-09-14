# דף נחיתה - גיוס עובדים SPORTLAND

דף נחיתה לקבלת מועמדויות וקורות חיים עבור סניפי SPORTLAND (חדרה, בית יצחק, קריית טבעון).

## מבנה הפרויקט

```
package.json        <- תלויות והרצה (ברמת השורש, לצורך פריסה קלה)

public/              <- הפרונט-אנד (הדף שהמועמד רואה)
  index.html
  css/style.css
  js/config.js       <- סניפים ומשרות (תצוגה בלבד)
  js/app.js
  assets/logo.png    <- לוגו החברה

server/              <- הבק-אנד (שרת Node שמקבל את הטופס ושולח מייל)
  index.js
  config.js          <- מיפוי סניף -> כתובת מייל
  rate-limit.js
  .env.example
```

## 1. איך להריץ את הפרויקט (מקומית, על המחשב שלך)

דרוש Node.js מותקן (גרסה 18 ומעלה).

```bash
npm install
cp server/.env.example server/.env
```

ואז לערוך את קובץ `server/.env` ולמלא את פרטי שרת המייל (SMTP) - ראו סעיף 4.

להרצה:

```bash
npm start
```

השרת יעלה בכתובת `http://localhost:3000` ויגיש גם את הדף וגם את ה-API לשליחת הטפסים (אין צורך בשרת נפרד לפרונט-אנד).

## 2. איפה להחליף לוגו

הקובץ נמצא ב-`public/assets/logo.png`. פשוט מחליפים את הקובץ בלוגו אחר (מומלץ PNG עם רקע שקוף). אין צורך לשנות קוד - ה-HTML כבר מצביע על `assets/logo.png`.

## 3. איפה מוגדרים הסניפים והמשרות

בקובץ `public/js/config.js`. כדי להוסיף סניף חדש או משרה נוספת, מוסיפים אובייקט למערך `branches` (או `positions` בתוך סניף קיים) - לא צריך לגעת בשום מקום אחר בקוד של הדף:

```js
{
  id: "new-branch",
  name: "ספורטלנד השם החדש",
  positions: [
    { id: "trainer", name: "מדריכות ומדריכי כושר" },
    { id: "reception", name: "נציגות ונציגי קבלה" }
  ]
}
```

**חשוב:** אחרי הוספת סניף חדש בקובץ הזה, יש להוסיף גם את כתובת המייל שלו בקובץ `server/config.js` (סעיף הבא) עם אותו `id` בדיוק - אחרת השרת ידחה בקשות לסניף הזה.

## 4. איפה מוגדרות כתובות המייל שאליהן נשלחים קורות החיים

בקובץ `server/config.js`, במפה `BRANCHES`. לכל סניף יש `id` (חייב להתאים למזהה בקובץ ה-config של הפרונט) ו-`email`.

ניתן גם לדרוס את כתובות המייל בלי לגעת בקוד, דרך משתני סביבה בקובץ `server/.env`:

```
EMAIL_HADERA=Danny@csport.co.il
EMAIL_BEIT_YITZHAK=Ronit@csport.co.il
EMAIL_TIVON=tamara@csport-tivon.co.il
```

### הגדרת שרת המייל (SMTP)

שליחת המיילים בפועל מתבצעת דרך שרת SMTP, שאותו יש להגדיר בקובץ `server/.env` (העתיקו מ-`server/.env.example`):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
MAIL_FROM="SPORTLAND - גיוס עובדים" <noreply@example.com>
```

אפשר להשתמש בכל ספק SMTP - לדוגמה Gmail (עם App Password), SendGrid, Mailgun, Amazon SES, או שרת ה-SMTP של ספק האחסון/הדומיין של החברה. מומלץ לפנות לספק האחסון של האתר לפרטי ה-SMTP המדויקים.

## 5. איך להעלות את האתר לשרת ולקבל לינק פעיל (Railway)

זהו אתר עם רכיב שרת (Node.js), ולכן דרוש אחסון שתומך בהרצת Node - לא אחסון סטטי רגיל. ההוראות כאן הן ל-[Railway](https://railway.com), שלא דורש חשבון GitHub ומאפשר להעלות ישירות מהמחשב באמצעות כלי שורת פקודה (CLI).

**חד פעמי - התקנת הכלי:**

```bash
npm install -g @railway/cli
```

**בכל פעם שרוצים לפרוס (מהתיקייה הראשית של הפרויקט):**

```bash
railway login
```
ייפתח דפדפן - מתחברים/נרשמים לחשבון Railway (חינמי) ומאשרים.

```bash
railway init
```
בוחרים "Create new project" ונותנים שם (לדוגמה `sportland-jobs`).

מגדירים את משתני הסביבה (פרטי ה-SMTP האמיתיים - ראו סעיף 4 למעלה):

```bash
railway variables --set "SMTP_HOST=smtp.example.com" --set "SMTP_PORT=587" --set "SMTP_SECURE=false" --set "SMTP_USER=your-smtp-username" --set "SMTP_PASS=your-smtp-password" --set "MAIL_FROM=SPORTLAND <noreply@example.com>"
```

מעלים ומריצים את השרת:

```bash
railway up
```

מקבלים כתובת ציבורית (לינק) להפעלה:

```bash
railway domain
```

הפקודה האחרונה מנפיקה כתובת מסוג `xxxx.up.railway.app` - זה הלינק שאפשר לשלוח הלאה. אם רוצים דומיין מותאם אישית (למשל `jobs.sportland.co.il`), אפשר לחבר אותו דרך `railway domain` או מלוח הבקרה שב-railway.app, ולהגדיר רשומת CNAME אצל ספק הדומיין.

**עדכון האתר בעתיד:** אחרי כל שינוי בקוד, פשוט מריצים שוב `railway up` מתוך התיקייה.

### אלטרנטיבות אחרות

- **Render + GitHub** - פותרים ריפו ב-GitHub, מחברים ל-Render, מגדירים את משתני הסביבה מ-`.env.example` בממשק, ומריצים `npm start`.
- **VPS רגיל** (DigitalOcean, AWS EC2 וכו') - מעלים את הקבצים, `npm install && npm start` (מומלץ עם מנהל תהליכים כמו `pm2`), ומגדירים פרוקסי (Nginx) עם תעודת SSL שמפנה את הדומיין לפורט השרת (ברירת מחדל 3000).

בכל מקרה - חשוב **לא** להעלות את קובץ ה-`.env` עצמו לשום ריפו/מקום ציבורי (הוא כבר ברשימת ה-`.gitignore`); מגדירים את הערכים הרגישים תמיד דרך ממשק/CLI האחסון.

## תכונות שכבר מוטמעות

- RTL מלא ועיצוב מותאם מובייל-תחילה.
- ולידציה בצד הלקוח (שדות חובה, פורמט טלפון/אימייל, סוג וגודל קובץ) **וגם** בצד השרת (הגנה אמיתית - ולידציית הלקוח אפשר לעקוף).
- הודעת טעינה בזמן השליחה, נעילת כפתור השליחה למניעת שליחה כפולה.
- הודעת הצלחה / שגיאה ברורות.
- Honeypot בסיסי נגד בוטים (שדה מוסתר - אם בוט ממלא אותו, הבקשה מתקבלת "בהצלחה" אך לא נשלח מייל).
- הגבלת קצב בקשות (Rate limiting) בסיסית לפי כתובת IP, למניעת הצפה.

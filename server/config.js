/**
 * הגדרות מרכזיות לצד השרת: סניפים, משרות וכתובת המייל שאליה
 * יישלחו קורות החיים עבור כל סניף.
 *
 * חשוב: מזהי הסניפים (id) והמשרות כאן חייבים להיות תואמים בדיוק
 * למזהים בקובץ public/js/config.js בצד הלקוח.
 *
 * ניתן (ומומלץ) לדרוס את כתובות המייל דרך משתני סביבה (קובץ .env)
 * מבלי לגעת בקוד - ראו EMAIL_HADERA / EMAIL_BEIT_YITZHAK / EMAIL_TIVON.
 */

const BRANCHES = {
  hadera: {
    name: "ספורטלנד חדרה",
    email: process.env.EMAIL_HADERA || "Danny@csport.co.il"
  },
  "beit-yitzhak": {
    name: "ספורטלנד בית יצחק",
    email: process.env.EMAIL_BEIT_YITZHAK || "Ronit@csport.co.il"
  },
  tivon: {
    name: "ספורטלנד קריית טבעון",
    email: process.env.EMAIL_TIVON || "tamara@csport-tivon.co.il"
  }
};

const POSITIONS = {
  trainer: "מדריכות ומדריכי כושר",
  reception: "נציגות ונציגי קבלה"
};

module.exports = { BRANCHES, POSITIONS };

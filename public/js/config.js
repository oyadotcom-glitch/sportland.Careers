/**
 * קובץ ההגדרות המרכזי של האתר.
 * כדי להוסיף/לשנות סניף או משרה - ערכו רק את המערך הזה.
 * שימו לב: מזהי הסניפים (id) חייבים להיות תואמים למזהים המוגדרים
 * בקובץ server/config.js בצד השרת (שם מוגדרות כתובות המייל).
 */
window.SPORTLAND_CONFIG = {
  branches: [
    {
      id: "hadera",
      name: "ספורטלנד חדרה",
      positions: [
        { id: "trainer", name: "מדריכות ומדריכי כושר" },
        { id: "reception", name: "נציגות ונציגי קבלה" }
      ]
    },
    {
      id: "beit-yitzhak",
      name: "ספורטלנד בית יצחק",
      positions: [
        { id: "trainer", name: "מדריכות ומדריכי כושר" },
        { id: "reception", name: "נציגות ונציגי קבלה" }
      ]
    },
    {
      id: "tivon",
      name: "ספורטלנד קריית טבעון",
      positions: [
        { id: "trainer", name: "מדריכות ומדריכי כושר" },
        { id: "reception", name: "נציגות ונציגי קבלה" }
      ]
    }
  ],

  // כתובת ה-API שאליה נשלח הטופס. ריק = אותו שרת שמגיש את הדף.
  apiUrl: "/api/apply",

  upload: {
    maxSizeMB: 10,
    acceptedExtensions: [".pdf", ".doc", ".docx"],
    acceptedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  }
};

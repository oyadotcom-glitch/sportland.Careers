const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const multer = require("multer");
const rateLimit = require("./rate-limit");
const { BRANCHES, POSITIONS } = require("./config");

const app = express();
const PORT = process.env.PORT || 3000;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const okMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const okExt = ALLOWED_EXTENSIONS.includes(ext);
    if (okMime && okExt) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_FILE_TYPE"));
    }
  }
});

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendApplicationEmail({ from, to, replyTo, subject, text, html, attachment }) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo,
      subject,
      text,
      html,
      attachments: [
        {
          filename: attachment.filename,
          content: attachment.buffer.toString("base64")
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(function () {
      return "";
    });
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  const digits = String(value).replace(/[\s-]/g, "");
  return /^0\d{8,9}$/.test(digits) || /^\+?\d{9,13}$/.test(digits);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.post(
  "/api/apply",
  rateLimit,
  function (req, res, next) {
    upload.single("resume")(req, res, function (err) {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "גודל הקובץ חורג מ-10MB" });
        }
        if (err.message === "INVALID_FILE_TYPE") {
          return res.status(400).json({ message: "יש להעלות קובץ מסוג PDF, DOC או DOCX בלבד" });
        }
        return res.status(400).json({ message: "שגיאה בהעלאת הקובץ" });
      }
      next();
    });
  },
  async function (req, res) {
    try {
      const { fullName, phone, email, branchId, positionId, website } = req.body;

      // honeypot - אם מולא, זה כנראה בוט. מגיבים בהצלחה מדומה בלי לשלוח מייל.
      if (website) {
        return res.json({ ok: true });
      }

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ message: "שם מלא הוא שדה חובה" });
      }
      if (!phone || !isValidPhone(phone)) {
        return res.status(400).json({ message: "מספר טלפון לא תקין" });
      }
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: "כתובת אימייל לא תקינה" });
      }

      const branch = BRANCHES[branchId];
      if (!branch) {
        return res.status(400).json({ message: "סניף לא תקין" });
      }

      const positionName = POSITIONS[positionId];
      if (!positionName) {
        return res.status(400).json({ message: "משרה לא תקינה" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "יש לצרף קובץ קורות חיים" });
      }

      const safeFullName = fullName.trim();
      const subject = `קורות חיים | ${branch.name} | ${positionName} | ${safeFullName}`;

      const textBody = [
        `שם מלא: ${safeFullName}`,
        `טלפון: ${phone.trim()}`,
        `אימייל: ${email.trim()}`,
        `סניף: ${branch.name}`,
        `משרה: ${positionName}`
      ].join("\n");

      const htmlBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7;">
          <p><strong>שם מלא:</strong> ${escapeHtml(safeFullName)}</p>
          <p><strong>טלפון:</strong> ${escapeHtml(phone.trim())}</p>
          <p><strong>אימייל:</strong> ${escapeHtml(email.trim())}</p>
          <p><strong>סניף:</strong> ${escapeHtml(branch.name)}</p>
          <p><strong>משרה:</strong> ${escapeHtml(positionName)}</p>
        </div>
      `;

      await sendApplicationEmail({
        from: process.env.MAIL_FROM || "SPORTLAND <onboarding@resend.dev>",
        to: branch.email,
        replyTo: email.trim(),
        subject: subject,
        text: textBody,
        html: htmlBody,
        attachment: {
          filename: req.file.originalname,
          buffer: req.file.buffer
        }
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("Failed to send application email:", error);
      return res.status(500).json({ message: "אירעה שגיאה בשליחת המייל. נסו שוב מאוחר יותר." });
    }
  }
);

app.listen(PORT, function () {
  console.log(`SPORTLAND jobs server running on http://localhost:${PORT}`);
});

/**
 * SmartCount – שרת סטטי קטן לפריסה ב-Railway (ללא תלויות).
 * Railway מגדיר את PORT אוטומטית.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

// רק קבצי האתר נחשפים – לא קוד שרת, README או סקריפטי אינטגרציה
const PUBLIC = new Set(["index.html", "privacy.html", "terms.html", "accessibility.html"]);
const PUBLIC_DIRS = ["assets/"];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Strict-Transport-Security": "max-age=31536000"
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers));
  res.end(body);
}

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "Bad Request");
  }

  if (pathname === "/healthz") return send(res, 200, "ok", { "Content-Type": "text/plain" });
  if (pathname === "/robots.txt") {
    return send(res, 200, "User-agent: *\nAllow: /\n", { "Content-Type": "text/plain; charset=utf-8" });
  }

  let rel = pathname.replace(/^\/+/, "");
  if (rel === "" ) rel = "index.html";
  if (!path.extname(rel) && PUBLIC.has(rel + ".html")) rel += ".html"; // /privacy → privacy.html

  // בודקים את הנתיב אחרי נרמול, כדי ש-../ לא יעקוף את רשימת המותרים
  const file = path.join(ROOT, rel);
  const safeRel = path.relative(ROOT, file).split(path.sep).join("/");
  const allowed = PUBLIC.has(safeRel) || PUBLIC_DIRS.some((d) => safeRel.startsWith(d));
  if (!allowed || !file.startsWith(ROOT + path.sep)) return notFound(res);

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    const ext = path.extname(file).toLowerCase();
    const headers = {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      // HTML תמיד טרי; נכסים נשמרים במטמון ליום
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400"
    };
    res.writeHead(200, Object.assign({}, SECURITY_HEADERS, headers));
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => {
  console.log("SmartCount listening on port " + PORT);
});

function notFound(res) {
  send(res, 404, '<!doctype html><meta charset="utf-8"><title>הדף לא נמצא | SmartCount</title>' +
    '<body style="font-family:system-ui;text-align:center;padding:80px 16px;direction:rtl">' +
    '<h1>הדף לא נמצא</h1><p><a href="/">חזרה לעמוד הראשי</a></p></body>',
    { "Content-Type": "text/html; charset=utf-8" });
}

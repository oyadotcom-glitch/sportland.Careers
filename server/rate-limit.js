/**
 * מגן ספאם בסיסי: מגביל כל כתובת IP למספר שליחות מוגבל בחלון זמן נתון.
 * מתאים לעומס קטן-בינוני; ללא תלות בחבילות חיצוניות.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 דקות
const MAX_REQUESTS = 5;

const hits = new Map();

function cleanup(now) {
  for (const [ip, timestamps] of hits.entries()) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) {
      hits.delete(ip);
    } else {
      hits.set(ip, recent);
    }
  }
}

module.exports = function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();

  cleanup(now);

  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({ message: "יותר מדי בקשות. נסו שוב בעוד כמה דקות." });
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  next();
};

import fs from "fs";

const logFile = "./data/analytics.json";

export function logClick({ storeId, linkType, utm }) {
  const log = {
    timestamp: new Date().toISOString(),
    storeId,
    linkType,
    utm: utm || {},
    device: {
      ua: (typeof navigator !== "undefined" ? navigator.userAgent : "server"),
    }
  };

  const data = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, "utf8")) : [];
  data.push(log);
  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
}

export function getAnalytics() {
  if (!fs.existsSync(logFile)) return [];
  return JSON.parse(fs.readFileSync(logFile, "utf8"));
}

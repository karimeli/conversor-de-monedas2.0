const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const PORT = process.env.PORT || 4001;
const LOG_FILE_PATH = path.join(__dirname, "data", "conversions.log");

app.use(cors());
app.use(express.json());

if (!fs.existsSync(path.dirname(LOG_FILE_PATH))) {
  fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
}

const recentLogs = [];

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "analytics-service" });
});

app.post("/logs/conversions", (req, res) => {
  const { id, origen, destino, cantidad, resultado, timestamp, message } = req.body || {};

  if (!origen || !destino || !cantidad || !resultado || !timestamp) {
    return res.status(400).json({ error: "Payload incompleto" });
  }

  const logItem = {
    id: id || crypto.randomUUID(),
    origen,
    destino,
    cantidad,
    resultado,
    timestamp,
    message:
      message ||
      `Usuario convirtio ${cantidad} ${origen} a ${destino} con resultado ${resultado}`,
  };

  recentLogs.unshift(logItem);
  if (recentLogs.length > 200) recentLogs.pop();

  fs.appendFile(
    LOG_FILE_PATH,
    `${JSON.stringify(logItem)}\n`,
    { encoding: "utf8" },
    (err) => {
      if (err) {
        console.error("Error escribiendo log:", err);
      }
    },
  );

  return res.status(202).json({ ok: true });
});

app.get("/logs/conversions", (req, res) => {
  const limit = Number(req.query.limit || 50);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;

  return res.json({
    items: recentLogs.slice(0, safeLimit),
    total: recentLogs.length,
  });
});

app.listen(PORT, () => {
  console.log(`Analytics service escuchando en http://localhost:${PORT}`);
});

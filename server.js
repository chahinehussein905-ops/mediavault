
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(here, "public")));

app.get("/health", (_req, res) =>
  res.json({ ok: true, app: "MediaVault" })
);

app.get("/{*splat}", (_req, res) =>
  res.sendFile(path.join(here, "public", "index.html"))
);

const port = process.env.PORT || 10000;

app.listen(port, "0.0.0.0", () =>
  console.log(`MediaVault listening on ${port}`)
);

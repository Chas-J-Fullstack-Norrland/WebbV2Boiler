import jsonServer from "json-server";
import dotenv from "dotenv";

dotenv.config();

const server = jsonServer.create();
const router = jsonServer.router("./src/data/db.json");
const middlewares = jsonServer.defaults({
  static: "private",
  logger: true
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

import crypto from "crypto";
server.use((req, res, next) => {
    const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(res.locals.data || {}))
        .digest("hex");
    res.setHeader("ETag", etag);
    next();
});



// --------- Custom endpoints ---------
server.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// --------- json-server router ---------
server.use(router);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`\njson-server running on http://localhost:${port}`);
});

import jsonServer from "json-server";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const server = jsonServer.create();
const router = jsonServer.router("src/data/db.json");
const middlewares = jsonServer.defaults({
  static: "public",
  logger: true
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

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

// ETag middleware - AFTER router
server.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (data && typeof data === 'object') {
      const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex");
      res.setHeader("ETag", etag);
    }
    return originalSend.call(this, data);
  };
  
  next();
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`\njson-server running on http://localhost:${port}`);
});

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import whatsappRouter from "../routes/whatsapp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ─── Security Headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:;"
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const requestMap = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const entry = requestMap.get(key);
    if (!entry || now > entry.resetTime) {
      requestMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        error: "Muitas requisições. Por favor, aguarde alguns instantes antes de tentar novamente.",
      });
    }

    entry.count++;
    next();
  };
}

const timer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestMap.entries()) {
    if (now > entry.resetTime) requestMap.delete(key);
  }
}, 5 * 60 * 1000);

if (timer && typeof timer === "object" && "unref" in timer) {
  timer.unref();
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve static public assets (manifest.json, sw.js)
const publicDir = path.resolve(__dirname, "../../public");
app.use(express.static(publicDir));

registerOAuthRoutes(app);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Rate limit sensitive WhatsApp routes
app.use("/api/whatsapp", rateLimiter(15, 60 * 1000), whatsappRouter);

// Rate limit tRPC requests
app.use("/api/trpc", rateLimiter(120, 60 * 1000), createExpressMiddleware({ router: appRouter, createContext }));

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || "3000";
  server.listen(port, () => console.log(`[api] server listening on port ${port}`));
}

export default app;

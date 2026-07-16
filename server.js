/**
 * Derek Snake Game — server.js
 * Created by Jhon Dherick Pableo Rosal
 *
 * Minimal, hardened Express server:
 *  - Helmet security headers (CSP, no-sniff, frame deny, etc.)
 *  - Rate limiting (basic anti-DDoS / anti-abuse)
 *  - Strict static file serving (no directory listing, no dotfiles)
 *  - No dynamic/user-writable routes -> nothing to deface
 */

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// Railway sits behind a proxy — needed for correct client IPs in the rate limiter
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ---------- Security headers ----------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        mediaSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "no-referrer" },
  })
);

app.use(compression());

// ---------- Anti-DDoS / anti-abuse rate limiting ----------
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please slow down and try again shortly.",
});
app.use(globalLimiter);

const strictAssetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------- Static assets (game files) ----------
app.use(
  express.static(path.join(__dirname, "public"), {
    dotfiles: "deny",
    index: "index.html",
    maxAge: "1h",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

// ---------- Video assets (Try Again prank clips) ----------
app.use(
  "/assets",
  strictAssetLimiter,
  express.static(path.join(__dirname, "assets"), {
    dotfiles: "deny",
    index: false,
    maxAge: "1d",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

// Block anything that isn't a known static file — no admin routes, no eval'd input
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

// Generic error handler — never leak stack traces to clients
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong.");
});

app.listen(PORT, () => {
  console.log(`Derek Snake Game running on port ${PORT}`);
});

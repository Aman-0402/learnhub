import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";

// Static tags in index.html need an absolute address for crawlers that do not run JavaScript.
const SITE_URL = (process.env.VITE_SITE_URL || "https://learnhub.example").replace(/\/$/, "");
const robots = () => readFileSync(new URL("./robots.txt.template", import.meta.url), "utf8").replaceAll("__SITE_URL__", SITE_URL);
const siteUrl = () => ({
  name: "site-url",
  transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", SITE_URL),
  // robots.txt is served in development and written to dist/ on build.
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== "/robots.txt") return next();
      res.setHeader("Content-Type", "text/plain"); res.end(robots());
    });
  },
  generateBundle() { this.emitFile({ type: "asset", fileName: "robots.txt", source: robots() }); },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000", "/sitemap.xml": "http://127.0.0.1:8000" },
  },
});

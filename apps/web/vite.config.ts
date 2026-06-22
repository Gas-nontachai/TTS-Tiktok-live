import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-spa-fallback",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (
            !req.url ||
            req.method !== "GET" ||
            req.url.startsWith("/@") ||
            req.url.startsWith("/src/") ||
            req.url.includes(".")
          ) {
            next();
            return;
          }

          const indexPath = path.resolve(__dirname, "index.html");
          const html = await server.transformIndexHtml(req.url, fs.readFileSync(indexPath, "utf8"));
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          res.end(html);
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: "0.0.0.0"
  }
});

import http from "node:http";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { readConfig, updateConfig, updateConfigSchema } from "./config.js";
import { TikTokLiveService } from "./tiktok.js";
import { RealtimeHub } from "./websocket.js";

const port = Number(process.env.PORT ?? 3001);
const app = express();
const server = http.createServer(app);
const hub = new RealtimeHub();

hub.attach(server);

const tiktok = new TikTokLiveService(
  (comment) => hub.broadcast({ event: "comment", data: comment }),
  (status) => hub.broadcast({ event: "status", data: status }),
  (message) => hub.broadcast({ event: "error", data: { message } })
);

const connectSchema = z.object({
  username: z.string().trim().min(1)
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

app.get("/api/config", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await readConfig() });
  } catch (error) {
    next(error);
  }
});

app.put("/api/config", async (req, res, next) => {
  try {
    const partial = updateConfigSchema.parse(req.body);
    await updateConfig(partial);
    res.json({ success: true, message: "Config updated" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tiktok/connect", async (req, res, next) => {
  try {
    const { username } = connectSchema.parse(req.body);
    await updateConfig({ tiktok: { username } });
    const status = await tiktok.connect(username);

    res.json({
      success: true,
      message: "Connected to TikTok Live",
      data: {
        username: status.username,
        roomId: status.roomId
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tiktok/disconnect", async (_req, res, next) => {
  try {
    await tiktok.disconnect();
    res.json({ success: true, message: "Disconnected" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tiktok/status", (_req, res) => {
  res.json({ success: true, data: tiktok.getStatus() });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: error.flatten()
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ success: false, message });
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});


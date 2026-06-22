import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { defaultConfig, readConfig, replaceConfig, updateConfig, updateConfigSchema } from "./config.js";
import { TikTokLiveService } from "./tiktok.js";
import type {
  AppConfig,
  AppStats,
  ChatControlAction,
  ChatMessageEvent,
  FollowAlertEvent,
  GiftAlertEvent,
  LogEntry,
  OverlayEvent,
  ShareAlertEvent
} from "./types.js";
import { RealtimeHub } from "./websocket.js";

const port = Number(process.env.PORT ?? 3001);
const app = express();
const server = http.createServer(app);
const hub = new RealtimeHub();
const logs: LogEntry[] = [];
const recentChat: ChatMessageEvent[] = [];
const stats: AppStats = {
  viewerCount: 0,
  totalLikes: 0,
  eventCounts: {},
  messagesPerMinute: 0,
  filteredChatCount: 0,
  visibleChatCount: 0
};

let chatPaused = false;

hub.attach(server);

const tiktok = new TikTokLiveService(handleOverlayEvent, handleChatMessage, broadcastStatus, broadcastError, addLog);

const connectSchema = z.object({
  username: z.string().trim().min(1)
});

const chatTestSchema = z.object({
  username: z.string().trim().optional(),
  displayName: z.string().trim().optional(),
  message: z.string().trim().min(1)
});

const ttsSynthesizeSchema = z.object({
  text: z.string().trim().min(1).max(1000)
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
    const config = await updateConfig(partial);
    addLog({ level: "info", type: "config_update", message: "Config updated", metadata: partial });
    broadcastConfig(config);
    res.json({ success: true, message: "Config updated", data: config });
  } catch (error) {
    next(error);
  }
});

app.post("/api/config/reset", async (_req, res, next) => {
  try {
    const config = await replaceConfig(defaultConfig);
    addLog({ level: "warn", type: "config_update", message: "Config reset to defaults" });
    broadcastConfig(config);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stats", (_req, res) => {
  res.json({ success: true, data: stats });
});

app.post("/api/tts/synthesize", async (req, res, next) => {
  let tempDir = "";

  try {
    const { text } = ttsSynthesizeSchema.parse(req.body);
    const config = await readConfig();

    if (config.tts.engine !== "local-thai") {
      res.status(400).json({ success: false, message: "Local Thai TTS engine is not enabled" });
      return;
    }

    if (!config.tts.localThaiReferenceAudioPath.trim() || !config.tts.localThaiReferenceText.trim()) {
      res.status(400).json({
        success: false,
        message: "Set a reference audio path and matching reference text before using Local Thai TTS"
      });
      return;
    }

    tempDir = await mkdtemp(path.join(os.tmpdir(), "tiktok-live-tts-"));
    const outputPath = path.join(tempDir, "speech.wav");
    const scriptPath = path.resolve(process.cwd(), "scripts/local_thai_tts.py");

    await runLocalThaiTts({
      pythonPath: config.tts.localThaiPythonPath,
      scriptPath,
      engine: config.tts.localThaiEngine,
      text,
      referenceAudioPath: config.tts.localThaiReferenceAudioPath,
      referenceText: config.tts.localThaiReferenceText,
      speed: config.tts.rate,
      outputPath
    });

    const audio = await readFile(outputPath);
    addLog({ level: "info", type: "tts", message: "Generated local Thai TTS audio", metadata: { engine: config.tts.localThaiEngine } });
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.send(audio);
  } catch (error) {
    next(error);
  } finally {
    if (tempDir) {
      void rm(tempDir, { recursive: true, force: true });
    }
  }
});

app.get("/api/logs", (_req, res) => {
  res.json({ success: true, data: logs.slice(0, 250) });
});

app.post("/api/tiktok/connect", async (req, res, next) => {
  try {
    const { username } = connectSchema.parse(req.body);
    const config = await updateConfig({ tiktok: { username } });
    broadcastConfig(config);
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

app.post("/api/test/share", (_req, res) => {
  const event: ShareAlertEvent = {
    id: id("share"),
    type: "share",
    userId: "tester_share",
    username: "tester_share",
    displayName: "Tester Share",
    profilePictureUrl: "",
    timestamp: Date.now()
  };
  handleOverlayEvent(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.post("/api/test/follow", (_req, res) => {
  const event: FollowAlertEvent = {
    id: id("follow"),
    type: "follow",
    userId: "tester_follow",
    username: "tester_follow",
    displayName: "Tester Follow",
    profilePictureUrl: "",
    timestamp: Date.now()
  };
  handleOverlayEvent(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.post("/api/test/gift", (_req, res) => {
  const event: GiftAlertEvent = {
    id: id("gift"),
    type: "gift",
    userId: "tester_gift",
    username: "tester_gift",
    displayName: "Tester Gift",
    profilePictureUrl: "",
    timestamp: Date.now(),
    giftId: "rose",
    giftName: "Rose",
    giftCount: 5,
    diamondCount: 5,
    repeatEnd: true
  };
  handleOverlayEvent(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.post("/api/test/viewer-count", (_req, res) => {
  const event = {
    id: id("viewer"),
    type: "viewer_count" as const,
    viewerCount: Math.floor(20 + Math.random() * 400),
    timestamp: Date.now()
  };
  handleOverlayEvent(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.post("/api/test/like", (_req, res) => {
  const event = {
    id: id("like"),
    type: "like" as const,
    username: "tester_like",
    likeCount: 8,
    totalLikeCount: stats.totalLikes + 8,
    timestamp: Date.now()
  };
  handleOverlayEvent(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.get("/api/chat/config", async (_req, res, next) => {
  try {
    const config = await readConfig();
    res.json({ success: true, data: config.chat });
  } catch (error) {
    next(error);
  }
});

app.put("/api/chat/config", async (req, res, next) => {
  try {
    const config = await updateConfig({ chat: req.body });
    addLog({ level: "info", type: "config_update", message: "Chat config updated", metadata: req.body });
    broadcastConfig(config);
    hub.broadcast({ type: "chat_config_updated", payload: config.chat });
    res.json({ success: true, config: config.chat, data: config.chat });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/test-message", (req, res, next) => {
  try {
    const payload = chatTestSchema.parse(req.body);
    const event = makeChatMessage({
      username: payload.username || "tester",
      displayName: payload.displayName || "Tester",
      message: payload.message
    });
    handleChatMessage(event);
    res.json({ success: true, eventId: event.id, data: { eventId: event.id } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/clear", (_req, res) => {
  recentChat.length = 0;
  stats.visibleChatCount = 0;
  broadcastChatControl("clear");
  res.json({ success: true });
});

app.post("/api/chat/pause", (_req, res) => {
  chatPaused = true;
  broadcastChatControl("pause");
  res.json({ success: true });
});

app.post("/api/chat/resume", (_req, res) => {
  chatPaused = false;
  broadcastChatControl("resume");
  res.json({ success: true });
});

app.post("/api/chat/block-user", async (req, res, next) => {
  try {
    const username = z.object({ username: z.string().trim().min(1) }).parse(req.body).username;
    const config = await readConfig();
    const blockedUsernames = unique([...config.chat.filter.blockedUsernames, username]);
    const nextConfig = await updateConfig({ chat: { filter: { blockedUsernames } } });
    broadcastConfig(nextConfig);
    hub.broadcast({ type: "chat_config_updated", payload: nextConfig.chat });
    addLog({ level: "warn", type: "config_update", message: `Blocked chat user ${username}` });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/blacklist-word", async (req, res, next) => {
  try {
    const word = z.object({ word: z.string().trim().min(1) }).parse(req.body).word;
    const config = await readConfig();
    const blacklistWords = unique([...config.chat.filter.blacklistWords, word]);
    const nextConfig = await updateConfig({ chat: { filter: { blacklistWords } } });
    broadcastConfig(nextConfig);
    hub.broadcast({ type: "chat_config_updated", payload: nextConfig.chat });
    addLog({ level: "warn", type: "config_update", message: `Added blacklist word ${word}` });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
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
  addLog({ level: "error", type: "error", message });
  res.status(500).json({ success: false, message });
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

function handleOverlayEvent(event: OverlayEvent) {
  stats.eventCounts[event.type] = (stats.eventCounts[event.type] || 0) + 1;

  if (event.type === "viewer_count") {
    stats.viewerCount = event.viewerCount;
  }

  if (event.type === "like" && typeof event.totalLikeCount === "number") {
    stats.totalLikes = event.totalLikeCount;
  }

  hub.broadcast({ type: "overlay_event", payload: event });
  hub.broadcast({ type: "stats", payload: stats });
}

function handleChatMessage(event: ChatMessageEvent) {
  stats.eventCounts.chat_message = (stats.eventCounts.chat_message || 0) + 1;
  recentChat.unshift(event);
  recentChat.splice(100);
  stats.messagesPerMinute = countRecentChats();
  stats.visibleChatCount = Math.min(recentChat.length, 100);

  if (!chatPaused) {
    hub.broadcast({ type: "chat_message", payload: event });
  } else {
    addLog({ level: "info", type: "filtered_chat", message: "Chat hidden because overlay is paused", metadata: { event } });
  }

  hub.broadcast({
    type: "chat_stats_updated",
    payload: {
      messagesPerMinute: stats.messagesPerMinute,
      filteredChatCount: stats.filteredChatCount,
      visibleChatCount: stats.visibleChatCount
    }
  });
  hub.broadcast({ type: "stats", payload: stats });
}

function broadcastStatus(status: ReturnType<TikTokLiveService["getStatus"]>) {
  hub.broadcast({ type: "status", payload: status });
}

function broadcastError(message: string) {
  hub.broadcast({ type: "error", payload: { message } });
}

function broadcastConfig(config: AppConfig) {
  hub.broadcast({ type: "config_updated", payload: config });
}

function addLog(entry: Omit<LogEntry, "id" | "timestamp"> | LogEntry) {
  const fullEntry: LogEntry = {
    id: "id" in entry ? entry.id : id("log"),
    timestamp: "timestamp" in entry ? entry.timestamp : Date.now(),
    ...entry
  };
  logs.unshift(fullEntry);
  logs.splice(500);
  hub.broadcast({ type: "log", payload: fullEntry });
}

function broadcastChatControl(action: ChatControlAction) {
  addLog({ level: "info", type: "control_action", message: `Chat ${action}` });
  hub.broadcast({ type: "chat_control", payload: { action } });
}

function userEvent(type: "share" | "follow" | "gift", username: string, displayName: string) {
  return {
    id: id(type),
    type,
    userId: username,
    username,
    displayName,
    profilePictureUrl: "",
    timestamp: Date.now()
  };
}

function makeChatMessage(input: { username: string; displayName: string; message: string }): ChatMessageEvent {
  return {
    id: id("chat"),
    type: "chat_message",
    username: input.username,
    displayName: input.displayName,
    message: input.message,
    timestamp: Date.now(),
    badges: [],
    metadata: { test: true }
  };
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function countRecentChats() {
  const cutoff = Date.now() - 60000;
  return recentChat.filter((chat) => chat.timestamp >= cutoff).length;
}

function runLocalThaiTts(input: {
  pythonPath: string;
  scriptPath: string;
  engine: string;
  text: string;
  referenceAudioPath: string;
  referenceText: string;
  speed: number;
  outputPath: string;
}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(input.pythonPath, [
      input.scriptPath,
      "--engine",
      input.engine,
      "--text",
      input.text,
      "--reference-audio",
      input.referenceAudioPath,
      "--reference-text",
      input.referenceText,
      "--speed",
      String(input.speed),
      "--output",
      input.outputPath
    ], {
      windowsHide: true
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `Local Thai TTS failed with exit code ${code}`));
    });
  });
}

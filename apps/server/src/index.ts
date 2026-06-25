import http from "node:http";
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
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
const localThaiTtsTimeoutMs = 180000;
const localThaiPreflightTimeoutMs = 30000;
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

app.get("/api/tts/local-thai/preflight", async (_req, res, next) => {
  try {
    const config = await readConfig();
    const result = await checkLocalThaiTts(config);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
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

    const preflight = await checkLocalThaiTts(config);
    if (!preflight.ready) {
      res.status(400).json({
        success: false,
        message: `Local Thai TTS is not ready: ${preflight.checks.filter((check) => !check.ok).map((check) => check.message).join("; ")}`,
        data: preflight
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
      outputPath,
      timeoutMs: localThaiTtsTimeoutMs
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

  if (event.type === "like") {
    if (typeof event.totalLikeCount === "number") {
      stats.totalLikes = event.totalLikeCount;
    } else if (typeof event.likeCount === "number") {
      stats.totalLikes += event.likeCount;
    }
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

type LocalThaiTtsCheck = {
  name: string;
  ok: boolean;
  message: string;
};

type LocalThaiTtsPreflight = {
  ready: boolean;
  checks: LocalThaiTtsCheck[];
};

async function checkLocalThaiTts(config: AppConfig): Promise<LocalThaiTtsPreflight> {
  const checks: LocalThaiTtsCheck[] = [];
  const pythonPath = config.tts.localThaiPythonPath.trim();
  const referenceAudioPath = config.tts.localThaiReferenceAudioPath.trim();
  const referenceText = config.tts.localThaiReferenceText.trim();

  if (!pythonPath) {
    checks.push({ name: "python", ok: false, message: "Set a Python path before using Local Thai TTS" });
  } else {
    try {
      const version = await runPythonVersionCheck(pythonPath, localThaiPreflightTimeoutMs);
      checks.push({ name: "python", ok: true, message: `Python is available (${version})` });
    } catch (error) {
      checks.push({ name: "python", ok: false, message: error instanceof Error ? error.message : "Python check failed" });
    }

    try {
      await runPythonDependencyCheck(pythonPath, localThaiPreflightTimeoutMs);
      checks.push({ name: "dependencies", ok: true, message: "Python dependencies are installed" });
    } catch (error) {
      const details = error instanceof Error ? error.message : "Dependency check failed";
      checks.push({ name: "dependencies", ok: false, message: `${details}. Install torch, soundfile, and flowtts dependencies` });
    }
  }

  if (!referenceAudioPath) {
    checks.push({ name: "reference-audio", ok: false, message: "Set a reference WAV path before using Local Thai TTS" });
  } else if (path.extname(referenceAudioPath).toLowerCase() !== ".wav") {
    checks.push({ name: "reference-audio", ok: false, message: "Reference audio must be a .wav file" });
  } else {
    try {
      await access(referenceAudioPath, fsConstants.R_OK);
      checks.push({ name: "reference-audio", ok: true, message: "Reference WAV is readable" });
    } catch {
      checks.push({ name: "reference-audio", ok: false, message: `Reference audio not found or unreadable: ${referenceAudioPath}` });
    }
  }

  checks.push(
    referenceText
      ? { name: "reference-text", ok: true, message: "Reference text is set" }
      : { name: "reference-text", ok: false, message: "Set reference text that matches the WAV before using Local Thai TTS" }
  );

  return {
    ready: checks.every((check) => check.ok),
    checks
  };
}

async function runPythonVersionCheck(pythonPath: string, timeoutMs: number) {
  const result = await runProcess({
    command: pythonPath,
    args: ["--version"],
    timeoutMs,
    timeoutMessage: "Python version check timed out",
    fallbackMessage: "Python is not available from the configured path"
  });

  return (result.stdout || result.stderr).trim() || "version unknown";
}

async function runPythonDependencyCheck(pythonPath: string, timeoutMs: number) {
  const code = [
    "import importlib.util, sys",
    "mods = ['torch', 'soundfile', 'flowtts']",
    "missing = [m for m in mods if importlib.util.find_spec(m) is None]",
    "if missing:",
    "    print('Missing Python modules: ' + ', '.join(missing), file=sys.stderr)",
    "    sys.exit(2)",
    "print(sys.version.split()[0])"
  ].join("\n");
  const result = await runProcess({
    command: pythonPath,
    args: ["-c", code],
    timeoutMs,
    timeoutMessage: "Python dependency check timed out",
    fallbackMessage: "Python is not available from the configured path"
  });

  return result.stdout.trim();
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
  timeoutMs: number;
}) {
  return runProcess({
    command: input.pythonPath,
    args: [
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
    ],
    timeoutMs: input.timeoutMs,
    timeoutMessage: `Local Thai TTS timed out after ${Math.round(input.timeoutMs / 1000)} seconds`,
    fallbackMessage: "Local Thai TTS failed"
  }).then(() => undefined);
}

function runProcess(input: {
  command: string;
  args: string[];
  timeoutMs: number;
  timeoutMessage: string;
  fallbackMessage: string;
}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(input.command, input.args, { windowsHide: true });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      reject(new Error(input.timeoutMessage));
    }, input.timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      reject(new Error(`${input.fallbackMessage}: ${error.message}`));
    });
    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || `${input.fallbackMessage} with exit code ${code}`));
    });
  });
}

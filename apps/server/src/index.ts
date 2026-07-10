import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  GoalAlertEvent,
  GoalConfig,
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
const uploadsDir = path.resolve(process.cwd(), "apps/server/data/uploads");
const uploadsUrlPath = "/uploads";
const aiThaiTtsTimeoutMs = 180000;
const aiThaiPreflightTimeoutMs = 30000;
const aiThaiPythonPath = process.env.AI_THAI_PYTHON_PATH?.trim() || "python";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
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

const uploadSchema = z.object({
  fileName: z.string().trim().min(1),
  dataUrl: z.string().min(1)
});

const goalProgressSchema = z.object({
  id: z.string().trim().min(1),
  amount: z.number().min(0).default(1)
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(uploadsUrlPath, express.static(uploadsDir));

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

app.post("/api/uploads", async (req, res, next) => {
  try {
    const payload = uploadSchema.parse(req.body);
    const saved = await saveUpload(payload.fileName, payload.dataUrl);
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tts/ai-thai/preflight", async (_req, res, next) => {
  try {
    const config = await readConfig();
    const result = await checkAiThaiTts(config);
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

    if (config.tts.engine !== "ai-thai") {
      res.status(400).json({ success: false, message: "AI Thai TTS engine is not enabled" });
      return;
    }

    const preflight = await checkAiThaiTts(config);
    if (!preflight.ready) {
      res.status(400).json({
        success: false,
        message: `AI Thai TTS is not ready: ${preflight.checks.filter((check) => !check.ok).map((check) => check.message).join("; ")}`,
        data: preflight
      });
      return;
    }

    tempDir = await mkdtemp(path.join(os.tmpdir(), "tiktok-live-tts-"));
    const outputPath = path.join(tempDir, "speech.mp3");
    const scriptPath = path.join(repoRoot, "scripts/ai_thai_tts.py");

    await runAiThaiTts({
      pythonPath: aiThaiPythonPath,
      scriptPath,
      voice: config.tts.aiThaiVoice,
      text,
      speed: config.tts.rate,
      outputPath,
      timeoutMs: aiThaiTtsTimeoutMs
    });

    const audio = await readFile(outputPath);
    addLog({ level: "info", type: "tts", message: "Generated AI Thai TTS audio", metadata: { voice: config.tts.aiThaiVoice } });
    res.setHeader("Content-Type", "audio/mpeg");
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
    const config = await resetSessionGoals(await updateConfig({ tiktok: { username } }));
    broadcastConfig(config);
    hub.broadcast({ type: "goal_updated", payload: config.goals });
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
  const currentCount = stats.viewerCount > 0 ? stats.viewerCount : 120;
  const delta = Math.floor(Math.random() * 13) - 4;
  const viewerCount = Math.max(1, currentCount + delta);
  const event = {
    id: id("viewer"),
    type: "viewer_count" as const,
    viewerCount,
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

app.post("/api/test/comment", (_req, res) => {
  const event: ChatMessageEvent = {
    id: id("comment"),
    type: "chat_message",
    userId: "tester_comment",
    username: "tester_comment",
    displayName: "Tester Comment",
    profilePictureUrl: "",
    message: "This is a test chat message",
    timestamp: Date.now()
  };
  handleChatMessage(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.post("/api/test/goal", (_req, res) => {
  const event: GoalAlertEvent = {
    id: id("goal"),
    type: "goal",
    goalId: "test_goal",
    goalTitle: "Test Goal",
    currentValue: 100,
    targetValue: 100,
    timestamp: Date.now()
  };
  handleOverlayEvent(event);
  res.json({ success: true, data: { eventId: event.id } });
});

app.post("/api/test/goal-progress", async (req, res, next) => {
  try {
    const payload = goalProgressSchema.parse(req.body);
    const goals = await incrementGoal(payload.id, payload.amount);
    res.json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
});

app.post("/api/goals/:id/reset", async (req, res, next) => {
  try {
    const config = await readConfig();
    const goals = config.goals.map((goal) =>
      goal.id === req.params.id ? { ...goal, currentValue: 0, completed: false, isPaused: false } : goal
    );
    const nextConfig = await updateConfig({ goals });
    broadcastConfig(nextConfig);
    hub.broadcast({ type: "goal_updated", payload: nextConfig.goals });
    res.json({ success: true, data: nextConfig.goals });
  } catch (error) {
    next(error);
  }
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
  void applyGoalProgress(event);
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
  handleOverlayEvent({
    ...event,
    id: id("comment"),
    type: "comment"
  });
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

async function saveUpload(fileName: string, dataUrl: string) {
  const extension = path.extname(fileName).toLowerCase();
  const audioExtensions = new Set([".mp3", ".wav", ".ogg"]);
  const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
  if (!audioExtensions.has(extension) && !imageExtensions.has(extension)) {
    throw new Error("Unsupported upload type");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Upload must be a base64 data URL");
  }

  const safeBase = path.basename(fileName, extension).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "upload";
  const outputName = `${safeBase}_${Date.now()}${extension}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, outputName), Buffer.from(match[2], "base64"));

  return {
    url: `${uploadsUrlPath}/${outputName}`,
    mediaKind: audioExtensions.has(extension) ? "audio" : "image"
  };
}

async function applyGoalProgress(event: OverlayEvent) {
  if (event.type === "goal" || event.type === "viewer_count" || event.type === "system") {
    return;
  }

  const amountByType = goalAmountForEvent(event);
  if (!amountByType) {
    return;
  }

  const config = await readConfig();
  const goals = config.goals.map((goal) => advanceGoal(goal, amountByType));
  if (JSON.stringify(goals) === JSON.stringify(config.goals)) {
    return;
  }

  const nextConfig = await updateConfig({ goals });
  broadcastConfig(nextConfig);
  hub.broadcast({ type: "goal_updated", payload: nextConfig.goals });

  nextConfig.goals
    .filter((goal) => goal.completed && !config.goals.find((previous) => previous.id === goal.id)?.completed && goal.triggerAlertOnComplete)
    .forEach((goal) => {
      handleOverlayEvent({
        id: id("goal"),
        type: "goal",
        goalId: goal.id,
        goalTitle: goal.title,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        timestamp: Date.now()
      });
    });
}

function goalAmountForEvent(event: OverlayEvent): Partial<Record<GoalConfig["type"], number>> {
  if (event.type === "like") {
    return { like: event.likeCount || 1 };
  }
  if (event.type === "follow") {
    return { follow: 1 };
  }
  if (event.type === "share") {
    return { share: 1 };
  }
  if (event.type === "gift") {
    return { gift: event.giftCount || 1, coin: event.diamondCount || 0 };
  }
  return {};
}

function advanceGoal(goal: GoalConfig, amounts: Partial<Record<GoalConfig["type"], number>>) {
  const amount = amounts[goal.type] ?? (goal.type === "custom" ? 0 : undefined);
  if (!goal.enabled || goal.isPaused || goal.completed || !amount) {
    return goal;
  }

  const currentValue = Math.min(goal.targetValue, goal.currentValue + amount);
  return {
    ...goal,
    currentValue,
    completed: currentValue >= goal.targetValue
  };
}

async function incrementGoal(idValue: string, amount: number) {
  const config = await readConfig();
  const goals = config.goals.map((goal) =>
    goal.id === idValue
      ? {
          ...goal,
          currentValue: Math.min(goal.targetValue, goal.currentValue + amount),
          completed: goal.currentValue + amount >= goal.targetValue
        }
      : goal
  );
  const nextConfig = await updateConfig({ goals });
  broadcastConfig(nextConfig);
  hub.broadcast({ type: "goal_updated", payload: nextConfig.goals });
  return nextConfig.goals;
}

async function resetSessionGoals(config: AppConfig) {
  const goals = config.goals.map((goal) =>
    goal.resetMode === "session"
      ? {
          ...goal,
          currentValue: 0,
          completed: false,
          isPaused: false
        }
      : goal
  );

  if (JSON.stringify(goals) === JSON.stringify(config.goals)) {
    return config;
  }

  return updateConfig({ goals });
}

type AiThaiTtsCheck = {
  name: string;
  ok: boolean;
  message: string;
};

type AiThaiTtsPreflight = {
  ready: boolean;
  checks: AiThaiTtsCheck[];
};

async function checkAiThaiTts(config: AppConfig): Promise<AiThaiTtsPreflight> {
  const checks: AiThaiTtsCheck[] = [];
  const pythonPath = aiThaiPythonPath;

  try {
    const version = await runPythonVersionCheck(pythonPath, aiThaiPreflightTimeoutMs);
    checks.push({ name: "python", ok: true, message: `Python is available (${version})` });
  } catch (error) {
    checks.push({ name: "python", ok: false, message: error instanceof Error ? error.message : "Python check failed" });
  }

  try {
    await runPythonDependencyCheck(pythonPath, aiThaiPreflightTimeoutMs);
    checks.push({ name: "dependencies", ok: true, message: "edge-tts is installed" });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Dependency check failed";
    checks.push({ name: "dependencies", ok: false, message: `${details}. Install edge-tts` });
  }

  checks.push({ name: "voice", ok: true, message: `Using AI voice ${config.tts.aiThaiVoice}` });

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
    "mods = ['edge_tts']",
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

function runAiThaiTts(input: {
  pythonPath: string;
  scriptPath: string;
  voice: string;
  text: string;
  speed: number;
  outputPath: string;
  timeoutMs: number;
}) {
  return runProcess({
    command: input.pythonPath,
    args: [
      input.scriptPath,
      "--voice",
      input.voice,
      "--text",
      input.text,
      "--speed",
      String(input.speed),
      "--output",
      input.outputPath
    ],
    timeoutMs: input.timeoutMs,
    timeoutMessage: `AI Thai TTS timed out after ${Math.round(input.timeoutMs / 1000)} seconds`,
    fallbackMessage: "AI Thai TTS failed"
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

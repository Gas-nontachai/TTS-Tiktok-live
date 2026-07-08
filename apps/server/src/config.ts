import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { AppConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, "../data/config.json");

export const defaultConfig: AppConfig = {
  tiktok: {
    username: ""
  },
  alerts: {
    like: {
      enabled: true,
      playSound: true,
      ttsEnabled: false,
      visualMode: "custom",
      visualTemplate: "minimal-toast",
      template: "{likeCount} likes from {displayName}",
      soundUrl: "",
      mediaUrl: "",
      mediaType: "image",
      mediaSize: 96,
      mediaPosition: "left",
      durationMs: 2200,
      cooldownMs: 0,
      volume: 65,
      enterAnimation: "bounce",
      exitAnimation: "fade",
      animationDurationMs: 300,
      stylePreset: "neon",
      rateLimitPerSecond: 6,
      batchEnabled: true,
      batchWindowMs: 650,
      minimumTriggerCount: 1
    },
    comment: {
      enabled: true,
      playSound: true,
      ttsEnabled: false,
      visualMode: "custom",
      visualTemplate: "minimal-toast",
      template: "{displayName}: {message}",
      soundUrl: "",
      mediaUrl: "",
      mediaType: "image",
      mediaSize: 96,
      mediaPosition: "left",
      durationMs: 3500,
      cooldownMs: 500,
      volume: 65,
      enterAnimation: "slide-up",
      exitAnimation: "fade",
      animationDurationMs: 300,
      stylePreset: "minimal",
      rateLimitPerSecond: 4,
      batchEnabled: false,
      batchWindowMs: 700,
      minimumTriggerCount: 1
    },
    share: {
      enabled: true,
      playSound: true,
      ttsEnabled: false,
      visualMode: "template",
      visualTemplate: "neon-pop",
      template: "{username} แชร์ไลฟ์แล้ว ขอบคุณมากครับ",
      soundUrl: "",
      mediaUrl: "",
      mediaType: "image",
      mediaSize: 96,
      mediaPosition: "left",
      durationMs: 4000,
      cooldownMs: 5000,
      volume: 80,
      enterAnimation: "slide-up",
      exitAnimation: "fade",
      animationDurationMs: 300,
      stylePreset: "glass",
      rateLimitPerSecond: 4,
      batchEnabled: false,
      batchWindowMs: 700,
      minimumTriggerCount: 1
    },
    follow: {
      enabled: true,
      playSound: true,
      ttsEnabled: true,
      visualMode: "template",
      visualTemplate: "big-shoutout",
      template: "ขอบคุณ {username} ที่กดติดตามครับ",
      soundUrl: "",
      mediaUrl: "",
      mediaType: "image",
      mediaSize: 96,
      mediaPosition: "left",
      durationMs: 5000,
      cooldownMs: 3000,
      volume: 80,
      enterAnimation: "pop",
      exitAnimation: "fade",
      animationDurationMs: 320,
      stylePreset: "neon",
      rateLimitPerSecond: 4,
      batchEnabled: false,
      batchWindowMs: 700,
      minimumTriggerCount: 1
    },
    gift: {
      enabled: true,
      playSound: true,
      ttsEnabled: true,
      visualMode: "template",
      visualTemplate: "gift-pop",
      template: "ขอบคุณ {username} สำหรับ {giftName} x{giftCount}",
      soundUrl: "",
      mediaUrl: "",
      mediaType: "image",
      mediaSize: 96,
      mediaPosition: "left",
      durationMs: 6000,
      cooldownMs: 0,
      volume: 90,
      minGiftCount: 1,
      minDiamondCount: 0,
      waitForRepeatEnd: true,
      enterAnimation: "bounce",
      exitAnimation: "fade",
      animationDurationMs: 360,
      stylePreset: "solid",
      rateLimitPerSecond: 8,
      batchEnabled: false,
      batchWindowMs: 700,
      minimumTriggerCount: 1
    },
    goal: {
      enabled: true,
      playSound: true,
      ttsEnabled: true,
      visualMode: "template",
      visualTemplate: "goal-complete",
      template: "{goalTitle} complete: {currentValue}/{targetValue}",
      soundUrl: "",
      mediaUrl: "",
      mediaType: "image",
      mediaSize: 120,
      mediaPosition: "top",
      durationMs: 7000,
      cooldownMs: 0,
      volume: 90,
      enterAnimation: "bounce",
      exitAnimation: "fade",
      animationDurationMs: 360,
      stylePreset: "solid",
      rateLimitPerSecond: 4,
      batchEnabled: false,
      batchWindowMs: 700,
      minimumTriggerCount: 1
    }
  },
  alertQueue: {
    maxQueueSize: 50,
    allowGiftInterrupt: true,
    clearQueueOnDisconnect: false
  },
  viewerCount: {
    enabled: true,
    position: "top-right",
    showIcon: true,
    label: "ผู้ชม",
    fontSize: 28,
    animationPreset: "pulse"
  },
  likeHearts: {
    enabled: true,
    maxHeartsOnScreen: 30,
    heartSize: 32,
    animationDurationMs: 1800,
    spawnPosition: "bottom-right",
    intensity: "normal",
    animationPreset: "float-up"
  },
  tts: {
    enabled: true,
    playerEnabled: true,
    speakAlerts: true,
    speakChat: true,
    engine: "ai-thai",
    aiThaiVoice: "th-TH-PremwadeeNeural",
    chatPrefix: "",
    queueMode: "queue",
    maxQueueSize: 20,
    cooldownMs: 1000,
    muted: false,
    lang: "th-TH",
    voiceName: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    template: "{displayName} พูดว่า {message}"
  },
  sounds: {
    enabled: true,
    masterVolume: 0.9,
    shareVolume: 0.8,
    followVolume: 0.8,
    giftVolume: 0.9,
    sharePreset: "chime",
    followPreset: "soft-bell",
    giftPreset: "coin"
  },
  overlay: {
    showAlerts: true,
    showViewerCount: true,
    showHearts: true,
    showGoals: true,
    showChatInMain: false,
    alertPosition: "top-right"
  },
  goals: [
    {
      id: "session_likes",
      title: "Road to 10,000 Likes",
      type: "like",
      currentValue: 0,
      targetValue: 10000,
      enabled: false,
      isPaused: false,
      resetMode: "session",
      triggerAlertOnComplete: true,
      completed: false
    },
    {
      id: "session_followers",
      title: "Road to 100 Followers",
      type: "follow",
      currentValue: 0,
      targetValue: 100,
      enabled: false,
      isPaused: false,
      resetMode: "session",
      triggerAlertOnComplete: true,
      completed: false
    }
  ],
  chat: {
    enabled: true,
    overlayUrl: "http://localhost:3000/overlay/chat",
    display: {
      showAvatar: true,
      showUsername: true,
      showDisplayName: true,
      showTimestamp: false,
      showBadges: false,
      compactMode: false,
      messageOrder: "oldest-first"
    },
    queue: {
      maxVisibleMessages: 8,
      messageLifetimeMs: 15000,
      removeOldMessages: true,
      newestPosition: "bottom"
    },
    animation: {
      enabled: true,
      enterAnimation: "slide-up",
      exitAnimation: "fade",
      durationMs: 300
    },
    theme: {
      fontFamily: "system-ui, sans-serif",
      fontSize: 24,
      usernameFontSize: 22,
      messageFontSize: 24,
      textColor: "#ffffff",
      usernameColor: "#ff4fd8",
      backgroundColor: "transparent",
      bubbleColor: "rgba(0, 0, 0, 0.55)",
      borderColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 16,
      opacity: 100,
      spacing: 10,
      padding: 12,
      shadowEnabled: true
    },
    position: {
      position: "bottom-left",
      width: 520,
      height: 700,
      offsetX: 40,
      offsetY: 80
    },
    filter: {
      enabled: true,
      blacklistWords: [],
      blockedUsernames: [],
      hideDuplicateMessages: true,
      duplicateWindowMs: 5000,
      maxMessageLength: 200,
      hideLinks: true,
      hideEmojiOnlyMessages: false
    },
    tts: {
      enabled: false,
      onlyWhenPrefix: "!tts",
      cooldownMs: 3000,
      maxQueueSize: 10
    }
  }
};

const positionSchema = z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]);
const alertAnimationSchema = z.enum(["fade", "slide-up", "slide-left", "pop", "bounce", "zoom", "flip", "glow-pulse"]);
const chatAnimationSchema = z.enum(["none", "fade", "slide-up", "slide-left", "slide-right", "pop", "stack-pop", "soft-drop"]);
const heartAnimationSchema = z.enum(["float-up", "burst", "spiral", "side-float", "confetti"]);
const viewerAnimationSchema = z.enum(["none", "fade", "pulse", "count-pop"]);
const soundPresetSchema = z.enum(["none", "chime", "pop", "sparkle", "coin", "soft-bell", "digital"]);
const mediaTypeSchema = z.enum(["image", "gif", "webp"]);
const mediaPositionSchema = z.enum(["top", "bottom", "left", "right"]);
const alertVisualModeSchema = z.enum(["template", "custom"]);
const alertVisualTemplateSchema = z.enum(["gift-pop", "neon-pop", "minimal-toast", "big-shoutout", "goal-complete"]);
const goalTypeSchema = z.enum(["like", "follow", "gift", "coin", "share", "custom"]);
const goalResetModeSchema = z.enum(["session", "manual", "persistent"]);
const aiThaiVoiceSchema = z.enum(["th-TH-PremwadeeNeural", "th-TH-NiwatNeural"]);
const alertSchema = z.object({
  enabled: z.boolean(),
  playSound: z.boolean(),
  ttsEnabled: z.boolean(),
  visualMode: alertVisualModeSchema,
  visualTemplate: alertVisualTemplateSchema,
  template: z.string().min(1),
  soundUrl: z.string(),
  mediaUrl: z.string(),
  mediaType: mediaTypeSchema,
  mediaSize: z.number().int().min(16).max(512),
  mediaPosition: mediaPositionSchema,
  durationMs: z.number().int().min(500).max(60000),
  cooldownMs: z.number().int().min(0).max(60000),
  volume: z.number().min(0).max(100),
  enterAnimation: alertAnimationSchema,
  exitAnimation: alertAnimationSchema,
  animationDurationMs: z.number().int().min(0).max(5000),
  stylePreset: z.enum(["glass", "neon", "solid", "minimal"]),
  rateLimitPerSecond: z.number().int().min(0).max(60),
  batchEnabled: z.boolean(),
  batchWindowMs: z.number().int().min(100).max(10000),
  minimumTriggerCount: z.number().int().min(1).max(1000000)
});
const goalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: goalTypeSchema,
  currentValue: z.number().min(0),
  targetValue: z.number().min(1),
  enabled: z.boolean(),
  isPaused: z.boolean(),
  resetMode: goalResetModeSchema,
  triggerAlertOnComplete: z.boolean(),
  completed: z.boolean()
});

const configSchema = z.object({
  tiktok: z.object({
    username: z.string().trim().default("")
  }),
  alerts: z.object({
    like: alertSchema,
    comment: alertSchema,
    share: alertSchema,
    follow: alertSchema,
    gift: alertSchema.extend({
      minGiftCount: z.number().int().min(1),
      minDiamondCount: z.number().int().min(0),
      waitForRepeatEnd: z.boolean()
    }),
    goal: alertSchema
  }),
  alertQueue: z.object({
    maxQueueSize: z.number().int().min(1).max(200),
    allowGiftInterrupt: z.boolean(),
    clearQueueOnDisconnect: z.boolean()
  }),
  viewerCount: z.object({
    enabled: z.boolean(),
    position: positionSchema,
    showIcon: z.boolean(),
    label: z.string(),
    fontSize: z.number().int().min(10).max(96),
    animationPreset: viewerAnimationSchema
  }),
  likeHearts: z.object({
    enabled: z.boolean(),
    maxHeartsOnScreen: z.number().int().min(1).max(200),
    heartSize: z.number().int().min(8).max(128),
    animationDurationMs: z.number().int().min(300).max(10000),
    spawnPosition: positionSchema,
    intensity: z.enum(["low", "normal", "high"]),
    animationPreset: heartAnimationSchema
  }),
  tts: z.object({
    enabled: z.boolean(),
    playerEnabled: z.boolean(),
    speakAlerts: z.boolean(),
    speakChat: z.boolean(),
    engine: z.literal("ai-thai").default("ai-thai"),
    aiThaiVoice: aiThaiVoiceSchema.default("th-TH-PremwadeeNeural"),
    chatPrefix: z.string(),
    queueMode: z.enum(["queue", "interrupt"]),
    maxQueueSize: z.number().int().min(1).max(200),
    cooldownMs: z.number().int().min(0).max(60000),
    muted: z.boolean(),
    lang: z.string().min(1),
    voiceName: z.string(),
    rate: z.number().min(0.1).max(10),
    pitch: z.number().min(0).max(2),
    volume: z.number().min(0).max(1),
    template: z.string().min(1)
  }),
  sounds: z.object({
    enabled: z.boolean(),
    masterVolume: z.number().min(0).max(1),
    shareVolume: z.number().min(0).max(1),
    followVolume: z.number().min(0).max(1),
    giftVolume: z.number().min(0).max(1),
    sharePreset: soundPresetSchema,
    followPreset: soundPresetSchema,
    giftPreset: soundPresetSchema
  }),
  overlay: z.object({
    showAlerts: z.boolean(),
    showViewerCount: z.boolean(),
    showHearts: z.boolean(),
    showGoals: z.boolean(),
    showChatInMain: z.boolean(),
    alertPosition: positionSchema
  }),
  goals: z.array(goalSchema),
  chat: z.object({
    enabled: z.boolean(),
    overlayUrl: z.string(),
    display: z.object({
      showAvatar: z.boolean(),
      showUsername: z.boolean(),
      showDisplayName: z.boolean(),
      showTimestamp: z.boolean(),
      showBadges: z.boolean(),
      compactMode: z.boolean(),
      messageOrder: z.enum(["oldest-first", "newest-first"])
    }),
    queue: z.object({
      maxVisibleMessages: z.number().int().min(1).max(100),
      messageLifetimeMs: z.number().int().min(1000).max(120000),
      removeOldMessages: z.boolean(),
      newestPosition: z.enum(["top", "bottom"])
    }),
    animation: z.object({
      enabled: z.boolean(),
      enterAnimation: chatAnimationSchema,
      exitAnimation: z.enum(["none", "fade", "slide-up", "slide-left", "slide-right"]),
      durationMs: z.number().int().min(0).max(5000)
    }),
    theme: z.object({
      fontFamily: z.string(),
      fontSize: z.number().int().min(8).max(96),
      usernameFontSize: z.number().int().min(8).max(96),
      messageFontSize: z.number().int().min(8).max(96),
      textColor: z.string(),
      usernameColor: z.string(),
      backgroundColor: z.string(),
      bubbleColor: z.string(),
      borderColor: z.string(),
      borderRadius: z.number().int().min(0).max(64),
      opacity: z.number().min(0).max(100),
      spacing: z.number().int().min(0).max(64),
      padding: z.number().int().min(0).max(64),
      shadowEnabled: z.boolean()
    }),
    position: z.object({
      position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "custom"]),
      width: z.number().int().min(160).max(1920),
      height: z.number().int().min(120).max(1920),
      offsetX: z.number().int().min(0).max(1000),
      offsetY: z.number().int().min(0).max(1000)
    }),
    filter: z.object({
      enabled: z.boolean(),
      blacklistWords: z.array(z.string()),
      blockedUsernames: z.array(z.string()),
      hideDuplicateMessages: z.boolean(),
      duplicateWindowMs: z.number().int().min(0).max(60000),
      maxMessageLength: z.number().int().min(1).max(2000),
      hideLinks: z.boolean(),
      hideEmojiOnlyMessages: z.boolean()
    }),
    tts: z.object({
      enabled: z.boolean(),
      onlyWhenPrefix: z.string().nullable(),
      cooldownMs: z.number().int().min(0).max(60000),
      maxQueueSize: z.number().int().min(1).max(100)
    })
  })
});

export const updateConfigSchema = configSchema.deepPartial();

async function ensureDataDir() {
  await mkdir(path.dirname(configPath), { recursive: true });
}

function mergeConfig(raw: unknown): AppConfig {
  const existing = typeof raw === "object" && raw ? (raw as Record<string, unknown>) : {};
  const legacyTts = (existing.tts as Record<string, unknown> | undefined) ?? {};

  return configSchema.parse({
    ...defaultConfig,
    ...existing,
    tiktok: {
      ...defaultConfig.tiktok,
      ...(existing.tiktok as object | undefined)
    },
    alerts: {
      ...defaultConfig.alerts,
      ...(existing.alerts as object | undefined),
      like: mergeAlertConfig(defaultConfig.alerts.like, (existing.alerts as { like?: object } | undefined)?.like),
      comment: mergeAlertConfig(defaultConfig.alerts.comment, (existing.alerts as { comment?: object } | undefined)?.comment),
      share: mergeAlertConfig(defaultConfig.alerts.share, (existing.alerts as { share?: object } | undefined)?.share),
      follow: mergeAlertConfig(defaultConfig.alerts.follow, (existing.alerts as { follow?: object } | undefined)?.follow),
      gift: mergeAlertConfig(defaultConfig.alerts.gift, (existing.alerts as { gift?: object } | undefined)?.gift),
      goal: mergeAlertConfig(defaultConfig.alerts.goal, (existing.alerts as { goal?: object } | undefined)?.goal)
    },
    alertQueue: {
      ...defaultConfig.alertQueue,
      ...(existing.alertQueue as object | undefined)
    },
    viewerCount: {
      ...defaultConfig.viewerCount,
      ...(existing.viewerCount as object | undefined)
    },
    likeHearts: {
      ...defaultConfig.likeHearts,
      ...(existing.likeHearts as object | undefined)
    },
    tts: {
      ...defaultConfig.tts,
      ...legacyTts,
      engine: "ai-thai",
      aiThaiVoice: normalizeAiThaiVoice(legacyTts.aiThaiVoice),
      muted: typeof legacyTts.muted === "boolean" ? legacyTts.muted : defaultConfig.tts.muted
    },
    sounds: {
      ...defaultConfig.sounds,
      ...(existing.sounds as object | undefined)
    },
    overlay: {
      ...defaultConfig.overlay,
      ...(existing.overlay as object | undefined)
    },
    goals: mergeGoals((existing.goals as object[] | undefined) ?? []),
    chat: {
      ...defaultConfig.chat,
      ...(existing.chat as object | undefined),
      display: {
        ...defaultConfig.chat.display,
        ...((existing.chat as { display?: object } | undefined)?.display ?? {})
      },
      queue: {
        ...defaultConfig.chat.queue,
        ...((existing.chat as { queue?: object } | undefined)?.queue ?? {})
      },
      animation: {
        ...defaultConfig.chat.animation,
        ...((existing.chat as { animation?: object } | undefined)?.animation ?? {})
      },
      theme: {
        ...defaultConfig.chat.theme,
        ...((existing.chat as { theme?: object } | undefined)?.theme ?? {})
      },
      position: {
        ...defaultConfig.chat.position,
        ...((existing.chat as { position?: object } | undefined)?.position ?? {})
      },
      filter: {
        ...defaultConfig.chat.filter,
        ...((existing.chat as { filter?: object } | undefined)?.filter ?? {})
      },
      tts: {
        ...defaultConfig.chat.tts,
        ...((existing.chat as { tts?: object } | undefined)?.tts ?? {})
      }
    }
  }) as AppConfig;
}

function mergeAlertConfig<T extends AppConfig["alerts"][keyof AppConfig["alerts"]]>(defaults: T, raw: object | undefined): T {
  if (!raw) {
    return defaults;
  }

  const existing = raw as Partial<T> & { visualMode?: unknown; visualTemplate?: unknown };
  const legacyVisualFallback = existing.visualMode === undefined
    ? { visualMode: "custom" as const, visualTemplate: "minimal-toast" as const }
    : {};

  return {
    ...defaults,
    ...existing,
    ...legacyVisualFallback
  };
}

function normalizeAiThaiVoice(value: unknown): AppConfig["tts"]["aiThaiVoice"] {
  if (value === "th-TH-PremwadeeNeural" || value === "th-TH-NiwatNeural") {
    return value;
  }

  return defaultConfig.tts.aiThaiVoice;
}

function mergeGoals(rawGoals: object[]) {
  if (!rawGoals.length) {
    return defaultConfig.goals;
  }

  return rawGoals.map((goal, index) => ({
    ...defaultConfig.goals[0],
    id: `goal_${index + 1}`,
    title: `Goal ${index + 1}`,
    ...goal
  }));
}

async function writeConfig(config: AppConfig): Promise<AppConfig> {
  await ensureDataDir();
  const parsed = configSchema.parse(config);
  await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

export async function readConfig(): Promise<AppConfig> {
  await ensureDataDir();

  try {
    const rawConfig = await readFile(configPath, "utf8");
    const parsed = mergeConfig(JSON.parse(rawConfig));
    await writeConfig(parsed);
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError || error instanceof z.ZodError) {
      await writeConfig(defaultConfig);
      return defaultConfig;
    }

    throw error;
  }
}

export async function replaceConfig(config: AppConfig): Promise<AppConfig> {
  return writeConfig(mergeConfig(config));
}

export async function updateConfig(partial: z.infer<typeof updateConfigSchema>): Promise<AppConfig> {
  const current = await readConfig();
  return writeConfig(mergeConfig(deepMerge(current, partial)));
}

function deepMerge<T>(target: T, partial: unknown): T {
  if (!partial || typeof partial !== "object") {
    return target;
  }

  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const [key, value] of Object.entries(partial)) {
    const currentValue = output[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      currentValue &&
      typeof currentValue === "object" &&
      !Array.isArray(currentValue)
    ) {
      output[key] = deepMerge(currentValue, value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }

  return output as T;
}

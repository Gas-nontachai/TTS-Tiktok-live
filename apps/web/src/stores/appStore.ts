import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppConfig, AppStats, ChatMessageEvent, DeepPartial, GoalConfig, GoalState, LogEntry, OverlayEvent, TikTokStatus } from "../types";

export const defaultConfig: AppConfig = {
  tiktok: { username: "" },
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
    showIcon: false,
    label: "ผู้ชม",
    fontSize: 28,
    animationPreset: "count-pop"
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
      visualTemplate: "event-bar",
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
      visualTemplate: "event-bar",
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
      messageLifetimeMs: 8000,
      removeOldMessages: true,
      newestPosition: "bottom"
    },
    animation: {
      enabled: true,
      enterAnimation: "slide-in",
      exitAnimation: "fade-out",
      durationMs: 220,
      enterDurationMs: 220,
      exitDurationMs: 350,
      reducedMotion: false,
      emojiSupport: true
    },
    theme: {
      fontFamily: "system",
      fontSize: 24,
      usernameFontSize: 22,
      messageFontSize: 24,
      textColor: "#ffffff",
      usernameColor: "#ff4fd8",
      backgroundColor: "transparent",
      bubbleColor: "transparent",
      borderColor: "transparent",
      borderRadius: 0,
      opacity: 100,
      spacing: 10,
      padding: 0,
      shadowEnabled: false
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

const defaultStats: AppStats = {
  viewerCount: 0,
  totalLikes: 0,
  eventCounts: {},
  messagesPerMinute: 0,
  filteredChatCount: 0,
  visibleChatCount: 0
};

interface AppState {
  config: AppConfig;
  status: TikTokStatus;
  stats: AppStats;
  overlayEvents: OverlayEvent[];
  chatMessages: ChatMessageEvent[];
  logs: LogEntry[];
  error: string;
  wsConnected: boolean;
  currentSpeakingText: string;
  chatPaused: boolean;
  setConfig: (config: AppConfig) => void;
  setGoals: (goals: GoalState[]) => void;
  patchConfig: (config: DeepPartial<AppConfig>) => void;
  setStatus: (status: TikTokStatus) => void;
  setStats: (stats: AppStats) => void;
  addOverlayEvent: (event: OverlayEvent) => void;
  addChatMessage: (message: ChatMessageEvent) => void;
  clearChat: () => void;
  addLog: (log: LogEntry) => void;
  setError: (error: string) => void;
  setWsConnected: (connected: boolean) => void;
  setCurrentSpeakingText: (text: string) => void;
  setChatPaused: (paused: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      status: {
        status: "disconnected",
        username: "",
        roomId: ""
      },
      stats: defaultStats,
      overlayEvents: [],
      chatMessages: [],
      logs: [],
      error: "",
      wsConnected: false,
      currentSpeakingText: "",
      chatPaused: false,
      setConfig: (config) => set({ config: normalizeConfig(config) }),
      setGoals: (goals) => set({ config: normalizeConfig({ ...get().config, goals }) }),
      patchConfig: (partial) => {
        set({ config: normalizeConfig(deepMerge(get().config, partial)) });
      },
      setStatus: (status) => set({ status }),
      setStats: (stats) => set({ stats }),
      addOverlayEvent: (event) => {
        set({ overlayEvents: [event, ...get().overlayEvents].slice(0, 100) });
      },
      addChatMessage: (message) => {
        set({ chatMessages: [message, ...get().chatMessages].slice(0, 100) });
      },
      clearChat: () => set({ chatMessages: [] }),
      addLog: (log) => set({ logs: [log, ...get().logs].slice(0, 250) }),
      setError: (error) => set({ error }),
      setWsConnected: (wsConnected) => set({ wsConnected }),
      setCurrentSpeakingText: (currentSpeakingText) => set({ currentSpeakingText }),
      setChatPaused: (chatPaused) => set({ chatPaused })
    }),
    {
      name: "tiktok-live-suite:config",
      version: 1,
      partialize: (state) => ({ config: state.config }),
      merge: (persisted, current) => {
        const persistedConfig = (persisted as { config?: DeepPartial<AppConfig> } | undefined)?.config;
        return {
          ...current,
          config: normalizeConfig(persistedConfig ? deepMerge(current.config, persistedConfig) : current.config)
        };
      }
    }
  )
);

function deepMerge<T>(target: T, partial: DeepPartial<T>): T {
  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const [key, value] of Object.entries(partial as Record<string, unknown>)) {
    const current = output[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      output[key] = deepMerge(current, value as DeepPartial<typeof current>);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }

  return output as T;
}

function normalizeConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    goals: config.goals.map(normalizeGoal)
  };
}

function normalizeGoal(goal: GoalConfig): GoalConfig {
  return {
    ...goal,
    visualTemplate: goal.visualTemplate ?? "event-bar"
  };
}

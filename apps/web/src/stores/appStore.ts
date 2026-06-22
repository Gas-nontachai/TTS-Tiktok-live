import { create } from "zustand";
import type { AppConfig, AppStats, ChatMessageEvent, DeepPartial, LogEntry, OverlayEvent, TikTokStatus } from "../types";

export const defaultConfig: AppConfig = {
  tiktok: { username: "" },
  alerts: {
    share: {
      enabled: true,
      playSound: true,
      ttsEnabled: false,
      template: "{username} แชร์ไลฟ์แล้ว ขอบคุณมากครับ",
      durationMs: 4000,
      cooldownMs: 5000,
      volume: 80,
      enterAnimation: "slide-up",
      exitAnimation: "fade",
      animationDurationMs: 300,
      stylePreset: "glass"
    },
    follow: {
      enabled: true,
      playSound: true,
      ttsEnabled: true,
      template: "ขอบคุณ {username} ที่กดติดตามครับ",
      durationMs: 5000,
      cooldownMs: 3000,
      volume: 80,
      enterAnimation: "pop",
      exitAnimation: "fade",
      animationDurationMs: 320,
      stylePreset: "neon"
    },
    gift: {
      enabled: true,
      playSound: true,
      ttsEnabled: true,
      template: "ขอบคุณ {username} สำหรับ {giftName} x{giftCount}",
      durationMs: 6000,
      cooldownMs: 0,
      volume: 90,
      minGiftCount: 1,
      minDiamondCount: 0,
      waitForRepeatEnd: true,
      enterAnimation: "bounce",
      exitAnimation: "fade",
      animationDurationMs: 360,
      stylePreset: "solid"
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
    speakChat: false,
    engine: "browser",
    localThaiEngine: "thonburian",
    localThaiReferenceAudioPath: "",
    localThaiReferenceText: "",
    localThaiPythonPath: "python",
    chatPrefix: "!tts",
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
    showChatInMain: false,
    alertPosition: "top-right"
  },
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

export const useAppStore = create<AppState>((set, get) => ({
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
  setConfig: (config) => set({ config }),
  patchConfig: (partial) => {
    set({ config: deepMerge(get().config, partial) });
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
}));

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

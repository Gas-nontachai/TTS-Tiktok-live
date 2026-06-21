import { create } from "zustand";
import type { AppConfig, DeepPartial, LiveComment, TikTokStatus } from "../types";

export const defaultConfig: AppConfig = {
  tiktok: {
    username: ""
  },
  tts: {
    enabled: false,
    lang: "th-TH",
    voiceName: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    template: "{nickname} พูดว่า {comment}"
  },
  queue: {
    enabled: true,
    maxQueueSize: 20
  }
};

interface AppState {
  config: AppConfig;
  status: TikTokStatus;
  comments: LiveComment[];
  queue: LiveComment[];
  currentSpeakingText: string;
  error: string;
  wsConnected: boolean;
  setConfig: (config: AppConfig) => void;
  patchConfig: (config: DeepPartial<AppConfig>) => void;
  setStatus: (status: TikTokStatus) => void;
  addComment: (comment: LiveComment) => void;
  setQueue: (queue: LiveComment[]) => void;
  setCurrentSpeakingText: (text: string) => void;
  setError: (error: string) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  config: defaultConfig,
  status: {
    status: "disconnected",
    username: "",
    roomId: ""
  },
  comments: [],
  queue: [],
  currentSpeakingText: "",
  error: "",
  wsConnected: false,
  setConfig: (config) => set({ config }),
  patchConfig: (partial) => {
    const current = get().config;
    set({
      config: {
        ...current,
        ...partial,
        tiktok: {
          ...current.tiktok,
          ...partial.tiktok
        },
        tts: {
          ...current.tts,
          ...partial.tts
        },
        queue: {
          ...current.queue,
          ...partial.queue
        }
      }
    });
  },
  setStatus: (status) => set({ status }),
  addComment: (comment) => {
    const { comments, queue, config } = get();
    const nextComments = [comment, ...comments].slice(0, 50);
    const shouldQueue = config.tts.enabled && config.queue.enabled && queue.length < config.queue.maxQueueSize;

    set({
      comments: nextComments,
      queue: shouldQueue ? [...queue, comment] : queue
    });
  },
  setQueue: (queue) => set({ queue }),
  setCurrentSpeakingText: (currentSpeakingText) => set({ currentSpeakingText }),
  setError: (error) => set({ error }),
  setWsConnected: (wsConnected) => set({ wsConnected })
}));

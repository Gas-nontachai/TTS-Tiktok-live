export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface AppConfig {
  tiktok: {
    username: string;
  };
  tts: {
    enabled: boolean;
    lang: string;
    voiceName: string;
    rate: number;
    pitch: number;
    volume: number;
    template: string;
  };
  queue: {
    enabled: boolean;
    maxQueueSize: number;
  };
}

export interface TikTokStatus {
  status: ConnectionStatus;
  username: string;
  roomId: string;
}

export interface LiveComment {
  username: string;
  nickname: string;
  comment: string;
  timestamp: number;
}

export type WsEvent =
  | { event: "comment"; data: LiveComment }
  | { event: "status"; data: TikTokStatus }
  | { event: "error"; data: { message: string } };

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

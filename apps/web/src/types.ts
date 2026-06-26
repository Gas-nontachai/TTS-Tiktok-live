export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";
export type AlertType = "like" | "comment" | "follow" | "share" | "gift" | "goal";
export type OverlayEventType = AlertType | "viewer_count" | "chat_message" | "system";
export type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type AlertAnimationPreset = "fade" | "slide-up" | "slide-left" | "pop" | "bounce" | "zoom" | "flip" | "glow-pulse";
export type ChatAnimationPreset = "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "pop" | "stack-pop" | "soft-drop";
export type HeartAnimationPreset = "float-up" | "burst" | "spiral" | "side-float" | "confetti";
export type ViewerAnimationPreset = "none" | "fade" | "pulse" | "count-pop";
export type SoundPreset = "none" | "chime" | "pop" | "sparkle" | "coin" | "soft-bell" | "digital";
export type AlertMediaType = "image" | "gif" | "webp";
export type AlertMediaPosition = "top" | "bottom" | "left" | "right";
export type GoalType = "like" | "follow" | "gift" | "coin" | "share" | "custom";
export type GoalResetMode = "session" | "manual" | "persistent";

export interface TikTokStatus {
  status: ConnectionStatus;
  username: string;
  roomId: string;
}

export interface BaseOverlayEvent {
  id: string;
  type: OverlayEventType;
  timestamp: number;
}

export interface UserEventFields {
  userId?: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
}

export interface ShareAlertEvent extends BaseOverlayEvent, UserEventFields {
  type: "share";
}

export interface FollowAlertEvent extends BaseOverlayEvent, UserEventFields {
  type: "follow";
}

export interface GiftAlertEvent extends BaseOverlayEvent, UserEventFields {
  type: "gift";
  giftId?: string;
  giftName: string;
  giftCount: number;
  diamondCount?: number;
  repeatEnd?: boolean;
}

export interface ViewerCountEvent extends BaseOverlayEvent {
  type: "viewer_count";
  viewerCount: number;
}

export interface LikeEvent extends BaseOverlayEvent, Partial<UserEventFields> {
  type: "like";
  likeCount?: number;
  totalLikeCount?: number;
}

export interface CommentAlertEvent extends BaseOverlayEvent, UserEventFields {
  type: "comment";
  message: string;
}

export interface GoalAlertEvent extends BaseOverlayEvent {
  type: "goal";
  goalId: string;
  goalTitle: string;
  currentValue: number;
  targetValue: number;
}

export interface ChatMessageEvent extends BaseOverlayEvent, UserEventFields {
  type: "chat_message";
  message: string;
  badges?: string[];
  isModerator?: boolean;
  isSubscriber?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SystemEvent extends BaseOverlayEvent {
  type: "system";
  message?: string;
}

export type AlertEvent = ShareAlertEvent | FollowAlertEvent | GiftAlertEvent | LikeEvent | CommentAlertEvent | GoalAlertEvent;
export type OverlayEvent = AlertEvent | ViewerCountEvent | LikeEvent | ChatMessageEvent | SystemEvent;

export type LogLevel = "info" | "warn" | "error";
export type LogType =
  | "raw_event"
  | "normalized_event"
  | "raw_chat"
  | "normalized_chat"
  | "filtered_chat"
  | "config_update"
  | "control_action"
  | "tts"
  | "ws_error"
  | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  type: LogType;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LocalThaiTtsCheck {
  name: string;
  ok: boolean;
  message: string;
}

export interface LocalThaiTtsPreflight {
  ready: boolean;
  checks: LocalThaiTtsCheck[];
}

export interface AlertConfig {
  enabled: boolean;
  playSound: boolean;
  ttsEnabled: boolean;
  template: string;
  soundUrl: string;
  mediaUrl: string;
  mediaType: AlertMediaType;
  mediaSize: number;
  mediaPosition: AlertMediaPosition;
  durationMs: number;
  cooldownMs: number;
  volume: number;
  enterAnimation: AlertAnimationPreset;
  exitAnimation: AlertAnimationPreset;
  animationDurationMs: number;
  stylePreset: "glass" | "neon" | "solid" | "minimal";
  rateLimitPerSecond: number;
  batchEnabled: boolean;
  batchWindowMs: number;
  minimumTriggerCount: number;
}

export interface GiftAlertConfig extends AlertConfig {
  minGiftCount: number;
  minDiamondCount: number;
  waitForRepeatEnd: boolean;
}

export interface ChatConfig {
  enabled: boolean;
  overlayUrl: string;
  display: {
    showAvatar: boolean;
    showUsername: boolean;
    showDisplayName: boolean;
    showTimestamp: boolean;
    showBadges: boolean;
    compactMode: boolean;
    messageOrder: "oldest-first" | "newest-first";
  };
  queue: {
    maxVisibleMessages: number;
    messageLifetimeMs: number;
    removeOldMessages: boolean;
    newestPosition: "top" | "bottom";
  };
  animation: {
    enabled: boolean;
    enterAnimation: ChatAnimationPreset;
    exitAnimation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right";
    durationMs: number;
  };
  theme: {
    fontFamily: string;
    fontSize: number;
    usernameFontSize: number;
    messageFontSize: number;
    textColor: string;
    usernameColor: string;
    backgroundColor: string;
    bubbleColor: string;
    borderColor: string;
    borderRadius: number;
    opacity: number;
    spacing: number;
    padding: number;
    shadowEnabled: boolean;
  };
  position: {
    position: Position | "custom";
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
  filter: {
    enabled: boolean;
    blacklistWords: string[];
    blockedUsernames: string[];
    hideDuplicateMessages: boolean;
    duplicateWindowMs: number;
    maxMessageLength: number;
    hideLinks: boolean;
    hideEmojiOnlyMessages: boolean;
  };
  tts: {
    enabled: boolean;
    onlyWhenPrefix: string | null;
    cooldownMs: number;
    maxQueueSize: number;
  };
}

export interface AppConfig {
  tiktok: {
    username: string;
  };
  alerts: {
    like: AlertConfig;
    comment: AlertConfig;
    share: AlertConfig;
    follow: AlertConfig;
    gift: GiftAlertConfig;
    goal: AlertConfig;
  };
  alertQueue: {
    maxQueueSize: number;
    allowGiftInterrupt: boolean;
    clearQueueOnDisconnect: boolean;
  };
  viewerCount: {
    enabled: boolean;
    position: Position;
    showIcon: boolean;
    label: string;
    fontSize: number;
    animationPreset: ViewerAnimationPreset;
  };
  likeHearts: {
    enabled: boolean;
    maxHeartsOnScreen: number;
    heartSize: number;
    animationDurationMs: number;
    spawnPosition: Position;
    intensity: "low" | "normal" | "high";
    animationPreset: HeartAnimationPreset;
  };
  tts: {
    enabled: boolean;
    playerEnabled: boolean;
    speakAlerts: boolean;
    speakChat: boolean;
    engine: "browser" | "local-thai";
    localThaiEngine: "thonburian" | "jaitts-f5tts";
    localThaiReferenceAudioPath: string;
    localThaiReferenceText: string;
    localThaiPythonPath: string;
    chatPrefix: string;
    queueMode: "queue" | "interrupt";
    maxQueueSize: number;
    cooldownMs: number;
    muted: boolean;
    lang: string;
    voiceName: string;
    rate: number;
    pitch: number;
    volume: number;
    template: string;
  };
  sounds: {
    enabled: boolean;
    masterVolume: number;
    shareVolume: number;
    followVolume: number;
    giftVolume: number;
    sharePreset: SoundPreset;
    followPreset: SoundPreset;
    giftPreset: SoundPreset;
  };
  overlay: {
    showAlerts: boolean;
    showViewerCount: boolean;
    showHearts: boolean;
    showGoals: boolean;
    showChatInMain: boolean;
    alertPosition: Position;
  };
  goals: GoalConfig[];
  chat: ChatConfig;
}

export interface GoalConfig {
  id: string;
  title: string;
  type: GoalType;
  currentValue: number;
  targetValue: number;
  enabled: boolean;
  isPaused: boolean;
  resetMode: GoalResetMode;
  triggerAlertOnComplete: boolean;
  completed: boolean;
}

export type GoalState = GoalConfig;

export interface AppStats {
  viewerCount: number;
  totalLikes: number;
  eventCounts: Record<string, number>;
  messagesPerMinute: number;
  filteredChatCount: number;
  visibleChatCount: number;
}

export type ChatControlAction = "clear" | "pause" | "resume";

export type WsEvent =
  | { type: "config_updated"; payload: AppConfig }
  | { type: "overlay_event"; payload: OverlayEvent }
  | { type: "goal_updated"; payload: GoalState[] }
  | { type: "chat_message"; payload: ChatMessageEvent }
  | { type: "chat_control"; payload: { action: ChatControlAction } }
  | { type: "chat_config_updated"; payload: ChatConfig }
  | { type: "chat_stats_updated"; payload: Pick<AppStats, "messagesPerMinute" | "filteredChatCount" | "visibleChatCount"> }
  | { type: "status"; payload: TikTokStatus }
  | { type: "stats"; payload: AppStats }
  | { type: "log"; payload: LogEntry }
  | { type: "error"; payload: { message: string } };

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

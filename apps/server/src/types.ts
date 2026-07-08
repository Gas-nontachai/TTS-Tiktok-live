type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

type AlertType = "like" | "comment" | "follow" | "share" | "gift" | "goal";
type OverlayEventType = AlertType | "viewer_count" | "chat_message" | "system";
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type AlertAnimationPreset = "fade" | "slide-up" | "slide-left" | "pop" | "bounce" | "zoom" | "flip" | "glow-pulse";
type ChatAnimationPreset = "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "pop" | "stack-pop" | "soft-drop";
type HeartAnimationPreset = "float-up" | "burst" | "spiral" | "side-float" | "confetti";
type ViewerAnimationPreset = "none" | "fade" | "pulse" | "count-pop";
type SoundPreset = "none" | "chime" | "pop" | "sparkle" | "coin" | "soft-bell" | "digital";
type AlertMediaType = "image" | "gif" | "webp";
type AlertMediaPosition = "top" | "bottom" | "left" | "right";
type GoalType = "like" | "follow" | "gift" | "coin" | "share" | "custom";
type GoalResetMode = "session" | "manual" | "persistent";

export interface TikTokStatus {
  status: ConnectionStatus;
  username: string;
  roomId: string;
}

interface BaseOverlayEvent {
  id: string;
  type: OverlayEventType;
  timestamp: number;
}

interface UserEventFields {
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

interface CommentAlertEvent extends BaseOverlayEvent, UserEventFields {
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

interface SystemEvent extends BaseOverlayEvent {
  type: "system";
  message?: string;
}

type AlertEvent = ShareAlertEvent | FollowAlertEvent | GiftAlertEvent | LikeEvent | CommentAlertEvent | GoalAlertEvent;
export type OverlayEvent = AlertEvent | ViewerCountEvent | LikeEvent | ChatMessageEvent | SystemEvent;

type LogLevel = "info" | "warn" | "error";
type LogType =
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

interface AiThaiTtsCheck {
  name: string;
  ok: boolean;
  message: string;
}

interface AiThaiTtsPreflight {
  ready: boolean;
  checks: AiThaiTtsCheck[];
}

interface AlertConfig {
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

interface GiftAlertConfig extends AlertConfig {
  minGiftCount: number;
  minDiamondCount: number;
  waitForRepeatEnd: boolean;
}

interface AlertQueueConfig {
  maxQueueSize: number;
  allowGiftInterrupt: boolean;
  clearQueueOnDisconnect: boolean;
}

interface ViewerCountConfig {
  enabled: boolean;
  position: Position;
  showIcon: boolean;
  label: string;
  fontSize: number;
  animationPreset: ViewerAnimationPreset;
}

interface LikeHeartConfig {
  enabled: boolean;
  maxHeartsOnScreen: number;
  heartSize: number;
  animationDurationMs: number;
  spawnPosition: Position;
  intensity: "low" | "normal" | "high";
  animationPreset: HeartAnimationPreset;
}

interface TtsConfig {
  enabled: boolean;
  playerEnabled: boolean;
  speakAlerts: boolean;
  speakChat: boolean;
  engine: "ai-thai";
  aiThaiVoice: "th-TH-PremwadeeNeural" | "th-TH-NiwatNeural";
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
}

interface SoundConfig {
  enabled: boolean;
  masterVolume: number;
  shareVolume: number;
  followVolume: number;
  giftVolume: number;
  sharePreset: SoundPreset;
  followPreset: SoundPreset;
  giftPreset: SoundPreset;
}

interface OverlayConfig {
  showAlerts: boolean;
  showViewerCount: boolean;
  showHearts: boolean;
  showGoals: boolean;
  showChatInMain: boolean;
  alertPosition: Position;
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

type GoalState = GoalConfig;

interface ChatConfig {
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
    exitAnimation: Exclude<ChatAnimationPreset, "pop" | "stack-pop" | "soft-drop">;
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
  alertQueue: AlertQueueConfig;
  viewerCount: ViewerCountConfig;
  likeHearts: LikeHeartConfig;
  tts: TtsConfig;
  sounds: SoundConfig;
  overlay: OverlayConfig;
  goals: GoalConfig[];
  chat: ChatConfig;
}

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

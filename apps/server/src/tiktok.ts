import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";
import type {
  ChatMessageEvent,
  FollowAlertEvent,
  GiftAlertEvent,
  LikeEvent,
  LogEntry,
  OverlayEvent,
  ShareAlertEvent,
  TikTokStatus,
  ViewerCountEvent
} from "./types.js";

type EventHandler = (event: OverlayEvent) => void;
type ChatHandler = (event: ChatMessageEvent) => void;
type StatusHandler = (status: TikTokStatus) => void;
type ErrorHandler = (message: string) => void;
type LogHandler = (entry: LogEntry) => void;

const giftDuplicateTtlMs = 30000;

interface TikTokConnectionLike {
  connect: () => Promise<{ roomId?: string | number }>;
  disconnect: () => void | Promise<void>;
  on: (eventName: string, callback: (data: unknown) => void) => void;
}

export class TikTokLiveService {
  private connection?: TikTokConnectionLike;
  private recentGiftKeys: Record<string, number> = {};
  private status: TikTokStatus = {
    status: "disconnected",
    username: "",
    roomId: ""
  };

  constructor(
    private readonly onEvent: EventHandler,
    private readonly onChat: ChatHandler,
    private readonly onStatus: StatusHandler,
    private readonly onError: ErrorHandler,
    private readonly onLog: LogHandler
  ) {}

  getStatus() {
    return this.status;
  }

  async connect(username: string) {
    const cleanUsername = username.trim().replace(/^@/, "");

    if (!cleanUsername) {
      throw new Error("TikTok username is required");
    }

    await this.disconnect(false);
    this.setStatus({ status: "connecting", username: cleanUsername, roomId: "" });

    const connection = new TikTokLiveConnection(cleanUsername, {
      processInitialData: false,
      fetchRoomInfoOnConnect: true
    }) as unknown as TikTokConnectionLike;
    this.connection = connection;
    this.recentGiftKeys = {};

    const isActiveConnection = () => this.connection === connection;
    const emitIfActive = (type: string, mapper: (data: unknown) => OverlayEvent) => (data: unknown) => {
      if (!isActiveConnection()) {
        return;
      }
      this.emitMapped(type, mapper(data), data);
    };

    connection.on(WebcastEvent.CHAT, (data) => {
      if (!isActiveConnection()) {
        return;
      }
      this.log("info", "raw_chat", "Raw chat event received", data);
      const event = this.mapChat(data);
      this.log("info", "normalized_chat", `${event.displayName || event.username}: ${event.message}`, event);
      this.onChat(event);
    });

    connection.on(WebcastEvent.SHARE, emitIfActive("share", (data) => this.mapShare(data)));
    connection.on(WebcastEvent.FOLLOW, emitIfActive("follow", (data) => this.mapFollow(data)));
    connection.on(WebcastEvent.GIFT, emitIfActive("gift", (data) => this.mapGift(data)));
    connection.on(WebcastEvent.ROOM_USER, emitIfActive("viewer_count", (data) => this.mapViewerCount(data)));
    connection.on(WebcastEvent.MEMBER, emitIfActive("viewer_count", (data) => this.mapMemberCount(data)));
    connection.on(WebcastEvent.LIKE, emitIfActive("like", (data) => this.mapLike(data)));

    connection.on("disconnected", () => {
      if (!isActiveConnection()) {
        return;
      }
      this.connection = undefined;
      this.setStatus({
        status: "disconnected",
        username: this.status.username,
        roomId: this.status.roomId
      });
    });

    connection.on(WebcastEvent.STREAM_END, () => {
      if (!isActiveConnection()) {
        return;
      }
      this.connection = undefined;
      this.setStatus({
        status: "disconnected",
        username: this.status.username,
        roomId: this.status.roomId
      });
    });

    connection.on("error", (data) => {
      if (!isActiveConnection()) {
        return;
      }
      const message = this.getErrorMessage(data);
      this.log("error", "error", message, data);
      this.onError(message);
    });

    try {
      const state = await connection.connect();
      const roomId = state.roomId ? String(state.roomId) : "";
      this.setStatus({ status: "connected", username: cleanUsername, roomId });
      this.log("info", "normalized_event", `Connected to @${cleanUsername}`, { roomId });
      return this.status;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.connection = undefined;
      this.setStatus({ status: "error", username: cleanUsername, roomId: "" });
      this.log("error", "error", message, error);
      this.onError(message);
      throw new Error(message);
    }
  }

  async disconnect(announce = true) {
    if (this.connection) {
      const connection = this.connection;
      this.connection = undefined;
      await connection.disconnect();
    }
    this.recentGiftKeys = {};

    this.setStatus({ status: "disconnected", username: this.status.username, roomId: "" }, announce);
    if (announce) {
      this.log("info", "control_action", "Disconnected from TikTok Live");
    }
  }

  private emitMapped(type: string, event: OverlayEvent, raw: unknown) {
    this.log("info", "raw_event", `Raw ${type} event received`, raw);
    if (event.type === "gift" && !this.claimGiftEvent(event)) {
      this.log("info", "normalized_event", "Skipped duplicate gift event", event);
      return;
    }

    this.log("info", "normalized_event", `Normalized ${type} event`, event);
    this.onEvent(event);
  }

  private claimGiftEvent(event: GiftAlertEvent) {
    const now = Date.now();
    for (const [key, expiresAt] of Object.entries(this.recentGiftKeys)) {
      if (expiresAt <= now) {
        delete this.recentGiftKeys[key];
      }
    }

    const key = this.giftEventKey(event);
    if (this.recentGiftKeys[key] && this.recentGiftKeys[key] > now) {
      return false;
    }

    this.recentGiftKeys[key] = now + giftDuplicateTtlMs;
    return true;
  }

  private giftEventKey(event: GiftAlertEvent) {
    return [
      event.userId || event.username,
      event.giftId || event.giftName,
      event.giftCount,
      event.repeatEnd === undefined ? "unknown" : String(event.repeatEnd)
    ].join(":").toLowerCase();
  }

  private setStatus(status: TikTokStatus, announce = true) {
    this.status = status;

    if (announce) {
      this.onStatus(status);
    }
  }

  private mapChat(data: unknown): ChatMessageEvent {
    const payload = this.asRecord(data);
    const user = this.asRecord(payload.user);
    const username = this.firstString(user.uniqueId, user.displayId, payload.uniqueId, user.id, "unknown");
    const displayName = this.firstString(user.nickname, payload.nickname, username);

    return {
      id: this.id("chat"),
      type: "chat_message",
      userId: this.firstString(user.userId, user.id),
      username,
      displayName,
      profilePictureUrl: this.profilePicture(user),
      message: this.firstString(payload.content, payload.comment, payload.text),
      timestamp: Date.now(),
      badges: [],
      isModerator: Boolean(payload.isModerator),
      isSubscriber: Boolean(payload.isSubscriber),
      metadata: {}
    };
  }

  private mapShare(data: unknown): ShareAlertEvent {
    const fields = this.userFields(data);
    return {
      id: this.id("share"),
      type: "share",
      timestamp: Date.now(),
      ...fields
    };
  }

  private mapFollow(data: unknown): FollowAlertEvent {
    const fields = this.userFields(data);
    return {
      id: this.id("follow"),
      type: "follow",
      timestamp: Date.now(),
      ...fields
    };
  }

  private mapGift(data: unknown): GiftAlertEvent {
    const payload = this.asRecord(data);
    const giftDetails = this.asRecord(payload.giftDetails);
    const fields = this.userFields(data);
    const repeatCount = Number(this.firstString(payload.repeatCount, payload.repeat_count, 1)) || 1;
    const diamondCount = Number(this.firstString(giftDetails.diamondCount, payload.diamondCount, payload.diamond_count, 0)) || 0;

    return {
      id: this.id("gift"),
      type: "gift",
      timestamp: Date.now(),
      ...fields,
      giftId: this.firstString(payload.giftId, giftDetails.giftId),
      giftName: this.firstString(giftDetails.giftName, payload.giftName, "Gift"),
      giftCount: repeatCount,
      diamondCount,
      repeatEnd: typeof payload.repeatEnd === "boolean" ? payload.repeatEnd : undefined
    };
  }

  private mapViewerCount(data: unknown): ViewerCountEvent {
    const payload = this.asRecord(data);
    return {
      id: this.id("viewer"),
      type: "viewer_count",
      viewerCount: this.firstNumber(payload.viewerCount, payload.viewer_count, payload.memberCount, payload.member_count) ?? 0,
      timestamp: Date.now()
    };
  }

  private mapMemberCount(data: unknown): ViewerCountEvent {
    const payload = this.asRecord(data);
    return {
      id: this.id("viewer"),
      type: "viewer_count",
      viewerCount: this.firstNumber(payload.memberCount, payload.member_count, payload.viewerCount, payload.viewer_count) ?? 0,
      timestamp: Date.now()
    };
  }

  private mapLike(data: unknown): LikeEvent {
    const payload = this.asRecord(data);
    const fields = this.userFields(data);
    return {
      id: this.id("like"),
      type: "like",
      timestamp: Date.now(),
      userId: fields.userId,
      username: fields.username,
      likeCount: this.firstNumber(payload.likeCount, payload.like_count, payload.count, payload.likeMessage && this.asRecord(payload.likeMessage).likeCount, 1),
      totalLikeCount: this.firstNumber(payload.totalLikeCount, payload.total_like_count, payload.total, payload.likeMessage && this.asRecord(payload.likeMessage).totalLikeCount, undefined)
    };
  }

  private userFields(data: unknown) {
    const payload = this.asRecord(data);
    const user = this.asRecord(payload.user);
    const username = this.firstString(user.uniqueId, user.displayId, payload.uniqueId, user.id, "unknown");
    const displayName = this.firstString(user.nickname, payload.nickname, username);

    return {
      userId: this.firstString(user.userId, user.id),
      username,
      displayName,
      profilePictureUrl: this.profilePicture(user)
    };
  }

  private profilePicture(user: Record<string, unknown>) {
    const avatar = this.asRecord(user.avatarThumb);
    const urls = Array.isArray(avatar.urlList) ? avatar.urlList : [];
    return this.firstString(user.profilePictureUrl, user.avatar, urls[0]);
  }

  private log(level: LogEntry["level"], type: LogEntry["type"], message: string, metadata?: unknown) {
    this.onLog({
      id: this.id("log"),
      level,
      type,
      message,
      timestamp: Date.now(),
      metadata: this.safeMetadata(metadata)
    });
  }

  private safeMetadata(metadata: unknown) {
    if (!metadata || typeof metadata !== "object") {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
    } catch {
      return { note: "Unable to serialize metadata" };
    }
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  }

  private id(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private firstString(...values: unknown[]) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value;
      }

      if (typeof value === "number" || typeof value === "bigint") {
        return String(value);
      }
    }

    return "";
  }

  private firstNumber(...values: unknown[]) {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === "bigint") {
        return Number(value);
      }

      if (typeof value === "string" && value.trim()) {
        const number = Number(value);
        if (Number.isFinite(number)) {
          return number;
        }
      }
    }

    return undefined;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "object" && error && "message" in error) {
      return String((error as { message: unknown }).message);
    }

    return "Unable to connect to TikTok Live";
  }
}

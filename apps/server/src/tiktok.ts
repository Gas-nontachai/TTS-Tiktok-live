import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";
import type { LiveComment, TikTokStatus } from "./types.js";

type CommentHandler = (comment: LiveComment) => void;
type StatusHandler = (status: TikTokStatus) => void;
type ErrorHandler = (message: string) => void;

interface TikTokConnectionLike {
  connect: () => Promise<{ roomId?: string | number }>;
  disconnect: () => void | Promise<void>;
  on: (eventName: string, callback: (data: unknown) => void) => void;
}

export class TikTokLiveService {
  private connection?: TikTokConnectionLike;
  private status: TikTokStatus = {
    status: "disconnected",
    username: "",
    roomId: ""
  };

  constructor(
    private readonly onComment: CommentHandler,
    private readonly onStatus: StatusHandler,
    private readonly onError: ErrorHandler
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

    connection.on(WebcastEvent.CHAT, (data) => {
      this.onComment(this.mapComment(data));
    });

    connection.on("disconnected", () => {
      this.setStatus({
        status: "disconnected",
        username: this.status.username,
        roomId: this.status.roomId
      });
    });

    connection.on(WebcastEvent.STREAM_END, () => {
      this.setStatus({
        status: "disconnected",
        username: this.status.username,
        roomId: this.status.roomId
      });
    });

    connection.on("error", (data) => {
      const message = this.getErrorMessage(data);
      this.onError(message);
    });

    try {
      const state = await connection.connect();
      const roomId = state.roomId ? String(state.roomId) : "";
      this.setStatus({ status: "connected", username: cleanUsername, roomId });
      return this.status;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.connection = undefined;
      this.setStatus({ status: "error", username: cleanUsername, roomId: "" });
      this.onError(message);
      throw new Error(message);
    }
  }

  async disconnect(announce = true) {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = undefined;
    }

    this.setStatus({ status: "disconnected", username: this.status.username, roomId: "" }, announce);
  }

  private setStatus(status: TikTokStatus, announce = true) {
    this.status = status;

    if (announce) {
      this.onStatus(status);
    }
  }

  private mapComment(data: unknown): LiveComment {
    const payload = data as Record<string, unknown>;
    const user = (payload.user as Record<string, unknown> | undefined) ?? {};
    const username = this.firstString(user.displayId, user.uniqueId, payload.uniqueId, user.id);
    const nickname = this.firstString(user.nickname, payload.nickname, username, "Unknown");
    const comment = this.firstString(payload.content, payload.comment, payload.text);

    return {
      username,
      nickname,
      comment,
      timestamp: Date.now()
    };
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

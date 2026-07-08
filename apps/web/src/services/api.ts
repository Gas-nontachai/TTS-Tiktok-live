import type { AlertType, AiThaiTtsPreflight, AppConfig, AppStats, DeepPartial, GoalState, LogEntry, TikTokStatus } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  config?: T;
  message?: string;
  eventId?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }

  return (payload.data ?? payload.config ?? payload) as T;
}

export function getConfig() {
  return request<AppConfig>("/api/config");
}

export async function saveConfig(config: DeepPartial<AppConfig>) {
  return request<AppConfig>("/api/config", {
    method: "PUT",
    body: JSON.stringify(config)
  });
}

export function resetConfig() {
  return request<AppConfig>("/api/config/reset", { method: "POST" });
}

export function getStats() {
  return request<AppStats>("/api/stats");
}

export async function synthesizeTts(text: string) {
  const response = await fetch(`${API_URL}/api/tts/synthesize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new Error(payload?.message ?? "TTS synthesis failed");
  }

  return response.blob();
}

export function checkAiThaiTts() {
  return request<AiThaiTtsPreflight>("/api/tts/ai-thai/preflight");
}

export function getLogs() {
  return request<LogEntry[]>("/api/logs");
}

export function connectTikTok(username: string) {
  return request<{ username: string; roomId: string }>("/api/tiktok/connect", {
    method: "POST",
    body: JSON.stringify({ username })
  });
}

export async function disconnectTikTok() {
  await request<void>("/api/tiktok/disconnect", {
    method: "POST"
  });
}

export function getTikTokStatus() {
  return request<TikTokStatus>("/api/tiktok/status");
}

export function uploadMedia(file: File) {
  return new Promise<{ url: string; mediaKind: "audio" | "image" }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.onload = async () => {
      try {
        const result = await request<{ url: string; mediaKind: "audio" | "image" }>("/api/uploads", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            dataUrl: String(reader.result || "")
          })
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(file);
  });
}

export function testAlert(type: AlertType | "viewer-count") {
  return request<{ eventId: string }>(`/api/test/${type}`, { method: "POST" });
}

export function testGoalProgress(id: string, amount = 1) {
  return request<GoalState[]>("/api/test/goal-progress", {
    method: "POST",
    body: JSON.stringify({ id, amount })
  });
}

export function resetGoal(id: string) {
  return request<GoalState[]>(`/api/goals/${encodeURIComponent(id)}/reset`, { method: "POST" });
}

export function testChatMessage(message: string, username = "tester", displayName = "Tester") {
  return request<{ eventId: string }>("/api/chat/test-message", {
    method: "POST",
    body: JSON.stringify({ username, displayName, message })
  });
}

export async function clearChat() {
  await request<void>("/api/chat/clear", { method: "POST" });
}

export async function pauseChat() {
  await request<void>("/api/chat/pause", { method: "POST" });
}

export async function resumeChat() {
  await request<void>("/api/chat/resume", { method: "POST" });
}

export async function blockChatUser(username: string) {
  await request<void>("/api/chat/block-user", {
    method: "POST",
    body: JSON.stringify({ username })
  });
}

export async function addBlacklistWord(word: string) {
  await request<void>("/api/chat/blacklist-word", {
    method: "POST",
    body: JSON.stringify({ word })
  });
}

export function wsUrl() {
  return API_URL.replace(/^http/, "ws") + "/ws";
}

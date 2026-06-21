import type { AppConfig, DeepPartial, TikTokStatus } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
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

  return payload.data as T;
}

export function getConfig() {
  return request<AppConfig>("/api/config");
}

export async function saveConfig(config: DeepPartial<AppConfig>) {
  await request<void>("/api/config", {
    method: "PUT",
    body: JSON.stringify(config)
  });
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

export function wsUrl() {
  return API_URL.replace(/^http/, "ws") + "/ws";
}

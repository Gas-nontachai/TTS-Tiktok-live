import type { AlertEvent, AlertType, ChatMessageEvent, OverlayEvent, SoundPreset } from "../types";
import { useAppStore } from "../stores/appStore";

export function renderTemplate(template: string, event: Partial<AlertEvent | ChatMessageEvent>) {
  const data = event as Record<string, unknown>;
  const values: Record<string, string> = {
    username: String(data.username || "unknown"),
    displayName: String(data.displayName || data.username || "unknown"),
    giftName: String(data.giftName || ""),
    giftCount: String(data.giftCount || ""),
    diamondCount: String(data.diamondCount || ""),
    viewerCount: String(data.viewerCount || ""),
    message: String(data.message || ""),
    comment: String(data.message || "")
  };

  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function cleanTtsText(text: string) {
  return text
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F]/gu, "")
    .replace(/[\u200D\u20E3]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function soundPresetFor(type: AlertType, config: ReturnType<typeof useAppStore.getState>["config"]): SoundPreset {
  if (type === "gift") {
    return config.sounds.giftPreset;
  }
  if (type === "follow") {
    return config.sounds.followPreset;
  }
  return config.sounds.sharePreset;
}

export function alertVolumeFor(type: AlertType, config: ReturnType<typeof useAppStore.getState>["config"]) {
  const volume = type === "gift" ? config.sounds.giftVolume : type === "follow" ? config.sounds.followVolume : config.sounds.shareVolume;
  return volume * config.sounds.masterVolume;
}

export function filterChat(message: ChatMessageEvent, config: ReturnType<typeof useAppStore.getState>["config"], duplicates: Record<string, number>) {
  const filter = config.chat.filter;
  if (!config.chat.enabled) {
    return null;
  }
  if (!filter.enabled) {
    return message;
  }

  const username = message.username.toLowerCase();
  const text = message.message.trim();
  const lower = text.toLowerCase();

  if (filter.blockedUsernames.some((blocked) => blocked.toLowerCase() === username)) {
    return null;
  }
  if (filter.blacklistWords.some((word) => word && lower.includes(word.toLowerCase()))) {
    return null;
  }
  if (filter.hideLinks && /https?:\/\/|www\./i.test(text)) {
    return null;
  }
  if (filter.hideEmojiOnlyMessages && !/[A-Za-z0-9ก-๙]/.test(text)) {
    return null;
  }
  if (filter.hideDuplicateMessages) {
    const key = `${username}:${lower}`;
    const last = duplicates[key] || 0;
    if (Date.now() - last < filter.duplicateWindowMs) {
      return null;
    }
    duplicates[key] = Date.now();
  }
  if (text.length > filter.maxMessageLength) {
    return { ...message, message: `${text.slice(0, filter.maxMessageLength)}...` };
  }
  return message;
}

export function trimMessages(messages: ChatMessageEvent[], max: number, newestPosition: "top" | "bottom") {
  if (messages.length <= max) {
    return messages;
  }
  return newestPosition === "top" ? messages.slice(0, max) : messages.slice(-max);
}

export function chatBoxStyle(position: ReturnType<typeof useAppStore.getState>["config"]["chat"]["position"]): React.CSSProperties {
  const base: React.CSSProperties = {
    width: position.width,
    height: position.height
  };
  if (position.position.includes("left")) base.left = position.offsetX;
  if (position.position.includes("right")) base.right = position.offsetX;
  if (position.position.includes("top")) base.top = position.offsetY;
  if (position.position.includes("bottom")) base.bottom = position.offsetY;
  if (position.position === "custom") {
    base.left = position.offsetX;
    base.top = position.offsetY;
  }
  return base;
}

export function playTone(type: AlertType, volume: number, preset: SoundPreset = "chime") {
  if (preset === "none") {
    return;
  }
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }
  const ctx = new AudioContextCtor();
  const safeVolume = Math.max(0, Math.min(1, volume));
  const now = ctx.currentTime;
  let lastStop = now + 0.2;

  const tone = (frequency: number, start: number, duration: number, wave: OscillatorType = "sine", gainScale = 1) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * 0.22 * gainScale), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    lastStop = Math.max(lastStop, start + duration + 0.04);
  };

  if (preset === "chime") {
    tone(type === "gift" ? 784 : 523, now, 0.22);
    tone(type === "gift" ? 1175 : 659, now + 0.08, 0.24, "sine", 0.7);
  } else if (preset === "pop") {
    tone(220, now, 0.08, "triangle", 0.9);
    tone(420, now + 0.035, 0.1, "sine", 0.6);
  } else if (preset === "sparkle") {
    [880, 1175, 1568, 2093].forEach((frequency, index) => tone(frequency, now + index * 0.045, 0.12, "sine", 0.45));
  } else if (preset === "coin") {
    tone(988, now, 0.12, "square", 0.55);
    tone(1319, now + 0.06, 0.18, "square", 0.5);
    tone(1760, now + 0.15, 0.18, "triangle", 0.42);
  } else if (preset === "soft-bell") {
    tone(587, now, 0.36, "sine", 0.55);
    tone(880, now + 0.03, 0.42, "sine", 0.35);
  } else if (preset === "digital") {
    tone(660, now, 0.07, "square", 0.38);
    tone(990, now + 0.08, 0.07, "square", 0.38);
    tone(1320, now + 0.16, 0.09, "square", 0.32);
  }

  window.setTimeout(() => void ctx.close(), Math.ceil((lastStop - now) * 1000) + 80);
}

export function typeLabel(type: AlertType) {
  return type === "gift" ? "Gift" : type === "follow" ? "Follow" : "Share";
}

export function routeTitle(path: string) {
  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/connection": "TikTok Connection",
    "/alerts": "Alerts",
    "/chat": "Chat Overlay",
    "/chat/filter": "Chat Filter",
    "/chat/moderation": "Chat Moderation",
    "/overlay": "Overlay",
    "/tts": "TTS",
    "/sounds": "Sounds",
    "/logs": "Logs",
    "/settings": "Settings"
  };
  return titles[path] || "Dashboard";
}

export function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function enqueueAlert(queue: AlertEvent[], event: AlertEvent, max: number, allowGiftInterrupt: boolean) {
  const next = [...queue, event].sort((a, b) => priority(b, allowGiftInterrupt) - priority(a, allowGiftInterrupt));
  return next.slice(0, max);
}

export function isAlertEvent(event: OverlayEvent): event is AlertEvent {
  return event.type === "share" || event.type === "follow" || event.type === "gift";
}

function priority(event: AlertEvent, allowGiftInterrupt: boolean) {
  if (event.type === "gift") {
    return allowGiftInterrupt ? 100 : 60;
  }
  if (event.type === "follow") {
    return 70;
  }
  return 50;
}

export function statusChipClasses(status: string): string {
  const base = "status-chip";
  switch (status) {
    case "connected":
      return `${base} connected`;
    case "connecting":
    case "reconnecting":
      return `${base} ${status}`;
    case "error":
      return `${base} error`;
    case "disconnected":
    default:
      return `${base} disconnected`;
  }
}

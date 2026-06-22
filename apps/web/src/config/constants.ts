import type { AlertAnimationPreset, ChatAnimationPreset, SoundPreset } from "../types";

export const languages = ["th-TH", "en-US", "ja-JP", "ko-KR", "zh-CN"];
export const alertAnimations: AlertAnimationPreset[] = ["fade", "slide-up", "slide-left", "pop", "bounce", "zoom", "flip", "glow-pulse"];
export const chatAnimations: ChatAnimationPreset[] = ["none", "fade", "slide-up", "slide-left", "slide-right", "pop", "stack-pop", "soft-drop"];
export const heartAnimations = ["float-up", "burst", "spiral", "side-float", "confetti"] as const;
export const viewerAnimations = ["none", "fade", "pulse", "count-pop"] as const;
export const soundPresets: SoundPreset[] = ["none", "chime", "pop", "sparkle", "coin", "soft-bell", "digital"];

export const overlayMainUrl = "http://localhost:3000/overlay/main";
export const overlayAlertsUrl = "http://localhost:3000/overlay/alerts";
export const overlayViewerCountUrl = "http://localhost:3000/overlay/viewer-count";
export const overlayHeartsUrl = "http://localhost:3000/overlay/hearts";
export const overlayChatUrl = "http://localhost:3000/overlay/chat";
export const overlayTtsUrl = "http://localhost:3000/overlay/tts";
export const ttsPlayerUrl = "http://localhost:3000/player/tts";

export const panelClass = "rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-surfaceMuted";
export const quietClass = "text-sm text-textMuted";
export const metricPanelClass = "metric-panel";
export const buttonRowClass = "button-row";
export const formGridClass = "form-grid";

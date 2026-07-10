import type { AlertAnimationPreset, AlertVisualTemplate, ChatEnterAnimationPreset, ChatExitAnimationPreset, SoundPreset } from "../types";

export const alertAnimations: AlertAnimationPreset[] = ["fade", "slide-up", "slide-left", "pop", "bounce", "zoom", "flip", "glow-pulse"];
export const chatEnterAnimations: ChatEnterAnimationPreset[] = ["none", "fade-in", "slide-in", "pop-in", "bounce-in", "glitch-in"];
export const chatExitAnimations: ChatExitAnimationPreset[] = ["none", "fade-out", "slide-up", "drift-away", "shrink-out", "glitch-out"];
export const chatFontFamilies: string[] = ["system", "Inter", "Noto Sans", "Noto Sans Thai", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", "Prompt", "Sarabun", "Kanit", "Pixel / Retro"];
export const heartAnimations = ["float-up", "burst", "spiral", "side-float", "confetti"] as const;
export const viewerAnimations = ["none", "fade", "pulse", "count-pop"] as const;
export const soundPresets: SoundPreset[] = ["none", "chime", "pop", "sparkle", "coin", "soft-bell", "digital"];
export const alertVisualTemplates: Array<{
  id: AlertVisualTemplate;
  label: string;
  description: string;
  emoji: string;
}> = [
  { id: "gift-pop", label: "Gift Pop", description: "ของขวัญเด้งใหญ่ตรงกลางพร้อม badge จำนวน", emoji: "🎁" },
  { id: "neon-pop", label: "Neon Pop", description: "arcade neon burst ข้อความกลางจอพร้อม glow", emoji: "✨" },
  { id: "minimal-toast", label: "Minimal Toast", description: "toast เรียบแบบเดียวสำหรับคนอยากไม่บังจอ", emoji: "🔔" },
  { id: "big-shoutout", label: "Big Shoutout", description: "banner shoutout กว้าง ชื่อคนเด่นมาก", emoji: "🎉" },
  { id: "goal-complete", label: "Goal Complete", description: "achievement style พร้อม trophy และ progress", emoji: "🏆" }
];

export const overlayMainUrl = "http://localhost:3000/overlay/main";
export const overlayAlertsUrl = "http://localhost:3000/overlay/alerts";
export const overlayGoalsUrl = "http://localhost:3000/overlay/goals";
export const overlayViewerCountUrl = "http://localhost:3000/overlay/viewer-count";
export const overlayHeartsUrl = "http://localhost:3000/overlay/hearts";
export const overlayChatUrl = "http://localhost:3000/overlay/chat";
export const overlayTtsUrl = "http://localhost:3000/overlay/tts";
export const ttsPlayerUrl = "http://localhost:3000/player/tts";

export const panelClass = "flex animate-panel-enter flex-col gap-4 rounded-lg border border-surfaceMuted bg-[#fffdfa] p-4";
export const quietClass = "text-sm text-textMuted";
export const metricPanelClass = "grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4";
export const buttonRowClass = "flex flex-wrap items-center gap-2.5";
export const formGridClass = "grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-end";
export const transparentPreviewClass = "bg-[length:24px_24px] bg-[repeating-conic-gradient(#d6d6d6_0_25%,#ffffff_0_50%)]";

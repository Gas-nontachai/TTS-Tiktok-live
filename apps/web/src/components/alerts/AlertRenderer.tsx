import { useEffect, useState, type CSSProperties } from "react";
import type { AlertEvent, AppConfig, AlertVisualTemplate } from "../../types";
import { cn } from "../../lib/utils";
import { renderTemplate, typeLabel } from "../../utils/helpers";

type AlertConfig = AppConfig["alerts"][keyof AppConfig["alerts"]];
type AlertPosition = AppConfig["overlay"]["alertPosition"];

type AlertRendererProps = {
  event: AlertEvent;
  alertConfig: AlertConfig;
  position: AlertPosition;
};

const templateEmoji: Record<AlertVisualTemplate, string> = {
  "gift-pop": "🎁",
  "neon-pop": "✨",
  "minimal-toast": "🔔",
  "big-shoutout": "🎉",
  "goal-complete": "🏆"
};

export function AlertRenderer({ event, alertConfig, position }: AlertRendererProps) {
  const visualMode = alertConfig.visualMode ?? "custom";

  if (visualMode === "template") {
    return <TemplateAlert event={event} alertConfig={alertConfig} position={position} />;
  }

  return <CustomAlert event={event} alertConfig={alertConfig} position={position} />;
}

function CustomAlert({ event, alertConfig, position }: AlertRendererProps) {
  return (
    <div
      key={`${event.id}-${alertConfig.enterAnimation}-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 flex w-[calc(100%_-_64px)] max-w-[620px] transform-gpu gap-3 rounded-lg border px-5 py-4 text-white shadow-[0_20px_55px_rgba(0,0,0,0.35)] [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(position),
        mediaPositionClass(alertConfig.mediaPosition),
        alertAnimationClass(alertConfig.enterAnimation),
        alertStyleClass(alertConfig.stylePreset)
      )}
      style={{ animationDuration: `${alertConfig.animationDurationMs}ms` }}
    >
      {alertConfig.mediaUrl ? (
        <img
          src={alertConfig.mediaUrl}
          alt=""
          className="shrink-0 rounded-lg object-contain"
          style={{ width: alertConfig.mediaSize, height: alertConfig.mediaSize }}
        />
      ) : null}
      <div className="grid min-w-0 gap-1">
        <strong className="text-sm uppercase tracking-[0.08em] text-white/80">{typeLabel(event.type)}</strong>
        <span className="text-2xl font-black leading-tight">{renderTemplate(alertConfig.template, event)}</span>
      </div>
    </div>
  );
}

function TemplateAlert({ event, alertConfig, position }: AlertRendererProps) {
  const visualTemplate = alertConfig.visualTemplate ?? "minimal-toast";

  switch (visualTemplate) {
    case "gift-pop":
      return <GiftPopTemplate event={event} alertConfig={alertConfig} position={position} />;
    case "neon-pop":
      return <NeonPopTemplate event={event} alertConfig={alertConfig} position={position} />;
    case "big-shoutout":
      return <BigShoutoutTemplate event={event} alertConfig={alertConfig} position={position} />;
    case "goal-complete":
      return <GoalCompleteTemplate event={event} alertConfig={alertConfig} position={position} />;
    default:
      return <MinimalToastTemplate event={event} alertConfig={alertConfig} position={position} />;
  }
}

function GiftPopTemplate({ event, alertConfig, position }: AlertRendererProps) {
  const giftName = event.type === "gift" ? event.giftName || "gift" : typeLabel(event.type);
  const giftCount = event.type === "gift" ? event.giftCount || 1 : 1;
  const sender = eventSenderName(event);

  return (
    <div
      key={`${event.id}-gift-pop-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 grid w-[calc(100%_-_64px)] max-w-[520px] transform-gpu justify-items-center gap-2 text-center text-white [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(position),
        "animate-alert-bounce"
      )}
      style={{ animationDuration: `${Math.max(alertConfig.animationDurationMs, 360)}ms` }}
    >
      <div className="relative grid justify-items-center">
        <div className="absolute inset-0 scale-125 rounded-full bg-[radial-gradient(circle,rgba(255,207,90,0.34),rgba(255,79,216,0.18)_45%,transparent_70%)] blur-md" />
        <TemplateMedia alertConfig={alertConfig} emoji={giftEmoji(giftName)} size="hero" />
        <span className="relative -mt-4 rounded-full border border-[#ffcf5a]/70 bg-[#24120f]/90 px-5 py-1.5 text-3xl font-black text-[#ffec9d] shadow-[0_10px_30px_rgba(255,207,90,0.28)]">x{giftCount}</span>
      </div>
      <div className="grid max-w-full justify-items-center gap-1 rounded-[30px] border border-white/20 bg-[#171018]/88 px-8 py-4 shadow-[0_22px_70px_rgba(255,69,145,0.38)] backdrop-blur-xl">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd6eb]">Gift Pop</span>
        <strong className="max-w-full truncate text-4xl font-black leading-none text-white [text-shadow:0_3px_22px_rgba(255,79,216,0.55)]">{sender}</strong>
        <span className="text-lg font-bold leading-tight text-white/88">
          sent <span className="text-[#ffcf5a]">{giftName}</span>
        </span>
      </div>
      <span className="sr-only">{templateMessage(alertConfig, event)}</span>
    </div>
  );
}

function NeonPopTemplate({ event, alertConfig, position }: AlertRendererProps) {
  return (
    <div
      key={`${event.id}-neon-pop-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 grid w-[calc(100%_-_64px)] max-w-[620px] transform-gpu justify-items-center gap-4 text-center text-white [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(position),
        "animate-alert-pop"
      )}
      style={{ animationDuration: `${Math.max(alertConfig.animationDurationMs, 320)}ms` }}
    >
      <div className="relative grid min-h-[11rem] w-full place-items-center overflow-hidden rounded-[34px] border-2 border-[#79e0d4]/80 bg-[#061514]/90 px-8 py-7 shadow-[0_0_22px_rgba(121,224,212,0.58),0_0_70px_rgba(255,79,216,0.28)]">
        <div className="absolute -left-12 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-[#ff4fd8]/25 blur-2xl" />
        <div className="absolute -right-10 top-2 h-24 w-24 rounded-full bg-[#79e0d4]/25 blur-2xl" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#79e0d4] to-transparent" />
        <div className="relative grid justify-items-center gap-2">
          <TemplateMedia alertConfig={alertConfig} emoji={templateEmoji["neon-pop"]} size="icon" />
          <span className="rounded-full border border-[#79e0d4]/50 bg-[#79e0d4]/10 px-4 py-1 text-xs font-black uppercase tracking-[0.22em] text-[#9ff7ed]">Neon Pop</span>
          <strong className="max-w-full text-4xl font-black leading-tight text-white [text-shadow:0_0_18px_rgba(121,224,212,0.55)]">{templateMessage(alertConfig, event)}</strong>
        </div>
      </div>
    </div>
  );
}

function BigShoutoutTemplate({ event, alertConfig, position }: AlertRendererProps) {
  const sender = eventSenderName(event);

  return (
    <div
      key={`${event.id}-big-shoutout-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 w-[calc(100%_-_64px)] max-w-[880px] transform-gpu text-white [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(position),
        "animate-slide-up"
      )}
      style={{ animationDuration: `${Math.max(alertConfig.animationDurationMs, 340)}ms` }}
    >
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 overflow-hidden rounded-[18px] border-y-2 border-[#ffcf5a] bg-gradient-to-r from-[#140d05]/92 via-[#321b07]/94 to-[#140d05]/92 px-7 py-5 shadow-[0_24px_70px_rgba(255,207,90,0.25)]">
        <div className="absolute inset-y-0 left-0 w-2 bg-[#ffcf5a]" />
        <div className="absolute inset-y-0 right-0 w-2 bg-[#ff4fd8]" />
        <TemplateMedia alertConfig={alertConfig} emoji={templateEmoji["big-shoutout"]} size="icon" />
        <div className="grid min-w-0 gap-1">
          <span className="text-sm font-black uppercase tracking-[0.24em] text-[#ffec9d]">Big Shoutout</span>
          <strong className="truncate text-5xl font-black leading-none text-white [text-shadow:0_4px_22px_rgba(255,207,90,0.42)]">{sender}</strong>
          <span className="text-xl font-bold leading-tight text-white/85">{templateMessage(alertConfig, event)}</span>
        </div>
      </div>
    </div>
  );
}

function GoalCompleteTemplate({ event, alertConfig, position }: AlertRendererProps) {
  const percent = event.type === "goal" ? Math.min(100, Math.round((event.currentValue / event.targetValue) * 100)) : 100;
  const title = event.type === "goal" ? event.goalTitle : typeLabel(event.type);

  return (
    <div
      key={`${event.id}-goal-complete-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 grid w-[calc(100%_-_64px)] max-w-[560px] transform-gpu justify-items-center gap-3 text-center text-white [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(position),
        "animate-alert-zoom"
      )}
      style={{ animationDuration: `${Math.max(alertConfig.animationDurationMs, 360)}ms` }}
    >
      <div className="relative grid w-full justify-items-center overflow-hidden rounded-[32px] border border-[#9be87d]/65 bg-[#0e1f10]/92 px-7 pb-6 pt-8 shadow-[0_22px_70px_rgba(105,211,145,0.34)]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c9ffbd] to-transparent" />
        <TemplateMedia alertConfig={alertConfig} emoji={templateEmoji["goal-complete"]} size="icon" />
        <span className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-[#c9ffbd]">Goal Complete</span>
        <strong className="mt-1 max-w-full text-4xl font-black leading-tight text-white">{title}</strong>
        <span className="mt-1 text-lg font-bold text-white/80">{templateMessage(alertConfig, event)}</span>
        <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-white/16 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
          <span className="block h-full rounded-full bg-gradient-to-r from-[#69d391] via-[#c9ffbd] to-[#ffcf5a]" style={{ width: `${percent}%` }} />
        </div>
        <span className="mt-2 text-sm font-black text-[#c9ffbd]">{percent}%</span>
      </div>
    </div>
  );
}

function MinimalToastTemplate({ event, alertConfig, position }: AlertRendererProps) {
  return (
    <div
      key={`${event.id}-minimal-toast-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 flex w-[calc(100%_-_64px)] max-w-[620px] transform-gpu items-center gap-3 rounded-2xl border border-white/25 bg-black/55 px-5 py-4 text-white shadow-[0_20px_55px_rgba(0,0,0,0.35)] [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(position),
        "animate-fade-in"
      )}
      style={{ animationDuration: `${Math.max(alertConfig.animationDurationMs, 300)}ms` }}
    >
      <TemplateMedia alertConfig={alertConfig} emoji={templateEmoji["minimal-toast"]} size="compact" />
      <div className="grid min-w-0 gap-1">
        <strong className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Minimal Toast</strong>
        <span className="text-2xl font-black leading-tight text-white">{templateMessage(alertConfig, event)}</span>
      </div>
    </div>
  );
}

function TemplateMedia({ alertConfig, emoji, size }: { alertConfig: AlertConfig; emoji: string; size: "hero" | "icon" | "compact" }) {
  const [mediaOk, setMediaOk] = useState(Boolean(alertConfig.mediaUrl));

  useEffect(() => {
    setMediaOk(Boolean(alertConfig.mediaUrl));
  }, [alertConfig.mediaUrl]);

  const px = size === "hero"
    ? Math.max(118, Math.min(alertConfig.mediaSize, 176))
    : size === "icon"
      ? Math.max(74, Math.min(alertConfig.mediaSize, 104))
      : Math.max(48, Math.min(alertConfig.mediaSize, 68));
  const style: CSSProperties = { width: px, height: px };
  const emojiSize = size === "hero" ? "text-7xl" : size === "icon" ? "text-5xl" : "text-3xl";

  if (alertConfig.mediaUrl && mediaOk) {
    return (
      <img
        src={alertConfig.mediaUrl}
        alt=""
        className="relative z-10 shrink-0 rounded-3xl bg-white/14 object-contain p-2 shadow-[0_12px_36px_rgba(255,255,255,0.18)]"
        style={style}
        onError={() => setMediaOk(false)}
      />
    );
  }

  return (
    <span
      className={cn("relative z-10 grid shrink-0 place-items-center rounded-3xl bg-white/15 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]", emojiSize)}
      style={style}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}

function giftEmoji(giftName: string) {
  const normalized = giftName.toLowerCase();
  if (normalized.includes("rose")) return "🌹";
  if (normalized.includes("diamond")) return "💎";
  return "🎁";
}

function eventSenderName(event: AlertEvent) {
  return "displayName" in event ? event.displayName || event.username || "Someone" : "Someone";
}

function templateMessage(alertConfig: AlertConfig, event: AlertEvent) {
  return renderTemplate(alertConfig.template, event);
}

function overlayPositionClass(position: string) {
  switch (position) {
    case "top-left":
      return "left-8 top-8";
    case "top-right":
      return "right-8 top-8";
    case "bottom-left":
      return "bottom-8 left-8";
    case "bottom-right":
      return "bottom-8 right-8";
    default:
      return "bottom-8 left-8";
  }
}

function alertAnimationClass(animation: string) {
  switch (animation) {
    case "none":
      return "";
    case "pop":
      return "animate-alert-pop";
    case "bounce":
      return "animate-alert-bounce";
    case "zoom":
      return "animate-alert-zoom";
    case "flip":
      return "animate-alert-flip";
    case "slide-up":
      return "animate-slide-up";
    case "slide-left":
      return "animate-slide-left";
    case "slide-right":
      return "animate-slide-right";
    case "glow-pulse":
      return "animate-alert-glow-pulse";
    case "fade":
      return "animate-fade-in";
    default:
      return "animate-alert-pop";
  }
}

function alertStyleClass(style: string) {
  switch (style) {
    case "neon":
      return "border-[#79e0d4]/75 bg-[#071512]/85 shadow-[0_0_28px_rgba(121,224,212,0.45)]";
    case "solid":
      return "border-[#52684d] bg-[#52684d]";
    case "minimal":
      return "border-white/25 bg-black/45 shadow-[0_14px_40px_rgba(0,0,0,0.25)]";
    default:
      return "border-white/25 bg-black/55 backdrop-blur-md";
  }
}

function mediaPositionClass(position: string) {
  switch (position) {
    case "right":
      return "flex-row-reverse items-center";
    case "top":
      return "flex-col items-center text-center";
    case "bottom":
      return "flex-col-reverse items-center text-center";
    default:
      return "flex-row items-center";
  }
}

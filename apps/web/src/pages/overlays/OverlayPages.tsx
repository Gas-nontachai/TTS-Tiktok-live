import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useSpeechQueue } from "../../hooks/useSpeechQueue";
import { useAlertQueue } from "../../hooks/useAlertQueue";
import { Button, CopyRow, Metric } from "../../components/ui";
import { Avatar } from "../../components";
import type { AlertEvent, ChatMessageEvent, GoalConfig } from "../../types";
import { ttsPlayerUrl } from "../../config/constants";
import { cn } from "../../lib/utils";
import { chatBoxStyle, filterChat, renderTemplate, trimMessages, typeLabel } from "../../utils/helpers";

const obsOverlayClass = "pointer-events-none relative h-screen w-screen overflow-hidden bg-transparent font-sans";

type HeartParticle = {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

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

function viewerAnimationClass(animation: string) {
  switch (animation) {
    case "fade":
      return "animate-fade-in";
    case "pulse":
      return "animate-viewer-pulse";
    case "count-pop":
      return "animate-count-pop";
    default:
      return "";
  }
}

function heartAnimationClass(animation: string) {
  switch (animation) {
    case "burst":
      return "animate-heart-burst";
    case "spiral":
      return "animate-heart-spiral";
    case "side-float":
      return "animate-heart-side-float";
    case "confetti":
      return "animate-heart-confetti";
    default:
      return "animate-float-heart";
  }
}

function createHeartParticles(eventId: string, count: number, baseSize: number, baseDuration: number): HeartParticle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${eventId}_${index}_${Date.now()}`,
    x: 16 + Math.random() * 190,
    y: 10 + Math.random() * 120,
    size: Math.max(18, baseSize + Math.round((Math.random() - 0.5) * 12)),
    duration: Math.max(900, baseDuration + Math.round((Math.random() - 0.5) * 420)),
    delay: index * 45 + Math.round(Math.random() * 120)
  }));
}

function heartPositionStyle(position: string, heart: HeartParticle): CSSProperties {
  const base: CSSProperties = {
    fontSize: heart.size,
    animationDuration: `${heart.duration}ms`,
    animationDelay: `${heart.delay}ms`
  };

  if (position.includes("left")) {
    base.left = `${heart.x}px`;
  } else {
    base.right = `${heart.x}px`;
  }

  if (position.includes("top")) {
    base.top = `${heart.y}px`;
  } else {
    base.bottom = `${heart.y}px`;
  }

  return base;
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

function chatAnimationClass(animation: string) {
  switch (animation) {
    case "pop":
      return "animate-alert-pop";
    case "stack-pop":
      return "animate-stack-pop";
    case "soft-drop":
      return "animate-soft-drop";
    case "slide-up":
      return "animate-slide-up";
    case "slide-left":
      return "animate-slide-left";
    case "slide-right":
      return "animate-slide-right";
    case "fade":
      return "animate-fade-in";
    default:
      return "";
  }
}

export function MainOverlay() {
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const stats = useAppStore((state) => state.stats);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const current = useAlertQueue(config.overlay.showAlerts);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    const latest = events[0];
    if (!latest || seenRef.current.has(latest.id)) {
      return;
    }
    seenRef.current.add(latest.id);

    if (latest.type === "like" && config.overlay.showHearts && config.likeHearts.enabled) {
      const cap = config.likeHearts.intensity === "high" ? 12 : config.likeHearts.intensity === "normal" ? 6 : 3;
      const count = Math.min(latest.likeCount || 1, cap, config.likeHearts.maxHeartsOnScreen);
      const next = createHeartParticles(latest.id, count, config.likeHearts.heartSize, config.likeHearts.animationDurationMs);
      setHearts((items) => [...items, ...next].slice(-config.likeHearts.maxHeartsOnScreen));
      const cleanupMs = Math.max(...next.map((heart) => heart.duration + heart.delay)) + 120;
      window.setTimeout(() => setHearts((items) => items.filter((heart) => !next.some((candidate) => candidate.id === heart.id))), cleanupMs);
    }
  }, [config, events]);

  return (
    <main className={obsOverlayClass}>
      {config.overlay.showViewerCount && config.viewerCount.enabled ? (
        <div key={`${config.viewerCount.animationPreset}-${stats.viewerCount}`} className={cn("absolute z-[5] transform-gpu rounded-full bg-black/50 px-4 py-2.5 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.35)] will-change-transform", overlayPositionClass(config.viewerCount.position), viewerAnimationClass(config.viewerCount.animationPreset))} style={{ fontSize: config.viewerCount.fontSize }}>
          {config.viewerCount.showIcon ? "👁 " : null}
          {config.viewerCount.label} {stats.viewerCount}
        </div>
      ) : null}
      {current ? <AlertCard event={current} /> : null}
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={cn("absolute z-[4] transform-gpu text-[#ff3f86] [filter:drop-shadow(0_10px_18px_rgba(255,63,134,0.4))] will-change-transform", heartAnimationClass(config.likeHearts.animationPreset))}
          style={heartPositionStyle(config.likeHearts.spawnPosition, heart)}
        >
          ♥
        </span>
      ))}
      {config.overlay.showGoals ? <GoalLayer /> : null}
      {config.overlay.showChatInMain ? <ChatBox messages={chatMessages} /> : null}
    </main>
  );
}

export function AlertsOverlay() {
  return (
    <main className={obsOverlayClass}>
      <AlertsLayer />
    </main>
  );
}

function AlertsLayer() {
  const config = useAppStore((state) => state.config);
  const current = useAlertQueue(config.overlay.showAlerts);

  if (!config.overlay.showAlerts || !current) {
    return null;
  }

  return <AlertCard event={current} />;
}

function AlertCard({ event }: { event: AlertEvent }) {
  const config = useAppStore((state) => state.config);
  const alertConfig = config.alerts[event.type];

  return (
    <div
      key={`${event.id}-${alertConfig.enterAnimation}-${alertConfig.animationDurationMs}`}
      className={cn(
        "absolute z-10 flex max-w-[min(620px,86vw)] transform-gpu gap-3 rounded-lg border px-5 py-4 text-white shadow-[0_20px_55px_rgba(0,0,0,0.35)] [overflow-wrap:anywhere] will-change-transform",
        overlayPositionClass(config.overlay.alertPosition),
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

export function ViewerCountOverlay() {
  return (
    <main className={obsOverlayClass}>
      <ViewerCountLayer />
    </main>
  );
}

export function GoalsOverlay() {
  return (
    <main className={obsOverlayClass}>
      <GoalLayer />
    </main>
  );
}

function GoalLayer() {
  const config = useAppStore((state) => state.config);
  const activeGoals = config.goals.filter((goal) => goal.enabled);

  if (!config.overlay.showGoals || activeGoals.length === 0) {
    return null;
  }

  return (
    <section className="absolute bottom-8 left-8 grid w-[min(480px,calc(100vw-48px))] gap-2.5">
      {activeGoals.map((goal) => (
        <GoalWidget key={goal.id} goal={goal} />
      ))}
    </section>
  );
}

function GoalWidget({ goal }: { goal: GoalConfig }) {
  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

  return (
    <article className={cn("grid gap-2 rounded-lg border border-white/30 bg-[rgba(18,24,20,0.78)] p-3 text-white shadow-[0_18px_44px_rgba(0,0,0,0.35)] backdrop-blur-md", goal.completed ? "border-[#f7c948] shadow-[0_0_24px_rgba(247,201,72,0.35)]" : "")}>
      <header className="flex items-center justify-between gap-3">
        <strong className="min-w-0 truncate">{goal.title}</strong>
        <span className="text-sm font-bold text-white/80">{percent}%</span>
      </header>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
        <span className="block h-full rounded-full bg-gradient-to-r from-[#69d391] to-[#f7c948]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-white/80">
        {Math.floor(goal.currentValue).toLocaleString()} / {Math.floor(goal.targetValue).toLocaleString()}
      </p>
    </article>
  );
}

function ViewerCountLayer() {
  const config = useAppStore((state) => state.config);
  const stats = useAppStore((state) => state.stats);

  if (!config.overlay.showViewerCount || !config.viewerCount.enabled) {
    return null;
  }

  return (
    <div key={`${config.viewerCount.animationPreset}-${stats.viewerCount}`} className={cn("absolute z-[5] transform-gpu rounded-full bg-black/50 px-4 py-2.5 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.35)] will-change-transform", overlayPositionClass(config.viewerCount.position), viewerAnimationClass(config.viewerCount.animationPreset))} style={{ fontSize: config.viewerCount.fontSize }}>
      {config.viewerCount.showIcon ? "👁 " : null}
      {config.viewerCount.label} {stats.viewerCount}
    </div>
  );
}

export function HeartsOverlay() {
  return (
    <main className={obsOverlayClass}>
      <HeartsLayer />
    </main>
  );
}

function HeartsLayer() {
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    const latest = events[0];
    if (!latest || latest.type !== "like" || seenRef.current.has(latest.id)) {
      return;
    }
    seenRef.current.add(latest.id);

    if (!config.overlay.showHearts || !config.likeHearts.enabled) {
      return;
    }

    const cap = config.likeHearts.intensity === "high" ? 12 : config.likeHearts.intensity === "normal" ? 6 : 3;
    const count = Math.min(latest.likeCount || 1, cap, config.likeHearts.maxHeartsOnScreen);
    const next = createHeartParticles(latest.id, count, config.likeHearts.heartSize, config.likeHearts.animationDurationMs);
    setHearts((items) => [...items, ...next].slice(-config.likeHearts.maxHeartsOnScreen));
    const cleanupMs = Math.max(...next.map((heart) => heart.duration + heart.delay)) + 120;
    window.setTimeout(() => setHearts((items) => items.filter((heart) => !next.some((candidate) => candidate.id === heart.id))), cleanupMs);
  }, [config, events]);

  if (!config.overlay.showHearts || !config.likeHearts.enabled) {
    return null;
  }

  return (
    <>
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={cn("absolute z-[4] transform-gpu text-[#ff3f86] [filter:drop-shadow(0_10px_18px_rgba(255,63,134,0.4))] will-change-transform", heartAnimationClass(config.likeHearts.animationPreset))}
          style={heartPositionStyle(config.likeHearts.spawnPosition, heart)}
        >
          ♥
        </span>
      ))}
    </>
  );
}

export function TtsOverlay() {
  return <main className={obsOverlayClass} aria-label="TTS moved to browser player" />;
}

export function TtsPlayerPage() {
  const { stopSpeaking, testSpeak } = useSpeechQueue();
  const config = useAppStore((state) => state.config);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const currentSpeakingText = useAppStore((state) => state.currentSpeakingText);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const enabled = config.tts.enabled && !config.tts.muted;
  const stopAllTts = () => {
    window.dispatchEvent(new CustomEvent("stop-tts"));
    stopSpeaking();
  };

  return (
    <main className="grid min-h-screen place-items-center bg-surface p-5 text-text">
      <section className="grid w-full max-w-[820px] animate-panel-enter gap-4 rounded-lg border border-surfaceMuted bg-[#fffdfa] p-5 shadow-[0_18px_50px_rgba(47,53,46,0.12)]">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-textMuted">Browser TTS Player</p>
          <h1>เล่นเสียง TTS ผ่าน Browser</h1>
          <p className="mt-2 text-sm text-textMuted">เปิดหน้านี้ค้างไว้บนเครื่องสตรีม แล้วกด Enable Audio ก่อนเริ่มไลฟ์ OBS overlay จะไม่พูดเองแล้ว</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={() => {
              setAudioEnabled(true);
              testSpeak("TTS player ready");
            }}
          ><Play size={16} />Enable Audio
          </Button>
          <Button variant="secondary" onClick={stopAllTts}><Pause size={16} />Stop</Button>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="WebSocket" value={wsConnected ? "online" : "offline"} />
          <Metric label="Audio" value={audioEnabled ? "enabled" : "waiting"} />
          <Metric label="TTS" value={enabled ? "ready" : "disabled"} />
          <Metric label="Scope" value="global" />
        </div>
        <div className="grid gap-1 rounded-md border border-surfaceMuted bg-white p-3">
          <span>Last spoken</span>
          <strong>{currentSpeakingText || "Idle"}</strong>
        </div>
        <CopyRow label="Player URL" value={ttsPlayerUrl} />
      </section>
    </main>
  );
}

export function ChatOverlay() {
  const config = useAppStore((state) => state.config);
  const incomingMessages = useAppStore((state) => state.chatMessages);
  const [messages, setMessages] = useState<ChatMessageEvent[]>([]);
  const seenRef = useRef(new Set<string>());
  const duplicatesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const latest = incomingMessages[0];
    if (!latest || seenRef.current.has(latest.id)) {
      return;
    }
    seenRef.current.add(latest.id);
    const filtered = filterChat(latest, config, duplicatesRef.current);
    if (!filtered) {
      return;
    }
    setMessages((items) => {
      const next = config.chat.queue.newestPosition === "top" ? [filtered, ...items] : [...items, filtered];
      return trimMessages(next, config.chat.queue.maxVisibleMessages, config.chat.queue.newestPosition);
    });
    window.setTimeout(() => {
      setMessages((items) => items.filter((message) => message.id !== latest.id));
    }, config.chat.queue.messageLifetimeMs);
  }, [config, incomingMessages]);

  useEffect(() => {
    if (incomingMessages.length === 0) {
      setMessages([]);
    }
  }, [incomingMessages.length]);

  return (
    <main className={obsOverlayClass}>
      <ChatBox messages={messages} />
    </main>
  );
}

function ChatBox({ messages }: { messages: ChatMessageEvent[] }) {
  const config = useAppStore((state) => state.config);
  const style = chatBoxStyle(config.chat.position);
  const theme = config.chat.theme;
  const ordered = config.chat.display.messageOrder === "newest-first" ? messages : [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <section className="absolute z-[6] flex flex-col justify-end overflow-hidden" style={style}>
      {ordered.map((message) => (
        <article
          key={message.id}
          className={cn(
            "flex items-start gap-2.5 border border-transparent leading-[1.28] [overflow-wrap:anywhere]",
            config.chat.display.compactMode ? "block" : "",
            config.chat.animation.enabled ? chatAnimationClass(config.chat.animation.enterAnimation) : ""
          )}
          style={{
            color: theme.textColor,
            fontFamily: theme.fontFamily,
            fontSize: theme.messageFontSize,
            background: config.chat.display.compactMode ? "transparent" : theme.bubbleColor,
            borderColor: theme.borderColor,
            borderRadius: theme.borderRadius,
            opacity: theme.opacity / 100,
            padding: theme.padding,
            marginBottom: theme.spacing,
            animationDuration: `${config.chat.animation.durationMs}ms`,
            boxShadow: theme.shadowEnabled ? "0 10px 30px rgba(0,0,0,0.35)" : "none"
          }}
        >
          {config.chat.display.showAvatar && !config.chat.display.compactMode ? <Avatar message={message} /> : null}
          <div className="min-w-0">
            <header className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {config.chat.display.showDisplayName ? <strong style={{ color: theme.usernameColor, fontSize: theme.usernameFontSize }}>{message.displayName || message.username}</strong> : null}
              {config.chat.display.showUsername ? <span className="text-[0.85em] opacity-70">@{message.username}</span> : null}
              {config.chat.display.showTimestamp ? <time className="text-[0.8em] opacity-60">{new Date(message.timestamp).toLocaleTimeString()}</time> : null}
            </header>
            <p className="m-0">{message.message}</p>
          </div>
        </article>
      ))}
    </section>
  );
}


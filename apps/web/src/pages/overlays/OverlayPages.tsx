import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useSpeechQueue } from "../../hooks/useSpeechQueue";
import { useAlertQueue } from "../../hooks/useAlertQueue";
import { Button, CopyRow, Metric } from "../../components/ui";
import { Avatar } from "../../components";
import { AlertRenderer } from "../../components/alerts/AlertRenderer";
import type { AlertEvent, AppConfig, ChatMessageEvent, GoalConfig } from "../../types";
import { ttsPlayerUrl } from "../../config/constants";
import { cn } from "../../lib/utils";
import { chatBoxStyle, filterChat, trimMessages } from "../../utils/helpers";

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
    default:
      return "";
  }
}

function ViewerCountBadge({ count, viewerCountConfig }: { count: number; viewerCountConfig: AppConfig["viewerCount"] }) {
  const prefix = viewerCountPrefix(viewerCountConfig);

  return (
    <div
      className={cn(
        "absolute z-[5] rounded-full bg-black/50 px-4 py-2.5 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.35)]",
        "flex items-center gap-1.5 whitespace-nowrap font-semibold tabular-nums",
        overlayPositionClass(viewerCountConfig.position),
        viewerAnimationClass(viewerCountConfig.animationPreset)
      )}
      style={{ fontSize: viewerCountConfig.fontSize }}
    >
      {prefix ? <span>{prefix}</span> : null}
      <RollingNumber value={count} animate={viewerCountConfig.animationPreset === "count-pop" || viewerCountConfig.animationPreset === "pulse"} />
    </div>
  );
}

function viewerCountPrefix(viewerCountConfig: AppConfig["viewerCount"]) {
  return viewerCountConfig.label.trim().replace(/^👁\s*/u, "");
}

function RollingNumber({ value, animate }: { value: number; animate: boolean }) {
  const text = Math.max(0, Math.round(value)).toLocaleString("en-US");

  if (!animate) {
    return <span>{text}</span>;
  }

  return (
    <span className="inline-flex h-[1.12em] items-center overflow-hidden leading-none" aria-label={text}>
      {text.split("").map((character, index) => (
        <RollingCharacter key={`${index}-${text.length}`} character={character} />
      ))}
    </span>
  );
}

function RollingCharacter({ character }: { character: string }) {
  if (!/\d/.test(character)) {
    return (
      <span className="inline-block w-[0.38em] text-center leading-none" aria-hidden="true">
        {character}
      </span>
    );
  }

  const digit = Number(character);

  return (
    <span className="relative inline-block h-[1.12em] w-[0.62em] overflow-hidden text-center leading-none" aria-hidden="true">
      <span className="absolute left-0 top-0 grid w-full transition-transform duration-500 ease-out" style={{ transform: `translateY(-${digit * 1.12}em)` }}>
        {"0123456789".split("").map((item) => (
          <span key={item} className="h-[1.12em] leading-[1.12em]">
            {item}
          </span>
        ))}
      </span>
    </span>
  );
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
        <ViewerCountBadge count={stats.viewerCount} viewerCountConfig={config.viewerCount} />
      ) : null}
      {current ? <AlertRenderer event={current} alertConfig={config.alerts[current.type]} position={config.overlay.alertPosition} /> : null}
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

  return <AlertRenderer event={current} alertConfig={config.alerts[current.type]} position={config.overlay.alertPosition} />;
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
    <section className="absolute bottom-8 left-1/2 grid w-[min(760px,calc(100vw-48px))] -translate-x-1/2 gap-2.5">
      {activeGoals.map((goal) => (
        <GoalWidget key={goal.id} goal={goal} />
      ))}
    </section>
  );
}

export function GoalWidget({ goal }: { goal: GoalConfig }) {
  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const currentValue = Math.floor(goal.currentValue).toLocaleString();
  const targetValue = Math.floor(goal.targetValue).toLocaleString();
  const template = goal.visualTemplate ?? "event-bar";

  if (template === "neon-slab") {
    return (
      <article className="relative grid gap-2 px-7 py-4 text-white [text-shadow:0_2px_5px_rgba(0,0,0,0.9),0_0_12px_rgba(0,0,0,0.7)]">
        <header className="flex items-end justify-between gap-4">
          <strong className="min-w-0 truncate text-[clamp(20px,3.3vw,34px)] font-black leading-none">{goal.title}</strong>
          <span className="text-[clamp(18px,2.8vw,30px)] font-black text-cyan-100">{percent}%</span>
        </header>
        <div className="relative h-5 overflow-hidden rounded-full bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
          <span className="block h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#a3e635,#facc15)] shadow-[0_0_18px_rgba(34,211,238,0.6)]" style={{ width: `${percent}%` }} />
        </div>
        <footer className="flex items-center justify-between gap-4 text-[clamp(14px,2vw,20px)] font-black text-white/90">
          <span>{currentValue}</span>
          <span>เป้าหมาย {targetValue}</span>
        </footer>
      </article>
    );
  }

  if (template === "quest-meter") {
    return (
      <article className="relative grid gap-2 px-6 py-2 text-white [text-shadow:0_2px_3px_rgba(0,0,0,0.9),0_0_8px_rgba(0,0,0,0.7)]">
        <header className="relative z-[1] flex items-center justify-between gap-3">
          <strong className="min-w-0 truncate text-[clamp(18px,2.9vw,30px)] font-black">{goal.title}</strong>
          <span className="rounded-sm bg-amber-300 px-2 py-1 text-[clamp(14px,2vw,20px)] font-black text-black [text-shadow:none]">{percent}%</span>
        </header>
        <div className="relative z-[1] h-4 overflow-hidden rounded-sm bg-white/18 shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
          <span className="block h-full bg-[linear-gradient(90deg,#f97316,#fde047)]" style={{ width: `${percent}%` }} />
        </div>
        <p className="relative z-[1] text-center text-[clamp(14px,2vw,20px)] font-black">{currentValue} / {targetValue}</p>
      </article>
    );
  }

  if (template === "score-strip") {
    return (
      <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.7)]">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#19f132] text-xl font-black text-black shadow-[0_0_18px_rgba(25,241,50,0.7)] [text-shadow:none]">{percent}%</div>
        <div className="grid min-w-0 gap-2">
          <strong className="truncate text-[clamp(18px,3vw,30px)] font-black leading-none">{goal.title}</strong>
          <div className="h-3 overflow-hidden rounded-full bg-white/18 shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
            <span className="block h-full rounded-full bg-[#19f132]" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <strong className="text-right text-[clamp(18px,2.8vw,30px)] font-black leading-none">{currentValue}<span className="block text-sm text-white/70">/ {targetValue}</span></strong>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative grid gap-1.5 px-8 pb-3 pt-1 text-center text-white [text-shadow:0_2px_3px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.65)]",
        goal.completed ? "[filter:drop-shadow(0_0_14px_rgba(247,201,72,0.38))]" : ""
      )}
    >
      <strong className="relative z-[1] mx-auto max-w-full truncate text-[clamp(22px,4vw,38px)] font-black leading-none">
        {goal.title}
      </strong>
      <div className="relative z-[1] mt-1 h-12">
        <div className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 rounded-full bg-white/16 shadow-[0_2px_10px_rgba(0,0,0,0.65)]" />
        <span
          className="absolute left-0 top-1/2 h-11 min-w-11 -translate-y-1/2 rounded-full bg-[#19f132] shadow-[0_0_0_2px_rgba(0,0,0,0.35),0_0_18px_rgba(25,241,50,0.75)]"
          style={{ width: `max(44px, ${percent}%)` }}
        />
        <strong className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-[clamp(22px,3.8vw,36px)] font-black leading-none">
          {currentValue} ({percent}%)
        </strong>
      </div>
      <footer className="relative z-[1] flex items-center justify-between gap-4 text-[clamp(16px,2.4vw,24px)] font-black leading-none">
        <span>จากเป้าหมาย {targetValue}</span>
        <span>{currentValue} / {targetValue}</span>
      </footer>
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
    <ViewerCountBadge count={stats.viewerCount} viewerCountConfig={config.viewerCount} />
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
  return <main className={obsOverlayClass} aria-label="TTS moved to player" />;
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

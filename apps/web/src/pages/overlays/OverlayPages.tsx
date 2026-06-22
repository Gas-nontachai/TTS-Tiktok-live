import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useSpeechQueue } from "../../hooks/useSpeechQueue";
import { Button, CopyRow, Metric } from "../../components/ui";
import { Avatar } from "../../components";
import type { AlertEvent, ChatMessageEvent } from "../../types";
import { ttsPlayerUrl } from "../../config/constants";
import { alertVolumeFor, chatBoxStyle, enqueueAlert, filterChat, isAlertEvent, playTone, renderTemplate, soundPresetFor, trimMessages, typeLabel } from "../../utils/helpers";

export function MainOverlay() {
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const stats = useAppStore((state) => state.stats);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const [queue, setQueue] = useState<AlertEvent[]>([]);
  const [current, setCurrent] = useState<AlertEvent | null>(null);
  const [hearts, setHearts] = useState<{ id: string; x: number; y: number }[]>([]);
  const seenRef = useRef(new Set<string>());
  const cooldownRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const latest = events[0];
    if (!latest || seenRef.current.has(latest.id)) {
      return;
    }
    seenRef.current.add(latest.id);

    if (latest.type === "like" && config.overlay.showHearts && config.likeHearts.enabled) {
      const cap = config.likeHearts.intensity === "high" ? 12 : config.likeHearts.intensity === "normal" ? 6 : 3;
      const count = Math.min(latest.likeCount || 1, cap, config.likeHearts.maxHeartsOnScreen);
      const next = Array.from({ length: count }, (_, index) => ({ id: `${latest.id}_${index}`, x: Math.random() * 80, y: Math.random() * 40 }));
      setHearts((items) => [...items, ...next].slice(-config.likeHearts.maxHeartsOnScreen));
      window.setTimeout(() => setHearts((items) => items.filter((heart) => !next.some((candidate) => candidate.id === heart.id))), config.likeHearts.animationDurationMs);
    }

    if ((latest.type === "share" || latest.type === "follow" || latest.type === "gift") && config.overlay.showAlerts) {
      const alertConfig = config.alerts[latest.type];
      const now = Date.now();
      if (!alertConfig.enabled || now < (cooldownRef.current[latest.type] || 0)) {
        return;
      }
      if (latest.type === "gift") {
        if (latest.giftCount < config.alerts.gift.minGiftCount || (latest.diamondCount || 0) < config.alerts.gift.minDiamondCount) {
          return;
        }
        if (config.alerts.gift.waitForRepeatEnd && latest.repeatEnd === false) {
          return;
        }
      }
      cooldownRef.current[latest.type] = now + alertConfig.cooldownMs;
      setQueue((items) => enqueueAlert(items, latest, config.alertQueue.maxQueueSize, config.alertQueue.allowGiftInterrupt));
    }
  }, [config, events]);

  useEffect(() => {
    if (current || queue.length === 0) {
      return;
    }

    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
    const alertConfig = config.alerts[next.type];

    if (alertConfig.playSound && config.sounds.enabled) {
      playTone(next.type, alertVolumeFor(next.type, config), soundPresetFor(next.type, config));
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setCurrent(null);
    }, alertConfig.durationMs);
  }, [config, current, queue]);

  useEffect(() => {
    const skip = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setCurrent(null);
    };
    window.addEventListener("skip-alert", skip);
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("skip-alert", skip);
    };
  }, []);

  return (
    <main className="obs-overlay">
      {config.overlay.showViewerCount && config.viewerCount.enabled ? (
        <div className={`viewer-count ${config.viewerCount.position} viewer-anim-${config.viewerCount.animationPreset}`} style={{ fontSize: config.viewerCount.fontSize }}>
          {config.viewerCount.showIcon ? "👁 " : null}
          {config.viewerCount.label} {stats.viewerCount}
        </div>
      ) : null}
      {current ? (
        <div
          className={`alert-card ${config.overlay.alertPosition} alert-anim-${config.alerts[current.type].enterAnimation} alert-style-${config.alerts[current.type].stylePreset}`}
          style={{ animationDuration: `${config.alerts[current.type].animationDurationMs}ms` }}
        >
          <strong>{typeLabel(current.type)}</strong>
          <span>{renderTemplate(config.alerts[current.type].template, current)}</span>
        </div>
      ) : null}
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={`floating-heart ${config.likeHearts.spawnPosition} heart-anim-${config.likeHearts.animationPreset}`}
          style={{
            fontSize: config.likeHearts.heartSize,
            animationDuration: `${config.likeHearts.animationDurationMs}ms`,
            right: `${heart.x}px`,
            bottom: `${heart.y}px`
          }}
        >
          ♥
        </span>
      ))}
      {config.overlay.showChatInMain ? <ChatBox messages={chatMessages} /> : null}
    </main>
  );
}

export function AlertsOverlay() {
  return (
    <main className="obs-overlay">
      <AlertsLayer />
    </main>
  );
}

function AlertsLayer() {
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const [queue, setQueue] = useState<AlertEvent[]>([]);
  const [current, setCurrent] = useState<AlertEvent | null>(null);
  const seenRef = useRef(new Set<string>());
  const cooldownRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const latest = events[0];
    if (!latest || !isAlertEvent(latest) || seenRef.current.has(latest.id)) {
      return;
    }
    seenRef.current.add(latest.id);

    if (!config.overlay.showAlerts) {
      return;
    }

    const alertConfig = config.alerts[latest.type];
    const now = Date.now();
    if (!alertConfig.enabled || now < (cooldownRef.current[latest.type] || 0)) {
      return;
    }

    if (latest.type === "gift") {
      if (latest.giftCount < config.alerts.gift.minGiftCount || (latest.diamondCount || 0) < config.alerts.gift.minDiamondCount) {
        return;
      }
      if (config.alerts.gift.waitForRepeatEnd && latest.repeatEnd === false) {
        return;
      }
    }

    cooldownRef.current[latest.type] = now + alertConfig.cooldownMs;
    setQueue((items) => enqueueAlert(items, latest, config.alertQueue.maxQueueSize, config.alertQueue.allowGiftInterrupt));
  }, [config, events]);

  useEffect(() => {
    if (current || queue.length === 0 || !config.overlay.showAlerts) {
      return;
    }

    const [next, ...rest] = queue;
    const alertConfig = config.alerts[next.type];
    setQueue(rest);
    setCurrent(next);

    if (alertConfig.playSound && config.sounds.enabled) {
      playTone(next.type, alertVolumeFor(next.type, config), soundPresetFor(next.type, config));
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setCurrent(null);
    }, alertConfig.durationMs);
  }, [config, current, queue]);

  useEffect(() => {
    const skip = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setCurrent(null);
    };
    window.addEventListener("skip-alert", skip);
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("skip-alert", skip);
    };
  }, []);

  if (!config.overlay.showAlerts || !current) {
    return null;
  }

  return (
    <div
      className={`alert-card ${config.overlay.alertPosition} alert-anim-${config.alerts[current.type].enterAnimation} alert-style-${config.alerts[current.type].stylePreset}`}
      style={{ animationDuration: `${config.alerts[current.type].animationDurationMs}ms` }}
    >
      <strong>{typeLabel(current.type)}</strong>
      <span>{renderTemplate(config.alerts[current.type].template, current)}</span>
    </div>
  );
}

export function ViewerCountOverlay() {
  return (
    <main className="obs-overlay">
      <ViewerCountLayer />
    </main>
  );
}

function ViewerCountLayer() {
  const config = useAppStore((state) => state.config);
  const stats = useAppStore((state) => state.stats);

  if (!config.overlay.showViewerCount || !config.viewerCount.enabled) {
    return null;
  }

  return (
    <div className={`viewer-count ${config.viewerCount.position} viewer-anim-${config.viewerCount.animationPreset}`} style={{ fontSize: config.viewerCount.fontSize }}>
      {config.viewerCount.showIcon ? "👁 " : null}
      {config.viewerCount.label} {stats.viewerCount}
    </div>
  );
}

export function HeartsOverlay() {
  return (
    <main className="obs-overlay">
      <HeartsLayer />
    </main>
  );
}

function HeartsLayer() {
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const [hearts, setHearts] = useState<{ id: string; x: number; y: number }[]>([]);
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
    const next = Array.from({ length: count }, (_, index) => ({ id: `${latest.id}_${index}`, x: Math.random() * 80, y: Math.random() * 40 }));
    setHearts((items) => [...items, ...next].slice(-config.likeHearts.maxHeartsOnScreen));
    window.setTimeout(() => setHearts((items) => items.filter((heart) => !next.some((candidate) => candidate.id === heart.id))), config.likeHearts.animationDurationMs);
  }, [config, events]);

  if (!config.overlay.showHearts || !config.likeHearts.enabled) {
    return null;
  }

  return (
    <>
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={`floating-heart ${config.likeHearts.spawnPosition} heart-anim-${config.likeHearts.animationPreset}`}
          style={{
            fontSize: config.likeHearts.heartSize,
            animationDuration: `${config.likeHearts.animationDurationMs}ms`,
            right: `${heart.x}px`,
            bottom: `${heart.y}px`
          }}
        >
          ♥
        </span>
      ))}
    </>
  );
}

export function TtsOverlay() {
  return <main className="obs-overlay" aria-label="TTS moved to browser player" />;
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
    <main className="tts-player-page">
      <section className="tts-player-panel">
        <div>
          <p className="eyebrow">Browser TTS Player</p>
          <h1>เล่นเสียง TTS ผ่าน Browser</h1>
          <p className="quiet">เปิดหน้านี้ค้างไว้บนเครื่องสตรีม แล้วกด Enable Audio ก่อนเริ่มไลฟ์ OBS overlay จะไม่พูดเองแล้ว</p>
        </div>
        <div className="button-row">
          <Button
            onClick={() => {
              setAudioEnabled(true);
              testSpeak("TTS player ready");
            }}
          ><Play size={16} />Enable Audio
          </Button>
          <Button variant="secondary" onClick={stopAllTts}><Pause size={16} />Stop</Button>
        </div>
        <div className="metric-panel">
          <Metric label="WebSocket" value={wsConnected ? "online" : "offline"} />
          <Metric label="Audio" value={audioEnabled ? "enabled" : "waiting"} />
          <Metric label="TTS" value={enabled ? "ready" : "disabled"} />
          <Metric label="Scope" value="global" />
        </div>
        <div className="player-status">
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
    <main className="obs-overlay chat-only">
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
    <section className="chat-box" style={style}>
      {ordered.map((message) => (
        <article
          key={message.id}
          className={`chat-message ${config.chat.display.compactMode ? "compact" : "bubble"} ${config.chat.animation.enabled ? config.chat.animation.enterAnimation : ""}`}
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
            boxShadow: theme.shadowEnabled ? "0 10px 30px rgba(0,0,0,0.35)" : "none"
          }}
        >
          {config.chat.display.showAvatar && !config.chat.display.compactMode ? <Avatar message={message} /> : null}
          <div>
            <header>
              {config.chat.display.showDisplayName ? <strong style={{ color: theme.usernameColor, fontSize: theme.usernameFontSize }}>{message.displayName || message.username}</strong> : null}
              {config.chat.display.showUsername ? <span>@{message.username}</span> : null}
              {config.chat.display.showTimestamp ? <time>{new Date(message.timestamp).toLocaleTimeString()}</time> : null}
            </header>
            <p>{message.message}</p>
          </div>
        </article>
      ))}
    </section>
  );
}


import { useEffect, useRef, useState } from "react";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import { useAppStore } from "../stores/appStore";
import type { AlertEvent } from "../types";
import { claimRecentKey, eventSemanticKey, filterChat, isAlertEvent, renderTemplate } from "../utils/helpers";

const speakerId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const speakerLockKey = "tiktok-live-suite:tts-speaker";
const spokenEventPrefix = "tiktok-live-suite:tts-spoken:";
const speakerLockTtlMs = 4000;
const spokenEventTtlMs = 30000;
const semanticEventTtlMs = 30000;

type TtsWorkItem = {
  id: string;
  source: "alert" | "chat";
  text: string;
  timestamp: number;
};

export function GlobalTtsSpeaker() {
  const { speakText, stopSpeaking, isSpeaking } = useSpeechQueue();
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const status = useAppStore((state) => state.status.status);
  const [queue, setQueue] = useState<TtsWorkItem[]>([]);
  const seenAlertsRef = useRef(new Set<string>());
  const seenChatRef = useRef(new Set<string>());
  const recentAlertKeysRef = useRef<Record<string, number>>({});
  const processingRef = useRef(false);
  const duplicatesRef = useRef<Record<string, number>>({});
  const isSpeakerRef = useRef(false);
  const enabled = config.tts.enabled && config.tts.playerEnabled && !config.tts.muted;

  useEffect(() => {
    const updateSpeakerLock = () => {
      isSpeakerRef.current = claimSpeakerLock();
    };

    updateSpeakerLock();
    const timer = window.setInterval(updateSpeakerLock, 1500);

    return () => {
      window.clearInterval(timer);
      releaseSpeakerLock();
    };
  }, []);

  function enqueue(item: TtsWorkItem, interrupt = false) {
    if (interrupt || config.tts.queueMode === "interrupt") {
      stopSpeaking();
      processingRef.current = false;
      setQueue([item]);
      return;
    }

    setQueue((items) => [...items, item].slice(-config.tts.maxQueueSize));
  }

  useEffect(() => {
    const latest = events[0];
    if (!latest || !isAlertEvent(latest) || seenAlertsRef.current.has(latest.id)) {
      return;
    }
    seenAlertsRef.current.add(latest.id);
    const eventKey = eventSemanticKey(latest);
    if (!claimRecentKey(recentAlertKeysRef.current, eventKey, semanticEventTtlMs)) {
      return;
    }

    if (!isSpeakerRef.current || !enabled || !config.tts.speakAlerts || !claimSpokenEvent(eventKey)) {
      return;
    }

    const alertConfig = config.alerts[latest.type];
    if (!shouldSpeakAlert(latest, config)) {
      return;
    }

    enqueue({
      id: `alert-${latest.id}`,
      source: "alert",
      text: renderTemplate(alertConfig.template, latest),
      timestamp: Date.now()
    }, isTestAlert(latest));
  }, [config, enabled, events, stopSpeaking]);

  useEffect(() => {
    const latest = chatMessages[0];
    if (!latest || seenChatRef.current.has(latest.id)) {
      return;
    }
    seenChatRef.current.add(latest.id);

    if (!isSpeakerRef.current || !enabled || !config.tts.speakChat || !claimSpokenEvent(latest.id)) {
      return;
    }

    const filtered = filterChat(latest, config, duplicatesRef.current);
    if (!filtered) {
      return;
    }

    const prefix = config.tts.chatPrefix.trim();
    if (prefix && !filtered.message.trim().startsWith(prefix)) {
      return;
    }

    const message = prefix ? filtered.message.trim().slice(prefix.length).trim() : filtered.message.trim();
    const text = renderTemplate(config.tts.template, { ...filtered, message });
    if (!text.trim()) {
      return;
    }

    enqueue({
      id: `chat-${filtered.id}`,
      source: "chat",
      text,
      timestamp: Date.now()
    });
  }, [chatMessages, config, enabled, stopSpeaking]);

  useEffect(() => {
    if (status !== "disconnected" || !config.alertQueue.clearQueueOnDisconnect) {
      return;
    }

    setQueue([]);
    processingRef.current = false;
    stopSpeaking();
  }, [config.alertQueue.clearQueueOnDisconnect, status, stopSpeaking]);

  useEffect(() => {
    const stop = () => {
      setQueue([]);
      processingRef.current = false;
      stopSpeaking();
    };

    window.addEventListener("stop-tts", stop);
    return () => window.removeEventListener("stop-tts", stop);
  }, [stopSpeaking]);

  useEffect(() => {
    if (!enabled || !isSpeakerRef.current) {
      setQueue([]);
      processingRef.current = false;
      stopSpeaking();
      return;
    }
    if (processingRef.current || isSpeaking() || queue.length === 0) {
      return;
    }

    const [next, ...rest] = queue;
    processingRef.current = true;
    setQueue(rest);
    speakText(next.text, () => {
      window.setTimeout(() => {
        processingRef.current = false;
        setQueue((items) => [...items]);
      }, config.tts.cooldownMs);
    });
  }, [config.tts.cooldownMs, enabled, isSpeaking, queue, speakText, stopSpeaking]);

  return null;
}

function shouldSpeakAlert(event: AlertEvent, config: ReturnType<typeof useAppStore.getState>["config"]) {
  const alertConfig = config.alerts[event.type];
  if (!alertConfig.enabled || !alertConfig.ttsEnabled) {
    return false;
  }

  if (event.type !== "gift") {
    return true;
  }

  if (event.giftCount < config.alerts.gift.minGiftCount || (event.diamondCount || 0) < config.alerts.gift.minDiamondCount) {
    return false;
  }

  return !(config.alerts.gift.waitForRepeatEnd && event.repeatEnd === false);
}

function isTestAlert(event: AlertEvent) {
  return event.userId?.startsWith("tester_") || event.username.startsWith("tester_");
}

function claimSpeakerLock() {
  const now = Date.now();
  const current = readJson<{ id: string; expiresAt: number }>(speakerLockKey);

  if (current && current.id !== speakerId && current.expiresAt > now) {
    return false;
  }

  localStorage.setItem(speakerLockKey, JSON.stringify({ id: speakerId, expiresAt: now + speakerLockTtlMs }));
  return readJson<{ id: string; expiresAt: number }>(speakerLockKey)?.id === speakerId;
}

function releaseSpeakerLock() {
  const current = readJson<{ id: string; expiresAt: number }>(speakerLockKey);
  if (current?.id === speakerId) {
    localStorage.removeItem(speakerLockKey);
  }
}

function claimSpokenEvent(eventId: string) {
  const key = `${spokenEventPrefix}${eventId}`;
  const now = Date.now();
  const current = readJson<{ id: string; expiresAt: number }>(key);

  if (current && current.id !== speakerId && current.expiresAt > now) {
    return false;
  }

  localStorage.setItem(key, JSON.stringify({ id: speakerId, expiresAt: now + spokenEventTtlMs }));
  return readJson<{ id: string; expiresAt: number }>(key)?.id === speakerId;
}

function readJson<T>(key: string) {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

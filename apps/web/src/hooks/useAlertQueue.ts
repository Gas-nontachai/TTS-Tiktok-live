import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { AlertEvent, LikeEvent } from "../types";
import { useAppStore } from "../stores/appStore";
import { claimRecentKey, enqueueAlert, eventSemanticKey, isAlertEvent, playAlertSound } from "../utils/helpers";

const semanticEventTtlMs = 30000;

export function useAlertQueue(enabled: boolean) {
  const config = useAppStore((state) => state.config);
  const events = useAppStore((state) => state.overlayEvents);
  const status = useAppStore((state) => state.status.status);
  const [queue, setQueue] = useState<AlertEvent[]>([]);
  const [current, setCurrent] = useState<AlertEvent | null>(null);
  const seenRef = useRef(new Set<string>());
  const recentAlertKeysRef = useRef<Record<string, number>>({});
  const cooldownRef = useRef<Record<string, number>>({});
  const rateRef = useRef<Record<string, number[]>>({});
  const timeoutRef = useRef<number | null>(null);
  const likeBatchRef = useRef<LikeEvent | null>(null);
  const likeBatchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const latest = events[0];
    if (!latest || !isAlertEvent(latest) || seenRef.current.has(latest.id)) {
      return;
    }
    seenRef.current.add(latest.id);

    if (!enabled || !config.overlay.showAlerts) {
      return;
    }

    if (latest.type === "like" && config.alerts.like.batchEnabled) {
      likeBatchRef.current = mergeLikeBatch(likeBatchRef.current, latest);
      if (!likeBatchTimerRef.current) {
        likeBatchTimerRef.current = window.setTimeout(() => {
          likeBatchTimerRef.current = null;
          const batch = likeBatchRef.current;
          likeBatchRef.current = null;
          if (batch) {
            enqueueIfAllowed(batch);
          }
        }, config.alerts.like.batchWindowMs);
      }
      return;
    }

    enqueueIfAllowed(latest);
  }, [config, enabled, events]);

  useEffect(() => {
    if (status !== "disconnected" || !config.alertQueue.clearQueueOnDisconnect) {
      return;
    }

    clearTimer(timeoutRef);
    clearTimer(likeBatchTimerRef);
    likeBatchRef.current = null;
    setQueue([]);
    setCurrent(null);
  }, [config.alertQueue.clearQueueOnDisconnect, status]);

  useEffect(() => {
    if (current || queue.length === 0 || !enabled || !config.overlay.showAlerts) {
      return;
    }

    const [next, ...rest] = queue;
    const alertConfig = config.alerts[next.type];
    setQueue(rest);
    setCurrent(next);

    if (alertConfig.playSound && config.sounds.enabled) {
      playAlertSound(next.type, config);
    }

    clearTimer(timeoutRef);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setCurrent(null);
    }, alertConfig.durationMs);
  }, [config, current, enabled, queue]);

  useEffect(() => {
    const skip = () => {
      clearTimer(timeoutRef);
      setCurrent(null);
    };
    window.addEventListener("skip-alert", skip);
    return () => {
      clearTimer(timeoutRef);
      clearTimer(likeBatchTimerRef);
      window.removeEventListener("skip-alert", skip);
    };
  }, []);

  function enqueueIfAllowed(event: AlertEvent) {
    if (!claimRecentKey(recentAlertKeysRef.current, eventSemanticKey(event), semanticEventTtlMs)) {
      return;
    }

    const alertConfig = config.alerts[event.type];
    const now = Date.now();
    if (!alertConfig.enabled || now < (cooldownRef.current[event.type] || 0)) {
      return;
    }
    if (!passesRateLimit(event.type, alertConfig.rateLimitPerSecond, now)) {
      return;
    }
    if (event.type === "gift") {
      if (event.giftCount < config.alerts.gift.minGiftCount || (event.diamondCount || 0) < config.alerts.gift.minDiamondCount) {
        return;
      }
      if (config.alerts.gift.waitForRepeatEnd && event.repeatEnd === false) {
        return;
      }
    }
    if (event.type === "like" && (event.likeCount || 1) < alertConfig.minimumTriggerCount) {
      return;
    }

    cooldownRef.current[event.type] = now + alertConfig.cooldownMs;
    setQueue((items) => enqueueAlert(items, event, config.alertQueue.maxQueueSize, config.alertQueue.allowGiftInterrupt));
  }

  function passesRateLimit(type: AlertEvent["type"], limit: number, now: number) {
    if (!limit) {
      return true;
    }
    const recent = (rateRef.current[type] || []).filter((time) => now - time < 1000);
    if (recent.length >= limit) {
      rateRef.current[type] = recent;
      return false;
    }
    rateRef.current[type] = [...recent, now];
    return true;
  }

  return current;
}

function mergeLikeBatch(current: LikeEvent | null, next: LikeEvent): LikeEvent {
  if (!current) {
    return { ...next };
  }
  return {
    ...next,
    id: current.id,
    timestamp: current.timestamp,
    likeCount: (current.likeCount || 0) + (next.likeCount || 1),
    totalLikeCount: next.totalLikeCount ?? current.totalLikeCount
  };
}

function clearTimer(ref: MutableRefObject<number | null>) {
  if (ref.current) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

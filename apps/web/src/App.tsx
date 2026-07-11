import { useEffect, useRef, useState } from "react";
import { getConfig, getLogs, getStats, getTikTokStatus, saveConfig } from "./services/api";
import { useRealtime } from "./hooks/useRealtime";
import { useAppStore } from "./stores/appStore";
import { AppRoutes, isConfigRoute, normalizePath } from "./routes";
import { GlobalTtsSpeaker } from "./components";
import { Button, ModalPortal } from "./components/ui";

const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const controlTabLockKey = "tiktok-live-suite:control-tab";
const controlTabLockTtlMs = 5000;
const controlTabHeartbeatMs = 1500;

export default function App() {
  useRealtime();

  const path = normalizePath(window.location.pathname);
  const configRoute = isConfigRoute(path);
  useConfigAutosave(configRoute);
  useConnectedBeforeUnloadGuard();

  useEffect(() => {
    void loadInitialState();
  }, []);

  return (
    <>
      <ControlTabGuard enabled={configRoute} path={path} />
      {path === "/dashboard" || path === "/player/tts" || path === "/tts" ? <GlobalTtsSpeaker /> : null}
      <AppRoutes path={path} />
    </>
  );
}

function ControlTabGuard({ enabled, path }: { enabled: boolean; path: string }) {
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [closeAttempted, setCloseAttempted] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const claimLock = () => {
      const now = Date.now();
      const current = readJson<{ id: string; path: string; expiresAt: number }>(controlTabLockKey);

      if (current && current.id !== tabId && current.expiresAt > now) {
        setDuplicateOpen(true);
        return false;
      }

      localStorage.setItem(controlTabLockKey, JSON.stringify({ id: tabId, path, expiresAt: now + controlTabLockTtlMs }));
      setDuplicateOpen(false);
      return true;
    };

    claimLock();
    const timer = window.setInterval(claimLock, controlTabHeartbeatMs);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== controlTabLockKey) {
        return;
      }

      const current = readJson<{ id: string; expiresAt: number }>(controlTabLockKey);
      if (current && current.id !== tabId && current.expiresAt > Date.now()) {
        setDuplicateOpen(true);
      }
    };

    const releaseLock = () => {
      const current = readJson<{ id: string }>(controlTabLockKey);
      if (current?.id === tabId) {
        localStorage.removeItem(controlTabLockKey);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", releaseLock);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", releaseLock);
      releaseLock();
    };
  }, [enabled, path]);

  if (!enabled || !duplicateOpen) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
        <div className="absolute inset-0 animate-dialog-overlay bg-black/55 backdrop-blur-[2px]" />
        <div className="relative w-full max-w-md animate-dialog-enter rounded-lg bg-surface p-5 shadow-xl ring-1 ring-surfaceMuted">
          <h3 className="text-lg font-semibold">มีแท็บควบคุมเปิดอยู่แล้ว</h3>
          <p className="mt-2 text-sm text-textMuted">
            เพื่อกัน config ชนกัน ให้เหลือแท็บควบคุมระบบแค่แท็บเดียว แท็บ overlay สำหรับ OBS ยังเปิดแยกได้ตามปกติ
          </p>
          {closeAttempted ? (
            <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              ถ้าบราวเซอร์ไม่อนุญาตให้ปิดอัตโนมัติ กรุณาปิดแท็บนี้เอง
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            <Button
              variant="danger"
              onClick={() => {
                setCloseAttempted(true);
                window.close();
              }}
            >
              ปิดแท็บนี้
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function useConnectedBeforeUnloadGuard() {
  const status = useAppStore((state) => state.status.status);

  useEffect(() => {
    if (status !== "connected" && status !== "connecting") {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);
}

async function loadInitialState() {
  const store = useAppStore.getState();

  try {
    const [config, status, stats, logs] = await Promise.all([getConfig(), getTikTokStatus(), getStats(), getLogs()]);
    store.setConfig(config);
    store.setStatus(status);
    store.setStats(stats);
    logs.reverse().forEach(store.addLog);
  } catch (error) {
    store.setError(error instanceof Error ? error.message : "Unable to load app state");
  }
}

function useConfigAutosave(enabled = true) {
  const config = useAppStore((state) => state.config);
  const setConfig = useAppStore((state) => state.setConfig);
  const lastSerializedRef = useRef("");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const serialized = JSON.stringify(config);

    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSerializedRef.current = serialized;
      return;
    }

    if (serialized === lastSerializedRef.current) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const latestConfig = useAppStore.getState().config;
      const latestSerialized = JSON.stringify(latestConfig);

      if (latestSerialized === lastSerializedRef.current) {
        return;
      }

      try {
        const saved = await saveConfig(latestConfig);
        lastSerializedRef.current = JSON.stringify(saved);
        setConfig(saved);
      } catch (error) {
        useAppStore.getState().setError(error instanceof Error ? error.message : "Unable to autosave config");
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [config, enabled, setConfig]);
}

function readJson<T>(key: string) {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

import { useEffect, useRef } from "react";
import { getConfig, getLogs, getStats, getTikTokStatus, saveConfig } from "./services/api";
import { useRealtime } from "./hooks/useRealtime";
import { useAppStore } from "./stores/appStore";
import { AppRoutes, isConfigRoute, normalizePath } from "./routes";
import { GlobalTtsSpeaker } from "./components";

export default function App() {
  useRealtime();

  const path = normalizePath(window.location.pathname);
  useConfigAutosave(isConfigRoute(path));

  useEffect(() => {
    void loadInitialState();
  }, []);

  return (
    <>
      <GlobalTtsSpeaker />
      <AppRoutes path={path} />
    </>
  );
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

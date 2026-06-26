import { Download, FileUp, RotateCcw, Save } from "lucide-react";
import { useRef, useState } from "react";
import { defaultConfig, useAppStore } from "../stores/appStore";
import { Button, ConfirmDialog, Metric, SelectInput, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { resetConfig, saveConfig } from "../services/api";
import { buttonRowClass, panelClass } from "../config/constants";
import type { AppConfig, DeepPartial } from "../types";

export function SettingsPage() {
  const config = useAppStore((state) => state.config);
  const setConfig = useAppStore((state) => state.setConfig);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const setError = useAppStore((state) => state.setError);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [status, setStatus] = useState("");
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  function exportConfig() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "tiktok-live-suite",
      config
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tiktok-live-suite-config-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Config exported");
  }

  async function copyConfig() {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setStatus("Config copied");
  }

  async function importConfig(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DeepPartial<AppConfig> | { config?: DeepPartial<AppConfig> };
      const imported = "config" in parsed && parsed.config ? parsed.config : parsed;

      if (importMode === "replace") {
        setConfig(deepMerge(defaultConfig, imported as DeepPartial<AppConfig>));
      } else {
        patchConfig(imported as DeepPartial<AppConfig>);
      }

      setStatus(importMode === "replace" ? "Config imported as replacement" : "Config imported and merged");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import config";
      setError(message);
      setStatus(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function persistConfig() {
    const saved = await saveConfig(config);
    setConfig(saved);
    setStatus("Config saved to server");
  }

  async function restoreDefaults() {
    const next = await resetConfig();
    setConfig(next);
    setStatus("Config reset");
    setConfirmResetOpen(false);
  }

  return (
    <>
      <Tabs defaultValue="system" className="grid w-full gap-0">
        <TabsList aria-label="Settings sections">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>
        <TabsContent value="system">
          <section className={panelClass}>
            <h2>System</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <Metric label="Backend" value="http://localhost:3001" />
              <Metric label="WebSocket" value={wsConnected ? "online" : "offline"} />
              <Metric label="Config file" value="apps/server/data/config.json" />
            </div>
          </section>
        </TabsContent>
        <TabsContent value="config">
          <section className={panelClass}>
            <h2>Config</h2>
            <SelectInput label="Import behavior" value={importMode} options={["merge", "replace"]} onChange={(value) => setImportMode(value as "merge" | "replace")} />
            <div className={buttonRowClass}>
              <Button onClick={exportConfig}><Download size={16} />Export JSON</Button>
              <Button variant="secondary" onClick={() => void copyConfig()}>Copy JSON</Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}><FileUp size={16} />Import JSON</Button>
              <Button onClick={() => void persistConfig()}><Save size={16} />Save Config</Button>
              <Button variant="danger" onClick={() => setConfirmResetOpen(true)}><RotateCcw size={16} />Reset Config</Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void importConfig(event.target.files?.[0])}
            />
            <p className="text-sm text-textMuted">
              Local draft is stored in this browser. Save Config writes it to the server config used by OBS.
            </p>
            {status ? <p className="rounded-md border border-surfaceMuted bg-white px-3 py-2 text-sm font-semibold text-text">{status}</p> : null}
          </section>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset config"
        description="This will replace the current server config and local draft with defaults."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={restoreDefaults}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
}

function deepMerge<T>(target: T, partial: DeepPartial<T>): T {
  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const [key, value] of Object.entries(partial as Record<string, unknown>)) {
    const current = output[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      output[key] = deepMerge(current, value as DeepPartial<typeof current>);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }

  return output as T;
}

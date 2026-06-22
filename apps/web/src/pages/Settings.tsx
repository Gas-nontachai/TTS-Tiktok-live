import { RotateCcw } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, Metric } from "../components/ui";
import { resetConfig } from "../services/api";

export function SettingsPage() {
  const config = useAppStore((state) => state.config);
  const wsConnected = useAppStore((state) => state.wsConnected);

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>System</h2>
        <Metric label="Backend" value="http://localhost:3001" />
        <Metric label="WebSocket" value={wsConnected ? "online" : "offline"} />
        <Metric label="Config file" value="apps/server/data/config.json" />
      </section>
      <section className="panel">
        <h2>Config</h2>
        <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(config, null, 2))}>Export Config</Button>
        <Button variant="danger" onClick={() => void resetConfig().then(useAppStore.getState().setConfig)}><RotateCcw size={16} />Reset Config</Button>
      </section>
    </div>
  );
}

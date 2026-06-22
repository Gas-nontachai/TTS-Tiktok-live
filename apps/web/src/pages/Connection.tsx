import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Metric } from "../components/ui";
import { connectTikTok } from "../services/api";
import { overlayAlertsUrl } from "../config/constants";
import { ConnectionControls, LogList } from "../components";

export function ConnectionPage() {
  const status = useAppStore((state) => state.status);
  const logs = useAppStore((state) => state.logs);

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>TikTok Connection</h2>
        <ConnectionControls />
        <Button variant="secondary" onClick={() => void connectTikTok(useAppStore.getState().config.tiktok.username)}>
          Reconnect
        </Button>
      </section>
      <section className="panel">
        <h2>Room Info</h2>
        <Metric label="Status" value={status.status} />
        <Metric label="Account" value={status.username || "-"} />
        <Metric label="Room" value={status.roomId || "-"} />
      </section>
      <section className="panel wide">
        <h2>Connection Logs</h2>
        <LogList logs={logs.filter((log) => log.type === "control_action" || log.type === "error").slice(0, 12)} />
      </section>
    </div>
  );
}

import { useState } from "react";
import { useAppStore } from "../stores/appStore";
import { Button, Metric, ConfirmDialog } from "../components/ui";
import { connectTikTok, disconnectTikTok } from "../services/api";
import { panelClass, buttonRowClass } from "../config/constants";
import { ConnectionControls, LogList } from "../components";

export function ConnectionPage() {
  const config = useAppStore((state) => state.config);
  const status = useAppStore((state) => state.status);
  const logs = useAppStore((state) => state.logs);
  const setError = useAppStore((state) => state.setError);
  const setStatus = useAppStore((state) => state.setStatus);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);

  async function connect() {
    setError("");
    setStatus({ status: "connecting", username: config.tiktok.username, roomId: "" });
    try {
      const result = await connectTikTok(config.tiktok.username);
      setStatus({ status: "connected", username: result.username, roomId: result.roomId });
    } catch (error) {
      setStatus({ status: "error", username: config.tiktok.username, roomId: "" });
      setError(error instanceof Error ? error.message : "Unable to connect");
    }
  }
  async function disconnect() {
    await disconnectTikTok();
    setStatus({ status: "disconnected", username: status.username, roomId: "" });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className={`${panelClass} lg:col-span-2`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2>TikTok Connection</h2>
            <ConnectionControls />
          </div>
          <div className={buttonRowClass}>
            <Button onClick={connect} disabled={!config.tiktok.username.trim() || status.status === "connecting"}>
              Connect
            </Button>
            <Button variant="danger" onClick={() => setConfirmDisconnectOpen(true)}>
              Disconnect
            </Button>
          </div>

        </div>
        <div className="rounded-xl text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Status: </span>
            <span className="font-semibold">{status.status}</span>
          </div> 
          <div>
            <span className="font-medium text-muted-foreground">Account: </span>
            <span className="font-semibold">{status.username || "-"}</span>
          </div> 
          <div>
            <span className="font-medium text-muted-foreground">Room: </span>
            <span className="font-semibold">{status.roomId || "-"}</span>
          </div>
        </div>
      </section>
      <section className={`${panelClass} lg:col-span-2`}>
        <h2>Connection Logs</h2>
        <LogList logs={logs.filter((log) => log.type === "control_action" || log.type === "error").slice(0, 12)} />
      </section>
      <ConfirmDialog
        open={confirmDisconnectOpen}
        title="Disconnect"
        confirmText="Disconnect"
        cancelText="Cancel"
        onConfirm={async () => {
          await disconnect();
          setConfirmDisconnectOpen(false);
        }}
        onCancel={() => setConfirmDisconnectOpen(false)}
      />
    </div>
  );
}

import { useState } from "react";
import { useAppStore } from "../stores/appStore";
import { connectTikTok, disconnectTikTok } from "../services/api";
import { overlayAlertsUrl } from "../config/constants";
import { Button, ConfirmDialog, CopyRow, TextInput } from "./ui";

export function ConnectionControls({ compact = false }: { compact?: boolean }) {
  const config = useAppStore((state) => state.config);
  const status = useAppStore((state) => state.status);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const setStatus = useAppStore((state) => state.setStatus);
  const setError = useAppStore((state) => state.setError);
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
    <>
      <TextInput label="TikTok Username" value={config.tiktok.username} onChange={(username) => patchConfig({ tiktok: { username } })} />
      <div className="button-row">
        <Button onClick={connect} disabled={!config.tiktok.username.trim() || status.status === "connecting"}>
          Connect
        </Button>
        <Button variant="danger" onClick={() => setConfirmDisconnectOpen(true)}>
          Disconnect
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDisconnectOpen}
        title="Disconnect"
        description="Are you sure you want to disconnect from TikTok?"
        confirmText="Disconnect"
        cancelText="Cancel"
        onConfirm={async () => {
          await disconnect();
          setConfirmDisconnectOpen(false);
        }}
        onCancel={() => setConfirmDisconnectOpen(false)}
      />
      {!compact ? <CopyRow label="Alerts Overlay" value={overlayAlertsUrl} /> : null}
    </>
  );
}

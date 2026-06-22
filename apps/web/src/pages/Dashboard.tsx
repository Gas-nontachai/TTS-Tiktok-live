import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Metric } from "../components/ui";
import { testAlert } from "../services/api";
import {
  panelClass,
  metricPanelClass,
  buttonRowClass,
  quietClass,
  overlayAlertsUrl,
  overlayViewerCountUrl,
  overlayHeartsUrl,
  overlayChatUrl,
  ttsPlayerUrl,
  overlayMainUrl
} from "../config/constants";
import { ConnectionControls, LogList } from "../components";

export function DashboardPage() {
  const config = useAppStore((state) => state.config);
  const status = useAppStore((state) => state.status);
  const stats = useAppStore((state) => state.stats);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const logs = useAppStore((state) => state.logs);

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Connection</h2>
        <ConnectionControls compact />
      </section>
      <section className={panelClass + " " + metricPanelClass}>
        <Metric label="ผู้ชม" value={stats.viewerCount} />
        <Metric label="Likes" value={stats.totalLikes} />
        <Metric label="Chat/min" value={stats.messagesPerMinute} />
        <Metric label="Filtered" value={stats.filteredChatCount} />
      </section>
      <section className="panel">
        <h2>Overlay URLs</h2>
        <CopyRow label="Alerts Overlay" value={overlayAlertsUrl} />
        <CopyRow label="Viewer Count Overlay" value={overlayViewerCountUrl} />
        <CopyRow label="Hearts Overlay" value={overlayHeartsUrl} />
        <CopyRow label="Chat Overlay" value={config.chat.overlayUrl || overlayChatUrl} />
        <CopyRow label="TTS Player" value={ttsPlayerUrl} />
        <CopyRow label="Combined Preview" value={overlayMainUrl} />
        <div className={buttonRowClass}>
          <Button onClick={() => void testAlert("share")}>Test Share</Button>
          <Button onClick={() => void testAlert("gift")}>Test Gift</Button>
        </div>
      </section>
      <section className={panelClass}>
        <h2>Live Summary</h2>
        <p className={quietClass}>Account: {status.username || "ยังไม่ได้เชื่อมต่อ"}</p>
        <p className="quiet">Room: {status.roomId || "-"}</p>
        <p className="quiet">Latest chat: {chatMessages[0]?.message || "No chat yet"}</p>
      </section>
      <section className="panel wide">
        <h2>Latest Event Log</h2>
        <LogList logs={logs.slice(0, 8)} />
      </section>
    </div>
  );
}

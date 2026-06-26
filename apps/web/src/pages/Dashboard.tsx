import { Gift, Pause, Play } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, Metric } from "../components/ui";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import type { GiftAlertEvent } from "../types";
import {
  metricPanelClass,
  buttonRowClass,
  panelClass,
  quietClass,
} from "../config/constants";
import { Avatar, LogList } from "../components";

export function DashboardPage() {
  const { stopSpeaking, testSpeak } = useSpeechQueue();
  const config = useAppStore((state) => state.config);
  const status = useAppStore((state) => state.status);
  const stats = useAppStore((state) => state.stats);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const overlayEvents = useAppStore((state) => state.overlayEvents);
  const logs = useAppStore((state) => state.logs);
  const currentSpeakingText = useAppStore((state) => state.currentSpeakingText);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const giftHistory = overlayEvents.filter((event): event is GiftAlertEvent => event.type === "gift");
  const ttsReady = config.tts.enabled && config.tts.playerEnabled && config.tts.speakChat && !config.tts.muted;
  const stopAllTts = () => {
    window.dispatchEvent(new CustomEvent("stop-tts"));
    stopSpeaking();
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className={`${panelClass} lg:col-span-2`}>
        <h2>Live summary</h2>
        <div className={metricPanelClass + " grid-cols-4"}>
          <Metric label="ผู้ชม" value={stats.viewerCount} />
          <Metric label="Likes" value={stats.totalLikes} />
          <Metric label="Chat/min" value={stats.messagesPerMinute} />
          <Metric label="Filtered" value={stats.filteredChatCount} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className={quietClass}>Account: {status.username || "ยังไม่ได้เชื่อมต่อ"}</p>
          <p className={quietClass}>Room: {status.roomId || "-"}</p>
          <div className="flex flex-wrap gap-2 text-xs text-textMuted">
            <span>WebSocket: {wsConnected ? "online" : "offline"}</span>
            <span>TTS: {ttsReady ? "ready" : "disabled"}</span>
            <span className="[overflow-wrap:anywhere]">{currentSpeakingText || "Idle"}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg">
          <div className={buttonRowClass}>
            <Button onClick={() => testSpeak("TTS dashboard ready")}><Play size={16} />Enable Audio</Button>
            <Button variant="secondary" onClick={stopAllTts}><Pause size={16} />Stop</Button>
          </div>

        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0">
            <h3 className="mb-2 text-[0.95rem] font-bold text-[#464d42]">Chat history</h3>
            <div className="flex max-h-[360px] flex-col gap-2 overflow-auto">
              {chatMessages.length ? (
                chatMessages.map((message) => (
                  <article key={message.id} className="grid grid-cols-[38px_minmax(0,1fr)] gap-2.5 rounded-md border border-[#e6e1d8] bg-white p-2.5">
                    <Avatar message={message} />
                    <div className="min-w-0">
                      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-textMuted">
                        <strong className="text-sm text-text">{message.displayName || message.username}</strong>
                        <span>@{message.username}</span>
                        <time>{new Date(message.timestamp).toLocaleTimeString()}</time>
                      </header>
                      <p className="mt-1 text-sm [overflow-wrap:anywhere]">{message.message}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className={quietClass}>No chat history yet</p>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="mb-2 text-[0.95rem] font-bold text-[#464d42]">Gift history</h3>
            <div className="flex max-h-[360px] flex-col gap-2 overflow-auto">
              {giftHistory.length ? (
                giftHistory.map((event) => (
                  <article key={event.id} className="grid grid-cols-[38px_minmax(0,1fr)] gap-2.5 rounded-md border border-[#f0d7aa] bg-[#fffaf1] p-2.5">
                    <Avatar message={event} />
                    <div className="min-w-0">
                      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-textMuted">
                        <strong className="text-sm text-text">{event.displayName || event.username}</strong>
                        <span>@{event.username}</span>
                        <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                      </header>
                      <p className="mt-1 flex items-center gap-1.5 text-sm [overflow-wrap:anywhere]">
                        <Gift size={15} />
                        <span>
                          {event.giftName} x{event.giftCount}
                          {event.diamondCount ? ` · ${event.diamondCount} diamonds` : ""}
                        </span>
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <p className={quietClass}>No gift history yet</p>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className={`${panelClass} lg:col-span-2`}>
        <h2>Latest Event Log</h2>
        <LogList logs={logs.slice(0, 8)} />
      </section>
    </div>
  );
}

import { useAppStore } from "../../stores/appStore";
import { statusChipClasses, routeTitle } from "../../utils/helpers";
import { NavGroup } from "./NavGroup";
import { Radio, LayoutDashboard, Bell, MessageCircle, Filter, Pause, Eye, Mic, Volume2, Activity, Settings } from "lucide-react";

export function AppShell({ children, path }: { children: React.ReactNode; path: string }) {
  const status = useAppStore((state) => state.status);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const error = useAppStore((state) => state.error);

  return (
    <main className="min-h-screen grid min-h-screen grid-cols-[260px_minmax(0,1fr)] bg-surface text-text">
      <aside className="flex h-full flex-col gap-5 border-r border-surfaceMuted bg-white p-5">
        <div className="flex items-center gap-3 text-lg font-black text-slate-900">
          <Radio size={22} />
          <span>TikTok Live Suite</span>
        </div>
        <NavGroup title="Main" items={[["/dashboard", "Dashboard", LayoutDashboard], ["/connection", "Connection", Radio]]} path={path} />
        <NavGroup
          title="Streaming"
          items={[
            ["/alerts", "Alerts", Bell],
            ["/chat", "Chat", MessageCircle],
            ["/chat/filter", "Chat Filter", Filter],
            ["/chat/moderation", "Moderation", Pause],
            ["/overlay", "Overlay", Eye],
            ["/tts", "TTS", Mic],
            ["/sounds", "Sounds", Volume2]
          ]}
          path={path}
        />
        <NavGroup title="System" items={[["/logs", "Logs", Activity], ["/settings", "Settings", Settings]]} path={path} />
      </aside>
      <section className="flex min-h-screen flex-col gap-4 p-6">
        <header className="flex flex-col justify-between gap-4 border-b border-surfaceMuted pb-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">{routeTitle(path)}</h1>
            <p className="mt-2 text-sm text-textMuted">Local alerts, chat, TTS, and OBS overlays for TikTok Live.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusChipClasses(status.status)}>{status.status}</span>
            <span className={statusChipClasses(wsConnected ? "connected" : "disconnected")}>WS {wsConnected ? "online" : "offline"}</span>
          </div>
        </header>
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
        {children}
      </section>
    </main>
  );
}

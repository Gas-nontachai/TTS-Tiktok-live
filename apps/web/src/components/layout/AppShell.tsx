import { useState } from "react";
import { useAppStore } from "../../stores/appStore";
import { statusChipClasses, routeTitle } from "../../utils/helpers";
import { NavGroup } from "./NavGroup";
import { Radio, LayoutDashboard, Bell, MessageCircle, Eye, Mic, Volume2, Activity, Settings, Menu, X, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";

export function AppShell({ children, path }: { children: React.ReactNode; path: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const status = useAppStore((state) => state.status);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const error = useAppStore((state) => state.error);

  return (
    <main className={`grid min-h-screen bg-surface text-text transition-[grid-template-columns] duration-300 ease-out ${sidebarOpen ? "grid-cols-[260px_minmax(0,1fr)]" : "grid-cols-[0_minmax(0,1fr)]"}`}>
      <aside
        aria-hidden={!sidebarOpen}
        className={cn(
          "h-full overflow-hidden border-r border-surfaceMuted bg-white transition-[opacity,transform] duration-300 ease-out",
          sidebarOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0"
        )}
      >
        <div className="flex h-full w-[260px] flex-col gap-5 p-5">
          <div className="flex items-center justify-between gap-3 text-lg font-black text-slate-900">
            <div className="flex min-w-0 items-center gap-3">
              <Radio size={22} className="shrink-0" />
              <span className="truncate">TikTok Live Suite</span>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              title="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="min-h-0 rounded-lg border-surfaceMuted bg-white p-2 text-text transition duration-150 ease-out hover:rotate-90 hover:bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-sage active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
          <NavGroup title="Main" items={[["/dashboard", "Dashboard", LayoutDashboard], ["/connection", "Connection", Radio]]} path={path} />
          <NavGroup
            title="Streaming"
            items={[
              ["/alerts", "Alerts", Bell],
              ["/goals", "Goals", Trophy],
              ["/chat", "Chat", MessageCircle],
              ["/overlay", "Overlay", Eye],
              ["/tts", "TTS", Mic],
              ["/sounds", "Sounds", Volume2]
            ]}
            path={path}
          />
          <NavGroup title="System" items={[["/logs", "Logs", Activity], ["/settings", "Settings", Settings]]} path={path} />
        </div>
      </aside>
      <section className="flex min-h-screen min-w-0 flex-col gap-4 p-6">
        <header className="flex flex-col justify-between gap-4 border-b border-surfaceMuted pb-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            {!sidebarOpen ? (
              <button
                type="button"
                aria-label="Open sidebar"
                title="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                className="min-h-0 shrink-0 animate-sidebar-toggle rounded-lg border-surfaceMuted bg-white p-2 text-text transition duration-150 ease-out hover:bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-sage active:scale-95"
              >
                <Menu size={20} />
              </button>
            ) : null}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">{routeTitle(path)}</h1>
              <p className="mt-2 text-sm text-textMuted">Local alerts, chat, TTS, and OBS overlays for TikTok Live.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusChipClasses(status.status)}>{status.status}</span>
            <span className={statusChipClasses(wsConnected ? "connected" : "disconnected")}>WS {wsConnected ? "online" : "offline"}</span>
          </div>
        </header>
        {error ? <div className="animate-panel-enter rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
        <div className="animate-page-enter">{children}</div>
      </section>
    </main>
  );
}

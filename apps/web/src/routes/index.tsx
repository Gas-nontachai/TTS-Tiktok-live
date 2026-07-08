import { AppShell } from "../components/layout/AppShell";
import { AlertsPage } from "../pages/Alerts";
import { ChatPage } from "../pages/Chat";
import { ConnectionPage } from "../pages/Connection";
import { DashboardPage } from "../pages/Dashboard";
import { GoalsPage } from "../pages/Goals";
import { LogsPage } from "../pages/Logs";
import { OverlayConfigPage } from "../pages/OverlayConfig";
import { SettingsPage } from "../pages/Settings";
import { SoundsPage } from "../pages/Sounds";
import { TtsPage } from "../pages/Tts";
import {
  AlertsOverlay,
  ChatOverlay,
  GoalsOverlay,
  HeartsOverlay,
  MainOverlay,
  TtsOverlay,
  TtsPlayerPage,
  ViewerCountOverlay
} from "../pages/overlays/OverlayPages";

export function normalizePath(pathname: string) {
  return pathname === "/" ? "/dashboard" : pathname;
}

export function isConfigRoute(path: string) {
  return !path.startsWith("/overlay/") && !path.startsWith("/player/");
}

export function AppRoutes({ path }: { path: string }) {
  if (path === "/overlay/main") return <MainOverlay />;
  if (path === "/overlay/alerts") return <AlertsOverlay />;
  if (path === "/overlay/goals") return <GoalsOverlay />;
  if (path === "/overlay/viewer-count") return <ViewerCountOverlay />;
  if (path === "/overlay/hearts") return <HeartsOverlay />;
  if (path === "/overlay/chat") return <ChatOverlay />;
  if (path === "/overlay/tts") return <TtsOverlay />;
  if (path === "/player/tts") return <TtsPlayerPage />;

  return (
    <AppShell path={path}>
      {renderPage(path)}
    </AppShell>
  );
}

function renderPage(path: string) {
  switch (path) {
    case "/dashboard":
      return <DashboardPage />;
    case "/connection":
      return <ConnectionPage />;
    case "/alerts":
      return <AlertsPage />;
    case "/goals":
      return <GoalsPage />;
    case "/chat":
      return <ChatPage />;
    case "/overlay":
      return <OverlayConfigPage />;
    case "/tts":
      return <TtsPage />;
    case "/sounds":
      return <SoundsPage />;
    case "/logs":
      return <LogsPage />;
    case "/settings":
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

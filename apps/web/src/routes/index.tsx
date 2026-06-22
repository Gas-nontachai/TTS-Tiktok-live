import { AppShell } from "../components/layout/AppShell";
import { AlertsPage } from "../pages/Alerts";
import { ChatPage } from "../pages/Chat";
import { ChatFilterPage } from "../pages/ChatFilter";
import { ChatModerationPage } from "../pages/ChatModeration";
import { ConnectionPage } from "../pages/Connection";
import { DashboardPage } from "../pages/Dashboard";
import { LogsPage } from "../pages/Logs";
import { OverlayConfigPage } from "../pages/OverlayConfig";
import { SettingsPage } from "../pages/Settings";
import { SoundsPage } from "../pages/Sounds";
import { TtsPage } from "../pages/Tts";
import {
  AlertsOverlay,
  ChatOverlay,
  HeartsOverlay,
  MainOverlay,
  TtsOverlay,
  TtsPlayerPage,
  ViewerCountOverlay
} from "../pages/overlays/OverlayPages";

export const knownRoutes = new Set([
  "/dashboard",
  "/connection",
  "/alerts",
  "/chat",
  "/chat/filter",
  "/chat/moderation",
  "/overlay",
  "/tts",
  "/sounds",
  "/logs",
  "/settings"
]);

export const overlayRoutes = new Set([
  "/overlay/main",
  "/overlay/alerts",
  "/overlay/viewer-count",
  "/overlay/hearts",
  "/overlay/chat",
  "/overlay/tts"
]);

export const playerRoutes = new Set([
  "/player/tts"
]);

export type RouteType = "page" | "overlay" | "player";

export function getRouteType(path: string): RouteType | null {
  if (overlayRoutes.has(path)) return "overlay";
  if (playerRoutes.has(path)) return "player";
  if (knownRoutes.has(path)) return "page";
  return null;
}

export function normalizePath(pathname: string) {
  return pathname === "/" ? "/dashboard" : pathname;
}

export function isConfigRoute(path: string) {
  return !path.startsWith("/overlay/") && !path.startsWith("/player/");
}

export function AppRoutes({ path }: { path: string }) {
  if (path === "/overlay/main") return <MainOverlay />;
  if (path === "/overlay/alerts") return <AlertsOverlay />;
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
    case "/chat":
      return <ChatPage />;
    case "/chat/filter":
      return <ChatFilterPage />;
    case "/chat/moderation":
      return <ChatModerationPage />;
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

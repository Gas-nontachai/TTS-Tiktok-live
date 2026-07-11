import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { saveConfig } from "../services/api";
import {
  overlayAlertsUrl,
  overlayGoalsUrl,
  overlayViewerCountUrl,
  overlayHeartsUrl,
  overlayTtsUrl,
  overlayMainUrl,
  panelClass,
  resolveCurrentWebUrl,
  ttsPlayerUrl
} from "../config/constants";

export function OverlayConfigPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <Tabs defaultValue="urls" className="grid w-full gap-0">
      <TabsList aria-label="Overlay settings sections">
        <TabsTrigger value="urls">URLs</TabsTrigger>
        <TabsTrigger value="visibility">Visibility</TabsTrigger>
      </TabsList>
      <TabsContent value="urls">
        <section className={panelClass}>
          <h2>Overlay URLs</h2>
          <CopyRow label="Alerts Overlay" value={overlayAlertsUrl} />
          <CopyRow label="Goals Overlay" value={overlayGoalsUrl} />
          <CopyRow label="Viewer Count Overlay" value={overlayViewerCountUrl} />
          <CopyRow label="Hearts Overlay" value={overlayHeartsUrl} />
          <CopyRow label="Chat Overlay" value={resolveCurrentWebUrl(config.chat.overlayUrl, "/overlay/chat")} />
          <CopyRow label="TTS Player" value={ttsPlayerUrl} />
          <CopyRow label="Deprecated TTS Overlay" value={overlayTtsUrl} />
          <CopyRow label="Combined Preview" value={overlayMainUrl} />
          <p className="mt-1 text-sm text-textMuted">OBS 16:9: 1920 x 1080, 30 FPS</p>
          <p className="mt-1 text-sm text-textMuted">TikTok 9:16: 1080 x 1920, 30 FPS</p>
        </section>
      </TabsContent>
      <TabsContent value="visibility">
        <section className={panelClass}>
          <h2>Overlay Visibility</h2>
          <Toggle label="Show alerts" checked={config.overlay.showAlerts} onChange={(showAlerts) => patchConfig({ overlay: { showAlerts } })} />
          <Toggle label="Show goals" checked={config.overlay.showGoals} onChange={(showGoals) => patchConfig({ overlay: { showGoals } })} />
          <Toggle label="Show viewer count" checked={config.overlay.showViewerCount} onChange={(showViewerCount) => patchConfig({ overlay: { showViewerCount } })} />
          <Toggle label="Show hearts" checked={config.overlay.showHearts} onChange={(showHearts) => patchConfig({ overlay: { showHearts } })} />
          <Toggle label="Include chat in combined preview" checked={config.overlay.showChatInMain} onChange={(showChatInMain) => patchConfig({ overlay: { showChatInMain } })} />
          <p className="mt-1 text-sm text-textMuted">Dedicated OBS URLs stay separated; combined preview only renders modules enabled here.</p>
          <Button onClick={() => void saveConfig(config)}>Save Overlay Settings</Button>
        </section>
      </TabsContent>
    </Tabs>
  );
}

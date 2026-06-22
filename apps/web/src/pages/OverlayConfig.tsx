import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, SelectInput, NumberInput } from "../components/ui";
import { saveConfig, testAlert } from "../services/api";
import {
  overlayAlertsUrl,
  overlayViewerCountUrl,
  overlayHeartsUrl,
  overlayTtsUrl,
  overlayMainUrl,
  viewerAnimations,
  heartAnimations
} from "../config/constants";

export function OverlayConfigPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>Overlay URLs</h2>
        <CopyRow label="Alerts Overlay" value={overlayAlertsUrl} />
        <CopyRow label="Viewer Count Overlay" value={overlayViewerCountUrl} />
        <CopyRow label="Hearts Overlay" value={overlayHeartsUrl} />
        <CopyRow label="Chat Overlay" value={config.chat.overlayUrl || ""} />
        <CopyRow label="TTS Player" value={""} />
        <CopyRow label="Deprecated TTS Overlay" value={overlayTtsUrl} />
        <CopyRow label="Combined Preview" value={overlayMainUrl} />
        <p className="quiet">OBS 16:9: 1920 x 1080, 30 FPS</p>
        <p className="quiet">TikTok 9:16: 1080 x 1920, 30 FPS</p>
      </section>
      <section className="panel">
        <h2>Overlay Visibility</h2>
        <Toggle label="Show alerts" checked={config.overlay.showAlerts} onChange={(showAlerts) => patchConfig({ overlay: { showAlerts } })} />
        <Toggle label="Show viewer count" checked={config.overlay.showViewerCount} onChange={(showViewerCount) => patchConfig({ overlay: { showViewerCount } })} />
        <Toggle label="Show hearts" checked={config.overlay.showHearts} onChange={(showHearts) => patchConfig({ overlay: { showHearts } })} />
        <Toggle label="Include chat in combined preview" checked={config.overlay.showChatInMain} onChange={(showChatInMain) => patchConfig({ overlay: { showChatInMain } })} />
        <p className="quiet">Dedicated OBS URLs stay separated; combined preview only renders modules enabled here.</p>
      </section>
      <section className="panel">
        <h2>Viewer Count</h2>
        <Toggle label="Enabled" checked={config.viewerCount.enabled} onChange={(enabled) => patchConfig({ viewerCount: { enabled } })} />
        <SelectInput label="Position" value={config.viewerCount.position} options={["top-left", "top-right", "bottom-left", "bottom-right"]} onChange={(position) => patchConfig({ viewerCount: { position: position as typeof config.viewerCount.position } })} />
        <SelectInput label="Animation" value={config.viewerCount.animationPreset} options={[...viewerAnimations]} onChange={(animationPreset) => patchConfig({ viewerCount: { animationPreset: animationPreset as typeof config.viewerCount.animationPreset } })} />
        <NumberInput label="Font size" value={config.viewerCount.fontSize} onChange={(fontSize) => patchConfig({ viewerCount: { fontSize } })} />
        <Button onClick={() => void testAlert("viewer-count")}>Test Viewer Count</Button>
      </section>
      <section className="panel">
        <h2>Like Hearts</h2>
        <Toggle label="Enabled" checked={config.likeHearts.enabled} onChange={(enabled) => patchConfig({ likeHearts: { enabled } })} />
        <SelectInput label="Animation" value={config.likeHearts.animationPreset} options={[...heartAnimations]} onChange={(animationPreset) => patchConfig({ likeHearts: { animationPreset: animationPreset as typeof config.likeHearts.animationPreset } })} />
        <NumberInput label="Max hearts" value={config.likeHearts.maxHeartsOnScreen} onChange={(maxHeartsOnScreen) => patchConfig({ likeHearts: { maxHeartsOnScreen } })} />
        <NumberInput label="Heart size" value={config.likeHearts.heartSize} onChange={(heartSize) => patchConfig({ likeHearts: { heartSize } })} />
        <Button onClick={() => void testAlert("like")}>Test Like Hearts</Button>
      </section>
      <section className="panel wide">
        <Button onClick={() => void saveConfig(config)}>Save Overlay Settings</Button>
      </section>
    </div>
  );
}

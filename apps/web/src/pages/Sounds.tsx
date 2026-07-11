import { useAppStore } from "../stores/appStore";
import { Button, Toggle, RangeInput } from "../components/ui";
import { saveConfig } from "../services/api";
import { buttonRowClass, panelClass } from "../config/constants";
import { playTone } from "../utils/helpers";

export function SoundsPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const masterPercent = Math.round(config.sounds.masterVolume * 100);
  const canTestAudio = config.sounds.enabled && !config.sounds.muted && config.sounds.masterVolume > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className={panelClass}>
        <h2>Audio Settings</h2>
        <Toggle label="Enable alert sounds" checked={config.sounds.enabled} onChange={(enabled) => patchConfig({ sounds: { enabled } })} />
        <Toggle label="Mute all alert sounds" checked={config.sounds.muted} onChange={(muted) => patchConfig({ sounds: { muted } })} />
        <RangeInput
          label="Master volume"
          value={config.sounds.masterVolume}
          min={0}
          max={1}
          step={0.05}
          showNumberInput={false}
          valueLabel={`${masterPercent}%`}
          onChange={(masterVolume) => patchConfig({ sounds: { masterVolume } })}
        />
        <div className={buttonRowClass}>
          <Button onClick={() => canTestAudio && playTone("share", config.sounds.masterVolume, "chime")}>Test master audio</Button>
          <Button onClick={() => void saveConfig(config)}>Save Audio Settings</Button>
        </div>
      </section>
      <section className={panelClass}>
        <h2>Current Audio State</h2>
        <div className="grid gap-3 text-sm text-text">
          <div className="rounded-lg border border-surfaceMuted bg-white p-3">
            <span className="font-bold">Alert sounds: </span>
            {config.sounds.enabled ? "Enabled" : "Disabled"}
          </div>
          <div className="rounded-lg border border-surfaceMuted bg-white p-3">
            <span className="font-bold">Global mute: </span>
            {config.sounds.muted ? "Muted" : "Not muted"}
          </div> 
        </div>
      </section>
    </div>
  );
}

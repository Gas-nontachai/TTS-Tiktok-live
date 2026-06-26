import { useAppStore } from "../stores/appStore";
import { Button, Toggle, NumberInput, RangeInput, SelectInput } from "../components/ui";
import { saveConfig } from "../services/api";
import { buttonRowClass, panelClass, soundPresets } from "../config/constants";
import type { SoundPreset } from "../types";
import { playTone, soundPresetFor, alertVolumeFor } from "../utils/helpers";

export function SoundsPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className={panelClass}>
        <h2>Sound Effects</h2>
        <Toggle label="Enable sounds" checked={config.sounds.enabled} onChange={(enabled) => patchConfig({ sounds: { enabled } })} />
        <RangeInput label="Master volume" value={config.sounds.masterVolume} min={0} max={1} step={0.05} showNumberInput={false} valueLabel={`${Math.round(config.sounds.masterVolume * 100)}%`} onChange={(masterVolume) => patchConfig({ sounds: { masterVolume } })} />
        <SelectInput label="Share preset" value={config.sounds.sharePreset} options={soundPresets} onChange={(sharePreset) => patchConfig({ sounds: { sharePreset: sharePreset as SoundPreset } })} />
        <RangeInput label="Share volume" value={config.sounds.shareVolume} min={0} max={1} step={0.05} showNumberInput={false} valueLabel={`${Math.round(config.sounds.shareVolume * 100)}%`} onChange={(shareVolume) => patchConfig({ sounds: { shareVolume } })} />
        <SelectInput label="Follow preset" value={config.sounds.followPreset} options={soundPresets} onChange={(followPreset) => patchConfig({ sounds: { followPreset: followPreset as SoundPreset } })} />
        <RangeInput label="Follow volume" value={config.sounds.followVolume} min={0} max={1} step={0.05} showNumberInput={false} valueLabel={`${Math.round(config.sounds.followVolume * 100)}%`} onChange={(followVolume) => patchConfig({ sounds: { followVolume } })} />
        <SelectInput label="Gift preset" value={config.sounds.giftPreset} options={soundPresets} onChange={(giftPreset) => patchConfig({ sounds: { giftPreset: giftPreset as SoundPreset } })} />
        <RangeInput label="Gift volume" value={config.sounds.giftVolume} min={0} max={1} step={0.05} showNumberInput={false} valueLabel={`${Math.round(config.sounds.giftVolume * 100)}%`} onChange={(giftVolume) => patchConfig({ sounds: { giftVolume } })} />
        <Button onClick={() => void saveConfig(config)}>Save Sounds</Button>
      </section>
      <section className={panelClass}>
        <h2>Preview</h2>
        <div className={buttonRowClass}>
          <Button onClick={() => playTone("share", config.sounds.shareVolume * config.sounds.masterVolume, config.sounds.sharePreset)}>Share</Button>
          <Button onClick={() => playTone("follow", config.sounds.followVolume * config.sounds.masterVolume, config.sounds.followPreset)}>Follow</Button>
          <Button onClick={() => playTone("gift", config.sounds.giftVolume * config.sounds.masterVolume, config.sounds.giftPreset)}>Gift</Button>
        </div>
      </section>
    </div>
  );
}

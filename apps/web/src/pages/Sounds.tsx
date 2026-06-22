import { useAppStore } from "../stores/appStore";
import { Button, Toggle, NumberInput, SelectInput } from "../components/ui";
import { saveConfig } from "../services/api";
import { soundPresets } from "../config/constants";
import type { SoundPreset } from "../types";
import { playTone, soundPresetFor, alertVolumeFor } from "../utils/helpers";

export function SoundsPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>Sound Effects</h2>
        <Toggle label="Enable sounds" checked={config.sounds.enabled} onChange={(enabled) => patchConfig({ sounds: { enabled } })} />
        <NumberInput label="Master volume" value={config.sounds.masterVolume} step={0.05} onChange={(masterVolume) => patchConfig({ sounds: { masterVolume } })} />
        <SelectInput label="Share preset" value={config.sounds.sharePreset} options={soundPresets} onChange={(sharePreset) => patchConfig({ sounds: { sharePreset: sharePreset as SoundPreset } })} />
        <NumberInput label="Share volume" value={config.sounds.shareVolume} step={0.05} onChange={(shareVolume) => patchConfig({ sounds: { shareVolume } })} />
        <SelectInput label="Follow preset" value={config.sounds.followPreset} options={soundPresets} onChange={(followPreset) => patchConfig({ sounds: { followPreset: followPreset as SoundPreset } })} />
        <NumberInput label="Follow volume" value={config.sounds.followVolume} step={0.05} onChange={(followVolume) => patchConfig({ sounds: { followVolume } })} />
        <SelectInput label="Gift preset" value={config.sounds.giftPreset} options={soundPresets} onChange={(giftPreset) => patchConfig({ sounds: { giftPreset: giftPreset as SoundPreset } })} />
        <NumberInput label="Gift volume" value={config.sounds.giftVolume} step={0.05} onChange={(giftVolume) => patchConfig({ sounds: { giftVolume } })} />
        <Button onClick={() => void saveConfig(config)}>Save Sounds</Button>
      </section>
      <section className="panel">
        <h2>Preview</h2>
        <div className="button-row">
          <Button onClick={() => playTone("share", config.sounds.shareVolume * config.sounds.masterVolume, config.sounds.sharePreset)}>Share</Button>
          <Button onClick={() => playTone("follow", config.sounds.followVolume * config.sounds.masterVolume, config.sounds.followPreset)}>Follow</Button>
          <Button onClick={() => playTone("gift", config.sounds.giftVolume * config.sounds.masterVolume, config.sounds.giftPreset)}>Gift</Button>
        </div>
      </section>
    </div>
  );
}

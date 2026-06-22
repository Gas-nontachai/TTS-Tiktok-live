import { useState } from "react";
import { useAppStore } from "../stores/appStore";
import { Button, Toggle, TextInput, NumberInput, SelectInput } from "../components/ui";
import { saveConfig, testAlert } from "../services/api";
import type { AlertType, SoundPreset, AlertAnimationPreset } from "../types";
import { alertAnimations, soundPresets } from "../config/constants";
import { soundPresetFor, typeLabel } from "../utils/helpers";

function AlertConfig({ type }: { type: AlertType }) {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <section className="panel">
      <h2>{typeLabel(type)} Alert</h2>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <Toggle label="Enabled" checked={config.alerts[type].enabled} onChange={(enabled) => patchConfig({ alerts: { [type]: { enabled } } })} />
        <Toggle label="Play sound" checked={config.alerts[type].playSound} onChange={(playSound) => patchConfig({ alerts: { [type]: { playSound } } })} />
        <Toggle label="TTS" checked={config.alerts[type].ttsEnabled} onChange={(ttsEnabled) => patchConfig({ alerts: { [type]: { ttsEnabled } } })} />
      </div>
      <TextInput label="Template" value={config.alerts[type].template} onChange={(template) => patchConfig({ alerts: { [type]: { template } } })} />
      <NumberInput label="Duration ms" value={config.alerts[type].durationMs} onChange={(durationMs) => patchConfig({ alerts: { [type]: { durationMs } } })} />
      <NumberInput label="Cooldown ms" value={config.alerts[type].cooldownMs} onChange={(cooldownMs) => patchConfig({ alerts: { [type]: { cooldownMs } } })} />
      <SelectInput label="Enter animation" value={config.alerts[type].enterAnimation} options={alertAnimations} onChange={(enterAnimation) => patchConfig({ alerts: { [type]: { enterAnimation: enterAnimation as AlertAnimationPreset } } })} />
      <SelectInput label="Exit animation" value={config.alerts[type].exitAnimation} options={alertAnimations} onChange={(exitAnimation) => patchConfig({ alerts: { [type]: { exitAnimation: exitAnimation as AlertAnimationPreset } } })} />
      <NumberInput label="Animation ms" value={config.alerts[type].animationDurationMs} onChange={(animationDurationMs) => patchConfig({ alerts: { [type]: { animationDurationMs } } })} />
      <SelectInput label="Style preset" value={config.alerts[type].stylePreset} options={["glass", "neon", "solid", "minimal"]} onChange={(stylePreset) => patchConfig({ alerts: { [type]: { stylePreset: stylePreset as "glass" | "neon" | "solid" | "minimal" } } })} />
      <SelectInput label="Sound preset" value={soundPresetFor(type, config)} options={soundPresets} onChange={(preset) => patchSoundPreset(type, preset as SoundPreset)} />
      {type === "gift" ? (
        <>
          <NumberInput label="Min gift count" value={config.alerts.gift.minGiftCount} onChange={(minGiftCount) => patchConfig({ alerts: { gift: { minGiftCount } } })} />
          <NumberInput label="Min diamonds" value={config.alerts.gift.minDiamondCount} onChange={(minDiamondCount) => patchConfig({ alerts: { gift: { minDiamondCount } } })} />
          <Toggle label="Wait repeat end" checked={config.alerts.gift.waitForRepeatEnd} onChange={(waitForRepeatEnd) => patchConfig({ alerts: { gift: { waitForRepeatEnd } } })} />
        </>
      ) : null}
      <Button onClick={() => void testAlert(type)}>Test {typeLabel(type)}</Button>
    </section>
  );

  function patchSoundPreset(alertType: AlertType, preset: SoundPreset) {
    if (alertType === "share") {
      patchConfig({ sounds: { sharePreset: preset } });
    }
    if (alertType === "follow") {
      patchConfig({ sounds: { followPreset: preset } });
    }
    if (alertType === "gift") {
      patchConfig({ sounds: { giftPreset: preset } });
    }
  }
}

export function AlertsPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const [saving, setSaving] = useState(false);

  async function persist() {
    setSaving(true);
    const next = await saveConfig(config);
    useAppStore.getState().setConfig(next);
    setSaving(false);
  }

  return (
    <div className="page-grid">
      {(["share", "follow", "gift"] as AlertType[]).map((type) => (
        <AlertConfig key={type} type={type} />
      ))}
      <section className="panel wide">
        <h2>Alert Queue</h2>
        <div className="form-grid">
          <NumberInput label="Max queue size" value={config.alertQueue.maxQueueSize} onChange={(maxQueueSize) => patchConfig({ alertQueue: { maxQueueSize } })} />
          <Toggle label="Allow gift interrupt" checked={config.alertQueue.allowGiftInterrupt} onChange={(allowGiftInterrupt) => patchConfig({ alertQueue: { allowGiftInterrupt } })} />
          <Toggle label="Clear queue on disconnect" checked={config.alertQueue.clearQueueOnDisconnect} onChange={(clearQueueOnDisconnect) => patchConfig({ alertQueue: { clearQueueOnDisconnect } })} />
        </div>
        <div className="button-row">
          <Button onClick={persist} disabled={saving}>{saving ? "Saving..." : "Save Alerts"}</Button>
          <Button variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent("skip-alert"))}>Skip Current Alert</Button>
        </div>
      </section>
    </div>
  );
}

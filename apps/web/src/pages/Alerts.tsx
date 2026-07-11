import { useEffect, useState, type CSSProperties } from "react";
import { Upload, X } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextInput, NumberInput, RangeInput, SelectInput, ModalPortal, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { AlertRenderer } from "../components/alerts/AlertRenderer";
import { ChatPreviewWidget } from "../components/chat/ChatPreviewWidget";
import { saveConfig, testAlert, testChatMessage, uploadMedia } from "../services/api";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import type { AlertAnimationPreset, AlertEvent, AlertMediaPosition, AlertMediaType, AlertSoundSource, AlertType, AlertVisualMode, AlertVisualTemplate, AppConfig, SoundPreset } from "../types";
import {
  alertAnimations,
  alertVisualTemplates,
  buttonRowClass,
  chatEnterAnimations,
  formGridClass,
  heartAnimations,
  overlayAlertsUrl,
  overlayGoalsUrl,
  overlayHeartsUrl,
  overlayMainUrl,
  overlayTtsUrl,
  overlayViewerCountUrl,
  panelClass,
  resolveCurrentWebUrl,
  soundPresets,
  transparentPreviewClass,
  ttsPlayerUrl,
  viewerAnimations
} from "../config/constants";
import { alertVolumeFor, defaultSoundPresetFor, effectiveSoundSourceFor, playAlertSound, renderTemplate, soundPresetFor, typeLabel } from "../utils/helpers";

const alertTypes: AlertType[] = ["follow", "share", "gift", "like", "goal"];
const mediaPositions: AlertMediaPosition[] = ["left", "right", "top", "bottom"];
const mediaTypes: AlertMediaType[] = ["image", "gif", "webp"];
type AlertConfigValue = AppConfig["alerts"][keyof AppConfig["alerts"]];
type PreviewTarget = AlertType | "chat" | "viewer-count";
type PreviewBackgroundId = "transparent" | "dark" | "light" | "live" | "warm";
type PreviewHeart = {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

const previewBackgrounds: Array<{ id: PreviewBackgroundId; label: string; className: string }> = [
  { id: "transparent", label: "Transparent", className: transparentPreviewClass },
  { id: "dark", label: "Dark", className: "bg-[#111318]" },
  { id: "light", label: "Light", className: "bg-[#f7f3ea]" },
  { id: "live", label: "Live", className: "bg-[radial-gradient(circle_at_25%_20%,#5e1b4f_0,#251931_36%,#101219_78%)]" },
  { id: "warm", label: "Warm", className: "bg-[linear-gradient(135deg,#ffb86b,#7c2d12_48%,#111827)]" }
];

function LikeHeartsConfig() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Like Hearts</h2>
        <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Preview</Button>
      </div>
      <CopyRow label="Hearts Overlay URL" value={overlayHeartsUrl} />
      <div className="flex flex-wrap items-center gap-3">
        <Toggle label="Show hearts" checked={config.overlay.showHearts} onChange={(showHearts) => patchConfig({ overlay: { showHearts } })} />
        <Toggle label="Enabled" checked={config.likeHearts.enabled} onChange={(enabled) => patchConfig({ likeHearts: { enabled } })} />
      </div>
      <div className={formGridClass}>
        <SelectInput label="Spawn position" value={config.likeHearts.spawnPosition} options={["top-left", "top-right", "bottom-left", "bottom-right"]} onChange={(spawnPosition) => patchConfig({ likeHearts: { spawnPosition: spawnPosition as typeof config.likeHearts.spawnPosition } })} />
        <SelectInput label="Animation" value={config.likeHearts.animationPreset} options={[...heartAnimations]} onChange={(animationPreset) => patchConfig({ likeHearts: { animationPreset: animationPreset as typeof config.likeHearts.animationPreset } })} />
        <SelectInput label="Intensity" value={config.likeHearts.intensity} options={["low", "normal", "high"]} onChange={(intensity) => patchConfig({ likeHearts: { intensity: intensity as typeof config.likeHearts.intensity } })} />
        <NumberInput label="Max hearts" value={config.likeHearts.maxHeartsOnScreen} onChange={(maxHeartsOnScreen) => patchConfig({ likeHearts: { maxHeartsOnScreen } })} />
        <NumberInput label="Heart size" value={config.likeHearts.heartSize} onChange={(heartSize) => patchConfig({ likeHearts: { heartSize } })} />
        <NumberInput label="Animation ms" value={config.likeHearts.animationDurationMs} onChange={(animationDurationMs) => patchConfig({ likeHearts: { animationDurationMs } })} />
      </div>
      <div className={buttonRowClass}>
        <Button onClick={() => void testAlert("like")}>Test Like Hearts</Button>
        <Button onClick={() => void saveConfig(config)}>Save Alerts</Button>
      </div>
      <AlertPreviewModal open={previewOpen} target="like" onClose={() => setPreviewOpen(false)} />
    </section>
  );
}

function ChatConfigSection() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const [message, setMessage] = useState("สวัสดีครับ นี่คือข้อความทดสอบ");
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Chat</h2>
        <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Preview</Button>
      </div>
      <CopyRow label="Chat Overlay URL" value={resolveCurrentWebUrl(config.chat.overlayUrl, "/overlay/chat")} />
      <div className="flex flex-wrap items-center gap-3">
        <Toggle label="Enable chat overlay" checked={config.chat.enabled} onChange={(enabled) => patchConfig({ chat: { enabled } })} />
        <Toggle label="Show avatar" checked={config.chat.display.showAvatar} onChange={(showAvatar) => patchConfig({ chat: { display: { showAvatar } } })} />
        <Toggle label="Show timestamp" checked={config.chat.display.showTimestamp} onChange={(showTimestamp) => patchConfig({ chat: { display: { showTimestamp } } })} />
        <Toggle label="Compact mode" checked={config.chat.display.compactMode} onChange={(compactMode) => patchConfig({ chat: { display: { compactMode } } })} />
      </div>
      <div className={formGridClass}>
        <NumberInput label="Max visible messages" value={config.chat.queue.maxVisibleMessages} onChange={(maxVisibleMessages) => patchConfig({ chat: { queue: { maxVisibleMessages } } })} />
        <NumberInput label="Message lifetime ms" value={config.chat.queue.messageLifetimeMs} onChange={(messageLifetimeMs) => patchConfig({ chat: { queue: { messageLifetimeMs } } })} />
        <SelectInput label="Enter animation" value={config.chat.animation.enterAnimation} options={chatEnterAnimations} onChange={(enterAnimation) => patchConfig({ chat: { animation: { enterAnimation: enterAnimation as typeof config.chat.animation.enterAnimation } } })} />
      </div>
      <TextInput label="Test message" value={message} onChange={setMessage} />
      <div className={buttonRowClass}>
        <Button onClick={() => void testChatMessage(message)}>Test Chat</Button>
        <Button onClick={() => void saveConfig(config)}>Save Chat</Button>
      </div>
      <AlertPreviewModal open={previewOpen} target="chat" onClose={() => setPreviewOpen(false)} />
    </section>
  );
}

function ViewerCountConfig() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Viewer Count</h2>
        <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Preview</Button>
      </div>
      <CopyRow label="Viewer Count Overlay URL" value={overlayViewerCountUrl} />
      <div className="flex flex-wrap items-center gap-3">
        <Toggle label="Show viewer count" checked={config.overlay.showViewerCount} onChange={(showViewerCount) => patchConfig({ overlay: { showViewerCount } })} />
        <Toggle label="Enabled" checked={config.viewerCount.enabled} onChange={(enabled) => patchConfig({ viewerCount: { enabled } })} />
      </div>
      <div className={formGridClass}>
        <SelectInput label="Position" value={config.viewerCount.position} options={["top-left", "top-right", "bottom-left", "bottom-right"]} onChange={(position) => patchConfig({ viewerCount: { position: position as typeof config.viewerCount.position } })} />
        <SelectInput label="Animation" value={config.viewerCount.animationPreset} options={[...viewerAnimations]} onChange={(animationPreset) => patchConfig({ viewerCount: { animationPreset: animationPreset as typeof config.viewerCount.animationPreset } })} />
        <NumberInput label="Font size" value={config.viewerCount.fontSize} onChange={(fontSize) => patchConfig({ viewerCount: { fontSize } })} />
        <TextInput label="Label" value={config.viewerCount.label} onChange={(label) => patchConfig({ viewerCount: { label } })} />
      </div>
      <div className={buttonRowClass}>
        <Button onClick={() => void testAlert("viewer-count")}>Test Viewer Count</Button>
        <Button onClick={() => void saveConfig(config)}>Save Alerts</Button>
      </div>
      <AlertPreviewModal open={previewOpen} target="viewer-count" onClose={() => setPreviewOpen(false)} />
    </section>
  );
}

function AlertConfig({ type }: { type: AlertType }) {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const { speakText } = useSpeechQueue();
  const [uploading, setUploading] = useState<"sound" | "media" | "">("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const alertConfig = config.alerts[type];
  const visualMode = alertConfig.visualMode ?? "custom";
  const visualTemplate = alertConfig.visualTemplate ?? "minimal-toast";
  const effectiveSoundSource = effectiveSoundSourceFor(type, config);
  const effectiveVolume = alertVolumeFor(type, config);
  const effectiveVolumeLabel = `${Math.round(effectiveVolume * 100)}%`;
  const soundStatus = getSoundStatus(type, config);
  const isGloballyMuted = !config.sounds.enabled || config.sounds.muted;

  async function handleUpload(file: File | undefined, kind: "sound" | "media") {
    if (!file) {
      return;
    }
    setUploading(kind);
    try {
      const result = await uploadMedia(file);
      if (kind === "sound") {
        patchConfig({ alerts: { [type]: { soundSource: "custom", soundUrl: result.url } } });
      } else {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const mediaType = extension === "gif" ? "gif" : extension === "webp" ? "webp" : "image";
        patchConfig({ alerts: { [type]: { mediaUrl: result.url, mediaType } } });
      }
    } finally {
      setUploading("");
    }
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>{typeLabel(type)} Alert</h2>
        <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Preview</Button>
      </div>
      <CopyRow label={`${typeLabel(type)} Alert Overlay URL`} value={overlayAlertsUrl} />
      {type === "goal" ? <CopyRow label="Goals Overlay URL" value={overlayGoalsUrl} /> : null}
      <div className="flex items-center gap-3 whitespace-nowrap">
        <Toggle label="Enabled" checked={alertConfig.enabled} onChange={(enabled) => patchConfig({ alerts: { [type]: { enabled } } })} />
        <Toggle label="Play sound" checked={alertConfig.playSound} onChange={(playSound) => patchConfig({ alerts: { [type]: { playSound } } })} />
        <Toggle label="TTS" checked={alertConfig.ttsEnabled} onChange={(ttsEnabled) => patchConfig({ alerts: { [type]: { ttsEnabled } } })} />
      </div>

      <section className="grid gap-3 rounded-lg border border-surfaceMuted bg-white/65 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text">Alert Visual</h3>
            <p className="text-sm text-textMuted">Template คือ UI สำเร็จรูป ส่วน Custom คือปรับเองจาก field เดิม</p>
          </div>
          <div className="inline-grid grid-cols-2 rounded-md border border-surfaceMuted bg-white p-1">
            {(["template", "custom"] as AlertVisualMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => patchConfig({ alerts: { [type]: { visualMode: mode } } })}
                className={`min-h-9 rounded px-3 text-sm font-bold transition ${visualMode === mode ? "bg-sage text-white" : "text-textMuted hover:bg-surface"}`}
              >
                {mode === "template" ? "Template" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {visualMode === "template" ? (
          <TemplateGallery
            selected={visualTemplate}
            alertConfig={alertConfig}
            onSelect={(visualTemplate) => patchConfig({ alerts: { [type]: { visualMode: "template", visualTemplate } } })}
          />
        ) : (
          <div className={formGridClass}>
            <SelectInput label="Enter animation" value={alertConfig.enterAnimation} options={alertAnimations} onChange={(enterAnimation) => patchConfig({ alerts: { [type]: { enterAnimation: enterAnimation as AlertAnimationPreset } } })} />
            <SelectInput label="Exit animation" value={alertConfig.exitAnimation} options={alertAnimations} onChange={(exitAnimation) => patchConfig({ alerts: { [type]: { exitAnimation: exitAnimation as AlertAnimationPreset } } })} />
            <NumberInput label="Animation ms" value={alertConfig.animationDurationMs} onChange={(animationDurationMs) => patchConfig({ alerts: { [type]: { animationDurationMs } } })} />
            <SelectInput label="Style preset" value={alertConfig.stylePreset} options={["glass", "neon", "solid", "minimal"]} onChange={(stylePreset) => patchConfig({ alerts: { [type]: { stylePreset: stylePreset as "glass" | "neon" | "solid" | "minimal" } } })} />
            <SelectInput label="Media position" value={alertConfig.mediaPosition} options={mediaPositions} onChange={(mediaPosition) => patchConfig({ alerts: { [type]: { mediaPosition: mediaPosition as AlertMediaPosition } } })} />
            <NumberInput label="Media size" value={alertConfig.mediaSize} onChange={(mediaSize) => patchConfig({ alerts: { [type]: { mediaSize } } })} />
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-lg border border-surfaceMuted bg-white/65 p-3">
        <h3 className="text-base font-bold text-text">Message Text</h3>
        <TextInput label="Message text" value={alertConfig.template} onChange={(template) => patchConfig({ alerts: { [type]: { template } } })} />
      </section>

      <section className="grid gap-3 rounded-lg border border-surfaceMuted bg-white/65 p-3">
        <h3 className="text-base font-bold text-text">Behavior</h3>
        <div className={formGridClass}>
          <NumberInput label="Duration ms" value={alertConfig.durationMs} onChange={(durationMs) => patchConfig({ alerts: { [type]: { durationMs } } })} />
          <NumberInput label="Cooldown ms" value={alertConfig.cooldownMs} onChange={(cooldownMs) => patchConfig({ alerts: { [type]: { cooldownMs } } })} />
          <NumberInput label="Rate/sec" value={alertConfig.rateLimitPerSecond} onChange={(rateLimitPerSecond) => patchConfig({ alerts: { [type]: { rateLimitPerSecond } } })} />
          <NumberInput label="Minimum count" value={alertConfig.minimumTriggerCount} onChange={(minimumTriggerCount) => patchConfig({ alerts: { [type]: { minimumTriggerCount } } })} />
        </div>
      </section>
      {type === "like" ? (
        <div className={formGridClass}>
          <Toggle label="Batch likes" checked={alertConfig.batchEnabled} onChange={(batchEnabled) => patchConfig({ alerts: { like: { batchEnabled } } })} />
          <NumberInput label="Batch window ms" value={alertConfig.batchWindowMs} onChange={(batchWindowMs) => patchConfig({ alerts: { like: { batchWindowMs } } })} />
        </div>
      ) : null}
      {type === "gift" ? (
        <div className={formGridClass}>
          <NumberInput label="Min gift count" value={config.alerts.gift.minGiftCount} onChange={(minGiftCount) => patchConfig({ alerts: { gift: { minGiftCount } } })} />
          <NumberInput label="Min diamonds" value={config.alerts.gift.minDiamondCount} onChange={(minDiamondCount) => patchConfig({ alerts: { gift: { minDiamondCount } } })} />
          <Toggle label="Wait repeat end" checked={config.alerts.gift.waitForRepeatEnd} onChange={(waitForRepeatEnd) => patchConfig({ alerts: { gift: { waitForRepeatEnd } } })} />
        </div>
      ) : null}

      <section className="grid gap-3 rounded-lg border border-surfaceMuted bg-white/65 p-3">
        <h3 className="text-base font-bold text-text">Media & Sound</h3>
        <div className="grid gap-3 rounded-lg border border-surfaceMuted bg-white p-3">
          <div className="grid gap-2">
            <span className="text-sm font-bold text-text">Sound source</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["default", "preset", "custom"] as AlertSoundSource[]).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => patchSoundSource(source)}
                  className={`min-h-10 rounded-md border px-3 text-sm font-bold transition ${alertConfig.soundSource === source ? "border-sage bg-sage text-white" : "border-surfaceMuted bg-white text-textMuted hover:bg-surface"}`}
                >
                  {source === "default" ? "Use default sound" : source === "preset" ? "Select preset" : "Custom sound"}
                </button>
              ))}
            </div>
          </div>
          <div className={formGridClass}>
            <SelectInput
              label="Alert preset"
              value={alertConfig.soundSource === "preset" ? alertConfig.soundPreset : soundPresetFor(type, config)}
              options={soundPresets}
              onChange={(preset) => patchConfig({ alerts: { [type]: { soundSource: "preset", soundPreset: preset as SoundPreset } } })}
            />
            <TextInput label="Custom sound URL" value={alertConfig.soundUrl} onChange={(soundUrl) => patchConfig({ alerts: { [type]: { soundSource: soundUrl.trim() ? "custom" : alertConfig.soundSource, soundUrl } } })} />
            <RangeInput label="Alert volume" value={alertConfig.volume} min={0} max={100} step={1} showNumberInput={false} valueLabel={`${alertConfig.volume}%`} onChange={(volume) => patchConfig({ alerts: { [type]: { volume } } })} />
          </div>
          <div className="grid gap-2 rounded-lg border border-surfaceMuted bg-[#fffdfa] p-3 text-sm text-text">
            <div>
              <span className="font-bold">Sound status: </span>
              <span className={isGloballyMuted ? "text-rose-700" : "text-text"}>{soundStatus}</span>
            </div>
            <div>
              <span className="font-bold">Effective volume: </span>
              {effectiveVolumeLabel} <span className="text-textMuted">({alertConfig.volume}% alert x {Math.round(config.sounds.masterVolume * 100)}% master)</span>
            </div>
            <div>
              <span className="font-bold">Effective source: </span>
              {effectiveSoundSource === "custom" ? alertConfig.soundUrl : `${effectiveSoundSource === "preset" ? "Preset" : "Default"}: ${soundPresetFor(type, config)}`}
            </div>
          </div>
          <div className={formGridClass}>
          <label className="grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#e1dcd1] bg-white px-3 py-2 text-sm font-bold text-[#464d42]">
            <span>{uploading === "sound" ? "Uploading..." : "Upload sound"}</span>
            <Upload size={16} />
            <input type="file" accept=".mp3,.wav,.ogg,audio/*" onChange={(event) => void handleUpload(event.target.files?.[0], "sound")} />
          </label>
          </div>
        </div>
        <div className={formGridClass}>
          <TextInput label="Media URL" value={alertConfig.mediaUrl} onChange={(mediaUrl) => patchConfig({ alerts: { [type]: { mediaUrl } } })} />
          <SelectInput label="Media type" value={alertConfig.mediaType} options={mediaTypes} onChange={(mediaType) => patchConfig({ alerts: { [type]: { mediaType: mediaType as AlertMediaType } } })} />
          {visualMode === "template" ? (
            <NumberInput label="Media size" value={alertConfig.mediaSize} onChange={(mediaSize) => patchConfig({ alerts: { [type]: { mediaSize } } })} />
          ) : null}
          <label className="grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#e1dcd1] bg-white px-3 py-2 text-sm font-bold text-[#464d42]">
            <span>{uploading === "media" ? "Uploading..." : "Upload media"}</span>
            <Upload size={16} />
            <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,image/*" onChange={(event) => void handleUpload(event.target.files?.[0], "media")} />
          </label>
        </div>
      </section>

      <div className={buttonRowClass}>
        <Button onClick={() => void testAlertWithTtsPreview()}>Test {typeLabel(type)}</Button>
        <Button variant="secondary" onClick={() => playAlertSound(type, config)}>Preview Sound</Button>
      </div>
      <AlertPreviewModal open={previewOpen} target={type} onClose={() => setPreviewOpen(false)} />
    </section>
  );

  async function testAlertWithTtsPreview() {
    await testAlert(type);

    if (!config.tts.enabled || !config.tts.playerEnabled || !config.tts.speakAlerts || config.tts.muted || !alertConfig.enabled || !alertConfig.ttsEnabled) {
      return;
    }

    const text = renderTemplate(alertConfig.template, sampleAlertEvent(type));
    speakText(text);
  }

  function patchSoundSource(soundSource: AlertSoundSource) {
    patchConfig({ alerts: { [type]: { soundSource, soundPreset: alertConfig.soundPreset ?? defaultSoundPresetFor(type) } } });
  }
}

function getSoundStatus(type: AlertType, config: AppConfig) {
  const alertConfig = config.alerts[type];

  if (!config.sounds.enabled) {
    return "Muted by global audio settings";
  }
  if (config.sounds.muted) {
    return "Muted by global audio settings";
  }
  if (!alertConfig.playSound) {
    return "Sound disabled for this alert";
  }
  if (alertConfig.soundSource === "custom" && !alertConfig.soundUrl.trim()) {
    return "Custom sound URL is empty; using default sound";
  }
  if (effectiveSoundSourceFor(type, config) === "custom") {
    return "Using custom sound";
  }
  if (effectiveSoundSourceFor(type, config) === "preset") {
    return "Using preset";
  }
  return "Using default sound";
}

function OverlayConfigSection() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <section className={panelClass}>
      <h2>Overlay Config</h2>
      <CopyRow label="Combined Preview URL" value={overlayMainUrl} />
      <CopyRow label="TTS Player URL" value={ttsPlayerUrl} />
      <CopyRow label="Deprecated TTS Overlay URL" value={overlayTtsUrl} />
      <div className="flex flex-wrap items-center gap-3">
        <Toggle label="Show alerts" checked={config.overlay.showAlerts} onChange={(showAlerts) => patchConfig({ overlay: { showAlerts } })} />
        <Toggle label="Show goals" checked={config.overlay.showGoals} onChange={(showGoals) => patchConfig({ overlay: { showGoals } })} />
        <Toggle label="Show viewer count" checked={config.overlay.showViewerCount} onChange={(showViewerCount) => patchConfig({ overlay: { showViewerCount } })} />
        <Toggle label="Show hearts" checked={config.overlay.showHearts} onChange={(showHearts) => patchConfig({ overlay: { showHearts } })} />
        <Toggle label="Include chat in combined preview" checked={config.overlay.showChatInMain} onChange={(showChatInMain) => patchConfig({ overlay: { showChatInMain } })} />
      </div>
      <div className={buttonRowClass}>
        <Button onClick={() => void saveConfig(config)}>Save Overlay Settings</Button>
      </div>
    </section>
  );
}

function TemplateGallery({
  selected,
  alertConfig,
  onSelect
}: {
  selected: AlertVisualTemplate;
  alertConfig: AlertConfigValue;
  onSelect: (template: AlertVisualTemplate) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {alertVisualTemplates.map((template) => {
        const isSelected = selected === template.id;
        const previewConfig = {
          ...alertConfig,
          visualMode: "template",
          visualTemplate: template.id,
          mediaUrl: ""
        } as AlertConfigValue;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`grid min-h-[15rem] gap-3 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 ${isSelected ? "border-sage bg-[#eef6ef] shadow-[0_10px_28px_rgba(82,104,77,0.16)]" : "border-surfaceMuted bg-white hover:border-sage/60"}`}
          >
            <div className={`relative h-40 overflow-hidden rounded-md ${transparentPreviewClass}`}>
              <AlertRenderer event={sampleAlertEvent(template.id === "goal-complete" ? "goal" : template.id === "big-shoutout" || template.id === "neon-pop" ? "follow" : "gift")} alertConfig={previewConfig} position="bottom-left" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-black text-text">{template.emoji} {template.label}</span>
              <span className="text-xs font-medium leading-snug text-textMuted">{template.description}</span>
              {isSelected ? <span className="text-xs font-black uppercase tracking-[0.12em] text-sage">Selected</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AlertPreviewModal({ open, target, onClose }: { open: boolean; target: PreviewTarget; onClose: () => void }) {
  const config = useAppStore((state) => state.config);
  const [ratio, setRatio] = useState<"16:9" | "9:16">("16:9");
  const [backgroundId, setBackgroundId] = useState<PreviewBackgroundId>("transparent");
  const previewEvent = target === "viewer-count" || target === "like" || target === "chat" ? null : sampleAlertEvent(target);
  const alertConfig = previewEvent ? config.alerts[previewEvent.type] : null;
  const previewBackground = previewBackgrounds.find((background) => background.id === backgroundId) ?? previewBackgrounds[0];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      window.addEventListener("keydown", onKey);
    }

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[2147483647] grid place-items-center p-4">
        <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" type="button" aria-label="Close preview" onClick={onClose} />
        <section className="relative grid w-full max-w-6xl gap-4 rounded-lg border border-surfaceMuted bg-[#fffdfa] p-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2>{target === "viewer-count" ? "Viewer Count" : target === "chat" ? "Chat" : typeLabel(target)} Preview</h2>
              <p className="text-sm text-textMuted">Preview นี้ใช้ renderer กลางของ widget เดียวกัน</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["16:9", "9:16"] as const).map((nextRatio) => (
                <Button key={nextRatio} type="button" variant={ratio === nextRatio ? "primary" : "secondary"} onClick={() => setRatio(nextRatio)}>
                  {nextRatio}
                </Button>
              ))}
              {previewBackgrounds.map((background) => (
                <Button key={background.id} type="button" variant={backgroundId === background.id ? "primary" : "secondary"} onClick={() => setBackgroundId(background.id)}>
                  {background.label}
                </Button>
              ))}
              <Button type="button" variant="danger" size="icon" aria-label="Close preview" onClick={onClose}><X size={16} /></Button>
            </div>
          </div>
          <div className={`grid place-items-center rounded-lg p-3 ${target === "chat" ? "bg-[#141414]" : previewBackground.className}`}>
            <div className={`relative w-full overflow-hidden rounded-md bg-transparent ${ratio === "16:9" ? "aspect-video max-w-5xl" : "aspect-[9/16] max-h-[70vh] max-w-sm"}`}>
              {previewEvent && alertConfig ? (
                <AlertRenderer key={`${previewEvent.id}-${ratio}`} event={previewEvent} alertConfig={alertConfig} position={config.overlay.alertPosition} />
              ) : target === "chat" ? (
                <ChatPreviewWidget key={`chat-${ratio}`} config={config} />
              ) : target === "like" ? (
                <LikeHeartsPreview key={`like-${ratio}`} />
              ) : (
                <ViewerCountPreview />
              )}
            </div>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}

function LikeHeartsPreview() {
  const config = useAppStore((state) => state.config);
  const hearts = createPreviewHearts(config.likeHearts.intensity === "high" ? 12 : config.likeHearts.intensity === "normal" ? 8 : 4, config.likeHearts.heartSize, config.likeHearts.animationDurationMs);

  return (
    <>
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={`absolute z-[4] transform-gpu text-[#ff3f86] [filter:drop-shadow(0_10px_18px_rgba(255,63,134,0.4))] will-change-transform ${heartAnimationClass(config.likeHearts.animationPreset)}`}
          style={previewHeartPositionStyle(config.likeHearts.spawnPosition, heart)}
        >
          ♥
        </span>
      ))}
    </>
  );
}

function ViewerCountPreview() {
  const config = useAppStore((state) => state.config);
  const sampleViewerCount = 128;
  const prefix = config.viewerCount.label.trim().replace(/^👁\s*/u, "");

  return (
    <div className={`absolute z-[5] transform-gpu rounded-full bg-black/50 px-4 py-2.5 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.35)] ${previewPositionClass(config.viewerCount.position)}`} style={{ fontSize: config.viewerCount.fontSize }}>
      {prefix ? `${prefix} ` : null}
      {sampleViewerCount}
    </div>
  );
}

function previewPositionClass(position: string) {
  switch (position) {
    case "top-left":
      return "left-8 top-8";
    case "top-right":
      return "right-8 top-8";
    case "bottom-left":
      return "bottom-8 left-8";
    case "bottom-right":
      return "bottom-8 right-8";
    default:
      return "top-8 right-8";
  }
}

function createPreviewHearts(count: number, baseSize: number, baseDuration: number): PreviewHeart[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `preview-heart-${index}`,
    x: 18 + (index % 4) * 42,
    y: 18 + Math.floor(index / 4) * 38,
    size: Math.max(18, baseSize + (index % 3) * 5),
    duration: Math.max(900, baseDuration + index * 35),
    delay: index * 70
  }));
}

function previewHeartPositionStyle(position: string, heart: PreviewHeart): CSSProperties {
  const base: CSSProperties = {
    fontSize: heart.size,
    animationDuration: `${heart.duration}ms`,
    animationDelay: `${heart.delay}ms`
  };

  if (position.includes("left")) {
    base.left = `${heart.x}px`;
  } else {
    base.right = `${heart.x}px`;
  }

  if (position.includes("top")) {
    base.top = `${heart.y}px`;
  } else {
    base.bottom = `${heart.y}px`;
  }

  return base;
}

function heartAnimationClass(animation: string) {
  switch (animation) {
    case "burst":
      return "animate-heart-burst";
    case "spiral":
      return "animate-heart-spiral";
    case "side-float":
      return "animate-heart-side-float";
    case "confetti":
      return "animate-heart-confetti";
    default:
      return "animate-float-heart";
  }
}

function sampleAlertEvent(type: AlertType): AlertEvent {
  const base = {
    id: `preview-${type}-${Date.now()}`,
    timestamp: Date.now(),
    userId: `tester_${type}`,
    username: `tester_${type}`,
    displayName: "Tester"
  };

  switch (type) {
    case "gift":
      return {
        ...base,
        type,
        giftId: "rose",
        giftName: "Rose",
        giftCount: 5,
        diamondCount: 5,
        repeatEnd: true
      };
    case "goal":
      return {
        id: "preview-goal",
        type,
        goalId: "test_goal",
        goalTitle: "Test Goal",
        currentValue: 100,
        targetValue: 100,
        timestamp: Date.now()
      };
    case "like":
      return {
        ...base,
        type,
        likeCount: 8,
        totalLikeCount: 100
      };
    case "comment":
      return {
        ...base,
        type,
        message: "This is a test chat message"
      };
    default:
      return {
        ...base,
        type
      } as AlertEvent;
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
    <Tabs defaultValue="follow" className="grid w-full gap-0">
      <TabsList aria-label="Alert settings sections">
        <TabsTrigger value="hearts">Like Hearts</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="viewer">Viewer Count</TabsTrigger>
        {alertTypes.map((type) => (
          <TabsTrigger key={type} value={type}>{typeLabel(type)}</TabsTrigger>
        ))}
        <TabsTrigger value="queue">Queue</TabsTrigger>
        <TabsTrigger value="config">Config</TabsTrigger>
      </TabsList>
      <TabsContent value="hearts">
        <LikeHeartsConfig />
      </TabsContent>
      <TabsContent value="chat">
        <ChatConfigSection />
      </TabsContent>
      <TabsContent value="viewer">
        <ViewerCountConfig />
      </TabsContent>
      {alertTypes.map((type) => (
        <TabsContent key={type} value={type}>
          <AlertConfig type={type} />
        </TabsContent>
      ))}
      <TabsContent value="queue">
        <section className={panelClass}>
          <h2>Alert Queue</h2>
          <div className={formGridClass}>
            <NumberInput label="Max queue size" value={config.alertQueue.maxQueueSize} onChange={(maxQueueSize) => patchConfig({ alertQueue: { maxQueueSize } })} />
            <Toggle label="Allow gift interrupt" checked={config.alertQueue.allowGiftInterrupt} onChange={(allowGiftInterrupt) => patchConfig({ alertQueue: { allowGiftInterrupt } })} />
            <Toggle label="Clear queue on disconnect" checked={config.alertQueue.clearQueueOnDisconnect} onChange={(clearQueueOnDisconnect) => patchConfig({ alertQueue: { clearQueueOnDisconnect } })} />
          </div>
          <div className={buttonRowClass}>
            <Button onClick={persist} disabled={saving}>{saving ? "Saving..." : "Save Alerts"}</Button>
            <Button variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent("skip-alert"))}>Skip Current Alert</Button>
          </div>
        </section>
      </TabsContent>
      <TabsContent value="config">
        <OverlayConfigSection />
      </TabsContent>
    </Tabs>
  );
}

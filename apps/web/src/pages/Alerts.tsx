import { useState } from "react";
import { Upload } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, Toggle, TextInput, NumberInput, RangeInput, SelectInput, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { saveConfig, testAlert, testChatMessage, uploadMedia } from "../services/api";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import type { AlertAnimationPreset, AlertMediaPosition, AlertMediaType, AlertType, SoundPreset } from "../types";
import { alertAnimations, buttonRowClass, chatAnimations, formGridClass, heartAnimations, panelClass, soundPresets, viewerAnimations } from "../config/constants";
import { playAlertSound, renderTemplate, soundPresetFor, typeLabel } from "../utils/helpers";

const alertTypes: AlertType[] = ["follow", "share", "gift", "goal"];
const mediaPositions: AlertMediaPosition[] = ["left", "right", "top", "bottom"];
const mediaTypes: AlertMediaType[] = ["image", "gif", "webp"];

function LikeHeartsConfig() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <section className={panelClass}>
      <h2>Like Hearts</h2>
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
    </section>
  );
}

function CommentChatConfig() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const [message, setMessage] = useState("สวัสดีครับ นี่คือข้อความทดสอบ");

  return (
    <section className={panelClass}>
      <h2>Comment Chat</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Toggle label="Enable chat overlay" checked={config.chat.enabled} onChange={(enabled) => patchConfig({ chat: { enabled } })} />
        <Toggle label="Show avatar" checked={config.chat.display.showAvatar} onChange={(showAvatar) => patchConfig({ chat: { display: { showAvatar } } })} />
        <Toggle label="Show timestamp" checked={config.chat.display.showTimestamp} onChange={(showTimestamp) => patchConfig({ chat: { display: { showTimestamp } } })} />
        <Toggle label="Compact mode" checked={config.chat.display.compactMode} onChange={(compactMode) => patchConfig({ chat: { display: { compactMode } } })} />
      </div>
      <div className={formGridClass}>
        <NumberInput label="Max visible messages" value={config.chat.queue.maxVisibleMessages} onChange={(maxVisibleMessages) => patchConfig({ chat: { queue: { maxVisibleMessages } } })} />
        <NumberInput label="Message lifetime ms" value={config.chat.queue.messageLifetimeMs} onChange={(messageLifetimeMs) => patchConfig({ chat: { queue: { messageLifetimeMs } } })} />
        <SelectInput label="Enter animation" value={config.chat.animation.enterAnimation} options={chatAnimations} onChange={(enterAnimation) => patchConfig({ chat: { animation: { enterAnimation: enterAnimation as typeof config.chat.animation.enterAnimation } } })} />
      </div>
      <TextInput label="Test message" value={message} onChange={setMessage} />
      <div className={buttonRowClass}>
        <Button onClick={() => void testChatMessage(message)}>Test Comment Chat</Button>
        <Button onClick={() => void saveConfig(config)}>Save Chat</Button>
      </div>
    </section>
  );
}

function ViewerCountConfig() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <section className={panelClass}>
      <h2>Viewer Count</h2>
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
    </section>
  );
}

function AlertConfig({ type }: { type: AlertType }) {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const { speakText } = useSpeechQueue();
  const [uploading, setUploading] = useState<"sound" | "media" | "">("");
  const alertConfig = config.alerts[type];

  async function handleUpload(file: File | undefined, kind: "sound" | "media") {
    if (!file) {
      return;
    }
    setUploading(kind);
    try {
      const result = await uploadMedia(file);
      if (kind === "sound") {
        patchConfig({ alerts: { [type]: { soundUrl: result.url } } });
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
      <h2>{typeLabel(type)} Alert</h2>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <Toggle label="Enabled" checked={alertConfig.enabled} onChange={(enabled) => patchConfig({ alerts: { [type]: { enabled } } })} />
        <Toggle label="Play sound" checked={alertConfig.playSound} onChange={(playSound) => patchConfig({ alerts: { [type]: { playSound } } })} />
        <Toggle label="TTS" checked={alertConfig.ttsEnabled} onChange={(ttsEnabled) => patchConfig({ alerts: { [type]: { ttsEnabled } } })} />
      </div>
      <TextInput label="Template" value={alertConfig.template} onChange={(template) => patchConfig({ alerts: { [type]: { template } } })} />
      <div className={formGridClass}>
        <NumberInput label="Duration ms" value={alertConfig.durationMs} onChange={(durationMs) => patchConfig({ alerts: { [type]: { durationMs } } })} />
        <NumberInput label="Cooldown ms" value={alertConfig.cooldownMs} onChange={(cooldownMs) => patchConfig({ alerts: { [type]: { cooldownMs } } })} />
        <RangeInput label="Volume %" value={alertConfig.volume} min={0} max={100} step={1} showNumberInput={false} valueLabel={`${alertConfig.volume}%`} onChange={(volume) => patchConfig({ alerts: { [type]: { volume } } })} />
        <SelectInput label="Enter animation" value={alertConfig.enterAnimation} options={alertAnimations} onChange={(enterAnimation) => patchConfig({ alerts: { [type]: { enterAnimation: enterAnimation as AlertAnimationPreset } } })} />
        <SelectInput label="Exit animation" value={alertConfig.exitAnimation} options={alertAnimations} onChange={(exitAnimation) => patchConfig({ alerts: { [type]: { exitAnimation: exitAnimation as AlertAnimationPreset } } })} />
        <NumberInput label="Animation ms" value={alertConfig.animationDurationMs} onChange={(animationDurationMs) => patchConfig({ alerts: { [type]: { animationDurationMs } } })} />
        <SelectInput label="Style preset" value={alertConfig.stylePreset} options={["glass", "neon", "solid", "minimal"]} onChange={(stylePreset) => patchConfig({ alerts: { [type]: { stylePreset: stylePreset as "glass" | "neon" | "solid" | "minimal" } } })} />
        <NumberInput label="Rate/sec" value={alertConfig.rateLimitPerSecond} onChange={(rateLimitPerSecond) => patchConfig({ alerts: { [type]: { rateLimitPerSecond } } })} />
        <NumberInput label="Minimum count" value={alertConfig.minimumTriggerCount} onChange={(minimumTriggerCount) => patchConfig({ alerts: { [type]: { minimumTriggerCount } } })} />
      </div>
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
      <div className={formGridClass}>
        <SelectInput label="Sound preset" value={soundPresetFor(type, config)} options={soundPresets} onChange={(preset) => patchSoundPreset(type, preset as SoundPreset)} />
        <TextInput label="Custom sound URL" value={alertConfig.soundUrl} onChange={(soundUrl) => patchConfig({ alerts: { [type]: { soundUrl } } })} />
        <label className="grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#e1dcd1] bg-white px-3 py-2 text-sm font-bold text-[#464d42]">
          <span>{uploading === "sound" ? "Uploading..." : "Upload sound"}</span>
          <Upload size={16} />
          <input type="file" accept=".mp3,.wav,.ogg,audio/*" onChange={(event) => void handleUpload(event.target.files?.[0], "sound")} />
        </label>
        <TextInput label="Media URL" value={alertConfig.mediaUrl} onChange={(mediaUrl) => patchConfig({ alerts: { [type]: { mediaUrl } } })} />
        <SelectInput label="Media type" value={alertConfig.mediaType} options={mediaTypes} onChange={(mediaType) => patchConfig({ alerts: { [type]: { mediaType: mediaType as AlertMediaType } } })} />
        <SelectInput label="Media position" value={alertConfig.mediaPosition} options={mediaPositions} onChange={(mediaPosition) => patchConfig({ alerts: { [type]: { mediaPosition: mediaPosition as AlertMediaPosition } } })} />
        <NumberInput label="Media size" value={alertConfig.mediaSize} onChange={(mediaSize) => patchConfig({ alerts: { [type]: { mediaSize } } })} />
        <label className="grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#e1dcd1] bg-white px-3 py-2 text-sm font-bold text-[#464d42]">
          <span>{uploading === "media" ? "Uploading..." : "Upload media"}</span>
          <Upload size={16} />
          <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,image/*" onChange={(event) => void handleUpload(event.target.files?.[0], "media")} />
        </label>
      </div>
      <div className={buttonRowClass}>
        <Button onClick={() => void testAlertWithTtsPreview()}>Test {typeLabel(type)}</Button>
        <Button variant="secondary" onClick={() => playAlertSound(type, config)}>Preview Sound</Button>
      </div>
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

  function patchSoundPreset(alertType: AlertType, preset: SoundPreset) {
    if (alertType === "share" || alertType === "comment" || alertType === "goal" || alertType === "like") {
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

function sampleAlertEvent(type: AlertType) {
  const base = {
    id: `preview-${type}`,
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
      };
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
    <Tabs defaultValue="like" className="grid w-full gap-0">
      <TabsList aria-label="Alert settings sections">
        <TabsTrigger value="like">Like</TabsTrigger>
        <TabsTrigger value="comment">Comment</TabsTrigger>
        <TabsTrigger value="viewer">Viewer Count</TabsTrigger>
        {alertTypes.map((type) => (
          <TabsTrigger key={type} value={type}>{typeLabel(type)}</TabsTrigger>
        ))}
        <TabsTrigger value="queue">Queue</TabsTrigger>
      </TabsList>
      <TabsContent value="like">
        <LikeHeartsConfig />
      </TabsContent>
      <TabsContent value="comment">
        <CommentChatConfig />
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
    </Tabs>
  );
}

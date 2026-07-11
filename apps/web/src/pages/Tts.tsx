import { useState, type ReactNode } from "react";
import { Activity, Bell, ExternalLink, ListOrdered, MessageCircle, Mic2, Pause, Play, ShieldCheck, SkipForward, Trash2, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextInput, SelectInput, RangeInput, NumberInput, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { checkAiThaiTts, saveConfig } from "../services/api";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import { buttonRowClass, panelClass, ttsPlayerUrl } from "../config/constants";
import type { AiThaiTtsPreflight } from "../types";

const aiThaiVoices = ["th-TH-PremwadeeNeural", "th-TH-NiwatNeural"];

export function TtsPage() {
  const { testSpeak, stopSpeaking, ttsError } = useSpeechQueue();
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const setError = useAppStore((state) => state.setError);
  const currentSpeakingText = useAppStore((state) => state.currentSpeakingText);
  const ttsQueue = useAppStore((state) => state.ttsQueue);
  const ttsQueuePaused = useAppStore((state) => state.ttsQueuePaused);
  const [text, setText] = useState("สวัสดีครับ นี่คือเสียงทดสอบ");
  const [preflight, setPreflight] = useState<AiThaiTtsPreflight | null>(null);
  const [checkingAiThai, setCheckingAiThai] = useState(false);
  const mode = getTtsMode(config.tts.enabled, config.tts.playerEnabled, config.tts.muted);
  const bannedWordsValue = config.chat.filter.blacklistWords.join(", ");
  const stopAllTts = () => {
    window.dispatchEvent(new CustomEvent("stop-tts"));
    stopSpeaking();
  };
  const skipCurrentTts = () => {
    window.dispatchEvent(new CustomEvent("skip-tts"));
    stopSpeaking();
  };
  const toggleQueuePaused = () => {
    window.dispatchEvent(new CustomEvent(ttsQueuePaused ? "resume-tts-queue" : "pause-tts-queue"));
  };
  const setTtsMode = (nextMode: "off" | "on" | "muted") => {
    patchConfig({
      tts: {
        enabled: nextMode !== "off",
        playerEnabled: nextMode !== "off",
        muted: nextMode === "muted"
      }
    });
  };
  const setBannedWords = (value: string) => {
    patchConfig({
      chat: {
        filter: {
          blacklistWords: value
            .split(",")
            .map((word) => word.trim())
            .filter(Boolean)
        }
      }
    });
  };
  const checkAiThai = async () => {
    setCheckingAiThai(true);
    setError("");

    try {
      const result = await checkAiThaiTts();
      setPreflight(result);
      if (!result.ready) {
        setError(`AI Thai TTS is not ready: ${result.checks.filter((check) => !check.ok).map((check) => check.message).join("; ")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI Thai TTS check failed";
      setPreflight(null);
      setError(message);
    } finally {
      setCheckingAiThai(false);
    }
  };

  return (
    <section className={panelClass}>
      <Tabs defaultValue="controls">
        <TabsList>
          <TabsTrigger value="controls">TTS Controls</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="grid gap-4">
          <div className="grid gap-3 border-b border-surfaceMuted pb-4">
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="min-w-0 flex-1">
                <CopyRow label="Player URL" value={ttsPlayerUrl} />
              </div>
              <Button type="button" variant="secondary" onClick={() => window.open(ttsPlayerUrl, "_blank", "noopener,noreferrer")}>
                <ExternalLink size={16} />Open Player
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-surfaceMuted pb-4">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-textMuted">
              <Volume2 size={16} />Status
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-surfaceMuted bg-white p-1">
              <ModeButton active={mode === "off"} onClick={() => setTtsMode("off")}>
                <VolumeX size={16} />Off
              </ModeButton>
              <ModeButton active={mode === "on"} onClick={() => setTtsMode("on")}>
                <Volume2 size={16} />On
              </ModeButton>
              <ModeButton active={mode === "muted"} onClick={() => setTtsMode("muted")}>
                <Mic2 size={16} />Muted
              </ModeButton>
            </div>
          </div>

          <div className="grid gap-3 border-b border-surfaceMuted pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-textMuted">Now Speaking</p>
                <p className="mt-1 text-sm font-semibold text-text">{ttsQueuePaused ? "Queue paused" : currentSpeakingText ? "Speaking now" : "Idle"}</p>
              </div>
              <div className="rounded-md border border-surfaceMuted bg-white px-3 py-2 text-sm font-bold text-text">
                {ttsQueue.length} waiting
              </div>
            </div>
            <p className="min-h-16 rounded-md border border-surfaceMuted bg-white px-3 py-2 text-sm text-textMuted [overflow-wrap:anywhere]">
              {currentSpeakingText || ttsQueue[0]?.text || "ไม่มีข้อความในคิว"}
            </p>
            <div className={buttonRowClass}>
              <Button type="button" variant="secondary" onClick={skipCurrentTts}>
                <SkipForward size={16} />Skip Current
              </Button>
              <Button type="button" variant={ttsQueuePaused ? "primary" : "secondary"} onClick={toggleQueuePaused}>
                {ttsQueuePaused ? <Play size={16} /> : <Pause size={16} />}{ttsQueuePaused ? "Resume Queue" : "Pause Queue"}
              </Button>
              <Button type="button" variant="danger" onClick={stopAllTts}>
                <Trash2 size={16} />Clear Queue
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-surfaceMuted pb-4">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-textMuted">
              <MessageCircle size={16} />Sources
            </div>
            <SourceRow icon={<MessageCircle size={16} />} label="Chat messages" enabled={config.tts.speakChat} onChange={(speakChat) => patchConfig({ tts: { speakChat } })} />
            <SourceRow icon={<Bell size={16} />} label="Alerts" enabled={config.tts.speakAlerts} onChange={(speakAlerts) => patchConfig({ tts: { speakAlerts } })} />
            <TextInput label="Chat prefix" value={config.tts.chatPrefix} onChange={(chatPrefix) => patchConfig({ tts: { chatPrefix } })} />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-textMuted">
              <ListOrdered size={16} />Priority
            </div>
            <ol className="grid gap-2 text-sm font-semibold text-text">
              <li className="flex min-h-10 items-center gap-3 rounded-md border border-surfaceMuted bg-white px-3"><span className="text-textMuted">1</span> Alerts</li>
              <li className="flex min-h-10 items-center gap-3 rounded-md border border-surfaceMuted bg-white px-3"><span className="text-textMuted">2</span> Chat messages</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="safety" className="grid gap-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-textMuted">
              <ShieldCheck size={16} />Message Safety
            </div>
            <Toggle label="Safety filters" checked={config.chat.filter.enabled} onChange={(enabled) => patchConfig({ chat: { filter: { enabled } } })} />
            <Toggle label="Block links" checked={config.chat.filter.hideLinks} onChange={(hideLinks) => patchConfig({ chat: { filter: { hideLinks } } })} />
            <SafetyStatusRow label="Banned words" enabled={config.chat.filter.enabled && config.chat.filter.blacklistWords.length > 0} />
            <TextInput label="Banned words list" value={bannedWordsValue} onChange={setBannedWords} />
            <NumberInput label="Max length chars" value={config.chat.filter.maxMessageLength} onChange={(maxMessageLength) => patchConfig({ chat: { filter: { maxMessageLength } } })} />
            <NumberInput label="Cooldown / duplicate ms" value={config.chat.filter.duplicateWindowMs} step={500} onChange={(duplicateWindowMs) => patchConfig({ chat: { filter: { duplicateWindowMs } } })} />
            <NumberInput label="Max queue size" value={config.tts.maxQueueSize} onChange={(maxQueueSize) => patchConfig({ tts: { maxQueueSize } })} />
            <NumberInput label="Queue cooldown ms" value={config.tts.cooldownMs} step={250} onChange={(cooldownMs) => patchConfig({ tts: { cooldownMs } })} />
          </div>
        </TabsContent>

        <TabsContent value="voice" className="grid gap-4">
          <div className="grid gap-3 border-b border-surfaceMuted pb-4">
            <SelectInput label="Provider" value={config.tts.engine} options={["ai-thai"]} onChange={() => undefined} />
            <SelectInput label="Language" value={config.tts.lang} options={["th-TH"]} onChange={(lang) => patchConfig({ tts: { lang } })} />
            <SelectInput label="Voice" value={config.tts.aiThaiVoice} options={aiThaiVoices} onChange={(aiThaiVoice) => patchConfig({ tts: { aiThaiVoice: aiThaiVoice as typeof config.tts.aiThaiVoice } })} />
            <RangeInput label="Speed" value={config.tts.rate} step={0.1} min={0.5} max={2} onChange={(rate) => patchConfig({ tts: { rate } })} />
            <RangeInput label="Volume" value={config.tts.volume} step={0.05} min={0} max={1} onChange={(volume) => patchConfig({ tts: { volume } })} />
          </div>

          <div className="grid gap-3">
            <TextInput label="Test text" value={text} onChange={setText} />
            <div className={buttonRowClass}>
              <Button onClick={() => testSpeak(text)}><Play size={16} />Test TTS</Button>
              <Button variant="secondary" onClick={() => void checkAiThai()} disabled={checkingAiThai}><Activity size={16} />{checkingAiThai ? "Checking..." : "Check AI Thai TTS"}</Button>
              <Button onClick={() => void saveConfig(config)}>Save TTS</Button>
            </div>
            {ttsError ? <p className="rounded-md border border-danger bg-white px-3 py-2 text-sm font-semibold text-danger">{ttsError}</p> : null}
            {preflight ? (
              <div className={preflight.ready ? "rounded-md border border-[#b9d7b0] bg-[#f1faed] p-3 text-sm text-[#31582c]" : "rounded-md border border-[#f0c7a8] bg-[#fff4ec] p-3 text-sm text-[#8a3f12]"}>
                <strong>{preflight.ready ? "AI Thai TTS ready" : "AI Thai TTS needs setup"}</strong>
                {preflight.checks.map((check) => (
                  <p key={check.name}>{check.ok ? "OK" : "Fix"}: {check.message}</p>
                ))}
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function getTtsMode(enabled: boolean, playerEnabled: boolean, muted: boolean) {
  if (!enabled || !playerEnabled) {
    return "off";
  }
  return muted ? "muted" : "on";
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition ${
        active ? "bg-sage text-white shadow-sm" : "text-textMuted hover:bg-surface hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function SourceRow({ icon, label, enabled, onChange }: { icon: ReactNode; label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-surfaceMuted bg-white px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text">
        {icon}
        <span>{label}</span>
      </div>
      <Toggle label={enabled ? "On" : "Off"} checked={enabled} onChange={onChange} activeText="ON" inactiveText="OFF" />
    </div>
  );
}

function SafetyStatusRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-surfaceMuted bg-white px-3 py-2 text-sm font-semibold text-text">
      <span>{label}</span>
      <span className={enabled ? "rounded-sm border border-[#4f624a] bg-[#52684d] px-2 py-1 text-xs font-bold text-white" : "rounded-sm border border-surfaceMuted bg-surface px-2 py-1 text-xs font-bold text-textMuted"}>
        {enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
}

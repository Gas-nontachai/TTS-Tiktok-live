import { useState } from "react";
import { Activity, Play, Pause } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextInput, SelectInput, RangeInput, NumberInput } from "../components/ui";
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
  const [text, setText] = useState("สวัสดีครับ นี่คือเสียงทดสอบ");
  const [preflight, setPreflight] = useState<AiThaiTtsPreflight | null>(null);
  const [checkingAiThai, setCheckingAiThai] = useState(false);
  const stopAllTts = () => {
    window.dispatchEvent(new CustomEvent("stop-tts"));
    stopSpeaking();
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className={panelClass}>
        <h2>TTS Controls</h2>
        <CopyRow label="TTS Player URL" value={ttsPlayerUrl} />
        <Toggle label="Enable TTS Player" checked={config.tts.playerEnabled} onChange={(playerEnabled) => patchConfig({ tts: { playerEnabled } })} />
        <Toggle label="Enable TTS" checked={config.tts.enabled} onChange={(enabled) => patchConfig({ tts: { enabled } })} />
        <Toggle label="Mute TTS" checked={config.tts.muted} onChange={(muted) => patchConfig({ tts: { muted } })} />
        <Toggle label="Speak alerts" checked={config.tts.speakAlerts} onChange={(speakAlerts) => patchConfig({ tts: { speakAlerts } })} />
        <Toggle label="Speak chat" checked={config.tts.speakChat} onChange={(speakChat) => patchConfig({ tts: { speakChat } })} />
        <TextInput label="Chat prefix" value={config.tts.chatPrefix} onChange={(chatPrefix) => patchConfig({ tts: { chatPrefix } })} />
        <SelectInput label="Queue mode" value={config.tts.queueMode} options={["queue", "interrupt"]} onChange={(queueMode) => patchConfig({ tts: { queueMode: queueMode as typeof config.tts.queueMode } })} />
        <NumberInput label="Max queue size" value={config.tts.maxQueueSize} onChange={(maxQueueSize) => patchConfig({ tts: { maxQueueSize } })} />
        <NumberInput label="Cooldown ms" value={config.tts.cooldownMs} onChange={(cooldownMs) => patchConfig({ tts: { cooldownMs } })} />
        <TextInput label="Test text" value={text} onChange={setText} />
        <div className={buttonRowClass}>
          <Button onClick={() => testSpeak(text)}><Play size={16} />Test TTS</Button>
          <Button variant="secondary" onClick={stopAllTts}><Pause size={16} />Skip Current TTS</Button>
        </div>
        {ttsError ? <p className="rounded-md border border-danger bg-white px-3 py-2 text-sm font-semibold text-danger">{ttsError}</p> : null}
        <p className="rounded-md border border-surfaceMuted bg-white px-3 py-2 text-sm text-textMuted [overflow-wrap:anywhere]">{currentSpeakingText || "Idle"}</p>
      </section>
      <section className={panelClass}>
        <h2>AI Thai Voice</h2>
        <SelectInput label="Voice" value={config.tts.aiThaiVoice} options={aiThaiVoices} onChange={(aiThaiVoice) => patchConfig({ tts: { aiThaiVoice: aiThaiVoice as typeof config.tts.aiThaiVoice } })} />
        <Button variant="secondary" onClick={() => void checkAiThai()} disabled={checkingAiThai}><Activity size={16} />{checkingAiThai ? "Checking..." : "Check AI Thai TTS"}</Button>
        {preflight ? (
          <div className={preflight.ready ? "rounded-md border border-[#b9d7b0] bg-[#f1faed] p-3 text-sm text-[#31582c]" : "rounded-md border border-[#f0c7a8] bg-[#fff4ec] p-3 text-sm text-[#8a3f12]"}>
            <strong>{preflight.ready ? "AI Thai TTS ready" : "AI Thai TTS needs setup"}</strong>
            {preflight.checks.map((check) => (
              <p key={check.name}>{check.ok ? "OK" : "Fix"}: {check.message}</p>
            ))}
          </div>
        ) : null}
        <RangeInput label="Speed" value={config.tts.rate} step={0.1} min={0.5} max={2} onChange={(rate) => patchConfig({ tts: { rate } })} />
        <RangeInput label="Volume" value={config.tts.volume} step={0.05} min={0} max={1} onChange={(volume) => patchConfig({ tts: { volume } })} />
        <Button onClick={() => void saveConfig(config)}>Save TTS</Button>
      </section>
    </div>
  );
}

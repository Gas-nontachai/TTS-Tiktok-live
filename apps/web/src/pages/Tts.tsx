import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextInput, SelectInput, RangeInput, NumberInput } from "../components/ui";
import { saveConfig } from "../services/api";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import { languages, ttsPlayerUrl } from "../config/constants";

export function TtsPage() {
  const { voices, testSpeak, stopSpeaking } = useSpeechQueue();
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const currentSpeakingText = useAppStore((state) => state.currentSpeakingText);
  const [text, setText] = useState("สวัสดีครับ นี่คือเสียงทดสอบ");
  const filteredVoices = voices.filter((voice) => voice.lang === config.tts.lang);
  const stopAllTts = () => {
    window.dispatchEvent(new CustomEvent("stop-tts"));
    stopSpeaking();
  };

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>TTS Controls</h2>
        <CopyRow label="TTS Player URL" value={ttsPlayerUrl} />
        <Toggle label="Enable TTS Player" checked={config.tts.playerEnabled} onChange={(playerEnabled) => patchConfig({ tts: { playerEnabled } })} />
        <Toggle label="Enable TTS" checked={config.tts.enabled} onChange={(enabled) => patchConfig({ tts: { enabled } })} />
        <Toggle label="Mute TTS" checked={config.tts.muted} onChange={(muted) => patchConfig({ tts: { muted } })} />
        <Toggle label="Speak alerts" checked={config.tts.speakAlerts} onChange={(speakAlerts) => patchConfig({ tts: { speakAlerts } })} />
        <Toggle label="Speak chat" checked={config.tts.speakChat} onChange={(speakChat) => patchConfig({ tts: { speakChat } })} />
        <SelectInput label="Engine" value={config.tts.engine} options={["browser", "local-thai"]} onChange={(engine) => patchConfig({ tts: { engine: engine as typeof config.tts.engine } })} />
        <TextInput label="Chat prefix" value={config.tts.chatPrefix} onChange={(chatPrefix) => patchConfig({ tts: { chatPrefix } })} />
        <SelectInput label="Queue mode" value={config.tts.queueMode} options={["queue", "interrupt"]} onChange={(queueMode) => patchConfig({ tts: { queueMode: queueMode as typeof config.tts.queueMode } })} />
        <NumberInput label="Max queue size" value={config.tts.maxQueueSize} onChange={(maxQueueSize) => patchConfig({ tts: { maxQueueSize } })} />
        <NumberInput label="Cooldown ms" value={config.tts.cooldownMs} onChange={(cooldownMs) => patchConfig({ tts: { cooldownMs } })} />
        <TextInput label="Test text" value={text} onChange={setText} />
        <div className="button-row">
          <Button onClick={() => testSpeak(text)}><Play size={16} />Test TTS</Button>
          <Button variant="secondary" onClick={stopAllTts}><Pause size={16} />Skip Current TTS</Button>
        </div>
        <p className="speaking-text">{currentSpeakingText || "Idle"}</p>
      </section>
      <section className="panel">
        <h2>Voice</h2>
        {config.tts.engine === "local-thai" ? (
          <>
            <SelectInput label="Thai model" value={config.tts.localThaiEngine} options={["thonburian", "jaitts-f5tts"]} onChange={(localThaiEngine) => patchConfig({ tts: { localThaiEngine: localThaiEngine as typeof config.tts.localThaiEngine } })} />
            <TextInput label="Python path" value={config.tts.localThaiPythonPath} onChange={(localThaiPythonPath) => patchConfig({ tts: { localThaiPythonPath } })} />
            <TextInput label="Reference WAV path" value={config.tts.localThaiReferenceAudioPath} onChange={(localThaiReferenceAudioPath) => patchConfig({ tts: { localThaiReferenceAudioPath } })} />
            <TextInput label="Reference text" value={config.tts.localThaiReferenceText} onChange={(localThaiReferenceText) => patchConfig({ tts: { localThaiReferenceText } })} />
          </>
        ) : null}
        <SelectInput label="Language" value={config.tts.lang} options={languages} onChange={(lang) => patchConfig({ tts: { lang } })} />
        <SelectInput label="Voice" value={config.tts.voiceName} options={["", ...(filteredVoices.length ? filteredVoices : voices).map((voice) => voice.name)]} onChange={(voiceName) => patchConfig({ tts: { voiceName } })} />
        <RangeInput label="Rate" value={config.tts.rate} step={0.1} min={0.5} max={2} onChange={(rate) => patchConfig({ tts: { rate } })} />
        <RangeInput label="Pitch" value={config.tts.pitch} step={0.1} min={0.5} max={2} onChange={(pitch) => patchConfig({ tts: { pitch } })} />
        <RangeInput label="Volume" value={config.tts.volume} step={0.05} min={0} max={1} onChange={(volume) => patchConfig({ tts: { volume } })} />
        <Button onClick={() => void saveConfig(config)}>Save TTS</Button>
      </section>
    </div>
  );
}

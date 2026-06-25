import { useEffect, useState } from "react";
import { Activity, Play, Pause } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextInput, SelectInput, RangeInput, NumberInput } from "../components/ui";
import { checkLocalThaiTts, saveConfig } from "../services/api";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import { languages, ttsPlayerUrl } from "../config/constants";
import { findBestVoiceForLanguage, voiceMatchesLanguage } from "../utils/speechVoices";
import type { LocalThaiTtsPreflight } from "../types";

export function TtsPage() {
  const { voices, testSpeak, stopSpeaking, ttsError } = useSpeechQueue();
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const setError = useAppStore((state) => state.setError);
  const currentSpeakingText = useAppStore((state) => state.currentSpeakingText);
  const [text, setText] = useState("สวัสดีครับ นี่คือเสียงทดสอบ");
  const filteredVoices = voices.filter((voice) => voiceMatchesLanguage(voice, config.tts.lang));
  const hasLanguageVoice = filteredVoices.length > 0;
  const voiceOptions = ["", ...(hasLanguageVoice ? filteredVoices : config.tts.lang === "th-TH" ? [] : voices).map((voice) => voice.name)];
  const [preflight, setPreflight] = useState<LocalThaiTtsPreflight | null>(null);
  const [checkingLocalThai, setCheckingLocalThai] = useState(false);
  useEffect(() => {
    if (config.tts.engine !== "browser" || config.tts.lang !== "th-TH") {
      return;
    }

    const selectedVoice = voices.find((voice) => voice.name === config.tts.voiceName);
    if (selectedVoice && voiceMatchesLanguage(selectedVoice, config.tts.lang)) {
      return;
    }

    const thaiVoice = findBestVoiceForLanguage(voices, config.tts.lang);
    if (thaiVoice) {
      patchConfig({ tts: { voiceName: thaiVoice.name } });
    }
  }, [config.tts.engine, config.tts.lang, config.tts.voiceName, patchConfig, voices]);

  const setBrowserLanguage = (lang: string) => {
    patchConfig({ tts: { lang, voiceName: findBestVoiceForLanguage(voices, lang)?.name ?? "" } });
  };
  const stopAllTts = () => {
    window.dispatchEvent(new CustomEvent("stop-tts"));
    stopSpeaking();
  };
  const checkLocalThai = async () => {
    setCheckingLocalThai(true);
    setError("");

    try {
      const result = await checkLocalThaiTts();
      setPreflight(result);
      if (!result.ready) {
        setError(`Local Thai TTS is not ready: ${result.checks.filter((check) => !check.ok).map((check) => check.message).join("; ")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local Thai TTS check failed";
      setPreflight(null);
      setError(message);
    } finally {
      setCheckingLocalThai(false);
    }
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
        {ttsError ? <p className="error-banner">{ttsError}</p> : null}
        <p className="speaking-text">{currentSpeakingText || "Idle"}</p>
      </section>
      <section className="panel">
        <h2>{config.tts.engine === "local-thai" ? "Local Thai Model" : "Browser Voice"}</h2>
        {config.tts.engine === "local-thai" ? (
          <>
            <SelectInput label="Thai model" value={config.tts.localThaiEngine} options={["thonburian", "jaitts-f5tts"]} onChange={(localThaiEngine) => patchConfig({ tts: { localThaiEngine: localThaiEngine as typeof config.tts.localThaiEngine } })} />
            <TextInput label="Python path" value={config.tts.localThaiPythonPath} onChange={(localThaiPythonPath) => patchConfig({ tts: { localThaiPythonPath } })} />
            <TextInput label="Reference WAV path" value={config.tts.localThaiReferenceAudioPath} onChange={(localThaiReferenceAudioPath) => patchConfig({ tts: { localThaiReferenceAudioPath } })} />
            <TextInput label="Reference text" value={config.tts.localThaiReferenceText} onChange={(localThaiReferenceText) => patchConfig({ tts: { localThaiReferenceText } })} />
            <Button variant="secondary" onClick={() => void checkLocalThai()} disabled={checkingLocalThai}><Activity size={16} />{checkingLocalThai ? "Checking..." : "Check Local Thai TTS"}</Button>
            {preflight ? (
              <div className={preflight.ready ? "preflight-status ready" : "preflight-status not-ready"}>
                <strong>{preflight.ready ? "Local Thai TTS ready" : "Local Thai TTS needs setup"}</strong>
                {preflight.checks.map((check) => (
                  <p key={check.name}>{check.ok ? "OK" : "Fix"}: {check.message}</p>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <SelectInput label="Language" value={config.tts.lang} options={languages} onChange={setBrowserLanguage} />
            <SelectInput label="Voice" value={config.tts.voiceName} options={voiceOptions} onChange={(voiceName) => patchConfig({ tts: { voiceName } })} />
          </>
        )}
        <RangeInput label={config.tts.engine === "local-thai" ? "Speed" : "Rate"} value={config.tts.rate} step={0.1} min={0.5} max={2} onChange={(rate) => patchConfig({ tts: { rate } })} />
        {config.tts.engine === "browser" ? <RangeInput label="Pitch" value={config.tts.pitch} step={0.1} min={0.5} max={2} onChange={(pitch) => patchConfig({ tts: { pitch } })} /> : null}
        <RangeInput label="Volume" value={config.tts.volume} step={0.05} min={0} max={1} onChange={(volume) => patchConfig({ tts: { volume } })} />
        <Button onClick={() => void saveConfig(config)}>Save TTS</Button>
      </section>
    </div>
  );
}

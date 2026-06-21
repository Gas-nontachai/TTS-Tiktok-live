import { useEffect, useMemo, useState } from "react";
import { connectTikTok, disconnectTikTok, getConfig, getTikTokStatus, saveConfig } from "./services/api";
import { useSpeechQueue } from "./hooks/useSpeechQueue";
import { useRealtime } from "./hooks/useRealtime";
import { useAppStore } from "./stores/appStore";

const languages = ["th-TH", "en-US", "ja-JP", "ko-KR", "zh-CN"];

export default function App() {
  useRealtime();
  const { voices, testSpeak, stopSpeaking } = useSpeechQueue();
  const [testText, setTestText] = useState("สวัสดีครับ นี่คือเสียงทดสอบ");
  const [saving, setSaving] = useState(false);
  const config = useAppStore((state) => state.config);
  const status = useAppStore((state) => state.status);
  const comments = useAppStore((state) => state.comments);
  const queue = useAppStore((state) => state.queue);
  const error = useAppStore((state) => state.error);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const currentSpeakingText = useAppStore((state) => state.currentSpeakingText);
  const setConfig = useAppStore((state) => state.setConfig);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const setStatus = useAppStore((state) => state.setStatus);
  const setError = useAppStore((state) => state.setError);

  const filteredVoices = useMemo(() => {
    const byLang = voices.filter((voice) => voice.lang === config.tts.lang);
    return byLang.length > 0 ? byLang : voices;
  }, [config.tts.lang, voices]);

  useEffect(() => {
    async function load() {
      try {
        setConfig(await getConfig());
        setStatus(await getTikTokStatus());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load app state");
      }
    }

    void load();
  }, [setConfig, setError, setStatus]);

  async function persistConfig() {
    setSaving(true);
    setError("");

    try {
      await saveConfig(config);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save config");
    } finally {
      setSaving(false);
    }
  }

  async function connect() {
    setError("");
    setStatus({ status: "connecting", username: config.tiktok.username, roomId: "" });

    try {
      const result = await connectTikTok(config.tiktok.username);
      setStatus({ status: "connected", username: result.username, roomId: result.roomId });
    } catch (connectError) {
      setStatus({ status: "error", username: config.tiktok.username, roomId: "" });
      setError(connectError instanceof Error ? connectError.message : "Unable to connect");
    }
  }

  async function disconnect() {
    setError("");

    try {
      await disconnectTikTok();
      setStatus({ status: "disconnected", username: status.username, roomId: "" });
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Unable to disconnect");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#20201d]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5">
        <header className="flex flex-col gap-3 border-b border-[#d7d3c8] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">TikTok Live TTS</h1>
            <p className="mt-1 text-sm text-[#656256]">Local comment reader powered by browser speech synthesis.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`status-chip ${status.status}`}>{status.status}</span>
            <span className={`status-chip ${wsConnected ? "connected" : "disconnected"}`}>
              WS {wsConnected ? "online" : "offline"}
            </span>
            {status.roomId ? <span className="status-chip neutral">Room {status.roomId}</span> : null}
          </div>
        </header>

        {error ? <div className="rounded-md border border-[#c7524a] bg-[#fff1ef] px-3 py-2 text-sm text-[#8b2019]">{error}</div> : null}

        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-5">
            <div className="panel">
              <h2>Connection</h2>
              <label>
                TikTok Username
                <input
                  value={config.tiktok.username}
                  onChange={(event) => patchConfig({ tiktok: { username: event.target.value } })}
                  placeholder="example_user"
                />
              </label>
              <div className="button-row">
                <button onClick={connect} disabled={!config.tiktok.username.trim() || status.status === "connecting"}>
                  Connect
                </button>
                <button className="secondary" onClick={disconnect}>
                  Disconnect
                </button>
              </div>
            </div>

            <div className="panel">
              <h2>TTS Controls</h2>
              <div className="button-row">
                <button
                  className={config.tts.enabled ? "active" : ""}
                  onClick={() => patchConfig({ tts: { enabled: !config.tts.enabled } })}
                >
                  {config.tts.enabled ? "TTS Enabled" : "Enable TTS"}
                </button>
                <button className="secondary" onClick={stopSpeaking}>
                  Stop Speaking
                </button>
              </div>
              <label>
                Test Text
                <textarea rows={3} value={testText} onChange={(event) => setTestText(event.target.value)} />
              </label>
              <button onClick={() => testSpeak(testText)}>Test Speak</button>
              <div className="metric-grid">
                <div>
                  <span>Queue</span>
                  <strong>{queue.length}</strong>
                </div>
                <div>
                  <span>Comments</span>
                  <strong>{comments.length}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Voice Config</h2>
            <div className="form-grid">
              <label>
                Language
                <select value={config.tts.lang} onChange={(event) => patchConfig({ tts: { lang: event.target.value } })}>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Voice
                <select value={config.tts.voiceName} onChange={(event) => patchConfig({ tts: { voiceName: event.target.value } })}>
                  <option value="">System default</option>
                  {filteredVoices.map((voice) => (
                    <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Slider label="Rate" value={config.tts.rate} min={0.1} max={2} step={0.1} onChange={(rate) => patchConfig({ tts: { rate } })} />
            <Slider label="Pitch" value={config.tts.pitch} min={0} max={2} step={0.1} onChange={(pitch) => patchConfig({ tts: { pitch } })} />
            <Slider label="Volume" value={config.tts.volume} min={0} max={1} step={0.05} onChange={(volume) => patchConfig({ tts: { volume } })} />
            <label>
              Message Template
              <input value={config.tts.template} onChange={(event) => patchConfig({ tts: { template: event.target.value } })} />
            </label>
            <label>
              Max Queue Size
              <input
                type="number"
                min={1}
                max={200}
                value={config.queue.maxQueueSize}
                onChange={(event) => patchConfig({ queue: { maxQueueSize: Number(event.target.value) } })}
              />
            </label>
            <button onClick={persistConfig} disabled={saving}>
              {saving ? "Saving..." : "Save Config"}
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="panel">
            <h2>Current Speaking</h2>
            <p className="speaking-text">{currentSpeakingText || "Idle"}</p>
          </div>

          <div className="panel">
            <h2>Latest Comments</h2>
            <div className="comment-list">
              {comments.length === 0 ? <p className="empty-state">No comments yet.</p> : null}
              {comments.map((comment) => (
                <article key={`${comment.timestamp}-${comment.username}-${comment.comment}`} className="comment">
                  <div>
                    <strong>{comment.nickname || comment.username || "Unknown"}</strong>
                    <span>@{comment.username || "unknown"}</span>
                  </div>
                  <p>{comment.comment}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider">
      <span>
        {props.label}
        <strong>{props.value.toFixed(2)}</strong>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}


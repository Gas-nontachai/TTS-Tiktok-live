import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { cleanTtsText } from "../utils/helpers";
import { findBestVoiceForLanguage } from "../utils/speechVoices";
import { synthesizeTts } from "../services/api";

export function useSpeechQueue() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsError, setTtsError] = useState("");
  const speakingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const config = useAppStore((state) => state.config);
  const setCurrentSpeakingText = useAppStore((state) => state.setCurrentSpeakingText);
  const setError = useAppStore((state) => state.setError);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speakText = useCallback(
    (text: string, onDone?: () => void) => {
      const cleanText = cleanTtsText(text);

      if (config.tts.muted || !cleanText) {
        if (config.tts.muted) {
          const message = "TTS is muted. Turn off Mute TTS before testing.";
          setTtsError(message);
          setError(message);
        }
        onDone?.();
        return;
      }

      if (config.tts.engine === "local-thai") {
        speakingRef.current = true;
        setTtsError("");
        setError("");
        setCurrentSpeakingText(cleanText);

        void synthesizeTts(cleanText)
          .then((blob) => {
            if (audioUrlRef.current) {
              URL.revokeObjectURL(audioUrlRef.current);
            }

            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.volume = config.tts.volume;
            audioRef.current = audio;
            audioUrlRef.current = audioUrl;

            const done = () => {
              speakingRef.current = false;
              setCurrentSpeakingText("");
              audioRef.current = null;
              URL.revokeObjectURL(audioUrl);
              audioUrlRef.current = "";
              onDone?.();
            };

            audio.addEventListener("ended", done, { once: true });
            audio.addEventListener("error", done, { once: true });
            return audio.play();
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : "Local Thai TTS failed";
            setTtsError(message);
            setError(message);
            speakingRef.current = false;
            setCurrentSpeakingText("");
            onDone?.();
          });
        return;
      }

      if (!("speechSynthesis" in window)) {
        const message = "Browser TTS is not available in this browser.";
        setTtsError(message);
        setError(message);
        onDone?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = config.tts.lang;
      utterance.rate = config.tts.rate;
      utterance.pitch = config.tts.pitch;
      utterance.volume = config.tts.volume;
      utterance.voice = voices.find((voice) => voice.name === config.tts.voiceName) ?? findBestVoiceForLanguage(voices, config.tts.lang) ?? null;
      speakingRef.current = true;
      setTtsError("");
      setError("");
      setCurrentSpeakingText(cleanText);

      utterance.onend = () => {
        speakingRef.current = false;
        setCurrentSpeakingText("");
        onDone?.();
      };

      utterance.onerror = () => {
        const message = "Browser TTS could not play this test.";
        setTtsError(message);
        setError(message);
        speakingRef.current = false;
        setCurrentSpeakingText("");
        onDone?.();
      };

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    },
    [config.tts.engine, config.tts.lang, config.tts.muted, config.tts.pitch, config.tts.rate, config.tts.voiceName, config.tts.volume, setCurrentSpeakingText, setError, voices]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speakingRef.current = false;
    setCurrentSpeakingText("");
  }, [setCurrentSpeakingText]);

  const isSpeaking = useCallback(() => speakingRef.current, []);

  return {
    voices,
    speakText,
    testSpeak: speakText,
    stopSpeaking,
    ttsError,
    isSpeaking
  };
}

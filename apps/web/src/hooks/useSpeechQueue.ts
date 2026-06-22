import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { cleanTtsText } from "../utils/helpers";
import { synthesizeTts } from "../services/api";

export function useSpeechQueue() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speakingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const config = useAppStore((state) => state.config);
  const setCurrentSpeakingText = useAppStore((state) => state.setCurrentSpeakingText);

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
        onDone?.();
        return;
      }

      if (config.tts.engine === "local-thai") {
        speakingRef.current = true;
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
          .catch(() => {
            speakingRef.current = false;
            setCurrentSpeakingText("");
            onDone?.();
          });
        return;
      }

      if (!("speechSynthesis" in window)) {
        onDone?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = config.tts.lang;
      utterance.rate = config.tts.rate;
      utterance.pitch = config.tts.pitch;
      utterance.volume = config.tts.volume;
      utterance.voice = voices.find((voice) => voice.name === config.tts.voiceName) ?? null;
      speakingRef.current = true;
      setCurrentSpeakingText(cleanText);

      utterance.onend = () => {
        speakingRef.current = false;
        setCurrentSpeakingText("");
        onDone?.();
      };

      utterance.onerror = () => {
        speakingRef.current = false;
        setCurrentSpeakingText("");
        onDone?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [config.tts.engine, config.tts.lang, config.tts.muted, config.tts.pitch, config.tts.rate, config.tts.voiceName, config.tts.volume, setCurrentSpeakingText, voices]
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

  return {
    voices,
    speakText,
    testSpeak: speakText,
    stopSpeaking,
    isSpeaking: () => speakingRef.current
  };
}

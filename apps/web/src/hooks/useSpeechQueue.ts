import { useCallback, useRef, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { cleanTtsText } from "../utils/helpers";
import { synthesizeTts } from "../services/api";

export function useSpeechQueue() {
  const [ttsError, setTtsError] = useState("");
  const speakingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const config = useAppStore((state) => state.config);
  const setCurrentSpeakingText = useAppStore((state) => state.setCurrentSpeakingText);
  const setError = useAppStore((state) => state.setError);

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
          const message = error instanceof Error ? error.message : "AI Thai TTS failed";
          setTtsError(message);
          setError(message);
          speakingRef.current = false;
          setCurrentSpeakingText("");
          onDone?.();
        });
    },
    [config.tts.muted, config.tts.volume, setCurrentSpeakingText, setError]
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

    speakingRef.current = false;
    setCurrentSpeakingText("");
  }, [setCurrentSpeakingText]);

  const isSpeaking = useCallback(() => speakingRef.current, []);

  return {
    speakText,
    testSpeak: speakText,
    stopSpeaking,
    ttsError,
    isSpeaking
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveComment } from "../types";
import { useAppStore } from "../stores/appStore";

function renderTemplate(template: string, comment: LiveComment) {
  return template
    .replaceAll("{nickname}", comment.nickname)
    .replaceAll("{username}", comment.username)
    .replaceAll("{comment}", comment.comment);
}

export function useSpeechQueue() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speakingRef = useRef(false);
  const config = useAppStore((state) => state.config);
  const queue = useAppStore((state) => state.queue);
  const setQueue = useAppStore((state) => state.setQueue);
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
      if (!("speechSynthesis" in window)) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.tts.lang;
      utterance.rate = config.tts.rate;
      utterance.pitch = config.tts.pitch;
      utterance.volume = config.tts.volume;
      utterance.voice = voices.find((voice) => voice.name === config.tts.voiceName) ?? null;
      speakingRef.current = true;
      setCurrentSpeakingText(text);

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
    [config.tts.lang, config.tts.pitch, config.tts.rate, config.tts.voiceName, config.tts.volume, setCurrentSpeakingText, setQueue, voices]
  );

  useEffect(() => {
    if (!config.tts.enabled || speakingRef.current || queue.length === 0) {
      return;
    }

    speakText(renderTemplate(config.tts.template, queue[0]), () => {
      setQueue(useAppStore.getState().queue.slice(1));
    });
  }, [config.tts.enabled, config.tts.template, queue, speakText]);

  const testSpeak = useCallback(
    (text: string) => {
      if (!text.trim()) {
        return;
      }

      window.speechSynthesis.cancel();
      speakingRef.current = false;
      speakText(text.trim());
    },
    [speakText]
  );

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speakingRef.current = false;
    setCurrentSpeakingText("");
  }, [setCurrentSpeakingText]);

  return {
    voices,
    testSpeak,
    stopSpeaking
  };
}

export function voiceMatchesLanguage(voice: SpeechSynthesisVoice, lang: string) {
  const voiceLang = voice.lang.toLowerCase();
  const selectedLang = lang.toLowerCase();
  const selectedBaseLang = selectedLang.split("-")[0];

  if (voiceLang === selectedLang || voiceLang.startsWith(`${selectedBaseLang}-`)) {
    return true;
  }

  return selectedBaseLang === "th" && /thai|\u0e44\u0e17\u0e22/i.test(voice.name);
}

export function findBestVoiceForLanguage(voices: SpeechSynthesisVoice[], lang: string) {
  const matchedVoices = voices.filter((voice) => voiceMatchesLanguage(voice, lang));
  const selectedBaseLang = lang.toLowerCase().split("-")[0];

  if (selectedBaseLang === "th") {
    return (
      matchedVoices.find((voice) => /google.*(thai|\u0e44\u0e17\u0e22)/i.test(voice.name)) ??
      matchedVoices.find((voice) => /premwadee|pattara|thai|\u0e44\u0e17\u0e22/i.test(voice.name)) ??
      matchedVoices[0]
    );
  }

  return matchedVoices[0];
}

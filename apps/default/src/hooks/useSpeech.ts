import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

interface UseSpeechReturn {
  speak: (text: string, callback?: () => void) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
}

export const useSpeech = (options: UseSpeechOptions = {}): UseSpeechReturn => {
  const {
    rate = 0.9,
    pitch = 1,
    volume = 1,
    lang = 'en-US'
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      setVoices(availableVoices);

      // Try to find a good default voice
      const preferredVoice = availableVoices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('en') && !voice.name.includes('Microsoft')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('en')
      );

      if (preferredVoice && !selectedVoice) {
        setSelectedVoice(preferredVoice);
      }
    };

    // Load voices immediately
    loadVoices();

    // Also load when voices change (some browsers load them asynchronously)
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, [isSupported, selectedVoice]);

  const speak = useCallback((text: string, callback?: () => void) => {
    if (!synthRef.current || !isSupported) {
      if (callback) callback();
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = lang;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      if (callback) callback();
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [rate, pitch, volume, lang, selectedVoice, isSupported]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice
  };
};
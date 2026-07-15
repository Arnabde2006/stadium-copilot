import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceInput = (
  onTranscript: (text: string) => void,
  onInterimTranscript?: (text: string) => void
) => {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const isListeningRef = useRef(false);
  const accumulatedFinalText = useRef('');
  const sessionFinalTextRef = useRef('');

  // Keep callback refs fresh
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onInterimTranscriptRef.current = onInterimTranscript;
  }, [onInterimTranscript]);

  // Keep isListeningRef in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const initRecognition = useCallback(() => {
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let newFinalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalText += event.results[i][0].transcript;
        }
      }

      for (let i = 0; i < event.results.length; ++i) {
        if (!event.results[i].isFinal) {
          interimText += event.results[i][0].transcript;
        }
      }

      if (newFinalText) {
        sessionFinalTextRef.current = `${sessionFinalTextRef.current} ${newFinalText}`.trim();
        const totalFinal = `${accumulatedFinalText.current} ${sessionFinalTextRef.current}`.trim();
        onTranscriptRef.current(totalFinal);
      }

      const totalFull = `${accumulatedFinalText.current} ${sessionFinalTextRef.current} ${interimText}`.trim();
      if (onInterimTranscriptRef.current) {
        onInterimTranscriptRef.current(totalFull);
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // Append current session's final text to accumulated final text
      accumulatedFinalText.current = `${accumulatedFinalText.current} ${sessionFinalTextRef.current}`.trim();
      sessionFinalTextRef.current = ''; // Reset for next session

      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error('Failed to restart speech recognition:', err);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
  }, [SpeechRecognition]);

  useEffect(() => {
    initRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initRecognition]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not fully supported in this browser. Please type.');
      return;
    }
    accumulatedFinalText.current = '';
    sessionFinalTextRef.current = '';
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    isSupported: !!SpeechRecognition,
    toggleListening,
    startListening,
    stopListening
  };
};


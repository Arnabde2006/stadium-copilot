import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceInput = (onTranscript: (text: string) => void) => {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref fresh to avoid restarting listeners on handler changes
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const initRecognition = useCallback(() => {
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript.trim());
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // If we are still supposed to be listening (not manually stopped), restart!
      if (recognitionRef.current && isListening) {
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
  }, [SpeechRecognition, isListening]);

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
    toggleListening,
    startListening,
    stopListening
  };
};

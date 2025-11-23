import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isRecording, setIsRecording }) => {
  const [recognition, setRecognition] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Vendor prefix handling
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';
        setRecognition(recog);
      } else {
        setError("Voice not supported");
      }
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      setError(null);
    }
  }, [isRecording, recognition, setIsRecording]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript + " ");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      setError("Mic Error");
    };

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
    };
  }, [recognition, onTranscript, setIsRecording]);

  if (error) return <span className="text-xs text-red-500 font-medium">{error}</span>;
  if (!recognition) return null;

  return (
    <button
      onClick={toggleRecording}
      className={`
        flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
        ${isRecording 
          ? 'bg-red-500 text-white recording-pulse' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}
      `}
      title={isRecording ? "Stop Recording" : "Start Voice Answer"}
    >
      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
};

export default VoiceInput;
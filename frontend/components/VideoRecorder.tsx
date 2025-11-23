import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Video, Square, Play, RotateCcw, AlertCircle, Mic } from 'lucide-react';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  videoUrl?: string;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onRecordingComplete, videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  // Start camera stream
  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamReady(true);
        setError(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied or unavailable.");
    }
  }, []);

  // Initialize stream on mount if no existing video
  useEffect(() => {
    if (!videoUrl) {
      startStream();
    }
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [startStream, videoUrl]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    chunksRef.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      onRecordingComplete(blob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    onRecordingComplete(new Blob([])); // Clear parent state (handled by parent passing undefined videoUrl mostly)
    startStream();
  };

  if (error) {
    return (
      <div className="w-full aspect-video bg-ibm-grey-900 rounded-xl flex flex-col items-center justify-center text-ibm-grey-400 gap-2">
        <AlertCircle size={32} className="text-red-500" />
        <p>{error}</p>
        <button onClick={startStream} className="text-ibm-blue-400 hover:underline text-sm">Retry Camera</button>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg group">
        <video 
          src={videoUrl} 
          controls 
          className="w-full h-full object-cover" 
        />
        <button 
          onClick={handleRetake}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
        >
          <RotateCcw size={12} /> Retake Video
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-ibm-grey-900 rounded-xl overflow-hidden shadow-inner isolate">
      {/* Camera Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={`w-full h-full object-cover transition-opacity duration-500 ${isStreamReady ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Loading State */}
      {!isStreamReady && (
        <div className="absolute inset-0 flex items-center justify-center text-ibm-grey-500">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ibm-grey-600 mb-2"></div>
        </div>
      )}

      {/* Recording Overlay Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
        {isRecording ? (
          <>
             <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-mono font-medium">{formatTime(timer)}</span>
             </div>
             
             <button 
               onClick={stopRecording}
               className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all group"
             >
                <div className="w-6 h-6 bg-red-500 rounded-sm group-hover:rounded-md transition-all"></div>
             </button>
          </>
        ) : (
          <button 
            onClick={startRecording}
            disabled={!isStreamReady}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <div className="w-14 h-14 bg-red-600 rounded-full border-2 border-ibm-grey-900"></div>
          </button>
        )}
      </div>
      
      {!isRecording && (
         <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-2 text-white/90 text-xs">
             <Video size={12} />
             <span>Video Booth Ready</span>
         </div>
      )}
    </div>
  );
};

export default VideoRecorder;
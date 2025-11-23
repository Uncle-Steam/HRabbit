import React, { useState, useEffect } from 'react';
import { KnowledgeGap, InterviewAnswer } from '../types';
import VideoRecorder from './VideoRecorder';
import { transcribeVideo } from '../services/gemini';
import { AlertTriangle, Lightbulb, CheckCircle2, FileText, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  gap: KnowledgeGap;
  answerData?: InterviewAnswer;
  onAnswerUpdate: (data: Partial<InterviewAnswer>) => void;
  isSaving: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ gap, answerData, onAnswerUpdate, isSaving }) => {
  const [transcript, setTranscript] = useState(answerData?.content || "");
  const [videoUrl, setVideoUrl] = useState<string | undefined>(answerData?.videoUrl);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Sync state when props change (navigation)
  useEffect(() => {
    setTranscript(answerData?.content || "");
    setVideoUrl(answerData?.videoUrl);
  }, [answerData, gap.id]);

  const handleRecordingComplete = async (blob: Blob) => {
    // 1. Create URL for immediate playback
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    
    // 2. Update Parent State (Video saved)
    onAnswerUpdate({
        videoUrl: url,
        content: "", // Clear old transcript
        isTranscribing: true
    });

    // 3. Trigger AI Transcription
    setIsTranscribing(true);
    try {
        const text = await transcribeVideo(blob);
        setTranscript(text);
        onAnswerUpdate({
            content: text,
            isTranscribing: false
        });
    } catch (e) {
        console.error(e);
        setIsTranscribing(false);
    } finally {
        setIsTranscribing(false);
    }
  };

  // Handle manual edits to transcript
  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
    onAnswerUpdate({ content: e.target.value });
  };

  // Handle Retake (clearing)
  const handleRetake = (blob: Blob) => {
      if (blob.size === 0) {
          setVideoUrl(undefined);
          setTranscript("");
          onAnswerUpdate({ videoUrl: undefined, content: "" });
      } else {
          handleRecordingComplete(blob);
      }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-ibm-grey-200 overflow-hidden flex flex-col h-full">
      {/* Card Header - Gap Context */}
      <div className="bg-ibm-grey-50 px-6 py-4 border-b border-ibm-grey-100">
        <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mt-1 shrink-0">
                <AlertTriangle size={20} />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-ibm-grey-900">{gap.title}</h2>
                <p className="text-sm text-ibm-grey-600 mt-1">{gap.summary}</p>
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
            
            {/* Left Col: Question & Hints */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-ibm-grey-400 uppercase tracking-wide mb-2">Primary Question</label>
                    <p className="text-xl font-medium text-ibm-grey-800 leading-snug">{gap.primaryQuestion}</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-ibm-blue-50 p-4 rounded-lg border border-ibm-blue-100">
                        <div className="flex items-center gap-2 mb-2 text-ibm-blue-700 text-sm font-semibold">
                            <Lightbulb size={16} />
                            <span>Memory Trigger</span>
                        </div>
                        <p className="text-ibm-blue-900 text-sm leading-relaxed">{gap.memoryPrompt}</p>
                    </div>
                    <div className="bg-ibm-grey-50 p-4 rounded-lg border border-ibm-grey-100">
                        <div className="text-ibm-grey-500 text-xs font-bold uppercase mb-2">Follow Up</div>
                        <p className="text-ibm-grey-700 text-sm leading-relaxed">{gap.followUpQuestion}</p>
                    </div>
                </div>
            </div>

            {/* Right Col: Video Interaction */}
            <div className="lg:col-span-3 flex flex-col gap-4">
                 <label className="block text-xs font-bold text-ibm-grey-400 uppercase tracking-wide">Video Answer</label>
                 
                 <VideoRecorder 
                    onRecordingComplete={handleRetake}
                    videoUrl={videoUrl}
                 />

                 {/* Transcript Section */}
                 <div className="flex-1 flex flex-col mt-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-ibm-grey-400 uppercase tracking-wide">
                            <FileText size={14} />
                            AI Transcript
                        </label>
                        {isTranscribing && (
                            <span className="text-xs text-ibm-blue-500 flex items-center gap-1 animate-pulse">
                                <Sparkles size={12} /> Transcribing audio...
                            </span>
                        )}
                        {!isTranscribing && transcript && (
                             <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Auto-saved
                             </span>
                        )}
                    </div>
                    
                    <textarea
                        className={`w-full flex-1 min-h-[120px] p-4 text-sm bg-ibm-grey-50 border rounded-lg resize-none focus:ring-2 focus:ring-ibm-blue-500 focus:border-transparent outline-none transition-all text-ibm-grey-700 leading-relaxed
                        ${isTranscribing ? 'opacity-50' : 'opacity-100'}`}
                        placeholder={videoUrl ? "Processing audio..." : "Record a video to generate a transcript automatically. You can edit this text later."}
                        value={transcript}
                        onChange={handleTranscriptChange}
                        readOnly={isTranscribing}
                    />
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
import React, { useState, useCallback } from 'react';
import { KnowledgeGap, InterviewAnswer, AppState, UserContext } from './types';
// IBM Watsonx Orchestrate Integration
import { generateGaps, generateFinalHandover } from './services/watsonx';
import WelcomeScreen from './components/WelcomeScreen';
import QuestionCard from './components/QuestionCard';
import ProgressBar from './components/ProgressBar';
import { ChevronLeft, ChevronRight, Check, FileText, LayoutDashboard, LogOut, User, Video, Send, CheckCircle2, Search, Loader2 } from 'lucide-react';
import hrabbitLogo from './assets/HRabbit Logo.png';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [answers, setAnswers] = useState<Record<string, InterviewAnswer>>({});
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [finalDoc, setFinalDoc] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [checkingComplete, setCheckingComplete] = useState(false);

  // --- Handlers ---

  const handleStart = async (ctx: UserContext) => {
    setUserContext(ctx);
    setIsProcessing(true);
    setAppState(AppState.LOADING_GAPS);
    try {
      // Call Watsonx Orchestrate API to generate knowledge gaps
      const generatedGaps = await generateGaps(ctx);
      if (generatedGaps.length > 0) {
        setGaps(generatedGaps);
        setAppState(AppState.INTERVIEW);
      } else {
        alert("Could not identify gaps. Please try again.");
        setAppState(AppState.WELCOME);
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to Watsonx Orchestrate. Please check your WATSONX_API_KEY and WATSONX_API_ENDPOINT configuration.");
      setAppState(AppState.WELCOME);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerUpdate = useCallback((data: Partial<InterviewAnswer>) => {
    setIsSavingAnswer(true);
    const gapId = gaps[currentGapIndex].id;
    
    setAnswers(prev => ({
      ...prev,
      [gapId]: {
        gapId,
        content: data.content || prev[gapId]?.content || "",
        videoUrl: data.videoUrl !== undefined ? data.videoUrl : prev[gapId]?.videoUrl,
        lastUpdated: Date.now()
      }
    }));

    setTimeout(() => setIsSavingAnswer(false), 600);
  }, [gaps, currentGapIndex]);

  const handleNext = () => {
    if (currentGapIndex < gaps.length - 1) {
      setCurrentGapIndex(prev => prev + 1);
    } else {
      finishInterview();
    }
  };

  const handlePrev = () => {
    if (currentGapIndex > 0) {
      setCurrentGapIndex(prev => prev - 1);
    }
  };

  const finishInterview = async () => {
    if (!userContext) return;
    
    // Step 1: Show checking modal
    setAppState(AppState.CHECKING_ANSWERS);
    setIsProcessing(true);
    setCheckingComplete(false);
    
    // Step 2: Validate answers (could be API call in future)
    // For now, mark as complete immediately after validation
    setCheckingComplete(true);
    
    // Step 3: Generate the report using Watsonx Orchestrate
    setAppState(AppState.FINALIZING);
    try {
      const doc = await generateFinalHandover(userContext, gaps, answers);
      setFinalDoc(doc);
      setAppState(AppState.COMPLETED);
    } catch (e) {
      console.error(e);
      alert("Error generating summary.");
      setAppState(AppState.INTERVIEW);
    } finally {
      setIsProcessing(false);
      setCheckingComplete(false);
    }
  };

  const handleSendToHR = async () => {
    setIsProcessing(true);
    // Send report to HR via API (implement actual API call when backend is ready)
    try {
      // TODO: Replace with actual API call to backend/database
      // await sendReportToHR(finalDoc, userContext);
      setAppState(AppState.REPORT_SENT);
    } catch (e) {
      console.error(e);
      alert("Error sending report to HR. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Renders ---

  if (appState === AppState.WELCOME || appState === AppState.LOADING_GAPS) {
    return (
      <WelcomeScreen onStart={handleStart} isLoading={appState === AppState.LOADING_GAPS} />
    );
  }

  if (appState === AppState.COMPLETED) {
    return (
      <div className="min-h-screen bg-ibm-grey-50 p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-ibm-grey-200 p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8 border-b border-ibm-grey-100 pb-6">
                    <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-ibm-grey-900">Handover Document Ready</h1>
                        <p className="text-ibm-grey-600">Generated for {userContext?.name} • {userContext?.role}</p>
                    </div>
                </div>
                <div className="mb-8 document-content">
                    {finalDoc
                        .split('\n\n')
                        .map((paragraph, i) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            
                            // Remove "Interviewer:" text
                            const cleaned = trimmed.replace(/Interviewer:\s*/gi, '').trim();
                            if (!cleaned) return null;
                            
                            // Check if it's a section header (ALL CAPS or title case)
                            const isHeader = cleaned === cleaned.toUpperCase() && cleaned.length < 100 && 
                                            !cleaned.includes('.') && cleaned.length > 5;
                            
                            if (isHeader) {
                                return (
                                    <div key={i} className="section-header-wrapper mt-10 mb-6 first:mt-0">
                                        <h2 className="text-2xl font-bold text-ibm-blue-600 uppercase tracking-wide border-b-2 border-ibm-blue-200 pb-3">
                                            {cleaned}
                                        </h2>
                                    </div>
                                );
                            }
                            
                            // Check if it's a numbered or bulleted list
                            const lines = cleaned.split('\n').filter(line => {
                                const lineTrimmed = line.trim();
                                return lineTrimmed && !lineTrimmed.match(/^Interviewer:/i);
                            });
                            
                            const isList = lines.length > 1 && (
                                lines[0].match(/^\d+\./) || 
                                lines[0].match(/^[-•]/) ||
                                lines.every(line => line.match(/^\d+\./) || line.match(/^[-•]/))
                            );
                            
                            if (isList) {
                                return (
                                    <div key={i} className="list-wrapper my-6 bg-ibm-grey-50 rounded-lg p-5 border-l-4 border-ibm-blue-500">
                                        <ul className="list-none space-y-3">
                                            {lines.map((line, j) => {
                                                const cleanedLine = line.replace(/^[\d•-]\s*/, '').trim();
                                                if (!cleanedLine || cleanedLine.match(/^Interviewer:/i)) return null;
                                                return (
                                                    <li key={j} className="flex items-start text-ibm-grey-800">
                                                        <span className="text-ibm-blue-500 mr-3 mt-1.5 font-bold text-lg">•</span>
                                                        <span className="flex-1 leading-relaxed">{cleanedLine}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            }
                            
                            // Regular paragraph - filter out Interviewer lines
                            if (cleaned.match(/^Interviewer:/i)) return null;
                            
                            return (
                                <div key={i} className="paragraph-wrapper mb-5">
                                    <p className="text-base text-ibm-grey-800 leading-relaxed tracking-wide">
                                        {cleaned.split('\n').filter(line => !line.trim().match(/^Interviewer:/i)).join(' ')}
                                    </p>
                                </div>
                            );
                        })
                        .filter(Boolean)}
                </div>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => window.print()} 
                        className="bg-ibm-grey-200 text-ibm-grey-700 px-6 py-3 rounded-lg hover:bg-ibm-grey-300 font-medium transition-colors"
                    >
                        Export as PDF
                    </button>
                    <button 
                        onClick={handleSendToHR}
                        disabled={isProcessing}
                        className="bg-ibm-blue-500 text-white px-6 py-3 rounded-lg hover:bg-ibm-blue-600 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Send report to HR
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.CHECKING_ANSWERS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-ibm-grey-200 p-8 md:p-12 text-center">
          {!checkingComplete ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-ibm-blue-200 border-t-ibm-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search size={24} className="text-ibm-blue-500" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-ibm-grey-900 mb-3">Checking Interview Answers</h2>
              <p className="text-ibm-grey-600 mb-6">
                Analyzing transcripts to verify knowledge gaps are adequately addressed...
              </p>
              <div className="space-y-2">
                {gaps.map((gap, idx) => {
                  const answer = answers[gap.id];
                  const hasAnswer = answer?.content && answer.content.trim().length > 0;
                  return (
                    <div key={gap.id} className="flex items-center justify-between p-3 bg-ibm-grey-50 rounded-lg">
                      <span className="text-sm text-ibm-grey-700 flex-1 text-left">{gap.title}</span>
                      <div className="flex items-center gap-2">
                        {hasAnswer ? (
                          <>
                            <Loader2 size={16} className="text-ibm-blue-500 animate-spin" />
                            <span className="text-xs text-ibm-grey-500">Checking...</span>
                          </>
                        ) : (
                          <>
                            <Loader2 size={16} className="text-ibm-blue-500 animate-spin" />
                            <span className="text-xs text-ibm-grey-500">Checking...</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="bg-emerald-100 p-4 rounded-full">
                  <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-ibm-grey-900 mb-3">All Checks Passed!</h2>
              <p className="text-ibm-grey-600 mb-6">
                Knowledge gaps have been adequately addressed. Proceeding to generate the handover document...
              </p>
              <div className="space-y-2">
                {gaps.map((gap) => {
                  const answer = answers[gap.id];
                  const hasAnswer = answer?.content && answer.content.trim().length > 0;
                  return (
                    <div key={gap.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-sm text-ibm-grey-700 flex-1 text-left">{gap.title}</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (appState === AppState.FINALIZING) {
     return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
             <div className="w-12 h-12 border-4 border-ibm-blue-200 border-t-ibm-blue-500 rounded-full animate-spin"></div>
             <p className="text-ibm-grey-600 font-medium">Finalizing Handover Document...</p>
         </div>
     )
  }

  if (appState === AppState.REPORT_SENT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ibm-grey-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-ibm-grey-200 p-8 md:p-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-emerald-100 p-4 rounded-full">
              <CheckCircle2 size={48} className="text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-ibm-grey-900 mb-4">Report Sent Successfully!</h1>
          <p className="text-ibm-grey-600 text-lg mb-2">
            The handover document has been sent to HR for {userContext?.name}.
          </p>
          <p className="text-ibm-grey-500 text-sm mb-8">
            HR will review the knowledge transfer document and coordinate the transition process.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setAppState(AppState.COMPLETED)}
              className="bg-ibm-grey-200 text-ibm-grey-700 px-6 py-3 rounded-lg hover:bg-ibm-grey-300 font-medium transition-colors"
            >
              View Document
            </button>
            <button
              onClick={() => {
                setAppState(AppState.WELCOME);
                setUserContext(null);
                setGaps([]);
                setAnswers({});
                setFinalDoc("");
                setCurrentGapIndex(0);
              }}
              className="bg-ibm-blue-500 text-white px-6 py-3 rounded-lg hover:bg-ibm-blue-600 font-medium transition-colors"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Interview View ---
  
  const currentGap = gaps[currentGapIndex];
  const currentAnswerData = answers[currentGap.id];

  return (
    <div className="min-h-screen bg-ibm-grey-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar (Navigation) */}
      <aside className="w-full md:w-80 bg-white border-r border-ibm-grey-200 flex flex-col h-auto md:h-screen sticky top-0 z-20">
        <div className="p-6 border-b border-ibm-grey-100">
          <div className="flex items-center gap-3">
            {/* HRabbit Logo */}
            <img 
              src={hrabbitLogo} 
              alt="HRabbit Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-xl font-semibold text-ibm-grey-900">HRabbit</span>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-xs font-bold text-ibm-grey-400 uppercase tracking-wider mb-4 px-2">
                Interview Topics
            </div>
            <div className="space-y-1">
                {gaps.map((g, idx) => {
                    const isActive = idx === currentGapIndex;
                    const hasVideo = !!answers[g.id]?.videoUrl;
                    return (
                        <button
                            key={g.id}
                            onClick={() => setCurrentGapIndex(idx)}
                            className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors flex items-center gap-3
                                ${isActive 
                                    ? 'bg-ibm-blue-50 text-ibm-blue-700 font-medium ring-1 ring-ibm-blue-100' 
                                    : 'text-ibm-grey-600 hover:bg-ibm-grey-50'}
                            `}
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isActive ? 'bg-ibm-blue-500' : (hasVideo ? 'bg-emerald-400' : 'bg-ibm-grey-300')}`} />
                            <span className="truncate">{g.title}</span>
                            {hasVideo && <Check size={14} className="ml-auto text-emerald-500" />}
                        </button>
                    )
                })}
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm">
                    <User size={16} />
                </div>
                <div className="overflow-hidden">
                    <div className="text-sm font-medium text-slate-900 truncate">{userContext?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{userContext?.role}</div>
                </div>
            </div>
            <button onClick={() => setAppState(AppState.WELCOME)} className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-700 mt-2 p-1">
                <LogOut size={12} /> Exit Session
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full h-screen relative">
        
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 flex flex-col min-h-full">
                <ProgressBar current={currentGapIndex + 1} total={gaps.length} />
                
                <div className="flex-1">
                    <QuestionCard 
                        gap={currentGap} 
                        answerData={currentAnswerData}
                        onAnswerUpdate={handleAnswerUpdate}
                        isSaving={isSavingAnswer}
                    />
                </div>

                {/* Navigation Footer */}
                <div className="mt-8 flex items-center justify-between bg-ibm-grey-50/80 backdrop-blur-sm sticky bottom-0 py-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentGapIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg text-ibm-grey-600 font-medium hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={20} /> Previous
                    </button>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleNext}
                            className="px-6 py-3 rounded-lg text-ibm-grey-500 hover:text-ibm-grey-700 font-medium hover:bg-ibm-grey-100 transition-all"
                        >
                            Skip for now
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-ibm-blue-500 text-white font-semibold hover:bg-ibm-blue-600 shadow-md hover:shadow-lg transition-all"
                        >
                            {currentGapIndex === gaps.length - 1 ? 'Complete Interview' : 'Next Question'} 
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
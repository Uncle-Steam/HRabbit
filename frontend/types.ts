export interface KnowledgeGap {
  id: string;
  title: string;
  summary: string;
  primaryQuestion: string;
  memoryPrompt: string;
  followUpQuestion: string;
}

export interface InterviewAnswer {
  gapId: string;
  content: string; // This will hold the transcript
  videoUrl?: string; // Blob URL for playback
  isTranscribing?: boolean;
  lastUpdated: number;
}

export enum AppState {
  WELCOME = 'WELCOME',
  LOADING_GAPS = 'LOADING_GAPS',
  INTERVIEW = 'INTERVIEW',
  CHECKING_ANSWERS = 'CHECKING_ANSWERS',
  FINALIZING = 'FINALIZING',
  COMPLETED = 'COMPLETED',
  REPORT_SENT = 'REPORT_SENT'
}

export interface UserContext {
  name: string;
  role: string;
  department: string;
}
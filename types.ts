
export interface Thought {
  id: string;
  content: string;
  timestamp: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export enum AppState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  SAVING = 'SAVING',
  CONFIRMED = 'CONFIRMED',
  STRESSED = 'STRESSED',
  GUIDING = 'GUIDING'
}

export interface PresenceExercise {
  title: string;
  instructions: string;
  duration: number; // seconds
  visualType: 'breathing' | 'grounding' | 'focus';
}

export interface StressIndicator {
  type: string;
  severity: number; // 0-100
  description: string;
}

export interface UserStats {
  thoughtsOffloaded: number;
  presenceTime: number; // in minutes
  anxietyEvents: number;
  averageStressScore: number;
}

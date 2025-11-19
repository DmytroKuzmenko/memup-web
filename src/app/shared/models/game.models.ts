// Game API TypeScript Models - aligned strictly with API contract

export interface SectionVm {
  id: string;
  name: string;
  imageUrl?: string | null;
  orderIndex: number;
  isCompleted: boolean;
  score: number;
  maxScore: number;
  levelsCompleted: number;
  totalLevels: number;
}

export type LevelStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Locked';

export interface LevelVm {
  id: string;
  name: string;
  imageUrl?: string | null;
  headerText?: string | null;
  orderIndex: number;
  isCompleted: boolean;
  score: number;
  maxScore: number;
  status: LevelStatus;
}

export interface LevelIntroVm {
  levelId: string;
  levelName: string;
  headerText?: string | null;
  animationImageUrl?: string | null;
  orderIndex: number;
  tasksCount: number;
  maxScore: number;
  status: LevelStatus;
  replayAvailableAt?: string | null; // ISO
}

export interface TaskOptionVm {
  id: string;
  label: string;
  imageUrl?: string | null;
  isCorrect?: boolean | null;
}

export type SubmitResult = 'correct' | 'incorrect' | 'timeout';

export interface TaskVm {
  id: string;
  type: string;
  headerText?: string | null;
  imageUrl?: string | null;
  taskImageSource?: string | null;
  resultImagePath?: string | null;
  resultImageSource?: string | null;
  options: TaskOptionVm[];
  orderIndex: number;
  timeLimitSecEffective?: number | null;
  attemptToken: string;
}

export interface TaskSubmitSelectionDto {
  selectedOptionId: string;
  text?: string | null;
}

export interface TaskSubmitRequest {
  selectedOptions: TaskSubmitSelectionDto[];
  attemptToken: string;
}

export interface LevelProgressVm {
  completedTasks: number;
  totalTasks: number;
  score: number;
  maxScore: number;
}

export interface NextTaskResponse {
  levelId: string;
  task?: TaskVm;
  status: 'ok' | 'completed' | 'locked';
  levelProgress: LevelProgressVm;
}

export interface SubmitResponse {
  result: SubmitResult;
  attemptNumber: number;
  attemptsLeft: number;
  pointsEarned: number;
  taskCompleted: boolean;
  levelCompleted: boolean;
  levelSummary: { earnedScore: number; maxScore: number } | null;
  nextAction: 'nextTask' | 'levelSummary';
  explanationText?: string; // present only when result === 'correct'
  correctOptionIds?: string[];
}

export interface LeaderboardEntryVm {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  updatedAt: string;
}

export interface ReplayResponse {
  retryAfter?: string; // ISO string for 429 responses
}

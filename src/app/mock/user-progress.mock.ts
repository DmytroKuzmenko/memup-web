export interface LevelProgress {
    levelId: number;
    completed: boolean;
    score: number;
  }
  
  export interface UserProgress {
    username: string;
    levels: LevelProgress[];
    achievements: string[]; // Массив ключей бейджей
  }
  
  export function getDefaultProgress(): UserProgress {
    return {
      username: 'Гість',
      levels: [],
      achievements: []
    };
  }
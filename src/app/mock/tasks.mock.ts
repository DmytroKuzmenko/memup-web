export interface Task {
    id: number;
    memeId: number;
    questionText: string;
    answerOptions: string[];
    correctAnswerIndex: number;
    basePoints: number;
    explanationText: string;
  }
  
  export const TASKS: Task[] = [
    {
      id: 1001,
      memeId: 100,
      questionText: 'Яке головне свято зображене на фото?',
      answerOptions: ['Октоберфест', 'Різдво', 'День єдності', 'Карнавал'],
      correctAnswerIndex: 0,
      basePoints: 10,
      explanationText: 'На фото Октоберфест — головне пивне свято Баварії.'
    },
    {
      id: 1002,
      memeId: 101,
      questionText: 'Які гори на фото?',
      answerOptions: ['Альпи', 'Карпати', 'Татри', 'Урал'],
      correctAnswerIndex: 0,
      basePoints: 10,
      explanationText: 'Це Альпи — найвідоміші гори Баварії.'
    },
    {
      id: 1101,
      memeId: 110,
      questionText: 'Що символізує Берлінська стіна?',
      answerOptions: [
        'Розділення Німеччини',
        'Оздоблення міста',
        'Початок ЄС',
        'Футбольний матч'
      ],
      correctAnswerIndex: 0,
      basePoints: 10,
      explanationText: 'Берлінська стіна символізувала розділення Східної і Західної Німеччини.'
    }
  ];
  
export interface MemeMedia {
    url: string;
    type: 'image' | 'video'; // пока поддерживаем два типа
  }
  
  export interface Meme {
    id: number;
    levelId: number;
    title: string;
    media: MemeMedia[];
    displayOrder: number;
  }
  
  export const MEMES: Meme[] = [
    {
      id: 100,
      levelId: 10, // Баварія
      title: 'Октоберфест',
      media: [
        { url: 'assets/memes/oktoberfest-1.jpg', type: 'image' },
        { url: 'assets/memes/oktoberfest-2.jpg', type: 'image' },
        { url: 'assets/memes/oktoberfest-vid.mp4', type: 'video' }
      ],
      displayOrder: 1
    },
    {
      id: 101,
      levelId: 10,
      title: 'Баварські Альпи',
      media: [
        { url: 'assets/memes/alps.jpg', type: 'image' }
      ],
      displayOrder: 2
    },
    {
      id: 110,
      levelId: 11, // Берлін
      title: 'Берлінська стіна',
      media: [
        { url: 'assets/memes/berlin-wall.jpg', type: 'image' }
      ],
      displayOrder: 1
    }
  ];
  
export interface Level {
    id: number;
    sectionId: number;
    name: string;
    backgroundUrl: string;
    minPercentToPass: number;
    displayOrder: number;
  }
  
  export const LEVELS: Level[] = [
    {
      id: 10,
      sectionId: 1,
      name: 'Баварія',
      backgroundUrl: 'assets/levels/bavaria.png',
      minPercentToPass: 70,
      displayOrder: 1
    },
    {
      id: 11,
      sectionId: 1,
      name: 'Берлін',
      backgroundUrl: 'assets/levels/berlin.png',
      minPercentToPass: 70,
      displayOrder: 2
    },
    {
      id: 20,
      sectionId: 2,
      name: 'Політика 2000-х',
      backgroundUrl: 'assets/levels/politics-2000.jpg',
      minPercentToPass: 70,
      displayOrder: 1
    }
  ];
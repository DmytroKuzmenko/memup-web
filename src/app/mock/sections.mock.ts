export interface Section {
    id: number;
    name: string;
    description: string;
    iconUrl: string;
    displayOrder: number;
  }
  
  export const SECTIONS: Section[] = [
    {
      id: 1,
      name: '16 федеральних земель',
      description: 'Дізнайся про кожну землю Німеччини через меми',
      iconUrl: 'assets/sections/lands.png',
      displayOrder: 1,
    },
    {
      id: 2,
      name: 'Політика за роками',
      description: 'Вивчай політику Німеччини через меми',
      iconUrl: 'assets/sections/politics.png',
      displayOrder: 2,
    }
  ];
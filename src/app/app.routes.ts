import { Routes } from '@angular/router';
import { SectionsListComponent } from './features/sections/sections-list.component';
import { LevelsListComponent } from './features/levels/levels-list.component';
import { MemesCarouselComponent } from './features/memes/memes-carousel.component';

export const routes: Routes = [
  { path: '', component: SectionsListComponent },
  { path: 'sections', component: SectionsListComponent },
  { path: 'sections/:id', component: LevelsListComponent },
  { path: 'levels/:id', component: MemesCarouselComponent },
  // ...
];
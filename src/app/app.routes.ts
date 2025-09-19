import { Routes } from '@angular/router';
import { SectionsListComponent } from './features/sections/sections-list.component';
import { LevelsListComponent } from './features/levels/levels-list.component';
import { MemesCarouselComponent } from './features/memes/memes-carousel.component';
import { AdminLoginComponent } from './admin/login/login.component';

import { AdminSectionsComponent } from './admin/sections/sections.component';

import { adminGuard } from './admin/admin.guard';
import { SectionEditComponent } from './admin/sections/section-edit.component';

import { AdminLevelsComponent } from './admin/levels/levels.component';
import { AdminTasksComponent } from './admin/tasks/tasks.component';

export const routes: Routes = [
  { path: '', component: SectionsListComponent },
  { path: 'sections', component: SectionsListComponent },
  { path: 'sections/:id', component: LevelsListComponent },
  { path: 'levels/:id', component: MemesCarouselComponent },
  {
    path: 'admin',
    children: [
      { path: 'login', component: AdminLoginComponent },

      // --- Sections остаётся как есть ---
      { path: 'sections', component: AdminSectionsComponent, canActivate: [adminGuard] },
      { path: 'sections/new', component: SectionEditComponent, canActivate: [adminGuard] },
      { path: 'sections/:id', component: SectionEditComponent, canActivate: [adminGuard] },

      // --- NEW: Memes admin ---
      // { path: 'memes', component: AdminMemesComponent, canActivate: [adminGuard] },
      // { path: 'memes/new', component: MemeEditComponent, canActivate: [adminGuard] },
      // { path: 'memes/:id', component: MemeEditComponent, canActivate: [adminGuard] },

      // --- TEMP: убрать уровни/задания, вернём позже ---
      // { path: 'levels', component: AdminLevelsComponent, canActivate: [adminGuard] },
      // { path: 'tasks', component: AdminTasksComponent, canActivate: [adminGuard] },

      { path: '', redirectTo: 'sections', pathMatch: 'full' },
    ],
  },
];

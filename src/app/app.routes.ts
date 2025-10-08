import { Routes } from '@angular/router';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { SectionsListComponent } from './features/sections/sections-list.component';
import { LevelsListComponent } from './features/levels/levels-list.component';
import { MemesCarouselComponent } from './features/memes/memes-carousel.component';
import { AdminLoginComponent } from './admin/login/login.component';

import { AdminSectionsComponent } from './admin/sections/sections.component';

import { adminGuard } from './admin/admin.guard';
import { SectionEditComponent } from './admin/sections/section-edit.component';

import { LevelEditComponent } from './admin/levels/level-edit.component';
import { TaskEditComponent } from './admin/tasks/task-edit.component';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'welcome', component: WelcomeComponent },
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

      { path: 'levels/new', component: LevelEditComponent, canActivate: [adminGuard] },
      { path: 'levels/:id', component: LevelEditComponent, canActivate: [adminGuard] },

      { path: 'tasks/new', component: TaskEditComponent, canActivate: [adminGuard] },
      { path: 'tasks/:id', component: TaskEditComponent, canActivate: [adminGuard] },

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

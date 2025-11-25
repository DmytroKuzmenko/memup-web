import { Routes } from '@angular/router';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { SectionsListComponent } from './features/sections/sections-list.component';
import { LevelsListComponent } from './features/levels/levels-list.component';
import { AdminLoginComponent } from './admin/login/login.component';

import { AdminSectionsComponent } from './admin/sections/sections.component';

import { adminGuard } from './admin/admin.guard';
import { SectionEditComponent } from './admin/sections/section-edit.component';

import { LevelEditComponent } from './admin/levels/level-edit.component';
import { TaskEditComponent } from './admin/tasks/task-edit.component';

// Game components
import { TaskViewComponent } from './features/task/task-view.component';
import { LevelSummaryComponent } from './features/level-summary/level-summary.component';
import { LeaderboardComponent } from './features/leaderboard/leaderboard.component';
import { SurveyPlayerComponent } from './features/surveys/survey-player.component';
import { SurveyAdminListComponent } from './admin/surveys/survey-admin-list.component';
import { SurveyAdminEditorComponent } from './admin/surveys/survey-admin-editor.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'sections', component: SectionsListComponent },
  { path: 'sections/:id', component: LevelsListComponent },

  // Game routes
  { path: 'levels/:id/play', component: TaskViewComponent },
  { path: 'levels/:id/summary', component: LevelSummaryComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: 'surveys/:surveyId', component: SurveyPlayerComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    children: [
      { path: 'login', component: AdminLoginComponent },

      // --- Sections remains as is ---
      { path: 'sections', component: AdminSectionsComponent, canActivate: [adminGuard] },
      { path: 'sections/new', component: SectionEditComponent, canActivate: [adminGuard] },
      { path: 'sections/:id', component: SectionEditComponent, canActivate: [adminGuard] },

      { path: 'levels/new', component: LevelEditComponent, canActivate: [adminGuard] },
      { path: 'levels/:id', component: LevelEditComponent, canActivate: [adminGuard] },

      { path: 'tasks/new', component: TaskEditComponent, canActivate: [adminGuard] },
      { path: 'tasks/:id', component: TaskEditComponent, canActivate: [adminGuard] },

      { path: 'surveys', component: SurveyAdminListComponent, canActivate: [adminGuard] },
      { path: 'surveys/:surveyId/edit', component: SurveyAdminEditorComponent, canActivate: [adminGuard] },

      // --- NEW: Memes admin ---
      // { path: 'memes', component: AdminMemesComponent, canActivate: [adminGuard] },
      // { path: 'memes/new', component: MemeEditComponent, canActivate: [adminGuard] },
      // { path: 'memes/:id', component: MemeEditComponent, canActivate: [adminGuard] },

      // --- TEMP: remove levels/tasks, will restore later ---
      // { path: 'levels', component: AdminLevelsComponent, canActivate: [adminGuard] },
      // { path: 'tasks', component: AdminTasksComponent, canActivate: [adminGuard] },

      { path: '', redirectTo: 'sections', pathMatch: 'full' },
    ],
  },
];

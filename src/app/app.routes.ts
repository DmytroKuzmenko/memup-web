import { Routes } from '@angular/router';

import { FeedComponent } from './components/feed/feed.component';
import { MemeDetailComponent } from './pages/meme-detail/meme-detail.component';

export const routes: Routes = [
  { path: '', component: FeedComponent },
  { path: 'meme', component: MemeDetailComponent }
];
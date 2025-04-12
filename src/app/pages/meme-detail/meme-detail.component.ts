import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-meme-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meme-detail.component.html',
  styleUrls: ['./meme-detail.component.css']
})
export class MemeDetailComponent {
  meme = {
    text: 'Ich liebe Montag...',
    translation: 'Я люблю понеділок...',
    example: 'Zum Beispiel: Ich liebe Montag, weil ich produktiv bin.',
    note: 'Цей мем іронічний — більшість людей не люблять понеділки.'
  };
}
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Language } from '../services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button
        (click)="toggleDropdown()"
        class="flex min-w-[100px] items-center gap-1 rounded-lg border border-white/30 bg-white/40 px-2 py-1 text-xs font-medium text-gray-800 shadow-xl backdrop-blur-sm transition-all duration-200 hover:bg-white/50 sm:min-w-[120px] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
      >
        <span class="text-sm sm:text-lg">{{ currentLanguage().flag }}</span>
        <span>{{ currentLanguage().nativeName }}</span>
        <svg
          class="h-4 w-4 transition-transform duration-200"
          [class.rotate-180]="isDropdownOpen"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div
        *ngIf="isDropdownOpen"
        class="absolute top-full right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black/10 sm:w-48"
      >
        <div class="py-1">
          <button
            *ngFor="let language of languages"
            (click)="selectLanguage(language)"
            class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100"
            [class.bg-purple-50]="language.code === currentLanguage().code"
            [class.text-purple-700]="language.code === currentLanguage().code"
          >
            <span class="text-sm sm:text-lg">{{ language.flag }}</span>
            <div class="flex flex-col">
              <span class="font-medium">{{ language.nativeName }}</span>
              <span class="text-xs text-gray-500">{{ language.name }}</span>
            </div>
            <svg
              *ngIf="language.code === currentLanguage().code"
              class="ml-auto h-4 w-4 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LanguageSelectorComponent {
  private readonly languageService = inject(LanguageService);

  isDropdownOpen = false;
  languages = this.languageService.languages;
  currentLanguage = this.languageService.currentLanguage;

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  selectLanguage(language: Language): void {
    this.languageService.setLanguage(language.code);
    this.closeDropdown();
  }
}

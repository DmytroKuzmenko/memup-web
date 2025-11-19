import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import {
  TaskVm,
  SubmitResponse,
  LevelIntroVm,
  TaskOptionVm,
  TaskSubmitSelectionDto,
} from '../../shared/models/game.models';
import { NotificationService } from '../../shared/services/notification.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface AnagramPiece {
  id: string;
  text: string;
}

interface AnagramState {
  available: AnagramPiece[];
  result: AnagramPiece[];
  answer: string;
}

interface GapFillSegmentText {
  type: 'text';
  value: string;
}

interface GapFillSegmentBlank {
  type: 'blank';
  index: number;
}

type GapFillSegment = GapFillSegmentText | GapFillSegmentBlank;

interface MatchingPair {
  leftId: string;
  rightId: string;
  leftText: string;
  rightText: string;
}

interface MatchingOption {
  id: string;
  text: string;
}

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss'],
})
export class TaskViewComponent implements OnInit, OnDestroy {
  task: TaskVm | null = null;
  levelId: string = '';
  levelIntro: LevelIntroVm | null = null;
  // Support multiple selected option ids
  selectedOptionIds: Set<string> = new Set<string>();
  correctOptionIds: Set<string> = new Set<string>();
  anagramStates: Record<string, AnagramState> = {};
  gapFillSelections: Record<number, string> = {};
  gapFillBlankOrder: number[] = [];
  gapFillAvailableChips: string[] = [];
  matchingPairs: MatchingPair[] = [];
  matchingLeftOptions: MatchingOption[] = [];
  matchingRightOptions: MatchingOption[] = [];
  matchedLeftIds: Set<string> = new Set();
  matchedRightIds: Set<string> = new Set();
  selectedMatchingLeftId: string | null = null;
  selectedMatchingRightId: string | null = null;
  incorrectFeedback = false;
  incorrectMessage: string | null = null;
  timeRemaining: number = 0;
  timerInterval: any = null;
  submitting = false;
  showingExplanation = false;
  explanationText: string = '';
  loading = false;
  error: string | null = null;
  showIntro = false;
  introLoading = false;
  introError: string | null = null;
  animationPlaying = false;
  showAnimationImage = false;

  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  private levelCompletionState: { earnedScore?: number; maxScore?: number } | null = null;
  private anagramPieceCounter = 0;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.levelId = params['id'];
      if (this.levelId) {
        this.prepareForNewLevel();
        this.loadLevelIntro();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadCurrentTask(): void {
    this.resetInteractionState();
    this.levelCompletionState = null;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.loading = true;
    this.error = null;

    this.gameService.getNextTask(this.levelId).subscribe({
      next: (response) => {
          if (response.task) {
            this.task = response.task;
            this.initializeAnagramState();
            this.initializeGapFillState();
            this.initializeMatchingState();
            this.startTimer();
            this.loading = false;
          } else {
          // No more tasks, navigate to level summary
          const navigationExtras = response.levelProgress
            ? {
                state: {
                  earnedScore: response.levelProgress.score,
                  maxScore: response.levelProgress.maxScore,
                },
              }
            : undefined;

          this.router.navigate(['/levels', this.levelId, 'summary'], navigationExtras);
        }
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.error = 'Failed to load task';
        this.loading = false;

        if (error.status === 403) {
          this.notification.showError('This task is locked.');
        }
      },
    });
  }

  loadLevelIntro(): void {
    this.introLoading = true;
    this.introError = null;
    this.showIntro = true;
    this.levelIntro = null;
    this.gameService.getLevelIntro(this.levelId).subscribe({
      next: (intro) => {
        this.levelIntro = intro;
        this.introLoading = false;
      },
      error: (error) => {
        console.error('Error loading level intro:', error);
        this.introError = 'Failed to load level data';
        this.introLoading = false;
      },
    });
  }

  onStartLevel(): void {
    if (this.introLoading || this.animationPlaying) {
      return;
    }

    if (this.levelIntro?.animationImageUrl) {
      this.animationPlaying = true;
      this.showAnimationImage = true;
    } else {
      this.finishIntro();
    }
  }

  onIntroAnimationDone(): void {
    if (!this.animationPlaying) {
      return;
    }

    this.animationPlaying = false;
    this.showAnimationImage = false;
    this.finishIntro();
  }

  onIntroAnimationError(): void {
    console.warn('Intro animation image failed to load. Skipping animation.');
    this.animationPlaying = false;
    this.showAnimationImage = false;
    this.finishIntro();
  }

  retryIntro(): void {
    if (this.introLoading) {
      return;
    }
    this.prepareForNewLevel();
    this.loadLevelIntro();
  }

  private finishIntro(): void {
    this.showIntro = false;
    this.loadCurrentTask();
  }

  private prepareForNewLevel(): void {
    this.resetInteractionState();
    this.task = null;
    this.levelIntro = null;
    this.introError = null;
    this.introLoading = false;
    this.showIntro = false;
    this.animationPlaying = false;
    this.showAnimationImage = false;
    this.loading = false;
    this.error = null;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startTimer(): void {
    if (!this.task?.timeLimitSecEffective) return;

    this.timeRemaining = this.task.timeLimitSecEffective;

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  handleTimeout(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.notification.showError("Time's up!");
    this.loadCurrentTask(); // Get next task
  }

  onOptionSelect(optionId: string): void {
    // kept for compatibility if some code calls it; toggle selection
    this.onOptionToggle(optionId);
  }

  onOptionToggle(optionId: string): void {
    if (this.incorrectFeedback || this.showingExplanation) return;

    if (this.selectedOptionIds.has(optionId)) {
      this.selectedOptionIds.delete(optionId);
    } else {
      this.selectedOptionIds.add(optionId);
    }
  }

  onSubmit(): void {
    if (!this.task || this.submitting || this.incorrectFeedback) return;

    const selectedOptions = this.buildSubmitSelections();
    if (selectedOptions.length === 0) return;

    this.submitting = true;

    this.gameService.submitTask(this.task.id, selectedOptions, this.task.attemptToken).subscribe({
      next: (response: SubmitResponse) => {
        this.handleSubmitResponse(response);
      },
      error: (error) => {
        console.error('Error submitting task:', error);
        this.submitting = false;

        if (error.status === 403) {
          this.notification.showError('This task is locked.');
        } else {
          this.notification.showError('Failed to submit task');
        }
      },
    });
  }

  handleSubmitResponse(response: SubmitResponse): void {
    this.submitting = false;

    if (response.result === 'correct') {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.showingExplanation = true;
      this.explanationText = response.explanationText || '';
      const correctIds = response.correctOptionIds?.length
        ? response.correctOptionIds
        : Array.from(this.selectedOptionIds);
      this.correctOptionIds = new Set(correctIds);

      if (response.levelCompleted) {
        this.levelCompletionState = response.levelSummary
          ? {
              earnedScore: response.levelSummary.earnedScore,
              maxScore: response.levelSummary.maxScore,
            }
          : {};
      } else {
        this.levelCompletionState = null;
      }
    } else if (response.result === 'incorrect') {
      this.levelCompletionState = null;
      if (response.attemptsLeft > 0) {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        this.incorrectFeedback = true;
        this.incorrectMessage =
          response.attemptsLeft === 1
            ? 'Incorrect answer. You have 1 attempt remaining.'
            : `Incorrect answer. You have ${response.attemptsLeft} attempts remaining.`;
      } else {
        this.notification.showError('No attempts left');
        this.loadCurrentTask(); // Get next task
      }
    } else if (response.result === 'timeout') {
      this.levelCompletionState = null;
      this.notification.showError("Time's up!");
      this.loadCurrentTask(); // Get next task
    }
  }

  onContinue(): void {
    if (this.showingExplanation) {
      const summaryState = this.levelCompletionState;
      this.showingExplanation = false;
      this.correctOptionIds.clear();

      if (summaryState) {
        this.levelCompletionState = null;
        const navigationExtras = Object.keys(summaryState).length
          ? { state: summaryState }
          : undefined;
        this.router.navigate(['/levels', this.levelId, 'summary'], navigationExtras);
      } else {
        this.loadCurrentTask(); // Get next task
      }
    }
  }

  onTryAgain(): void {
    if (this.submitting || !this.task) return;

    this.resetInteractionState();
    this.loadCurrentTask();
  }

  private resetInteractionState(): void {
    this.selectedOptionIds.clear();
    this.incorrectFeedback = false;
    this.incorrectMessage = null;
    this.showingExplanation = false;
    this.explanationText = '';
    this.correctOptionIds.clear();
    this.anagramStates = {};
    this.anagramPieceCounter = 0;
    this.gapFillSelections = {};
    this.gapFillBlankOrder = [];
    this.gapFillAvailableChips = [];
    this.matchingPairs = [];
    this.matchingLeftOptions = [];
    this.matchingRightOptions = [];
    this.matchedLeftIds.clear();
    this.matchedRightIds.clear();
    this.selectedMatchingLeftId = null;
    this.selectedMatchingRightId = null;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getTimerClass(): string {
    if (!this.task?.timeLimitSecEffective) return '';

    const percentage = (this.timeRemaining / this.task.timeLimitSecEffective) * 100;

    if (percentage <= 20) return 'timer-critical';
    if (percentage <= 40) return 'timer-warning';
    return 'timer-normal';
  }

  isOptionCorrect(optionId: string): boolean {
    return this.correctOptionIds.has(optionId);
  }

  get displayedImageUrl(): string | null {
    if (!this.task) return null;
    if (this.showingExplanation && this.task.resultImagePath) {
      return this.task.resultImagePath;
    }
    return this.task.imageUrl || null;
  }

  get displayedImageSource(): SafeHtml | null {
    if (!this.task) return null;
    if (this.showingExplanation && this.task.resultImagePath) {
      return this.toSafeHtml(this.task.resultImageSource);
    }
    return this.toSafeHtml(this.task.taskImageSource);
  }

  isVideoUrl(url: string | null | undefined): boolean {
    return typeof url === 'string' && url.toLowerCase().endsWith('.mp4');
  }

  private toSafeHtml(value: string | null | undefined): SafeHtml | null {
    return value ? this.sanitizer.bypassSecurityTrustHtml(value) : null;
  }

  private getNormalizedTaskType(): string | null {
    if (!this.task?.type) return null;

    const normalizedType = this.task.type.replace(/\s+/g, '').toLowerCase();

    if (normalizedType === 'buildword') return 'anagram';
    if (normalizedType === 'imagechoice') return 'image_choice';
    if (normalizedType === 'textchoice') return 'text_choice';
    if (normalizedType === 'gapfill') return 'gap_fill';
    if (normalizedType === 'gapfilltask') return 'gap_fill';

    return normalizedType;
  }

  get isAnagramTask(): boolean {
    return this.getNormalizedTaskType() === 'anagram';
  }

  get isGapFillTask(): boolean {
    return this.getNormalizedTaskType() === 'gap_fill';
  }

  get isMatchingTask(): boolean {
    return this.getNormalizedTaskType() === 'matching';
  }

  get canSubmit(): boolean {
    if (!this.task || this.incorrectFeedback) return false;

    if (this.isAnagramTask) {
      return this.areAnagramAnswersComplete();
    }

    if (this.isGapFillTask) {
      return this.isGapFillComplete();
    }

    if (this.isMatchingTask) {
      return this.areAllPairsMatched();
    }

    return this.selectedOptionIds.size > 0;
  }

  trackOption(index: number, option: TaskOptionVm): string {
    return option.id || `option-${index}`;
  }

  getAnagramState(option: TaskOptionVm, index: number): AnagramState | null {
    return this.anagramStates[this.getAnagramKey(option, index)] || null;
  }

  getAnagramKey(option: TaskOptionVm, index: number): string {
    return option.id || `option-${index}`;
  }

  movePieceToResult(optionKey: string, pieceId: string): void {
    if (!this.isAnagramTask || this.incorrectFeedback || this.showingExplanation) {
      return;
    }

    const state = this.anagramStates[optionKey];
    if (!state) return;

    const idx = state.available.findIndex((piece) => piece.id === pieceId);
    if (idx === -1) return;

    const [piece] = state.available.splice(idx, 1);
    state.result.push(piece);
    this.syncAnagramAnswers();
  }

  movePieceToSource(optionKey: string, pieceId: string): void {
    if (!this.isAnagramTask || this.incorrectFeedback || this.showingExplanation) {
      return;
    }

    const state = this.anagramStates[optionKey];
    if (!state) return;

    const idx = state.result.findIndex((piece) => piece.id === pieceId);
    if (idx === -1) return;

    const [piece] = state.result.splice(idx, 1);
    state.available.push(piece);
    this.syncAnagramAnswers();
  }

  private initializeAnagramState(): void {
    this.anagramStates = {};
    this.anagramPieceCounter = 0;

    if (!this.isAnagramTask || !this.task) {
      return;
    }

    this.task.options.forEach((option, optionIndex) => {
      const optionKey = this.getAnagramKey(option, optionIndex);
      const pieces: AnagramPiece[] = [];
      const parts = option.label?.split(';') ?? [];
      parts.forEach((rawPart, partIndex) => {
        const text = rawPart.trim();
        if (!text) return;
        pieces.push({
          id: `piece-${option.id || optionIndex}-${partIndex}-${this.anagramPieceCounter++}`,
          text,
        });
      });
      this.shufflePieces(pieces);
      this.anagramStates[optionKey] = {
        available: pieces,
        result: [],
        answer: '',
      };
    });

    this.syncAnagramAnswers();
  }

  private syncAnagramAnswers(): void {
    if (!this.isAnagramTask || !this.task) return;

    Object.values(this.anagramStates).forEach((state) => {
      state.answer = state.result.map((piece) => piece.text).join('').trim();
    });

    this.selectedOptionIds.clear();
    if (!this.task.options.length) return;

    if (this.areAnagramAnswersComplete()) {
      this.task.options.forEach((option, index) => {
        const selectionId = option.id || this.getAnagramKey(option, index);
        this.selectedOptionIds.add(selectionId);
      });
    }
  }

  private areAnagramAnswersComplete(): boolean {
    if (!this.task) return false;

    return this.task.options.every((option, index) => {
      const key = this.getAnagramKey(option, index);
      const answer = this.anagramStates[key]?.answer?.trim();
      return !!answer && !!option.id;
    });
  }

  private buildSubmitSelections(): TaskSubmitSelectionDto[] {
    if (!this.task) return [];

    if (this.isAnagramTask) {
      return this.task.options.reduce((acc, option, index) => {
        const key = this.getAnagramKey(option, index);
        const answer = this.anagramStates[key]?.answer?.trim();

        if (answer && option.id) {
          acc.push({ selectedOptionId: option.id, text: answer });
        }

        return acc;
      }, [] as TaskSubmitSelectionDto[]);
    }

    if (this.isGapFillTask) {
      return Object.entries(this.gapFillSelections).reduce((acc, [indexString, value]) => {
        const index = parseInt(indexString, 10);
        const option = this.task?.options[index];

        if (option?.id && value) {
          acc.push({ selectedOptionId: option.id, text: value });
        }

        return acc;
      }, [] as TaskSubmitSelectionDto[]);
    }

    if (this.isMatchingTask) {
      return this.matchingPairs.reduce((acc, pair) => {
        if (!pair.leftId) return acc;

        acc.push({ selectedOptionId: pair.leftId, text: pair.rightText ?? '' });
        return acc;
      }, [] as TaskSubmitSelectionDto[]);
    }

    return Array.from(this.selectedOptionIds).map((id) => ({ selectedOptionId: id }));
  }

  private shufflePieces(pieces: AnagramPiece[]): void {
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
  }

  private initializeGapFillState(): void {
    this.gapFillSelections = {};
    this.gapFillBlankOrder = [];
    this.gapFillAvailableChips = [];

    if (!this.isGapFillTask || !this.task) return;

    const regex = /{(\d+)}/g;
    let match: RegExpExecArray | null;
    const encountered = new Set<number>();
    const header = this.getDecodedGapFillHeaderText();
    while ((match = regex.exec(header))) {
      const index = parseInt(match[1], 10);
      if (!Number.isNaN(index)) {
        if (!encountered.has(index)) {
          this.gapFillSelections[index] = '';
          encountered.add(index);
          this.gapFillBlankOrder.push(index);
        }
      }
    }

    this.gapFillAvailableChips = this.buildGapFillChipList();
  }

  private buildGapFillChipList(): string[] {
    const label = this.task?.options?.[0]?.label ?? '';
    return label
      .split('|')
      .map((value) => value.trim())
      .filter((value) => !!value);
  }

  get gapFillSegments(): GapFillSegment[] {
    if (!this.isGapFillTask) return [];

    const header = this.getDecodedGapFillHeaderText();
    const segments: GapFillSegment[] = [];
    const regex = /{(\d+)}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(header))) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: header.slice(lastIndex, match.index) });
      }

      const index = parseInt(match[1], 10);
      segments.push({ type: 'blank', index });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < header.length) {
      segments.push({ type: 'text', value: header.slice(lastIndex) });
    }

    return segments.length ? segments : [{ type: 'text', value: header }];
  }

  onGapFillChipSelect(value: string, chipIndex: number): void {
    if (this.incorrectFeedback || this.showingExplanation) return;

    const targetIndex = this.findFirstEmptyGapFillIndex();
    if (targetIndex === null) return;

    this.gapFillSelections[targetIndex] = value;
    this.gapFillAvailableChips.splice(chipIndex, 1);
  }

  onGapFillBlankClick(index: number): void {
    if (this.incorrectFeedback || this.showingExplanation) return;

    const currentValue = this.gapFillSelections[index];
    if (!currentValue) return;

    this.gapFillSelections[index] = '';
    this.gapFillAvailableChips.push(currentValue);
  }

  private findFirstEmptyGapFillIndex(): number | null {
    const order = this.gapFillBlankOrder.length
      ? this.gapFillBlankOrder
      : Object.keys(this.gapFillSelections)
          .map((key) => parseInt(key, 10))
          .sort((a, b) => a - b);

    for (const index of order) {
      if (!this.gapFillSelections[index]) {
        return index;
      }
    }

    return null;
  }

  private isGapFillComplete(): boolean {
    const order = this.gapFillBlankOrder.length
      ? this.gapFillBlankOrder
      : Object.keys(this.gapFillSelections).map((key) => parseInt(key, 10));

    if (!order.length) return false;

    return order.every((index) => !!this.gapFillSelections[index]);
  }

  private getDecodedGapFillHeaderText(): string {
    const raw = this.task?.headerText ?? '';
    if (!raw) return '';

    let decoded = raw;

    decoded = decoded.replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10);
      return Number.isNaN(code) ? _ : String.fromCharCode(code);
    });

    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? _ : String.fromCharCode(code);
    });

    const entityMap: Record<string, string> = {
      '&lbrace;': '{',
      '&#123;': '{',
      '&rbrace;': '}',
      '&#125;': '}',
      '&nbsp;': '\u00a0',
    };

    Object.entries(entityMap).forEach(([entity, replacement]) => {
      const regex = new RegExp(entity, 'gi');
      decoded = decoded.replace(regex, replacement);
    });

    return decoded;
  }

  private initializeMatchingState(): void {
    this.matchingPairs = [];
    this.matchingLeftOptions = [];
    this.matchingRightOptions = [];
    this.matchedLeftIds.clear();
    this.matchedRightIds.clear();
    this.selectedMatchingLeftId = null;
    this.selectedMatchingRightId = null;

    if (!this.isMatchingTask || !this.task) return;

    const leftRightPairs = this.task.options.map((option) =>
      this.parseMatchingLabel(option.label ?? ''),
    );

    this.matchingLeftOptions = this.task.options.map((option, index) => ({
      id: option.id || `left-${index}`,
      text: leftRightPairs[index]?.leftText ?? option.label ?? '',
    }));

    const rightOptions = this.task.options.map((option, index) => ({
      id: option.id ? `${option.id}-right` : `right-${index}`,
      text: leftRightPairs[index]?.rightText ?? '',
    }));

    this.matchingRightOptions = this.shuffleArray(rightOptions);
  }

  get availableMatchingLeftOptions(): MatchingOption[] {
    return this.matchingLeftOptions.filter((option) => !this.matchedLeftIds.has(option.id));
  }

  get availableMatchingRightOptions(): MatchingOption[] {
    return this.matchingRightOptions.filter((option) => !this.matchedRightIds.has(option.id));
  }

  onSelectMatchingLeft(optionId: string): void {
    if (this.incorrectFeedback || this.showingExplanation) return;
    if (this.matchedLeftIds.has(optionId)) return;

    this.selectedMatchingLeftId = this.selectedMatchingLeftId === optionId ? null : optionId;
    this.tryCreateMatchingPair();
  }

  onSelectMatchingRight(optionId: string): void {
    if (this.incorrectFeedback || this.showingExplanation) return;
    if (this.matchedRightIds.has(optionId)) return;

    this.selectedMatchingRightId = this.selectedMatchingRightId === optionId ? null : optionId;
    this.tryCreateMatchingPair();
  }

  removeMatchingPair(pair: MatchingPair): void {
    this.matchingPairs = this.matchingPairs.filter(
      (existing) => !(existing.leftId === pair.leftId && existing.rightId === pair.rightId),
    );
    this.matchedLeftIds.delete(pair.leftId);
    this.matchedRightIds.delete(pair.rightId);
    this.selectedMatchingLeftId = null;
    this.selectedMatchingRightId = null;
  }

  private tryCreateMatchingPair(): void {
    if (!this.selectedMatchingLeftId || !this.selectedMatchingRightId) return;

    const leftOption = this.matchingLeftOptions.find((option) => option.id === this.selectedMatchingLeftId);
    const rightOption = this.matchingRightOptions.find(
      (option) => option.id === this.selectedMatchingRightId,
    );
    if (!rightOption || !leftOption) return;

    this.matchingPairs.push({
      leftId: this.selectedMatchingLeftId,
      rightId: this.selectedMatchingRightId,
      leftText: leftOption.text,
      rightText: rightOption.text,
    });

    this.matchedLeftIds.add(this.selectedMatchingLeftId);
    this.matchedRightIds.add(this.selectedMatchingRightId);
    this.selectedMatchingLeftId = null;
    this.selectedMatchingRightId = null;
  }

  isLeftSelected(optionId: string): boolean {
    return this.selectedMatchingLeftId === optionId;
  }

  isRightSelected(optionId: string): boolean {
    return this.selectedMatchingRightId === optionId;
  }

  private areAllPairsMatched(): boolean {
    if (!this.isMatchingTask || !this.task) return false;

    return this.matchingPairs.length === this.task.options.length && this.matchingPairs.length > 0;
  }

  private shuffleArray<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private parseMatchingLabel(label: string): { leftText: string; rightText: string } {
    const [leftRaw, rightRaw] = (label ?? '').split('|');
    const leftText = (leftRaw ?? '').trim();
    const rightText = (rightRaw ?? '').trim() || leftText;

    return { leftText, rightText };
  }
}

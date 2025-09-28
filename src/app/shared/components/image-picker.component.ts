import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
  NgZone,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'app-image-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImagePickerComponent),
      multi: true,
    },
  ],
  styles: [
    `
      :host {
        display: block;
        --primary-color: #3b82f6;
        --primary-hover: #2563eb;
        --danger-color: #ef4444;
        --danger-hover: #dc2626;
        --success-color: #10b981;
        --gray-50: #f9fafb;
        --gray-100: #f3f4f6;
        --gray-200: #e5e7eb;
        --gray-300: #d1d5db;
        --gray-400: #9ca3af;
        --gray-500: #6b7280;
        --gray-600: #4b5563;
        --gray-700: #374151;
        --gray-800: #1f2937;
        --gray-900: #111827;
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        --border-radius: 12px;
        --border-radius-lg: 16px;
        --border-radius-xl: 20px;
        --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Современный превью */
      .preview {
        position: relative;
        width: 100%;
        border: 2px dashed var(--gray-300);
        border-radius: var(--border-radius-lg);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--gray-50);
        margin-top: 12px;
        cursor: pointer;
        user-select: none;
        transition: var(--transition);
        min-height: 120px;
      }

      .preview:hover {
        border-color: var(--primary-color);
        background: #f8faff;
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      .preview.dragover {
        border-color: var(--primary-color);
        background: #eff6ff;
        transform: scale(1.02);
      }

      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: var(--transition);
      }

      .hint {
        color: var(--gray-500);
        font-size: 14px;
        text-align: center;
        padding: 20px;
        line-height: 1.5;
      }

      .hint-icon {
        font-size: 32px;
        margin-bottom: 8px;
        opacity: 0.6;
      }

      /* Современная панель инструментов */
      .toolbar {
        position: absolute;
        right: 12px;
        bottom: 12px;
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        padding: 8px;
        border-radius: var(--border-radius-lg);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: var(--shadow-lg);
        opacity: 0;
        transform: translateY(10px);
        transition: var(--transition);
      }

      .preview:hover .toolbar {
        opacity: 1;
        transform: translateY(0);
      }

      /* Современные кнопки */
      .btn {
        padding: 8px 16px;
        border: 1px solid var(--gray-200);
        border-radius: var(--border-radius);
        background: #fff;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: var(--transition);
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      .btn:active {
        transform: translateY(0);
      }

      .btn-primary {
        background: var(--primary-color);
        color: #fff;
        border-color: var(--primary-color);
      }

      .btn-primary:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
      }

      .btn-danger {
        background: var(--danger-color);
        color: #fff;
        border-color: var(--danger-color);
      }

      .btn-danger:hover {
        background: var(--danger-hover);
        border-color: var(--danger-hover);
      }

      .btn-secondary {
        background: #fff;
        color: var(--gray-700);
        border-color: var(--gray-200);
      }

      .btn-secondary:hover {
        background: var(--gray-50);
        border-color: var(--gray-300);
      }

      .btn.icon-only {
        padding: 8px;
        min-width: 36px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .btn.icon-only svg {
        width: 16px;
        height: 16px;
        transition: var(--transition);
        margin: 0; /* Убираем отступы для иконок */
      }

      .btn.icon-only:hover svg {
        transform: scale(1.1);
      }

      .btn svg {
        width: 16px;
        height: 16px;
        margin-right: 6px;
        transition: var(--transition);
      }

      .btn:hover svg {
        transform: scale(1.05);
      }

      /* Специальные стили для кнопок масштабирования */
      .icon-btn {
        font-size: 20px;
        font-weight: 600;
        color: var(--gray-800);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-btn:hover {
        color: var(--primary-color);
        transform: scale(1.1);
      }

      .hidden {
        display: none !important;
      }

      /* Современная модалка */
      .modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: stretch;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 9999;
        animation: modalFadeIn 0.2s ease-out;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      @keyframes modalFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .card {
        width: 100%;
        max-width: min(95vw, 1200px);
        background: #fff;
        border-radius: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: cardSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-xl);
      }

      @keyframes cardSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .card-head {
        padding: 20px 24px;
        font-weight: 600;
        font-size: 18px;
        border-bottom: 1px solid var(--gray-200);
        position: sticky;
        top: 0;
        background: #fff;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        backdrop-filter: blur(8px);
      }

      .card-body {
        padding: 24px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
      }

      .card-foot {
        padding: 20px 24px;
        border-top: 1px solid var(--gray-200);
        display: flex;
        gap: 12px;
        justify-content: space-between;
        position: sticky;
        bottom: 0;
        background: #fff;
        z-index: 5;
        backdrop-filter: blur(8px);
      }

      /* Современный редактор */
      .editor {
        width: 100%;
        margin: 0 auto;
        display: grid;
        gap: 20px;
      }

      .canvas-wrap {
        width: 100%;
        display: flex;
        justify-content: center;
        margin: 0 auto;
        position: relative;
      }

      .canvas {
        width: 100%;
        height: auto;
        background: var(--gray-900);
        border-radius: var(--border-radius-lg);
        touch-action: none;
        border: 1px solid var(--gray-200);
        box-shadow: var(--shadow-lg);
        transition: var(--transition);
      }

      .canvas:hover {
        box-shadow: var(--shadow-xl);
      }

      /* Современные контролы */
      .ctrls {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 12px;
        align-items: center;
        padding: 16px;
        background: var(--gray-50);
        border-radius: var(--border-radius-lg);
        border: 1px solid var(--gray-200);
      }

      .range {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--gray-200);
        outline: none;
        cursor: pointer;
        transition: var(--transition);
      }

      .range::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: var(--transition);
      }

      .range::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: var(--shadow-md);
      }

      .range::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: none;
        box-shadow: var(--shadow-sm);
      }

      .icon-btn {
        width: 44px;
        height: 44px;
        border-radius: var(--border-radius);
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
        border: 1px solid var(--gray-200);
        background: #fff;
        color: var(--gray-700);
      }

      .icon-btn:hover {
        background: var(--primary-color);
        color: #fff;
        border-color: var(--primary-color);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      /* Индикатор загрузки */
      .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--border-radius-lg);
        z-index: 10;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--gray-200);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      /* Адаптивность */
      @media (max-width: 768px) {
        .preview {
          min-height: 100px;
        }

        .toolbar {
          position: static;
          opacity: 1;
          transform: none;
          margin-top: 12px;
          justify-content: center;
        }

        .card-head {
          padding: 16px 20px;
          font-size: 16px;
        }

        .card-body {
          padding: 16px;
          min-height: 300px;
        }

        .card-foot {
          padding: 16px 20px;
          flex-direction: row;
          gap: 12px;
        }

        .card-foot .btn {
          flex: 1;
        }

        .ctrls {
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          align-items: center;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          font-size: 16px;
        }
      }

      /* Очень маленькие экраны */
      @media (max-width: 480px) {
        .ctrls {
          gap: 8px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          font-size: 14px;
        }

        .card-foot {
          padding: 12px 16px;
          gap: 8px;
        }

        .card-foot .btn {
          font-size: 14px;
          padding: 10px 12px;
        }
      }

      @media (min-width: 769px) {
        .card {
          border-radius: var(--border-radius-xl);
          margin: 32px;
          max-height: 90vh;
        }

        .ctrls {
          grid-template-columns: 1fr auto auto;
        }
      }

      /* Темная тема */
      @media (prefers-color-scheme: dark) {
        :host {
          --gray-50: #1f2937;
          --gray-100: #374151;
          --gray-200: #4b5563;
          --gray-300: #6b7280;
          --gray-400: #9ca3af;
          --gray-500: #d1d5db;
          --gray-600: #e5e7eb;
          --gray-700: #f3f4f6;
          --gray-800: #f9fafb;
          --gray-900: #ffffff;
        }

        .preview {
          background: var(--gray-100);
          border-color: var(--gray-300);
        }

        .preview:hover {
          background: var(--gray-200);
        }

        .toolbar {
          background: rgba(31, 41, 55, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-secondary {
          background: var(--gray-100);
          color: var(--gray-700);
          border-color: var(--gray-300);
        }

        .btn-secondary:hover {
          background: var(--gray-200);
        }

        .ctrls {
          background: var(--gray-100);
          border-color: var(--gray-300);
        }

        .canvas {
          background: var(--gray-800);
        }
      }
    `,
  ],
  template: `
    <!-- скрытый input -->
    <input
      #fileInput
      type="file"
      [accept]="accept"
      (change)="onFileChange($event)"
      class="hidden"
    />

    <!-- внешний превью -->
    <div
      class="preview"
      [class.dragover]="isDragOver"
      [style.max-width.px]="previewWidth"
      [style.height.px]="previewHeightComputed"
      (click)="onPreviewClick()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <!-- Индикатор загрузки -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
      </div>

      <img
        *ngIf="liveDataUrl || rawPreviewUrl || value"
        [src]="liveDataUrl || rawPreviewUrl || value"
        alt="preview"
      />
      <div *ngIf="!(liveDataUrl || rawPreviewUrl || value)" class="hint">
        <div class="hint-icon">📷</div>
        <div>Tap to upload image</div>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">or drag & drop</div>
      </div>

      <!-- Подсказка для смены изображения -->
      <div
        *ngIf="liveDataUrl || rawPreviewUrl || value"
        class="hint"
        style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"
      >
        Click to change
      </div>

      <div class="toolbar" *ngIf="liveDataUrl || rawPreviewUrl || value">
        <button
          class="btn btn-danger icon-only"
          type="button"
          (click)="clear(); $event.stopPropagation()"
          title="Remove image"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3,6 5,6 21,6"></polyline>
            <path
              d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"
            ></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- полноэкранный редактор (только для mode='crop') -->
    <div class="modal" *ngIf="showEditor && mode === 'crop'" (click)="onModalClick($event)">
      <div class="card" (click)="$event.stopPropagation()">
        <div class="card-head">
          <span>Crop Image</span>
          <button class="btn btn-secondary" type="button" (click)="closeEditor()">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Close
          </button>
        </div>

        <div class="card-body">
          <div class="editor" [style.maxWidth.px]="editorMaxCssWidth">
            <div class="canvas-wrap" [style.maxWidth.px]="editorMaxCssWidth">
              <canvas
                #canvas
                class="canvas"
                (pointerdown)="onPointerDown($event)"
                (pointermove)="onPointerMove($event)"
                (pointerup)="onPointerUp($event)"
                (pointercancel)="onPointerUp($event)"
                (pointerleave)="onPointerUp($event)"
              ></canvas>
            </div>

            <div class="ctrls">
              <input
                class="range"
                type="range"
                [min]="minZoom"
                [max]="maxZoom"
                step="0.01"
                [(ngModel)]="zoom"
                (input)="onSliderZoom()"
              />
              <button class="btn icon-btn" type="button" (click)="bumpZoom(-0.1)" title="Zoom out">
                −
              </button>
              <button class="btn icon-btn" type="button" (click)="bumpZoom(+0.1)" title="Zoom in">
                +
              </button>
            </div>
          </div>
        </div>

        <div class="card-foot">
          <button class="btn btn-secondary" type="button" (click)="closeEditor()">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancel
          </button>
          <button class="btn btn-primary" type="button" (click)="apply()" [disabled]="isProcessing">
            <svg
              *ngIf="!isProcessing"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            <svg
              *ngIf="isProcessing"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m12 6v6l4 2"></path>
            </svg>
            <span *ngIf="!isProcessing">Apply</span>
            <span *ngIf="isProcessing">Processing...</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ImagePickerComponent implements ControlValueAccessor, OnDestroy {
  /* === Inputs === */
  @Input() accept = 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
  @Input() outputType: 'image/png' | 'image/jpeg' = 'image/png';

  /** Режим: 'crop' — редактирование; 'original' — сохранить как есть, без изменений */
  @Input() mode: 'crop' | 'original' = 'crop';

  /** Прямоугольный выход — укажи оба, чтобы получить, например, 4700×240 */
  @Input() outputWidth?: number; // если не задано — использует square outputSize
  @Input() outputHeight?: number;
  /** Квадратный выход по умолчанию (если не заданы outputWidth/Height) */
  @Input() outputSize = 600;

  /** Размер превью на форме (по умолчанию квадрат). Можно задать обе величины. */
  @Input() previewWidth = 320;
  @Input() previewHeight?: number; // если не задано — высчитывается из пропорции выхода

  /** Размер canvas в редакторе: ширина. Высота берётся по пропорции выхода */
  @Input() editorCanvasWidth = 960;
  /** Максимальная визуальная ширина canvas на экране (CSS) */
  @Input() editorMaxCssWidth = 640;

  /** Совместимость (не используется напрямую) */
  @Input() cropAspectRatio: number | null = null;

  /* === Outputs === */
  @Output() changed = new EventEmitter<string>(); // финальный base64

  /* === Refs === */
  @ViewChild('fileInput', { static: false }) fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('canvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;

  /* === CVA === */
  value: string | null = null;
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: string | null): void {
    this.value = v ?? null;
    // Обновляем отображение изображения при изменении значения
    this.updateImageDisplay();
  }

  private updateImageDisplay(): void {
    // Если есть значение, обновляем отображение
    if (this.value) {
      // Сбрасываем состояние загрузки
      this.imgLoaded = false;
      this.cdr.detectChanges();

      // Создаем новое изображение для загрузки
      const img = new Image();
      img.onload = () => {
        this.ngZone.run(() => {
          this.imgLoaded = true;
          this.cdr.detectChanges();
        });
      };
      img.onerror = () => {
        this.ngZone.run(() => {
          this.imgLoaded = false;
          this.cdr.detectChanges();
        });
      };
      img.src = this.value;
    } else {
      // Если нет значения, сбрасываем состояние
      this.imgLoaded = false;
      this.cdr.detectChanges();
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(_: boolean): void {}

  /* === State === */
  showEditor = false;
  rawPreviewUrl: string | null = null; // objectURL выбранного файла
  liveDataUrl: string | null = null; // текущий кадр (для внешнего превью)
  private objectUrlToRevoke?: string;

  private img = new Image();
  imgLoaded = false;

  zoom = 1;
  minZoom = 1;
  maxZoom = 8;

  private posX = 0; // top-left картинки в координатах canvas
  private posY = 0;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private startPosX = 0;
  private startPosY = 0;

  private pointerScale = 1;
  private pointers = new Map<number, PointerEvent>();
  private pinchStartDist = 0;
  private pinchStartZoom = 1;
  private pinchCenterX = 0;
  private pinchCenterY = 0;

  // Новые состояния для улучшенного UX
  isLoading = false;
  isProcessing = false;
  isDragOver = false;

  // Оптимизация производительности
  private rafId: number | null = null;
  private pendingLivePreview = false;

  // Upload service
  private uploadService = inject(UploadService);
  private pendingFile: File | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnDestroy() {
    this.revokeObjectUrl();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.restoreBodyScroll();
  }

  private preventBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  private restoreBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  /* === Вычисления размеров/пропорций === */
  private get outW(): number {
    return this.outputWidth ?? this.outputSize;
  }
  private get outH(): number {
    return this.outputHeight ?? this.outputSize;
  }
  private get outRatio(): number {
    return this.outH / this.outW;
  }

  get previewHeightComputed(): number {
    if (this.previewHeight && this.previewHeight > 0) return this.previewHeight;
    // Если задан прямоугольный выход — держим ту же пропорцию в превью
    return Math.max(24, Math.round(this.previewWidth * this.outRatio));
  }

  /* === UI === */
  onPreviewClick() {
    // Всегда открываем выбор файла при клике на превью
    this.triggerPick();
  }
  triggerPick() {
    this.fileInputRef?.nativeElement.click();
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validate(file)) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    // Сохраняем файл для последующей загрузки
    this.pendingFile = file;

    // Быстрый внешний превью
    this.revokeObjectUrl();
    this.objectUrlToRevoke = URL.createObjectURL(file);
    this.rawPreviewUrl = this.objectUrlToRevoke;

    // Режим "original": сохранить как есть, без редактора
    if (this.mode === 'original') {
      const reader = new FileReader();
      reader.onload = () => {
        this.ngZone.run(() => {
          const dataUrl = reader.result as string;
          this.value = dataUrl;
          this.onChange(this.value);
          this.liveDataUrl = dataUrl; // показываем на форме
          this.isLoading = false;
          this.cdr.detectChanges();
        });
        // очистим input, чтобы можно было выбрать тот же файл повторно
        setTimeout(() => {
          if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
        }, 0);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Режим "crop": загружаем в редактор
    this.img = new Image();
    this.img.onload = () => {
      this.ngZone.run(() => {
        this.imgLoaded = true;
        this.isLoading = false;
        this.openEditor();
        this.setupCanvas();
        this.cdr.detectChanges();
      });
      setTimeout(() => {
        if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
      }, 0);
    };
    this.img.onerror = () => {
      this.ngZone.run(() => {
        this.imgLoaded = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    };
    this.img.src = this.objectUrlToRevoke;
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const fake = { target: { files: [file] } } as any as Event;
    this.onFileChange(fake);
  }

  onModalClick(e: Event) {
    if (e.target === e.currentTarget) {
      this.closeEditor();
    }
  }

  openEditor() {
    if (this.mode !== 'crop') {
      return;
    }

    // Если изображение еще не загружено, загружаем его
    if (!this.imgLoaded && (this.rawPreviewUrl || this.value)) {
      this.img = new Image();
      this.img.onload = () => {
        this.ngZone.run(() => {
          this.imgLoaded = true;
          this.resetCropState(); // Сбрасываем состояние кропа
          this.showEditor = true;
          this.setupCanvas();
          this.cdr.detectChanges();
        });
      };
      this.img.onerror = () => {
        this.ngZone.run(() => {
          this.imgLoaded = false;
          this.cdr.detectChanges();
        });
      };
      this.img.src = this.rawPreviewUrl || this.value || '';
      return;
    }

    if (!this.imgLoaded) {
      return;
    }

    this.resetCropState(); // Сбрасываем состояние кропа
    this.showEditor = true;
    this.preventBodyScroll();
    setTimeout(() => this.setupCanvas(), 0);
  }
  closeEditor() {
    this.showEditor = false;
    this.pointers.clear();
    this.restoreBodyScroll();
    this.pendingLivePreview = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private resetCropState() {
    // Сбрасываем состояние кропа к оригинальному
    this.zoom = 1; // Будет переустановлен в setupCanvas()
    this.minZoom = 1; // Будет переустановлен в setupCanvas()
    this.maxZoom = 8;
    this.posX = 0; // Будет переустановлен в setupCanvas()
    this.posY = 0; // Будет переустановлен в setupCanvas()
    this.isDragging = false;
    this.pointers.clear();
    this.pinchStartDist = 0;
    this.pinchStartZoom = 1;
    this.pinchCenterX = 0;
    this.pinchCenterY = 0;
    this.pendingLivePreview = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  apply() {
    this.isProcessing = true;
    this.cdr.detectChanges();

    // Используем requestAnimationFrame для плавной обработки
    requestAnimationFrame(() => {
      try {
        // финализируем кроп в точном размере (outW × outH)
        const data = this.renderToOutput();
        if (data) {
          this.value = data;
          this.onChange(this.value);
          this.changed.emit(this.value);
          this.liveDataUrl = data;
          this.pendingLivePreview = false;

          // Сохраняем обработанное изображение как файл для загрузки
          this.convertDataUrlToFile(data);
        }
      } finally {
        this.isProcessing = false;
        this.closeEditor();
        this.cdr.detectChanges();
      }
    });
  }

  clear() {
    this.value = null;
    this.onChange(this.value);
    this.liveDataUrl = null;
    this.rawPreviewUrl = null;
    this.imgLoaded = false;
    this.pointers.clear();
    this.revokeObjectUrl();
    this.pendingLivePreview = false;
    this.pendingFile = null; // Очищаем pending файл
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /* === Canvas === */
  private setupCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imgLoaded) return;

    // ширина задаётся, высота по пропорции целевого выхода
    const cw = Math.min(Math.max(this.editorCanvasWidth, 200), 2000);
    const ch = Math.max(100, Math.round(cw * this.outRatio));
    canvas.width = cw;
    canvas.height = ch;

    // минимальный зум, чтобы покрыть весь кадр редактора
    const sx = cw / this.img.width;
    const sy = ch / this.img.height;
    this.minZoom = Math.max(sx, sy);

    // Устанавливаем зум только если он еще не был установлен (при первом открытии)
    if (this.zoom === 1) {
      this.zoom = this.minZoom;
    }

    const drawW = this.img.width * this.zoom;
    const drawH = this.img.height * this.zoom;

    // Устанавливаем позицию только если она еще не была установлена
    if (this.posX === 0 && this.posY === 0) {
      this.posX = (cw - drawW) / 2;
      this.posY = (ch - drawH) / 2;
    }

    const rect = canvas.getBoundingClientRect();
    this.pointerScale = canvas.width / rect.width;

    this.scheduleRender(true); // показать live превью сразу
  }

  private clampPosition() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const drawW = this.img.width * this.zoom;
    const drawH = this.img.height * this.zoom;

    this.posX = Math.min(0, Math.max(this.posX, cw - drawW));
    this.posY = Math.min(0, Math.max(this.posY, ch - drawH));
  }

  private scheduleRender(updateLivePreview = false) {
    if (updateLivePreview) {
      this.pendingLivePreview = true;
    }
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.ngZone.runOutsideAngular(() => this.renderFrame());
    });
  }

  private renderFrame() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imgLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.clampPosition();

    const cw = canvas.width;
    const ch = canvas.height;
    const drawW = this.img.width * this.zoom;
    const drawH = this.img.height * this.zoom;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, cw, ch);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, this.posX, this.posY, drawW, drawH);

    // live превью — только при необходимости
    if (this.pendingLivePreview && !this.isDragging && this.pointers.size === 0) {
      const data = this.renderToOutput();
      this.pendingLivePreview = false;
      if (data !== null) {
        this.ngZone.run(() => {
          this.liveDataUrl = data;
        });
      }
    }
  }

  /** Рендер в offscreen-канвас точного размера outW×outH */
  private renderToOutput(): string | null {
    if (!this.imgLoaded) return null;
    const outW = Math.min(Math.max(this.outW, 32), 10000); // защита от крайностей
    const outH = Math.min(Math.max(this.outH, 16), 10000);

    const canvas = this.canvasRef?.nativeElement!;
    const ratioX = outW / canvas.width;
    const ratioY = outH / canvas.height;

    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const octx = out.getContext('2d');
    if (!octx) return null;

    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';

    const drawW = this.img.width * this.zoom * ratioX;
    const drawH = this.img.height * this.zoom * ratioY;
    const posX = this.posX * ratioX;
    const posY = this.posY * ratioY;

    octx.clearRect(0, 0, outW, outH);
    octx.drawImage(this.img, posX, posY, drawW, drawH);

    return out.toDataURL(this.outputType);
  }

  /* === Zoom / Move === */
  private zoomAt(cx: number, cy: number, newZoom: number) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, newZoom));

    const imgX = (cx - this.posX) / this.zoom;
    const imgY = (cy - this.posY) / this.zoom;

    this.zoom = newZoom;
    this.posX = cx - imgX * this.zoom;
    this.posY = cy - imgY * this.zoom;

    this.scheduleRender(true);
  }
  onSliderZoom() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    this.zoomAt(cx, cy, this.zoom);
  }
  bumpZoom(delta: number) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    this.zoomAt(cx, cy, this.zoom + delta);
  }

  // Pointer gestures
  onPointerDown(ev: PointerEvent) {
    this.ngZone.runOutsideAngular(() => this.handlePointerDown(ev));
  }
  private handlePointerDown(ev: PointerEvent) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imgLoaded) return;
    canvas.setPointerCapture(ev.pointerId);

    const rect = canvas.getBoundingClientRect();
    this.pointerScale = canvas.width / rect.width;

    this.pointers.set(ev.pointerId, ev);

    if (this.pointers.size === 1) {
      this.isDragging = true;
      this.dragStartX = ev.clientX;
      this.dragStartY = ev.clientY;
      this.startPosX = this.posX;
      this.startPosY = this.posY;
    } else if (this.pointers.size === 2) {
      const [p1, p2] = Array.from(this.pointers.values());
      const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY) * this.pointerScale;
      this.pinchStartDist = dist;
      this.pinchStartZoom = this.zoom;

      const cxClient = (p1.clientX + p2.clientX) / 2;
      const cyClient = (p1.clientY + p2.clientY) / 2;
      const rect2 = canvas.getBoundingClientRect();
      this.pinchCenterX = (cxClient - rect2.left) * this.pointerScale;
      this.pinchCenterY = (cyClient - rect2.top) * this.pointerScale;

      this.isDragging = false;
    }
  }
  onPointerMove(ev: PointerEvent) {
    this.ngZone.runOutsideAngular(() => this.handlePointerMove(ev));
  }
  private handlePointerMove(ev: PointerEvent) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imgLoaded) return;

    if (!this.pointers.has(ev.pointerId)) return;
    this.pointers.set(ev.pointerId, ev);

    // Предотвращаем скролл страницы при перетаскивании
    ev.preventDefault();

    if (this.pointers.size === 1 && this.isDragging) {
      const dx = (ev.clientX - this.dragStartX) * this.pointerScale;
      const dy = (ev.clientY - this.dragStartY) * this.pointerScale;
      this.posX = this.startPosX + dx;
      this.posY = this.startPosY + dy;
      this.scheduleRender();
    } else if (this.pointers.size === 2) {
      const [p1, p2] = Array.from(this.pointers.values());
      const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY) * this.pointerScale;
      if (this.pinchStartDist > 0) {
        const scale = dist / this.pinchStartDist;
        const target = this.pinchStartZoom * scale;
        this.zoomAt(this.pinchCenterX, this.pinchCenterY, target);
      }
    }
  }
  onPointerUp(ev: PointerEvent) {
    this.ngZone.runOutsideAngular(() => this.handlePointerUp(ev));
  }
  private handlePointerUp(ev: PointerEvent) {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) canvas.releasePointerCapture(ev.pointerId);
    this.pointers.delete(ev.pointerId);
    if (this.pointers.size <= 1) {
      this.isDragging = false;
      this.pinchStartDist = 0;
      // Финальный рендер с live preview
      this.scheduleRender(true);
    }
  }

  /* === Utils === */
  validate(file: File): boolean {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    return allowed.includes(file.type) && file.size <= 20 * 1024 * 1024; // до 20 МБ
  }
  revokeObjectUrl() {
    if (this.objectUrlToRevoke) {
      URL.revokeObjectURL(this.objectUrlToRevoke);
      this.objectUrlToRevoke = undefined;
    }
  }

  // совместимость
  async uploadPendingIfAny(): Promise<string | null> {
    console.log('=== uploadPendingIfAny CALLED ===');
    console.log('Pending file:', this.pendingFile);

    if (!this.pendingFile) {
      console.log('No pending file, returning null');
      return null;
    }

    console.log('=== UPLOADING PENDING FILE ===');
    console.log('File:', this.pendingFile.name, this.pendingFile.size, 'bytes');

    try {
      const result = await firstValueFrom(this.uploadService.uploadImageResult(this.pendingFile));
      console.log('Upload result:', result);

      if (result && typeof result === 'object' && 'url' in result) {
        const url = result.url;
        console.log('Upload successful, URL:', url);
        this.pendingFile = null; // Очищаем после успешной загрузки
        return url;
      }

      console.log('Upload failed - no URL in result');
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }

  private convertDataUrlToFile(dataUrl: string): void {
    try {
      // Извлекаем данные из data URL
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      // Создаем файл
      const file = new File([u8arr], `image.${mime.split('/')[1]}`, { type: mime });
      this.pendingFile = file;

      console.log('Converted data URL to file:', file.name, file.size, 'bytes');
    } catch (error) {
      console.error('Error converting data URL to file:', error);
    }
  }
}

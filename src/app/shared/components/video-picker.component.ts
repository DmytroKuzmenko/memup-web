import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'app-video-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VideoPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="picker">
      <input
        #fileInput
        class="hidden"
        type="file"
        [accept]="accept"
        (change)="onFileSelected($event)"
        [disabled]="isDisabled || isUploading"
      />

      <div
        class="preview"
        [class.dragover]="isDragOver"
        [class.disabled]="isDisabled"
        (click)="openFileDialog()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <ng-container *ngIf="previewUrl; else placeholder">
          <video
            class="video"
            [src]="previewUrl"
            controls
            preload="metadata"
          ></video>
          <button class="btn btn-danger" type="button" (click)="clear($event)" [disabled]="isDisabled || isUploading">
            Remove
          </button>
        </ng-container>
        <ng-template #placeholder>
          <div class="hint">
            <div class="hint-icon">🎬</div>
            <div class="hint-title">{{ label }}</div>
            <div class="hint-subtitle">
              Drag & drop or click to upload an MP4 file (max {{ maxSizeMb }} MB)
            </div>
          </div>
        </ng-template>
        <div *ngIf="isUploading" class="loading-overlay">
          <div class="spinner"></div>
          <span>Uploading...</span>
        </div>
      </div>

      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .picker {
        display: grid;
        gap: 8px;
      }
      .hidden {
        display: none !important;
      }
      .preview {
        position: relative;
        border: 2px dashed #d1d5db;
        border-radius: 16px;
        min-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
      }
      .preview.disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .preview.dragover {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      .video {
        width: 100%;
        max-height: 320px;
        display: block;
      }
      .hint {
        text-align: center;
        padding: 24px;
        color: #4b5563;
      }
      .hint-icon {
        font-size: 36px;
        margin-bottom: 8px;
      }
      .hint-title {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .hint-subtitle {
        font-size: 13px;
        color: #6b7280;
      }
      .btn {
        position: absolute;
        right: 12px;
        bottom: 12px;
        padding: 6px 12px;
        border-radius: 9999px;
        border: none;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn.btn-danger {
        background: #ef4444;
        color: #fff;
      }
      .btn.btn-danger:hover:not(:disabled) {
        background: #dc2626;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.88);
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: #1f2937;
      }
      .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .error {
        color: #ef4444;
        font-size: 13px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoPickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() accept = 'video/mp4';
  @Input() maxSizeMb = 20;
  @Input() label = 'Upload video';

  @Output() changed = new EventEmitter<string | null>();

  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

  value: string | null = null;
  previewUrl: string | null = null;
  error: string | null = null;
  isDisabled = false;
  isDragOver = false;
  isUploading = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private tempPreviewUrl: string | null = null;

  constructor(private uploadService: UploadService) {}

  writeValue(value: string | null): void {
    this.value = value;
    this.previewUrl = value;
    this.error = null;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  ngOnDestroy(): void {
    this.revokeTempPreview();
  }

  openFileDialog(): void {
    if (this.isDisabled || this.isUploading) {
      return;
    }
    this.fileInput?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      await this.handleFile(file);
    }
    if (input) {
      input.value = '';
    }
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    if (this.isDisabled || this.isUploading) {
      return;
    }
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      await this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isDisabled || this.isUploading) {
      return;
    }
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled || this.isUploading) {
      return;
    }
    this.value = null;
    this.previewUrl = null;
    this.error = null;
    this.revokeTempPreview();
    this.onChange(this.value);
    this.onTouched();
    this.changed.emit(this.value);
  }

  private async handleFile(file: File): Promise<void> {
    this.error = null;

    if (!this.validate(file)) {
      this.error = `Allowed format: MP4 up to ${this.maxSizeMb} MB`;
      this.onTouched();
      return;
    }

    this.revokeTempPreview();
    this.tempPreviewUrl = URL.createObjectURL(file);
    this.previewUrl = this.tempPreviewUrl;
    this.isUploading = true;

    try {
      const result = await firstValueFrom(this.uploadService.uploadFile(file));
      this.value = result?.url ?? null;
      this.previewUrl = this.value;
      this.onChange(this.value);
      this.changed.emit(this.value);
    } catch (error) {
      console.error('Video upload failed', error);
      this.error = 'Failed to upload video. Please try again.';
    } finally {
      this.isUploading = false;
      this.revokeTempPreview();
      this.previewUrl = this.value;
      this.onTouched();
    }
  }

  private validate(file: File): boolean {
    const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
    const sizeLimit = this.maxSizeMb * 1024 * 1024;
    return isMp4 && file.size <= sizeLimit;
  }

  private revokeTempPreview(): void {
    if (this.tempPreviewUrl) {
      URL.revokeObjectURL(this.tempPreviewUrl);
      this.tempPreviewUrl = null;
    }
  }
}

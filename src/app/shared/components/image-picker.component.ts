// src/app/shared/components/image-picker.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { ImageCropperComponent, ImageCroppedEvent, OutputFormat } from 'ngx-image-cropper';
import { UploadService } from '../services/upload.service';

@Component({
  selector: 'app-image-picker',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
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
      }
      .ip-root {
        display: grid;
        gap: 12px;
      }
      .ip-label {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }
      .ip-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .ip-input {
        flex: 1;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        font-size: 14px;
        outline: none;
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
      }
      .ip-input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
      .ip-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid #d1d5db;
        background: #fff;
        font-size: 14px;
        cursor: pointer;
        transition:
          background 0.15s,
          border-color 0.15s;
      }
      .ip-btn:hover {
        background: #f9fafb;
      }
      .ip-btn--primary {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }

      .ip-help {
        font-size: 12px;
        color: #6b7280;
      }

      .ip-progress {
        width: 100%;
        height: 8px;
        background: #eef2ff;
        border-radius: 999px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }
      .ip-progress__bar {
        height: 100%;
        background: #2563eb;
        width: 0%;
        transition: width 0.15s;
      }
      .ip-error {
        font-size: 12px;
        color: #b91c1c;
      }

      .ip-preview {
        position: relative;
        width: 100%;
        max-width: 260px;
        aspect-ratio: 1/1;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        background: #fff;
      }
      .ip-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .ip-toolbar {
        position: absolute;
        inset: auto 8px 8px 8px;
        display: flex;
        gap: 8px;
        justify-content: space-between;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.05));
        padding: 8px;
        border-radius: 10px;
        color: #fff;
      }

      .ip-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      .ip-card {
        width: min(92vw, 980px);
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .ip-card__head {
        padding: 12px 16px;
        font-weight: 600;
        border-bottom: 1px solid #eee;
      }
      .ip-card__body {
        padding: 12px;
      }
      .ip-card__foot {
        padding: 12px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .ip-cropper {
        height: 60vh;
        max-height: 70vh;
      }
      @media (max-width: 480px) {
        .ip-row {
          flex-direction: column;
          align-items: stretch;
        }
        .ip-btn {
          justify-content: center;
        }
        .ip-card {
          width: 98vw;
        }
        .ip-cropper {
          height: 55vh;
        }
      }
    `,
  ],
  template: `
    <div class="ip-root">
      <label *ngIf="label" class="ip-label">{{ label }}</label>

      <!-- URL -->
      <div class="ip-row">
        <input
          class="ip-input"
          [placeholder]="placeholder || 'https://...'"
          [value]="value || ''"
          (input)="onUrlInput($event)"
          [disabled]="disabled || uploading"
        />
        <button
          class="ip-btn"
          type="button"
          (click)="clear()"
          [disabled]="disabled || !value || uploading"
        >
          Clear
        </button>
      </div>

      <!-- Upload -->
      <div class="ip-row">
        <div style="flex:1">
          <div class="ip-help">PNG, JPG, JPEG, GIF, WEBP, SVG — up to {{ maxSizeMb }} MB</div>
        </div>
        <button
          class="ip-btn ip-btn--primary"
          type="button"
          (click)="fileInput?.click()"
          [disabled]="disabled || uploading"
        >
          Upload
        </button>
        <input
          #fileInput
          type="file"
          [accept]="accept"
          [attr.capture]="enableCamera ? 'environment' : null"
          (change)="onFileSelected($event)"
          hidden
        />
      </div>

      <!-- Progress -->
      <div *ngIf="uploading">
        <div class="ip-progress">
          <div class="ip-progress__bar" [style.width.%]="progress"></div>
        </div>
      </div>

      <!-- Preview -->
      <div *ngIf="previewUrl || value as src" class="ip-preview">
        <img [src]="src" alt="Preview" />
        <div class="ip-toolbar">
          <a
            [href]="src"
            target="_blank"
            rel="noopener"
            style="color:#fff;text-decoration:underline;font-size:12px;"
            >Open</a
          >
          <div style="display:flex; gap:8px;">
            <button class="ip-btn" type="button" (click)="reCrop()" [disabled]="uploading">
              Change
            </button>
            <button class="ip-btn" type="button" (click)="clear()" [disabled]="uploading">
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Errors -->
      <div *ngIf="errorMsg" class="ip-error">{{ errorMsg }}</div>
    </div>

    <!-- Modal: Cropper -->
    <div class="ip-modal" *ngIf="showCropper">
      <div class="ip-card">
        <div class="ip-card__head">Crop image</div>
        <div class="ip-card__body">
          <image-cropper
            class="ip-cropper"
            [imageFile]="cropFile"
            [maintainAspectRatio]="!!cropAspectRatio"
            [aspectRatio]="cropAspectRatio || 1"
            [resizeToWidth]="outputWidth || 0"
            [resizeToHeight]="outputHeight || 0"
            [onlyScaleDown]="true"
            [roundCropper]="false"
            [format]="cropFormat"
            [hideResizeSquares]="false"
            [cropperMinWidth]="80"
            [cropperMinHeight]="80"
            [cropperMaxWidth]="4096"
            [cropperMaxHeight]="4096"
            (imageCropped)="onImageCropped($event)"
            (imageLoaded)="onImageLoaded()"
            (loadImageFailed)="onLoadFail()"
          >
          </image-cropper>
        </div>
        <div class="ip-card__foot">
          <button class="ip-btn" type="button" (click)="cancelCrop()">Cancel</button>
          <button class="ip-btn ip-btn--primary" type="button" (click)="applyCrop()">Apply</button>
        </div>
      </div>
    </div>
  `,
})
export class ImagePickerComponent implements ControlValueAccessor, OnDestroy {
  // UI
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() accept = 'image/*';
  @Input() enableCamera = true;
  @Input() maxSizeMb = 10;

  // Crop config
  @Input() enableCrop = true;
  @Input() cropAspectRatio: number | null = 1; // 1 — квадрат, 16/9 и т.д.
  @Input() outputWidth = 512;
  @Input() outputHeight = 512;
  @Input() outputType: 'image/png' | 'image/jpeg' = 'image/png';

  /** 'defer' — грузить при сохранении родителя; 'immediate' — сразу после Apply */
  @Input() uploadMode: 'defer' | 'immediate' = 'defer';

  @Output() uploaded = new EventEmitter<string>(); // итоговый URL (immediate)
  @Output() pendingChange = new EventEmitter<Blob | null>(); // Blob для defer

  private uploadSvc = inject(UploadService);
  private cdr = inject(ChangeDetectorRef);

  value: string | null = null; // значение контрола (URL)
  disabled = false;
  uploading = false;
  progress = 0;
  errorMsg = '';

  // Preview
  previewUrl: string | null = null;
  private lastObjectUrl?: string;

  // Cropper state
  showCropper = false;
  originalFile: File | null = null;
  cropFile?: File; // источник для [imageFile]
  croppedBlob: Blob | null = null;

  // ---- CVA ----
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: string | null) {
    this.value = v ?? null;
    this.setPreviewFromString(this.value);
  }
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  // Формат для кроппера
  get cropFormat(): OutputFormat {
    return this.outputType === 'image/jpeg' ? 'jpeg' : 'png';
  }

  // Вызвать из родителя перед сохранением (в режиме 'defer')
  async uploadPendingIfAny(): Promise<string | null> {
    if (!this.croppedBlob || this.uploadMode !== 'defer') return null;
    const url = await this.uploadBlob(this.croppedBlob);
    this.value = url;
    this.onChange(this.value);
    this.croppedBlob = null;
    this.pendingChange.emit(null);
    this.setPreviewFromString(url);
    return url;
  }

  // ------- URL -------
  onUrlInput(e: Event) {
    this.clearError();
    const v = (e.target as HTMLInputElement).value || null;
    this.value = v;
    this.onChange(this.value);
    this.croppedBlob = null;
    this.pendingChange.emit(null);
    this.setPreviewFromString(v);
  }

  clear() {
    this.value = null;
    this.onChange(this.value);
    this.croppedBlob = null;
    this.pendingChange.emit(null);
    this.setPreviewFromString(null);
    this.clearError();
  }

  // ------- File / Cropper -------
  onFileSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;
    if (!this.validateFile(file)) return;

    this.originalFile = file;
    this.croppedBlob = null; // сбрасываем прошлый pending
    this.cropFile = file; // отдаём файл кропперу
    this.showCropper = true;
  }

  reCrop() {
    if (!this.originalFile) return;
    this.cropFile = this.originalFile;
    this.showCropper = true;
  }

  onImageCropped(e: ImageCroppedEvent) {
    if (!e.base64) return;
    this.croppedBlob = this.base64ToBlob(e.base64, this.outputType);
  }

  onImageLoaded() {
    // можно прятать лоадер, если добавишь
    this.cdr.markForCheck();
  }
  onLoadFail() {
    this.errorMsg = 'Failed to load image.';
  }

  cancelCrop() {
    this.showCropper = false;
    // текущий превью/value не трогаем
  }

  async applyCrop() {
    this.showCropper = false;

    // если кроп отключён (enableCrop=false) и blob ещё не создан — работаем с оригиналом
    if (!this.croppedBlob && this.originalFile && !this.enableCrop) {
      if (this.uploadMode === 'immediate') {
        const url = await this.uploadOriginal(this.originalFile);
        this.value = url;
        this.onChange(this.value);
        this.setPreviewFromString(url);
        this.uploaded.emit(url);
      } else {
        this.setPreviewFromBlob(this.originalFile);
        this.pendingChange.emit(this.originalFile);
      }
      return;
    }

    if (!this.croppedBlob) return;

    if (this.uploadMode === 'immediate') {
      const url = await this.uploadBlob(this.croppedBlob);
      this.value = url;
      this.onChange(this.value);
      this.setPreviewFromString(url);
      this.uploaded.emit(url);
      this.croppedBlob = null;
      this.pendingChange.emit(null);
    } else {
      // defer: показываем превью и отдаём Blob наружу
      this.setPreviewFromBlob(this.croppedBlob);
      this.pendingChange.emit(this.croppedBlob);
    }
  }

  // ------- Helpers -------
  private validateFile(file: File): boolean {
    const max = this.maxSizeMb * 1024 * 1024;
    if (file.size > max) {
      this.errorMsg = `File is too large. Max ${this.maxSizeMb} MB.`;
      return false;
    }
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    if (!allowed.includes(file.type)) {
      this.errorMsg = 'Unsupported file type.';
      return false;
    }
    this.clearError();
    return true;
  }

  private setPreviewFromBlob(blob: Blob) {
    this.revokePreview();
    const url = URL.createObjectURL(blob);
    this.previewUrl = url;
    this.lastObjectUrl = url;
    this.cdr.markForCheck();
  }

  private setPreviewFromString(url: string | null) {
    this.revokePreview();
    this.previewUrl = url;
    this.cdr.markForCheck();
  }

  private revokePreview() {
    if (this.lastObjectUrl) {
      URL.revokeObjectURL(this.lastObjectUrl);
      this.lastObjectUrl = undefined;
    }
  }

  private async uploadOriginal(file: File) {
    const url = await this.uploadBlob(file);
    return url;
  }

  private async uploadBlob(blob: Blob): Promise<string> {
    this.uploading = true;
    this.progress = 0;
    return new Promise<string>((resolve, reject) => {
      const file = new File([blob], 'image.' + (this.outputType === 'image/jpeg' ? 'jpg' : 'png'), {
        type: this.outputType,
      });
      this.uploadSvc.uploadImage(file).subscribe({
        next: (evt) => {
          if (evt.type === HttpEventType.UploadProgress && evt.total) {
            this.progress = Math.round((evt.loaded / evt.total) * 100);
          } else if (evt.type === HttpEventType.Response) {
            this.uploading = false;
            this.progress = 0;
            resolve(evt.body!.url);
          }
        },
        error: (err) => {
          this.uploading = false;
          this.progress = 0;
          this.errorMsg = 'Upload failed. Try again.';
          reject(err);
        },
      });
    });
  }

  private base64ToBlob(base64: string, mime: 'image/png' | 'image/jpeg'): Blob {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    const len = bstr.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bstr.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  private clearError() {
    this.errorMsg = '';
  }

  ngOnDestroy() {
    this.revokePreview();
  }
}

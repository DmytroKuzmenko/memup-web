import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

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
      }
      .row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .btn {
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        background: #fff;
        cursor: pointer;
      }
      .btn-primary {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }
      .input {
        flex: 1;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
      }

      .preview {
        position: relative;
        width: 100%;
        max-width: 260px;
        aspect-ratio: 1/1;
        height: 260px;
        border: 2px dashed #60a5fa;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        margin-top: 12px;
      }
      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .toolbar {
        position: absolute;
        left: 8px;
        right: 8px;
        bottom: 8px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.05));
        padding: 8px;
        border-radius: 10px;
        color: #fff;
      }
      .toolbar .btn {
        color: #111827;
        background: #fff;
        border-color: #e5e7eb;
      }

      .modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
        z-index: 9999;
      }
      .card {
        width: min(92vw, 980px);
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .card-head {
        padding: 12px 16px;
        font-weight: 600;
        border-bottom: 1px solid #eee;
      }
      .card-body {
        padding: 12px;
      }
      .card-foot {
        padding: 12px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .editor-wrap {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 16px;
        align-items: start;
      }
      .editor {
        display: grid;
        gap: 12px;
        justify-items: center;
      }
      .canvas-box {
        width: min(80vmin, 560px);
        max-width: 560px;
      }
      .canvas {
        width: 100%;
        height: auto;
        background: #111;
        border-radius: 12px;
        touch-action: none;
        border: 1px solid #e5e7eb;
      }
      .side-preview {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 1/1;
      }
      .side-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ctrls {
        width: 100%;
        display: grid;
        gap: 6px;
      }
      .ctrls label {
        font-size: 12px;
        color: #374151;
      }
      .range {
        width: 100%;
      }
      @media (max-width: 860px) {
        .editor-wrap {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <!-- URL + кнопки -->
    <div class="row">
      <input
        class="input"
        [value]="value || ''"
        placeholder="https://..."
        (input)="onUrl($event)"
      />
      <button
        class="btn"
        type="button"
        (click)="clear()"
        [disabled]="!value && !liveDataUrl && !rawPreviewUrl"
      >
        Clear
      </button>
      <button class="btn btn-primary" type="button" (click)="fileInput.click()">Upload</button>
      <input #fileInput type="file" [accept]="accept" (change)="onFileChange($event)" hidden />
    </div>

    <!-- Внешний превью: приоритеты: live -> raw -> value -->
    <div class="preview">
      <img
        *ngIf="liveDataUrl || rawPreviewUrl || value"
        [src]="liveDataUrl || rawPreviewUrl || value"
        alt="preview"
      />
      <div *ngIf="!(liveDataUrl || rawPreviewUrl || value)" style="color:#6b7280; font-size:12px;">
        No image yet
      </div>

      <div class="toolbar" *ngIf="liveDataUrl || rawPreviewUrl || value">
        <a
          [href]="(liveDataUrl || rawPreviewUrl || value)!"
          target="_blank"
          rel="noopener"
          style="color:#fff;text-decoration:underline;font-size:12px;"
          >Open</a
        >
        <div style="display:flex; gap:8px;">
          <button class="btn" type="button" (click)="openEditor()" [disabled]="!imgLoaded">
            Change
          </button>
          <button class="btn" type="button" (click)="clear()">Remove</button>
        </div>
      </div>
    </div>

    <!-- Модалка редактора (canvas crop) -->
    <div class="modal" *ngIf="showEditor">
      <div class="card">
        <div class="card-head">Crop image</div>
        <div class="card-body">
          <div class="editor-wrap">
            <div class="editor">
              <div class="canvas-box">
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
                <label>Zoom: {{ zoom | number: '1.2-2' }}x</label>
                <input
                  class="range"
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  [(ngModel)]="zoom"
                  (input)="render()"
                />
              </div>
            </div>

            <div>
              <div class="side-preview">
                <img *ngIf="liveDataUrl" [src]="liveDataUrl" alt="live" />
                <div
                  *ngIf="!liveDataUrl"
                  style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:12px;"
                >
                  Move/zoom to preview
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-foot">
          <button class="btn" type="button" (click)="closeEditor()">Cancel</button>
          <button class="btn btn-primary" type="button" (click)="apply()">Apply</button>
        </div>
      </div>
    </div>
  `,
})
export class ImagePickerComponent implements ControlValueAccessor {
  // Inputs
  @Input() accept = 'image/png,image/jpeg,image/jpg,image/webp,image/gif'; // без SVG
  @Input() outputType: 'image/png' | 'image/jpeg' = 'image/png';
  @Input() cropSize = 600; // px

  // Outputs
  @Output() changed = new EventEmitter<string>();

  // Refs
  @ViewChild('canvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;

  // CVA
  value: string | null = null;
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: string | null): void {
    this.value = v ?? null;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(_: boolean): void {}

  // State
  showEditor = false;
  rawPreviewUrl: string | null = null; // objectURL выбранного файла
  liveDataUrl: string | null = null; // текущий кроп (dataURL)
  private objectUrlToRevoke?: string;

  // Изображение и трансформация
  private img = new Image();
  imgLoaded = false;
  zoom = 1;
  minZoom = 1;
  private posX = 0;
  private posY = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private startPosX = 0;
  private startPosY = 0;

  // Handlers
  onUrl(ev: Event) {
    const v = (ev.target as HTMLInputElement).value || null;
    this.value = v;
    this.onChange(this.value);
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validate(file)) return;

    // Показать сырой превью
    this.revokeObjectUrl();
    this.objectUrlToRevoke = URL.createObjectURL(file);
    this.rawPreviewUrl = this.objectUrlToRevoke;

    // Загрузить в <img> для редактора
    this.img = new Image();
    this.img.onload = () => {
      this.imgLoaded = true;
      this.setupEditor();
    };
    this.img.onerror = () => {
      this.imgLoaded = false;
      console.error('[picker] Failed to load image');
    };
    this.img.src = this.objectUrlToRevoke;
  }

  openEditor() {
    if (!this.imgLoaded) return;
    this.showEditor = true;
    setTimeout(() => this.setupCanvas(), 0);
  }

  closeEditor() {
    this.showEditor = false;
  }

  apply() {
    if (this.liveDataUrl) {
      this.value = this.liveDataUrl;
      this.onChange(this.value);
      this.changed.emit(this.value);
    }
    this.showEditor = false;
  }

  clear() {
    this.value = null;
    this.onChange(this.value);
    this.liveDataUrl = null;
    this.rawPreviewUrl = null;
    this.imgLoaded = false;
    this.revokeObjectUrl();
  }

  // Canvas editor
  private setupEditor() {
    this.showEditor = true;
    setTimeout(() => this.setupCanvas(), 0);
  }

  private setupCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const size = Math.min(this.cropSize, 800);
    canvas.width = size;
    canvas.height = size;

    const sx = size / this.img.width;
    const sy = size / this.img.height;
    this.minZoom = Math.max(sx, sy);
    this.zoom = this.minZoom;

    const drawW = this.img.width * this.zoom;
    const drawH = this.img.height * this.zoom;
    this.posX = (size - drawW) / 2;
    this.posY = (size - drawH) / 2;

    this.render();
  }

  render() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imgLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const drawW = this.img.width * this.zoom;
    const drawH = this.img.height * this.zoom;

    // ограничиваем перемещение, чтобы не было пустых полей
    this.posX = Math.min(0, Math.max(this.posX, size - drawW));
    this.posY = Math.min(0, Math.max(this.posY, size - drawH));

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, size, size);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, this.posX, this.posY, drawW, drawH);

    this.liveDataUrl = canvas.toDataURL(this.outputType);
  }

  // Drag to pan
  onPointerDown(ev: PointerEvent) {
    if (!this.imgLoaded) return;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.setPointerCapture(ev.pointerId);

    this.isDragging = true;
    this.dragStartX = ev.clientX;
    this.dragStartY = ev.clientY;
    this.startPosX = this.posX;
    this.startPosY = this.posY;
  }

  onPointerMove(ev: PointerEvent) {
    if (!this.isDragging || !this.imgLoaded) return;
    const dx = ev.clientX - this.dragStartX;
    const dy = ev.clientY - this.dragStartY;
    this.posX = this.startPosX + dx;
    this.posY = this.startPosY + dy;
    this.render();
  }

  onPointerUp(ev: PointerEvent) {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) canvas.releasePointerCapture(ev.pointerId);
    this.isDragging = false;
  }

  // Utils
  validate(file: File): boolean {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    return allowed.includes(file.type) && file.size <= 10 * 1024 * 1024;
  }

  revokeObjectUrl() {
    if (this.objectUrlToRevoke) {
      URL.revokeObjectURL(this.objectUrlToRevoke);
      this.objectUrlToRevoke = undefined;
    }
  }

  async uploadPendingIfAny(): Promise<string | null> {
    return null;
  } // совместимость со старым кодом
}

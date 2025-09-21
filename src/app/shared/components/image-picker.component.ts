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

      /* Внешний превью (кликабельно) */
      .preview {
        position: relative;
        width: 100%;
        border: 2px dashed #60a5fa;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        margin-top: 8px;
        cursor: pointer;
        user-select: none;
      }
      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .hint {
        color: #6b7280;
        font-size: 13px;
        text-align: center;
        padding: 0 10px;
      }

      .toolbar {
        position: absolute;
        right: 8px;
        bottom: 8px;
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.9);
        padding: 6px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }
      .btn {
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
      }
      .btn-danger {
        background: #ef4444;
        color: #fff;
        border-color: #ef4444;
      }
      .btn-quiet {
        background: #fff;
        color: #111827;
        border-color: #e5e7eb;
      }
      .hidden {
        display: none !important;
      }

      /* Полноэкранная модалка */
      .modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: stretch;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
        z-index: 9999;
      }
      .card {
        width: 100%;
        max-width: 980px;
        background: #fff;
        border-radius: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .card-head {
        padding: 14px 16px;
        font-weight: 600;
        border-bottom: 1px solid #eee;
        position: sticky;
        top: 0;
        background: #fff;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .card-body {
        padding: 12px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card-foot {
        padding: 12px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 8px;
        justify-content: space-between;
        position: sticky;
        bottom: 0;
        background: #fff;
        z-index: 5;
      }

      /* Редактор */
      .editor {
        width: 100%;
        margin: 0 auto;
        display: grid;
        gap: 14px;
      }
      .canvas-wrap {
        width: 100%;
        display: flex;
        justify-content: center;
        margin: 0 auto;
      }
      .canvas {
        width: 100%;
        height: auto;
        background: #111;
        border-radius: 16px;
        touch-action: none;
        border: 1px solid #e5e7eb;
      }

      .ctrls {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 10px;
        align-items: center;
      }
      .range {
        width: 100%;
      }
      .icon-btn {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (min-width: 721px) {
        .card {
          border-radius: 16px;
          margin: 24px;
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
      [style.max-width.px]="previewWidth"
      [style.height.px]="previewHeightComputed"
      (click)="onPreviewClick()"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event)"
    >
      <img
        *ngIf="liveDataUrl || rawPreviewUrl || value"
        [src]="liveDataUrl || rawPreviewUrl || value"
        alt="preview"
      />
      <div *ngIf="!(liveDataUrl || rawPreviewUrl || value)" class="hint">
        Tap to upload<br />(or drop a file)
      </div>

      <div class="toolbar" *ngIf="liveDataUrl || rawPreviewUrl || value">
        <button
          class="btn btn-quiet"
          type="button"
          (click)="openEditor(); $event.stopPropagation()"
          [disabled]="mode === 'original'"
        >
          Edit
        </button>
        <button
          class="btn btn-quiet"
          type="button"
          (click)="triggerPick(); $event.stopPropagation()"
        >
          Change
        </button>
        <button class="btn btn-danger" type="button" (click)="clear(); $event.stopPropagation()">
          Remove
        </button>
      </div>
    </div>

    <!-- полноэкранный редактор (только для mode='crop') -->
    <div class="modal" *ngIf="showEditor && mode === 'crop'">
      <div class="card">
        <div class="card-head">
          <span>Crop image</span>
          <button class="btn btn-quiet" type="button" (click)="closeEditor()">Close</button>
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
                min="1"
                [max]="maxZoom"
                step="0.01"
                [(ngModel)]="zoom"
                (input)="onSliderZoom()"
              />
              <button class="btn icon-btn" type="button" (click)="bumpZoom(-0.1)">−</button>
              <button class="btn icon-btn" type="button" (click)="bumpZoom(+0.1)">+</button>
            </div>
          </div>
        </div>

        <div class="card-foot">
          <button class="btn btn-quiet" type="button" (click)="closeEditor()">Cancel</button>
          <button
            class="btn"
            type="button"
            (click)="apply()"
            style="background:#2563EB;color:#fff;border-color:#2563EB;"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ImagePickerComponent implements ControlValueAccessor {
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
    if (this.mode === 'original') {
      // При "original" редактор не нужен — повторный клик открывает смену файла
      this.triggerPick();
      return;
    }
    if (this.liveDataUrl || this.rawPreviewUrl || this.value) this.openEditor();
    else this.triggerPick();
  }
  triggerPick() {
    this.fileInputRef?.nativeElement.click();
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validate(file)) return;

    // Быстрый внешний превью
    this.revokeObjectUrl();
    this.objectUrlToRevoke = URL.createObjectURL(file);
    this.rawPreviewUrl = this.objectUrlToRevoke;

    // Режим "original": сохранить как есть, без редактора
    if (this.mode === 'original') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.value = dataUrl;
        this.onChange(this.value);
        this.liveDataUrl = dataUrl; // показываем на форме
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
      this.imgLoaded = true;
      this.openEditor();
      this.setupCanvas();
      setTimeout(() => {
        if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
      }, 0);
    };
    this.img.onerror = () => {
      this.imgLoaded = false;
    };
    this.img.src = this.objectUrlToRevoke;
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const fake = { target: { files: [file] } } as any as Event;
    this.onFileChange(fake);
  }

  openEditor() {
    if (!this.imgLoaded || this.mode !== 'crop') return;
    this.showEditor = true;
    setTimeout(() => this.setupCanvas(), 0);
  }
  closeEditor() {
    this.showEditor = false;
    this.pointers.clear();
  }

  apply() {
    // финализируем кроп в точном размере (outW × outH)
    const data = this.renderToOutput();
    if (data) {
      this.value = data;
      this.onChange(this.value);
      this.changed.emit(this.value);
      this.liveDataUrl = data;
    }
    this.closeEditor();
  }

  clear() {
    this.value = null;
    this.onChange(this.value);
    this.liveDataUrl = null;
    this.rawPreviewUrl = null;
    this.imgLoaded = false;
    this.pointers.clear();
    this.revokeObjectUrl();
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
    this.zoom = this.minZoom;

    const drawW = this.img.width * this.zoom;
    const drawH = this.img.height * this.zoom;
    this.posX = (cw - drawW) / 2;
    this.posY = (ch - drawH) / 2;

    const rect = canvas.getBoundingClientRect();
    this.pointerScale = canvas.width / rect.width;

    this.render(); // показать live превью сразу
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

  private render() {
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

    // live превью — сразу в целевом размере и формате
    this.liveDataUrl = this.renderToOutput();
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

    this.render();
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
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imgLoaded) return;

    if (!this.pointers.has(ev.pointerId)) return;
    this.pointers.set(ev.pointerId, ev);

    if (this.pointers.size === 1 && this.isDragging) {
      const dx = (ev.clientX - this.dragStartX) * this.pointerScale;
      const dy = (ev.clientY - this.dragStartY) * this.pointerScale;
      this.posX = this.startPosX + dx;
      this.posY = this.startPosY + dy;
      this.render();
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
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) canvas.releasePointerCapture(ev.pointerId);
    this.pointers.delete(ev.pointerId);
    if (this.pointers.size <= 1) {
      this.isDragging = false;
      this.pinchStartDist = 0;
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
    return null;
  }
}

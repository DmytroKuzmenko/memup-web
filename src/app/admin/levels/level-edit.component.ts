import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SectionService, Section } from '../../section.service';
import { LevelService, Level } from '../../level.service';
import { TaskService, Task } from '../../task.service';

import { ImagePickerComponent } from '../../shared/components/image-picker.component';
import { Observable, take } from 'rxjs';

@Component({
  selector: 'app-level-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImagePickerComponent],
  templateUrl: './level-edit.component.html',
})
export class LevelEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectionsSvc = inject(SectionService);
  private levelsSvc = inject(LevelService);
  private taskSvc = inject(TaskService);

  @ViewChild('levelImagePicker') levelImagePicker?: ImagePickerComponent;
  @ViewChild('animationImagePicker') animationImagePicker?: ImagePickerComponent;

  id: string | null = null;

  /** Секции теперь как поток из API */
  sections$!: Observable<Section[]>;

  /** Пока задачи остаются синхронно из TaskService */
  tasks: Task[] = [];

  form = this.fb.group({
    sectionId: [null as string | null, Validators.required],
    name: ['', [Validators.required, Validators.minLength(1)]],
    imagePath: [''],
    headerText: [''], // изменено с prefaceText на headerText
    animationImagePath: [''],
    orderIndex: [null as number | null],
    status: [1, Validators.required],
    timeLimitSec: [null as number | null], // изменено с timeLimitSeconds на timeLimitSec
  });

  get isEdit() {
    return this.id !== null;
  }

  ngOnInit() {
    console.log('=== LEVEL EDIT COMPONENT INIT ===');

    // Загружаем список секций из API (Observable)
    this.sections$ = this.sectionsSvc.getSections();

    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam || null;
    console.log('ID parameter:', idParam);
    console.log('Parsed ID:', this.id);
    console.log('Is edit mode:', this.isEdit);

    const qpSectionId = this.route.snapshot.queryParamMap.get('sectionId');
    if (!this.id && qpSectionId) {
      console.log('Setting sectionId from query param:', qpSectionId);
      this.form.patchValue({ sectionId: qpSectionId });
    }

    if (this.id) {
      console.log('Loading level with ID:', this.id);
      this.levelsSvc
        .getLevelById(this.id)
        .pipe(take(1))
        .subscribe({
          next: (level) => {
            console.log('✅ Level data received:', level);
            this.form.patchValue({
              sectionId: level.sectionId,
              name: level.name,
              imagePath: level.imagePath ?? '',
              headerText: level.headerText ?? '', // изменено с prefaceText на headerText
              animationImagePath: level.animationImagePath ?? '',
              orderIndex: level.orderIndex ?? null,
              status: level.status,
              timeLimitSec: level.timeLimitSec ?? null, // изменено с timeLimitSeconds на timeLimitSec
            });
            console.log('Form values after patch:', this.form.getRawValue());
          },
          error: (error) => {
            console.error('❌ Error loading level:', error);
          },
        });
      this.loadTasks();
    } else {
      console.log('Creating new level (no ID)');
    }

    console.log('=== END LEVEL EDIT INIT ===');
  }

  // сортировка задач на вывод
  get tasksSorted(): Task[] {
    return [...this.tasks].sort((a, b) => {
      const ao = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const bo = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });
  }

  async save() {
    console.log('=== LEVEL SAVE ===');
    console.log('LevelImagePicker:', this.levelImagePicker);
    console.log('AnimationImagePicker:', this.animationImagePicker);

    // Загружаем изображения если есть
    const imageUrl = await this.levelImagePicker?.uploadPendingIfAny();
    const animationUrl = await this.animationImagePicker?.uploadPendingIfAny();

    console.log('Image upload URL result:', imageUrl);
    console.log('Animation upload URL result:', animationUrl);

    if (imageUrl) {
      console.log('Updating form with image URL:', imageUrl);
      this.form.patchValue({ imagePath: imageUrl });
    }

    if (animationUrl) {
      console.log('Updating form with animation URL:', animationUrl);
      this.form.patchValue({ animationImagePath: animationUrl });
    }

    if (this.form.invalid) {
      console.log('Form is invalid');
      return;
    }

    const v = this.form.getRawValue();
    console.log('Form values:', v);

    const dto: Partial<Level> = {
      sectionId: v.sectionId!,
      name: v.name!,
      imagePath: v.imagePath || '',
      headerText: v.headerText || '', // изменено с prefaceText на headerText
      animationImagePath: v.animationImagePath || '',
      orderIndex: v.orderIndex != null ? Number(v.orderIndex) : undefined,
      timeLimitSec: v.timeLimitSec != null ? Number(v.timeLimitSec) : undefined, // изменено с timeLimitSeconds на timeLimitSec
      status: Number(v.status),
    };

    if (this.isEdit) {
      this.levelsSvc
        .updateLevel(this.id!, dto)
        .pipe(take(1))
        .subscribe({
          next: () => {
            console.log('✅ Level updated successfully');
            this.router.navigate(['/admin/sections', dto.sectionId]);
          },
          error: (error) => {
            console.error('❌ Error updating level:', error);
          },
        });
    } else {
      this.levelsSvc
        .addLevel(dto)
        .pipe(take(1))
        .subscribe({
          next: () => {
            console.log('✅ Level created successfully');
            this.router.navigate(['/admin/sections', dto.sectionId]);
          },
          error: (error) => {
            console.error('❌ Error creating level:', error);
          },
        });
    }
  }

  cancel() {
    const sid = this.route.snapshot.queryParamMap.get('sectionId');
    if (sid) this.router.navigate(['/admin/sections', sid]);
    else this.router.navigate(['/admin/sections']);
  }

  private loadTasks() {
    if (!this.id) return;
    // Временно используем числовой ID для мок-сервиса задач
    const numericId = parseInt(this.id, 10);
    if (!isNaN(numericId)) {
      this.tasks = this.taskSvc.getTasks(numericId);
    }
  }

  openAddTask() {
    if (!this.id) return;
    this.router.navigate(['/admin/tasks/new'], { queryParams: { levelId: this.id } });
  }

  openEditTask(t: Task) {
    const levelId = this.id ?? t.levelId;
    this.router.navigate(['/admin/tasks', t.id], { queryParams: { levelId } });
  }

  deleteTask(id: number) {
    if (confirm('Delete this task?')) {
      this.taskSvc.deleteTask(id);
      this.loadTasks();
    }
  }

  trackByTaskId = (_: number, x: Task) => x.id;

  // даты уровня для read-only отображения (теперь из Observable)
  get levelDates(): Level | null {
    // Этот геттер больше не используется, так как данные загружаются асинхронно
    // Можно удалить или оставить для совместимости
    return null;
  }
}

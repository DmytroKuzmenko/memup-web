import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { TaskService, Task, TaskOption, TaskType } from '../../task.service';
import { LevelService, Level } from '../../level.service';

import { ImagePickerComponent } from '../../shared/components/image-picker.component';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImagePickerComponent],
  templateUrl: './task-edit.component.html',
})
export class TaskEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskSvc = inject(TaskService);
  private levelSvc = inject(LevelService);

  id: string | null = null;
  /** Секции теперь как поток из API */
  levels$!: Observable<Level[]>;

  form = this.fb.group({
    levelId: [null as string | null, Validators.required],
    internalName: ['', [Validators.required, Validators.minLength(1)]], // было title
    type: ['text_choice' as TaskType, Validators.required],
    headerText: [''], // было topText
    imagePath: [''], // было taskImagePath
    taskImageSource: [''],
    resultImagePath: [''],
    resultImageSource: [''],
    orderIndex: [null as number | null],
    status: [1, Validators.required],
    timeLimitSec: [null as number | null], // было timeLimitSeconds
    pointsAttempt1: [null as number | null], // было pointsFirst
    pointsAttempt2: [null as number | null], // было pointsSecond
    pointsAttempt3: [null as number | null], // было pointsThird
    explanationText: [''],

    // anagram
    charsCsv: [''],
    correctAnswer: [''],

    // options
    options: this.fb.array<FormGroup>([]),
  });

  get options(): FormArray<FormGroup> {
    return this.form.get('options') as FormArray<FormGroup>;
  }

  get isEdit() {
    return this.id !== null;
  }

  ngOnInit() {
    console.log('=== TASK EDIT COMPONENT INIT ===');

    // Получаем sectionId из query параметров или из текущей задачи
    const qpSectionId = this.route.snapshot.queryParamMap.get('sectionId');
    const qpLevelId = this.route.snapshot.queryParamMap.get('levelId');

    console.log('Query params - sectionId:', qpSectionId, 'levelId:', qpLevelId);

    if (qpSectionId) {
      console.log('Loading levels for section:', qpSectionId);
      this.levels$ = this.levelSvc.getLevels(qpSectionId);
    } else {
      console.log('Loading all levels');
      this.levels$ = this.levelSvc.getAllLevels();
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam || null;
    console.log('Task ID:', this.id, 'Is edit mode:', this.isEdit);

    if (!this.id && qpLevelId) {
      console.log('Setting levelId from query param:', qpLevelId);
      this.form.patchValue({ levelId: qpLevelId });
    }

    if (this.id) {
      this.taskSvc.getTaskById(this.id).subscribe({
        next: (task) => {
          console.log('✅ Task data received:', task);
          this.form.patchValue({
            levelId: task.levelId,
            internalName: task.internalName,
            type: task.type,
            headerText: task.headerText ?? '',
            imagePath: task.imagePath ?? '',
            taskImageSource: task.taskImageSource ?? '',
            resultImagePath: task.resultImagePath ?? '',
            resultImageSource: task.resultImageSource ?? '',
            orderIndex: task.orderIndex ?? null,
            status: task.status,
            timeLimitSec: task.timeLimitSec ?? null,
            pointsAttempt1: task.pointsAttempt1 ?? null,
            pointsAttempt2: task.pointsAttempt2 ?? null,
            pointsAttempt3: task.pointsAttempt3 ?? null,
            explanationText: task.explanationText ?? '',
            charsCsv: task.charsCsv ?? '',
            correctAnswer: task.correctAnswer ?? '',
          });

          (task.options ?? [])
            .filter((option) => option.label && option.label.trim() !== '') // Фильтруем пустые опции при загрузке
            .forEach((o) => {
              this.options.push(
                this.fb.group({
                  id: [o.id ?? null],
                  label: [o.label, Validators.required],
                  isCorrect: [o.isCorrect],
                  imageUrl: [o.imageUrl ?? ''],
                }),
              );
            });
          console.log('Form values after patch:', this.form.getRawValue());
        },
        error: (error) => {
          console.error('❌ Error loading task:', error);
        },
      });
    }

    // Убираем автоматическое добавление пустой опции
    // Пользователь может добавить опции вручную через кнопку "Add option"

    console.log('=== END TASK EDIT INIT ===');
  }

  addOption() {
    this.options.push(
      this.fb.group({
        id: [null as string | null],
        label: ['', Validators.required],
        isCorrect: [false],
        imageUrl: [''],
      }),
    );
  }

  removeOption(i: number) {
    this.options.removeAt(i);
  }

  async save() {
    console.log('=== TASK SAVE ===');
    console.log('Form valid:', this.form.valid);
    console.log('Form errors:', this.form.errors);
    console.log('Form value:', this.form.value);

    if (this.form.invalid) {
      console.log('Form is invalid');
      console.log('Form status:', this.form.status);
      // Логируем ошибки каждого поля
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control && control.errors) {
          console.log(`Field ${key} errors:`, control.errors);
        }
      });
      return;
    }

    const v = this.form.getRawValue();
    console.log('Form values:', v);

    const mappedOptions = (this.options.controls as FormGroup[])
      .map((g) => {
        const val = g.getRawValue() as {
          id: string | null;
          label: string;
          isCorrect: boolean;
          imageUrl?: string;
        };

        const option: TaskOption = {
          label: val.label || '',
          isCorrect: !!val.isCorrect,
          imageUrl: val.imageUrl || undefined,
        };

        if (val.id) {
          option.id = val.id;
        }

        return option;
      })
      .filter((option) => option.label && option.label.trim() !== ''); // Фильтруем пустые опции

    const dto: Partial<Task> = {
      levelId: v.levelId!,
      internalName: v.internalName!,
      type: v.type!,
      headerText: v.headerText || '',
      imagePath: v.imagePath || '',
      taskImageSource: v.taskImageSource || '',
      resultImagePath: v.resultImagePath || '',
      resultImageSource: v.resultImageSource || '',
      orderIndex: v.orderIndex != null ? Number(v.orderIndex) : undefined,
      status: Number(v.status),
      timeLimitSec: v.timeLimitSec != null ? Number(v.timeLimitSec) : undefined,
      pointsAttempt1: v.pointsAttempt1 != null ? Number(v.pointsAttempt1) : undefined,
      pointsAttempt2: v.pointsAttempt2 != null ? Number(v.pointsAttempt2) : undefined,
      pointsAttempt3: v.pointsAttempt3 != null ? Number(v.pointsAttempt3) : undefined,
      explanationText: v.explanationText || '',
      charsCsv: v.charsCsv || '',
      correctAnswer: v.correctAnswer || '',
      options: mappedOptions,
    };

    if (this.isEdit) {
      this.taskSvc.updateTask(this.id!, dto).subscribe({
        next: () => {
          console.log('✅ Task updated successfully');
          this.router.navigate(['/admin/levels', dto.levelId!]);
        },
        error: (error) => {
          console.error('❌ Error updating task:', error);
        },
      });
    } else {
      this.taskSvc.addTask(dto).subscribe({
        next: () => {
          console.log('✅ Task created successfully');
          this.router.navigate(['/admin/levels', dto.levelId!]);
        },
        error: (error) => {
          console.error('❌ Error creating task:', error);
        },
      });
    }
  }

  cancel() {
    const qpLevelId = this.route.snapshot.queryParamMap.get('levelId');
    const currentLevelId = this.form.value.levelId ?? qpLevelId;
    if (currentLevelId) this.router.navigate(['/admin/levels', currentLevelId]);
    else this.router.navigate(['/admin/sections']);
  }
}

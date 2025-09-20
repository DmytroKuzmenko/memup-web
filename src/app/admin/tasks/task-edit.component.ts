import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TaskService, Task, TaskType } from '../../task.service';
import { LevelService, Level } from '../../level.service';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-edit.component.html',
})
export class TaskEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskSvc = inject(TaskService);
  private levelSvc = inject(LevelService);

  id: number | null = null;
  levels: Level[] = [];

  form = this.fb.group({
    levelId: [null as number | null, Validators.required],
    title: ['', [Validators.required, Validators.minLength(1)]],
    type: ['text_choice' as TaskType, Validators.required],
    topText: [''],
    imagePath: [''],
    orderIndex: [null as number | null],
    status: [1, Validators.required],
    timeLimitSeconds: [null as number | null],
    pointsFirst: [null as number | null],
    pointsSecond: [null as number | null],
    pointsThird: [null as number | null],
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
    this.levels = this.levelSvc.getLevels();
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;

    const qpLevelId = this.route.snapshot.queryParamMap.get('levelId');
    if (!this.id && qpLevelId) this.form.patchValue({ levelId: Number(qpLevelId) });

    if (this.id) {
      const t = this.taskSvc.getTaskById(this.id);
      if (t) {
        this.form.patchValue({
          levelId: t.levelId,
          title: t.title,
          type: t.type,
          topText: t.topText ?? '',
          imagePath: t.imagePath ?? '',
          orderIndex: t.orderIndex ?? null,
          status: t.status,
          timeLimitSeconds: t.timeLimitSeconds ?? null,
          pointsFirst: t.pointsFirst ?? null,
          pointsSecond: t.pointsSecond ?? null,
          pointsThird: t.pointsThird ?? null,
          explanationText: t.explanationText ?? '',
          charsCsv: t.charsCsv ?? '',
          correctAnswer: t.correctAnswer ?? '',
        });

        (t.options ?? []).forEach((o) => {
          this.options.push(
            this.fb.group({
              label: [o.label, Validators.required],
              isCorrect: [o.isCorrect],
              imageUrl: [o.imageUrl ?? ''],
            }),
          );
        });
      }
    }

    if (
      this.options.length === 0 &&
      (this.form.value.type === 'text_choice' || this.form.value.type === 'image_choice')
    ) {
      this.addOption();
    }
  }

  addOption() {
    this.options.push(
      this.fb.group({
        label: ['', Validators.required],
        isCorrect: [false],
        imageUrl: [''],
      }),
    );
  }

  removeOption(i: number) {
    this.options.removeAt(i);
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    const mappedOptions = (this.options.controls as FormGroup[]).map((g) => {
      const val = g.getRawValue() as { label: string; isCorrect: boolean; imageUrl?: string };
      return {
        label: val.label || '',
        isCorrect: !!val.isCorrect,
        imageUrl: val.imageUrl || undefined,
      };
    });

    const dto: Partial<Task> = {
      levelId: Number(v.levelId),
      title: v.title!,
      type: v.type!,
      topText: v.topText || '',
      imagePath: v.imagePath || '',
      orderIndex: v.orderIndex != null ? Number(v.orderIndex) : undefined,
      status: Number(v.status),
      timeLimitSeconds: v.timeLimitSeconds != null ? Number(v.timeLimitSeconds) : undefined,
      pointsFirst: v.pointsFirst != null ? Number(v.pointsFirst) : undefined,
      pointsSecond: v.pointsSecond != null ? Number(v.pointsSecond) : undefined,
      pointsThird: v.pointsThird != null ? Number(v.pointsThird) : undefined,
      explanationText: v.explanationText || '',
      charsCsv: v.charsCsv || '',
      correctAnswer: v.correctAnswer || '',
      options: mappedOptions,
    };

    if (this.isEdit) this.taskSvc.updateTask(this.id!, dto);
    else this.taskSvc.addTask(dto);

    this.router.navigate(['/admin/levels', dto.levelId!]);
  }

  cancel() {
    const qpLevelId = this.route.snapshot.queryParamMap.get('levelId');
    const currentLevelId = this.form.value.levelId ?? (qpLevelId ? Number(qpLevelId) : null);
    if (currentLevelId) this.router.navigate(['/admin/levels', Number(currentLevelId)]);
    else this.router.navigate(['/admin/sections']);
  }
}

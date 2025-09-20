import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SectionService, Section } from '../../section.service';
import { LevelService, Level } from '../../level.service';
import { TaskService, Task } from '../../task.service';

@Component({
  selector: 'app-level-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './level-edit.component.html',
})
export class LevelEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectionsSvc = inject(SectionService);
  private levelsSvc = inject(LevelService);
  private taskSvc = inject(TaskService);

  id: number | null = null;
  sections: Section[] = [];
  tasks: Task[] = [];

  form = this.fb.group({
    sectionId: [null as number | null, Validators.required],
    name: ['', [Validators.required, Validators.minLength(1)]],
    imagePath: [''],
    prefaceText: [''],
    animationImagePath: [''],
    orderIndex: [null as number | null],
    status: [1, Validators.required],
    timeLimitSeconds: [null as number | null],
  });

  get isEdit() {
    return this.id !== null;
  }

  ngOnInit() {
    this.sections = this.sectionsSvc.getSections();
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;

    const qpSectionId = this.route.snapshot.queryParamMap.get('sectionId');
    if (!this.id && qpSectionId) this.form.patchValue({ sectionId: Number(qpSectionId) });

    if (this.id) {
      const lvl = this.levelsSvc.getLevelById(this.id);
      if (lvl) {
        this.form.patchValue({
          sectionId: lvl.sectionId,
          name: lvl.name,
          imagePath: lvl.imagePath ?? '',
          prefaceText: lvl.prefaceText ?? '',
          animationImagePath: lvl.animationImagePath ?? '',
          orderIndex: lvl.orderIndex ?? null,
          status: lvl.status,
          timeLimitSeconds: lvl.timeLimitSeconds ?? null,
        });
      }
      this.loadTasks();
    }
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

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    const dto: Partial<Level> = {
      sectionId: Number(v.sectionId),
      name: v.name!,
      imagePath: v.imagePath || '',
      prefaceText: v.prefaceText || '',
      animationImagePath: v.animationImagePath || '',
      orderIndex: v.orderIndex != null ? Number(v.orderIndex) : undefined,
      status: Number(v.status),
      timeLimitSeconds: v.timeLimitSeconds != null ? Number(v.timeLimitSeconds) : undefined,
    };

    if (this.isEdit) this.levelsSvc.updateLevel(this.id!, dto);
    else this.levelsSvc.addLevel(dto);

    const sid = dto.sectionId!;
    this.router.navigate(['/admin/sections', sid]);
  }

  cancel() {
    const sid = this.route.snapshot.queryParamMap.get('sectionId');
    if (sid) this.router.navigate(['/admin/sections', Number(sid)]);
    else this.router.navigate(['/admin/sections']);
  }

  private loadTasks() {
    if (!this.id) return;
    this.tasks = this.taskSvc.getTasks(this.id);
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

  // даты уровня для read-only отображения
  get levelDates() {
    if (!this.id) return null;
    return this.levelsSvc.getLevelById(this.id) ?? null;
  }
}

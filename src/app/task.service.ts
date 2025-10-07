import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export type TaskType = 'anagram' | 'image_choice' | 'text_choice';

export interface TaskOption {
  label: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface Task {
  id: string; // UUID
  levelId: string; // UUID
  internalName: string; // было title
  type: TaskType;
  headerText?: string; // было topText
  imagePath?: string; // было taskImagePath
  taskImageSource?: string;
  resultImagePath?: string;
  resultImageSource?: string;
  orderIndex?: number;
  status: number; // 0 draft, 1 published
  timeLimitSec?: number; // было timeLimitSeconds
  pointsAttempt1?: number; // было pointsFirst
  pointsAttempt2?: number; // было pointsSecond
  pointsAttempt3?: number; // было pointsThird
  explanationText?: string;

  // anagram
  charsCsv?: string;
  correctAnswer?: string;

  // image_choice / text_choice
  options?: TaskOption[];

  createdAt: Date;
  updatedAt: Date;
}

// Как приходит с API (даты — строки ISO)
interface TaskDto {
  id: string;
  levelId: string;
  internalName: string;
  type: number; // API возвращает number
  headerText?: string | null;
  imageUrl?: string | null; // API возвращает imageUrl
  orderIndex?: number;
  status: number;
  timeLimitSec?: number;
  pointsAttempt1?: number;
  pointsAttempt2?: number;
  pointsAttempt3?: number;
  explanationText?: string | null;
  // Новые поля для анаграмм и вариантов ответов
  options?: TaskOption[];
  charsCsv?: string | null;
  correctAnswer?: string | null;
  taskImageSource?: string | null;
  resultImagePath?: string | null;
  resultImageSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapDto(dto: TaskDto): Task {
  return {
    id: dto.id,
    levelId: dto.levelId,
    internalName: dto.internalName,
    type: mapTaskType(dto.type), // конвертируем number в TaskType
    headerText: dto.headerText ?? undefined,
    imagePath: dto.imageUrl ?? undefined, // маппим imageUrl в imagePath
    orderIndex: dto.orderIndex,
    status: dto.status,
    timeLimitSec: dto.timeLimitSec,
    pointsAttempt1: dto.pointsAttempt1,
    pointsAttempt2: dto.pointsAttempt2,
    pointsAttempt3: dto.pointsAttempt3,
    explanationText: dto.explanationText ?? undefined,
    // Новые поля для анаграмм и вариантов ответов
    options: dto.options ?? undefined,
    charsCsv: dto.charsCsv ?? undefined,
    correctAnswer: dto.correctAnswer ?? undefined,
    taskImageSource: dto.taskImageSource ?? undefined,
    resultImagePath: dto.resultImagePath ?? undefined,
    resultImageSource: dto.resultImageSource ?? undefined,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

function mapTaskType(type: number): TaskType {
  switch (type) {
    case 0:
      return 'text_choice';
    case 1:
      return 'image_choice';
    case 2:
      return 'anagram';
    default:
      return 'text_choice';
  }
}

function mapTaskTypeToNumber(type: TaskType): number {
  switch (type) {
    case 'text_choice':
      return 0;
    case 'image_choice':
      return 1;
    case 'anagram':
      return 2;
    default:
      return 0;
  }
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'
  private readonly tasksUrl = `${this.base}/Tasks`; // API использует Tasks с заглавной буквы

  /** GET /api/levels/{levelId}/tasks */
  getTasks(levelId: string): Observable<Task[]> {
    console.log('=== TASK SERVICE GET TASKS ===');
    console.log('Level ID:', levelId);
    const url = `${this.base}/levels/${levelId}/tasks`;
    console.log('Request URL:', url);

    return this.http.get<TaskDto[]>(url).pipe(
      map((list) => {
        console.log('✅ Raw tasks list from API:', JSON.stringify(list, null, 2));
        const mapped = list.map(mapDto);
        console.log('✅ Mapped tasks list:', JSON.stringify(mapped, null, 2));
        mapped.forEach((task: Task, index: number) => {
          console.log(`✅ Task ${index}: imagePath =`, task.imagePath);
        });
        return mapped;
      }),
    );
  }

  /** GET /api/Tasks/{id} */
  getTaskById(id: string): Observable<Task> {
    console.log('=== TASK SERVICE GET BY ID ===');
    console.log('Requesting task with ID:', id);
    console.log('Request URL:', `${this.tasksUrl}/${id}`);

    return this.http.get<TaskDto>(`${this.tasksUrl}/${id}`).pipe(
      map((dto) => {
        console.log('✅ Raw API response:', JSON.stringify(dto, null, 2));
        console.log('✅ imageUrl from API:', dto.imageUrl);
        const mapped = mapDto(dto);
        console.log('✅ Mapped task:', JSON.stringify(mapped, null, 2));
        console.log('✅ imagePath after mapping:', mapped.imagePath);
        return mapped;
      }),
    );
  }

  /** POST /api/Tasks */
  addTask(data: Partial<Task>): Observable<Task> {
    const payload = {
      levelId: data.levelId ?? '',
      internalName: data.internalName ?? '',
      type: mapTaskTypeToNumber(data.type ?? 'text_choice'),
      headerText: data.headerText ?? '',
      imageUrl: data.imagePath ?? '', // API ожидает imageUrl
      orderIndex: data.orderIndex ?? 0,
      timeLimitSec: data.timeLimitSec ?? 0,
      pointsAttempt1: data.pointsAttempt1 ?? 0,
      pointsAttempt2: data.pointsAttempt2 ?? 0,
      pointsAttempt3: data.pointsAttempt3 ?? 0,
      explanationText: data.explanationText ?? '',
      status: data.status ?? 0,
      // Добавляем поля для анаграмм и вариантов ответов
      options: data.options ?? [],
      charsCsv: data.charsCsv ?? '',
      correctAnswer: data.correctAnswer ?? '',
      taskImageSource: data.taskImageSource ?? '',
      resultImagePath: data.resultImagePath ?? '',
      resultImageSource: data.resultImageSource ?? '',
    };
    console.log('=== TASK SERVICE ADD ===');
    console.log('Adding new task');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.post<TaskDto>(this.tasksUrl, payload).pipe(
      map((dto) => {
        console.log('✅ Add response:', JSON.stringify(dto, null, 2));
        return mapDto(dto);
      }),
    );
  }

  /** PUT /api/Tasks/{id} */
  updateTask(id: string, data: Partial<Task>): Observable<Task> {
    const payload = {
      internalName: data.internalName,
      type: data.type ? mapTaskTypeToNumber(data.type) : undefined,
      headerText: data.headerText,
      imageUrl: data.imagePath, // API ожидает imageUrl
      orderIndex: data.orderIndex,
      timeLimitSec: data.timeLimitSec,
      pointsAttempt1: data.pointsAttempt1,
      pointsAttempt2: data.pointsAttempt2,
      pointsAttempt3: data.pointsAttempt3,
      explanationText: data.explanationText,
      status: data.status,
      // Добавляем поля для анаграмм и вариантов ответов
      options: data.options,
      charsCsv: data.charsCsv,
      correctAnswer: data.correctAnswer,
      taskImageSource: data.taskImageSource,
      resultImagePath: data.resultImagePath,
      resultImageSource: data.resultImageSource,
    };
    console.log('=== TASK SERVICE UPDATE ===');
    console.log('Updating task with ID:', id);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.put<TaskDto>(`${this.tasksUrl}/${id}`, payload).pipe(
      map((dto) => {
        console.log('✅ Update response:', JSON.stringify(dto, null, 2));
        return mapDto(dto);
      }),
    );
  }

  /** DELETE /api/Tasks/{id} */
  deleteTask(id: string): Observable<void> {
    console.log('=== TASK SERVICE DELETE ===');
    console.log('Deleting task with ID:', id);
    return this.http.delete<void>(`${this.tasksUrl}/${id}`);
  }
}

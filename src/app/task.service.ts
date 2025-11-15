import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export type TaskType = 'anagram' | 'image_choice' | 'text_choice';

export type Guid = string;

export interface TaskOption {
  id?: Guid; // Guid from .NET backend
  label: string;
  isCorrect: boolean;
  imageUrl?: string;
  correctAnswer?: string;
}

export interface Task {
  id: string; // UUID
  levelId: string; // UUID
  internalName: string; // was 'title'
  type: TaskType;
  headerText?: string; // was 'topText'
  imagePath?: string; // was 'taskImagePath'
  taskImageSource?: string;
  resultImagePath?: string;
  resultImageSource?: string;
  orderIndex?: number;
  status: number; // 0 draft, 1 published
  timeLimitSec?: number; // was 'timeLimitSeconds'
  pointsAttempt1?: number; // was 'pointsFirst'
  pointsAttempt2?: number; // was 'pointsSecond'
  pointsAttempt3?: number; // was 'pointsThird'
  explanationText?: string;

  // answer options
  options?: TaskOption[];

  createdAt: Date;
  updatedAt: Date;
}

// How it comes from the API (dates are ISO strings)
interface TaskOptionDto {
  id?: Guid;
  label: string;
  isCorrect: boolean;
  imageUrl?: string | null;
  correctAnswer?: string | null;
}

interface TaskDto {
  id: string;
  levelId: string;
  internalName: string;
  type: number; // API returns a number
  headerText?: string | null;
  imageUrl?: string | null; // API returns imageUrl
  orderIndex?: number;
  status: number;
  timeLimitSec?: number;
  pointsAttempt1?: number;
  pointsAttempt2?: number;
  pointsAttempt3?: number;
  explanationText?: string | null;
  options?: TaskOptionDto[];
  taskImageSource?: string | null;
  resultImagePath?: string | null;
  resultImageSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapOptionDto(option: TaskOptionDto): TaskOption {
  return {
    id: option.id,
    label: option.label,
    isCorrect: option.isCorrect,
    imageUrl: option.imageUrl ?? undefined,
    correctAnswer: option.correctAnswer ?? undefined,
  };
}

function mapOptionToDto(option: TaskOption): TaskOptionDto {
  const mapped: TaskOptionDto = {
    label: option.label,
    isCorrect: option.isCorrect,
  };

  if (option.id) {
    mapped.id = option.id;
  }

  if (option.imageUrl) {
    mapped.imageUrl = option.imageUrl;
  }

  if (option.correctAnswer !== undefined) {
    mapped.correctAnswer = option.correctAnswer;
  }

  return mapped;
}

function mapDto(dto: TaskDto): Task {
  return {
    id: dto.id,
    levelId: dto.levelId,
    internalName: dto.internalName,
    type: mapTaskType(dto.type), // convert number to TaskType
    headerText: dto.headerText ?? undefined,
    imagePath: dto.imageUrl ?? undefined, // map imageUrl to imagePath
    orderIndex: dto.orderIndex,
    status: dto.status,
    timeLimitSec: dto.timeLimitSec,
    pointsAttempt1: dto.pointsAttempt1,
    pointsAttempt2: dto.pointsAttempt2,
    pointsAttempt3: dto.pointsAttempt3,
    explanationText: dto.explanationText ?? undefined,
    options: dto.options?.map(mapOptionDto) ?? undefined,
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
      return 'anagram';
    case 1:
      return 'image_choice';
    case 2:
      return 'text_choice';
    default:
      return 'text_choice';
  }
}

function mapTaskTypeToNumber(type: TaskType): number {
  switch (type) {
    case 'anagram':
      return 0;
    case 'image_choice':
      return 1;
    case 'text_choice':
      return 2;
    default:
      return 2;
  }
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'
  private readonly tasksUrl = `${this.base}/Tasks`; // API uses 'Tasks' with uppercase

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
      imageUrl: data.imagePath ?? '', // API expects imageUrl
      orderIndex: data.orderIndex ?? 0,
      timeLimitSec: data.timeLimitSec ?? 0,
      pointsAttempt1: data.pointsAttempt1 ?? 0,
      pointsAttempt2: data.pointsAttempt2 ?? 0,
      pointsAttempt3: data.pointsAttempt3 ?? 0,
      explanationText: data.explanationText ?? '',
      status: data.status ?? 0,
      options: (data.options ?? []).map(mapOptionToDto),
      taskImageSource: data.taskImageSource || '',
      resultImagePath: data.resultImagePath || '',
      resultImageSource: data.resultImageSource || '',
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
      imageUrl: data.imagePath, // API expects imageUrl
      orderIndex: data.orderIndex,
      timeLimitSec: data.timeLimitSec,
      pointsAttempt1: data.pointsAttempt1,
      pointsAttempt2: data.pointsAttempt2,
      pointsAttempt3: data.pointsAttempt3,
      explanationText: data.explanationText,
      status: data.status,
      options: data.options?.map(mapOptionToDto),
      taskImageSource: data.taskImageSource || '',
      resultImagePath: data.resultImagePath || '',
      resultImageSource: data.resultImageSource || '',
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

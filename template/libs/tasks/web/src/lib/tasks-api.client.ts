import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { TaskPage, TaskSummary } from './task-summary';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

const TASK_PAGE_LIMIT = 20;

@Injectable({ providedIn: 'root' })
export class TasksApiClient {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listTasks(cursor: string | undefined): Promise<TaskPage> {
    const query: Record<string, string> = { limit: String(TASK_PAGE_LIMIT) };
    if (cursor !== undefined) {
      query['cursor'] = cursor;
    }
    return firstValueFrom(this.httpClient.get<TaskPage>(`${this.apiBaseUrl}/tasks`, { params: query }));
  }

  createTask(title: string): Promise<TaskSummary> {
    return firstValueFrom(this.httpClient.post<TaskSummary>(`${this.apiBaseUrl}/tasks`, { title }));
  }

  completeTask(taskId: string): Promise<TaskSummary> {
    return firstValueFrom(this.httpClient.patch<TaskSummary>(`${this.apiBaseUrl}/tasks/${taskId}`, { completed: true }));
  }
}

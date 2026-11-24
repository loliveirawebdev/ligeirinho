import { isDevMode } from '@angular/core';
import type { Route } from '@angular/router';
import { TaskListPage } from '@app/tasks-web';

export const appRoutes: Route[] = [
  ...(isDevMode() ? [{ path: '__preview', loadChildren: () => import('./preview.routes') }] : []),
  { path: '', pathMatch: 'full', component: TaskListPage, title: 'Tasks' },
];

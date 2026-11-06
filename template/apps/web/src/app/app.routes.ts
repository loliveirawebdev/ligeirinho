import { isDevMode } from '@angular/core';
import type { Route } from '@angular/router';
import { previewRoutes } from '@ligeirinho/previewer';
import { TaskListPage } from '@app/tasks-web';
import { scenarioRegistry } from './preview.registry';

export const appRoutes: Route[] = [
  ...(isDevMode() ? [{ path: '__preview', children: previewRoutes(scenarioRegistry) }] : []),
  { path: '', pathMatch: 'full', component: TaskListPage, title: 'Tasks' },
];

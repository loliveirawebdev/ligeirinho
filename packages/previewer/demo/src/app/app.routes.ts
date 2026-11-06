import { isDevMode } from '@angular/core';
import type { Routes } from '@angular/router';
import { previewRoutes } from '@ligeirinho/previewer';
import { scenarioRegistry } from './preview.registry';

export const routes: Routes = [
  ...(isDevMode() ? [{ path: '__preview', children: previewRoutes(scenarioRegistry) }] : []),
  { path: '', pathMatch: 'full', redirectTo: '__preview' },
];

import type { TaskSummary } from '../task-summary';

// The example data for this screen: the scenarios (previewer and view tests) and the dev seed all use it.
// Kept free of Angular so the seed can import it in plain Node.
export const SAMPLE_TASKS: readonly TaskSummary[] = [
  { id: '10000000-0000-4000-8000-000000000003', title: 'Review the plan with the team', completed: false, createdAt: '2026-03-03T09:00:00Z' },
  { id: '10000000-0000-4000-8000-000000000002', title: 'Draw the new screens in the previewer', completed: false, createdAt: '2026-03-02T09:00:00Z' },
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'A task with a very long title that has to wrap nicely on a small phone screen without breaking the layout',
    completed: true,
    createdAt: '2026-03-01T09:00:00Z',
  },
];


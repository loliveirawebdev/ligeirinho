import { describe, expect, it } from 'vitest';
import {
  clampSize,
  filterEntries,
  matchingViewport,
  neighborScenario,
  readWorkbenchState,
  resolveScale,
  resolveSelection,
  rulerTicks,
  toQueryParameters,
} from '../lib/src/lib/preview-workbench.state';
import type { PreviewEntrySummary } from '../lib/src/lib/scenario-registry';

const entries: readonly PreviewEntrySummary[] = [
  { id: 'profile-card', flow: 'Account', title: 'Profile card', scenarios: ['complete', 'minimal'] },
  { id: 'task-list', flow: 'Tasks', title: 'Task list', scenarios: ['empty', 'full', 'error'] },
];

const phone = { label: 'Phone', width: 390, height: 844 };

function query(parameters: Record<string, string>): { get(name: string): string | null } {
  const search = new URLSearchParams(parameters);
  return { get: (name) => search.get(name) };
}

describe('readWorkbenchState', () => {
  it('falls back to the default viewport, light theme, fit zoom and play on', () => {
    expect(readWorkbenchState(query({}), phone)).toEqual({
      entryId: null,
      scenarioName: null,
      width: 390,
      height: 844,
      theme: 'light',
      zoom: 'fit',
      play: true,
    });
  });

  it('reads every parameter and round-trips through toQueryParameters', () => {
    const state = readWorkbenchState(
      query({ entry: 'task-list', scenario: 'full', w: '768', h: '1024', theme: 'dark', zoom: '0.5', play: '0' }),
      phone,
    );

    expect(state).toEqual({
      entryId: 'task-list',
      scenarioName: 'full',
      width: 768,
      height: 1024,
      theme: 'dark',
      zoom: 0.5,
      play: false,
    });
    expect(readWorkbenchState(query(toQueryParameters(state)), phone)).toEqual(state);
  });

  it('ignores invalid sizes and zoom levels', () => {
    const state = readWorkbenchState(query({ w: 'wide', h: '99999', zoom: '0.33' }), phone);

    expect(state.width).toBe(390);
    expect(state.height).toBe(3840);
    expect(state.zoom).toBe('fit');
  });
});

describe('clampSize', () => {
  it('keeps the frame between 240 and 3840 px, rounded', () => {
    expect(clampSize(100)).toBe(240);
    expect(clampSize(500.6)).toBe(501);
    expect(clampSize(5000)).toBe(3840);
    expect(clampSize(Number.NaN)).toBe(240);
  });
});

describe('resolveScale', () => {
  it('uses a fixed zoom as is', () => {
    expect(resolveScale(1.5, { width: 390, height: 844 }, { width: 100, height: 100 })).toBe(1.5);
  });

  it('fits the frame into the available space without enlarging it', () => {
    expect(resolveScale('fit', { width: 400, height: 800 }, { width: 1000, height: 400 })).toBe(0.5);
    expect(resolveScale('fit', { width: 400, height: 400 }, { width: 1000, height: 1000 })).toBe(1);
  });

  it('draws at full size before the canvas is measured', () => {
    expect(resolveScale('fit', { width: 400, height: 800 }, { width: 0, height: 0 })).toBe(1);
  });
});

describe('rulerTicks', () => {
  it('marks every 50 px at full scale and labels every other one', () => {
    const ticks = rulerTicks(200, 1);

    expect(ticks.map((tick) => tick.value)).toEqual([0, 50, 100, 150, 200]);
    expect(ticks.filter((tick) => tick.labeled).map((tick) => tick.value)).toEqual([0, 100, 200]);
  });

  it('spaces the marks out when zoomed out and places them on screen', () => {
    const ticks = rulerTicks(400, 0.25);

    expect(ticks.map((tick) => tick.value)).toEqual([0, 200, 400]);
    expect(ticks.map((tick) => tick.offset)).toEqual([0, 50, 100]);
  });
});

describe('filterEntries', () => {
  it('keeps everything for an empty search', () => {
    expect(filterEntries(entries, '  ')).toEqual(entries);
  });

  it('keeps a whole entry when its title or flow matches', () => {
    expect(filterEntries(entries, 'account').map((entry) => entry.id)).toEqual(['profile-card']);
    expect(filterEntries(entries, 'TASK')[0]?.scenarios).toEqual(['empty', 'full', 'error']);
  });

  it('keeps only the matching scenarios otherwise', () => {
    expect(filterEntries(entries, 'err')).toEqual([{ ...entries[1], scenarios: ['error'] }]);
  });
});

describe('neighborScenario', () => {
  const scenarios = [
    { entryId: 'profile-card', scenarioName: 'minimal' },
    { entryId: 'task-list', scenarioName: 'empty' },
  ];

  it('moves to the next or previous scenario, wrapping around', () => {
    expect(neighborScenario(scenarios, scenarios[0] ?? null, 1)).toEqual(scenarios[1]);
    expect(neighborScenario(scenarios, scenarios[1] ?? null, 1)).toEqual(scenarios[0]);
    expect(neighborScenario(scenarios, scenarios[0] ?? null, -1)).toEqual(scenarios[1]);
  });

  it('starts from the first scenario when the current one is not listed', () => {
    expect(neighborScenario(scenarios, { entryId: 'task-list', scenarioName: 'full' }, 1)).toEqual(scenarios[0]);
    expect(neighborScenario([], null, 1)).toBeNull();
  });
});

describe('resolveSelection', () => {
  it('returns the selected scenario when it exists', () => {
    expect(resolveSelection(entries, 'task-list', 'error')).toEqual({ entryId: 'task-list', scenarioName: 'error' });
  });

  it('falls back to the first scenario', () => {
    const first = { entryId: 'profile-card', scenarioName: 'complete' };
    expect(resolveSelection(entries, 'task-list', 'loading')).toEqual(first);
    expect(resolveSelection(entries, null, null)).toEqual(first);
    expect(resolveSelection([], null, null)).toBeNull();
  });
});

describe('matchingViewport', () => {
  it('finds the preset for a size, rotated too', () => {
    expect(matchingViewport([phone], 390, 844)).toBe(phone);
    expect(matchingViewport([phone], 844, 390)).toBe(phone);
    expect(matchingViewport([phone], 400, 844)).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { defineScenarios, toEntryId, type AnyScenarioEntry } from '../lib/src/lib/scenario-entry';
import {
  DuplicatePreviewEntryId,
  PreviewEntryNotFound,
  PreviewScenarioNotFound,
  assertUniqueEntryIds,
  buildRenderPath,
  listFlows,
  resolveScenario,
  summarizeEntries,
} from '../lib/src/lib/scenario-registry';
import { CounterView, type CounterViewModel } from './fixtures/counter.view';

const counterScenarios = defineScenarios<CounterViewModel>({
  flow: 'Counting',
  title: 'Counter panel',
  component: CounterView,
  scenarios: { zero: { count: 0 }, many: { count: 42 } },
});

const otherCounterScenarios = defineScenarios({
  flow: 'Other',
  title: 'Other counter',
  component: CounterView,
  scenarios: { one: { count: 1 } },
});

const registry: readonly AnyScenarioEntry[] = [counterScenarios, otherCounterScenarios];

describe('toEntryId', () => {
  it.each([
    ['Task list', 'task-list'],
    ['TaskList', 'task-list'],
    ['  Edit   profile / avatar ', 'edit-profile-avatar'],
    ['Step 2: Payment', 'step-2-payment'],
  ])('turns %j into %j', (title, expectedId) => {
    expect(toEntryId(title)).toBe(expectedId);
  });
});

describe('defineScenarios', () => {
  it('keeps the definition and adds the kebab-case id', () => {
    expect(counterScenarios.id).toBe('counter-panel');
    expect(counterScenarios.flow).toBe('Counting');
    expect(counterScenarios.component).toBe(CounterView);
    expect(counterScenarios.scenarios.many).toEqual({ count: 42 });
  });
});

describe('resolveScenario', () => {
  it('finds the scenario model by entry id and scenario name', () => {
    const resolved = resolveScenario(registry, 'counter-panel', 'many');
    expect(resolved.entry).toBe(counterScenarios);
    expect(resolved.model).toEqual({ count: 42 });
  });

  it('throws PreviewEntryNotFound for an unknown entry', () => {
    expect(() => resolveScenario(registry, 'missing', 'zero')).toThrow(PreviewEntryNotFound);
  });

  it('throws PreviewScenarioNotFound listing the available scenarios', () => {
    expect(() => resolveScenario(registry, 'counter-panel', 'toString')).toThrow(
      new PreviewScenarioNotFound('counter-panel', 'toString', ['zero', 'many']),
    );
  });
});

describe('assertUniqueEntryIds', () => {
  it('accepts distinct ids', () => {
    expect(() => assertUniqueEntryIds(registry)).not.toThrow();
  });

  it('rejects two titles with the same kebab-case id', () => {
    const clash = defineScenarios({ ...otherCounterScenarios, title: 'Counter Panel' });
    expect(() => assertUniqueEntryIds([counterScenarios, clash])).toThrow(DuplicatePreviewEntryId);
  });
});

describe('manifest helpers', () => {
  it('summarizes entries as serializable data', () => {
    expect(JSON.parse(JSON.stringify(summarizeEntries(registry)))).toEqual([
      { id: 'counter-panel', flow: 'Counting', title: 'Counter panel', scenarios: ['zero', 'many'] },
      { id: 'other-counter', flow: 'Other', title: 'Other counter', scenarios: ['one'] },
    ]);
  });

  it('lists flows once, in registry order', () => {
    expect(listFlows([...registry, counterScenarios])).toEqual(['Counting', 'Other']);
  });

  it('builds the render path with the theme', () => {
    expect(buildRenderPath('/__preview', 'task-list', 'full', 'dark')).toBe('/__preview/render/task-list/full?theme=dark');
  });
});

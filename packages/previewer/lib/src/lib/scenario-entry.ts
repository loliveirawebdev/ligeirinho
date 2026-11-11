import type { InputSignal, Type } from '@angular/core';

/**
 * A standalone view component that receives its view-model through
 * `readonly model = input.required<TViewModel>()`.
 */
export type ViewComponent<TViewModel> = Type<{ readonly model: InputSignal<TViewModel> }>;

/** What a scenario's `play` function receives once the view is on screen. */
export interface PlayContext {
  /**
   * The render page's `<body>`: the view plus anything it opens in an overlay (dialogs, menus, snack bars). Query
   * it with `@testing-library/dom` (`within(canvas).getByRole(...)`) and drive it with `@testing-library/user-event`.
   */
  readonly canvas: HTMLElement;
  /** Names a step for the previewer's Steps panel and for e2e failures; returns what `action` returns. */
  step<TResult>(label: string, action: () => TResult | Promise<TResult>): Promise<TResult>;
}

/**
 * Interaction that brings a scenario to the state worth looking at, beyond what the view-model alone shows: open
 * a dialog, type in a field, expand a panel. Runs after the view renders, in the previewer and before e2e checks.
 */
export type PlayFunction = (context: PlayContext) => void | Promise<void>;

export interface ScenarioDefinition<TViewModel, TScenarioName extends string> {
  /** Groups entries on the preview grid (usually the feature's flow). */
  readonly flow: string;
  /** Human title; the entry id is its kebab-case form. */
  readonly title: string;
  readonly component: ViewComponent<TViewModel>;
  /** One example view-model per scenario (empty, full, error, read-only...). */
  readonly scenarios: Readonly<Record<TScenarioName, NoInfer<TViewModel>>>;
  /** Optional interaction per scenario, run after it renders (see `PlayFunction`). */
  readonly play?: Readonly<Partial<Record<NoInfer<TScenarioName>, PlayFunction>>>;
}

export interface ScenarioEntry<TViewModel, TScenarioName extends string = string>
  extends ScenarioDefinition<TViewModel, TScenarioName> {
  /** kebab-case(title), used in the render URL. */
  readonly id: string;
}

/**
 * An entry of any view-model type, as stored in the registry. `InputSignal<T>` is invariant in `T`, so entries of
 * different view-models share no common `ScenarioEntry<...>`; the pairing of component and scenarios is checked by
 * `defineScenarios` instead.
 */
export interface AnyScenarioEntry {
  readonly id: string;
  readonly flow: string;
  readonly title: string;
  readonly component: Type<object>;
  readonly scenarios: Readonly<Record<string, unknown>>;
  readonly play?: Readonly<Partial<Record<string, PlayFunction>>>;
}

export type ScenarioRegistry = readonly AnyScenarioEntry[];

/**
 * Declares the scenarios of one view.
 *
 * The view-model type can be given explicitly (`defineScenarios<TaskListViewModel>(...)`) or inferred from
 * `component`. Scenario names are only inferred when no type argument is given (TypeScript has no partial
 * inference); pass them as the second type argument to get `scenarios.full` typed without `| undefined`.
 */
export function defineScenarios<TViewModel, const TScenarioName extends string = string>(
  definition: ScenarioDefinition<TViewModel, TScenarioName>,
): ScenarioEntry<TViewModel, TScenarioName> {
  return { ...definition, id: toEntryId(definition.title) };
}

/** 'Task list' → 'task-list', 'TaskList' → 'task-list'. */
export function toEntryId(title: string): string {
  return title
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

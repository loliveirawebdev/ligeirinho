// Compile-time checks of the public types, run by `pnpm typecheck` (tsc), never executed.
import { Component, input, output } from '@angular/core';
import { defineScenarios, type ScenarioRegistry } from '../lib/src/public-api';

interface TaskListViewModel {
  readonly tasks: readonly string[];
}

interface ProfileViewModel {
  readonly name: string;
}

@Component({ selector: 'type-test-task-list', template: '' })
class TaskListView {
  readonly model = input.required<TaskListViewModel>();
  readonly toggleTask = output<string>();
}

@Component({ selector: 'type-test-profile', template: '' })
class ProfileView {
  readonly model = input.required<ProfileViewModel>();
}

@Component({ selector: 'type-test-no-model', template: '' })
class NoModelView {}

// The template's form: explicit view-model type.
const taskListScenarios = defineScenarios<TaskListViewModel>({
  flow: 'Tasks',
  title: 'Task list',
  component: TaskListView,
  scenarios: { empty: { tasks: [] }, full: { tasks: ['Write tests'] } },
});
const explicitFull: TaskListViewModel | undefined = taskListScenarios.scenarios['full'];

// Inferred form: view-model from the component, scenario names kept.
const profileScenarios = defineScenarios({
  flow: 'Account',
  title: 'Profile',
  component: ProfileView,
  scenarios: { complete: { name: 'Ada' } },
});
const inferredComplete: ProfileViewModel = profileScenarios.scenarios.complete;

// Explicit form with scenario names.
const namedScenarios = defineScenarios<TaskListViewModel, 'empty'>({
  flow: 'Tasks',
  title: 'Named',
  component: TaskListView,
  scenarios: { empty: { tasks: [] } },
});
const namedEmpty: TaskListViewModel = namedScenarios.scenarios.empty;

export const registry: ScenarioRegistry = [taskListScenarios, profileScenarios, namedScenarios];

defineScenarios<TaskListViewModel>({
  flow: 'Tasks',
  title: 'Wrong component',
  // @ts-expect-error the component's model is a ProfileViewModel
  component: ProfileView,
  scenarios: {},
});

defineScenarios<TaskListViewModel>({
  flow: 'Tasks',
  title: 'No model input',
  // @ts-expect-error the component has no `model` input
  component: NoModelView,
  scenarios: {},
});

defineScenarios({
  flow: 'Account',
  title: 'Wrong scenario',
  component: ProfileView,
  // @ts-expect-error a scenario must be a ProfileViewModel
  scenarios: { broken: { nickname: 'Ada' } },
});

export const usedValues = [explicitFull, inferredComplete, namedEmpty];

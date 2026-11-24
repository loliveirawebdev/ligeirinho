import { defineScenarios } from '@ligeirinho/previewer';
import { ButtonsExample, type ButtonsExampleModel } from './buttons.example';

const buttons: ButtonsExampleModel = {
  title: 'Buttons',
  textButtons: {
    title: 'Text buttons, from the most emphasis to the least',
    rows: [
      { emphasis: 'filled', name: 'matButton="filled"', use: 'The one primary action of a screen or section' },
      { emphasis: 'tonal', name: 'matButton="tonal"', use: 'A secondary action that still needs weight' },
      { emphasis: 'outlined', name: 'matButton="outlined"', use: 'Other actions; the action inside a notice' },
      { emphasis: 'elevated', name: 'matButton="elevated"', use: 'Rare: an action over an image or a busy surface' },
      { emphasis: 'text', name: 'matButton', use: 'The least: Cancel, Show more, links in a row' },
    ],
  },
  iconButtons: {
    title: 'Icon buttons',
    name: 'matIconButton',
    use: 'Actions known by their icon (close, more, notifications); always with a label and a tooltip',
  },
  fabs: {
    title: 'Floating action buttons',
    fab: { name: 'matFab', use: 'The main action of a phone screen, over the content' },
    miniFab: { name: 'matMiniFab', use: 'The same, where space is short' },
    extendedFab: { name: 'matFab extended', use: 'When the icon alone is not clear' },
  },
  toggle: {
    title: 'Toggle group',
    name: 'mat-button-toggle-group',
    use: 'One choice among a few views or modes (list, board, calendar); filters are chips',
    options: [
      { value: 'list', label: 'List' },
      { value: 'board', label: 'Board' },
      { value: 'calendar', label: 'Calendar' },
    ],
    selected: 'list',
  },
  columns: { plain: 'Plain', withIcon: 'Icon', iconAtEnd: 'Icon at the end', disabled: 'Disabled' },
  sample: {
    action: 'Add member',
    icon: 'add',
    iconAtEnd: 'arrow_forward',
    iconLabel: 'More options',
    iconNames: ['more_vert', 'close', 'notifications', 'edit', 'delete'],
  },
};

export const buttonsScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Buttons',
  component: ButtonsExample,
  scenarios: {
    all: buttons,
    longLabels: { ...buttons, sample: { ...buttons.sample, action: 'Resend every pending invitation' } },
  },
});

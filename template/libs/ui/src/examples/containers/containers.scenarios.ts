import { defineScenarios } from '@ligeirinho/previewer';
import { ContainersExample, type ContainersExampleModel } from './containers.example';

const containers: ContainersExampleModel = {
  title: 'Containers and lists',
  sections: { cards: 'Cards', expansion: 'Expansion panels', lists: 'Lists', grid: 'Grid list', tree: 'Tree' },
  notes: {
    cards: [
      {
        appearance: 'outlined',
        name: 'mat-card appearance="outlined"',
        use: 'An object the user acts on as a whole (a plan, an integration); never cards inside cards, never filled',
      },
      { appearance: 'raised', name: 'mat-card appearance="raised"', use: 'Rare: a card over a busy surface. Actions sit under a divider, at the end' },
    ],
    expansion: {
      name: 'mat-accordion',
      use: 'Long optional detail, one subject a panel (settings groups, FAQ); not to hide what most users need',
    },
    list: { name: 'mat-list', use: 'Read-only rows with an icon; records the user opens are ui-item-list' },
    listTwoLines: { name: 'matListItemLine', use: 'A second line under the title' },
    selectionList: { name: 'mat-selection-list', use: 'Picking several rows of a list (members to add)' },
    divider: { name: 'mat-divider', use: 'Only between rows that would otherwise blur together' },
    gridList: { name: 'mat-grid-list', use: 'Tiles of fixed height (a gallery, a dashboard of equal blocks)' },
    tree: { name: 'mat-tree', use: 'Nested things the user opens level by level (folders, an org chart)' },
  },
  card: {
    title: 'Business plan',
    subtitle: '€12 per member a month',
    body: 'Unlimited projects, two-step verification for everyone and priority support.',
    action: 'Choose plan',
    secondaryAction: 'Compare',
  },
  panels: [
    { title: 'Notifications', description: 'Email and push', body: 'Which events send an email or a push notification.' },
    { title: 'Security', description: 'Two-step verification on', body: 'How members sign in and how long a session lasts.' },
    { title: 'Billing', description: 'Business plan', body: 'The plan, the payment method and the invoices.' },
  ],
  list: {
    subheader: 'Workspace',
    items: [
      { icon: 'group', title: 'Members', line: '24 members, 3 invited' },
      { icon: 'folder', title: 'Projects', line: '12 active, 4 archived' },
      { icon: 'extension', title: 'Integrations', line: 'Slack, Google Drive' },
    ],
  },
  selection: {
    label: 'Members to add',
    options: [
      { value: 'ana', label: 'Ana Souza' },
      { value: 'bruno', label: 'Bruno Lima' },
      { value: 'carla', label: 'Carla Méndez' },
    ],
    selected: ['bruno'],
  },
  divider: { items: ['Profile', 'Access', 'Activity'] },
  tiles: [
    { label: 'Revenue', cols: 2, rows: 2 },
    { label: 'Members', cols: 1, rows: 1 },
    { label: 'Projects', cols: 1, rows: 1 },
    { label: 'Invoices', cols: 2, rows: 1 },
  ],
  tree: {
    label: 'Teams',
    nodes: [
      {
        name: 'Operations',
        toggleLabel: 'Show Operations',
        children: [{ name: 'Logistics' }, { name: 'Support', toggleLabel: 'Show Support', children: [{ name: 'Tier 1' }, { name: 'Tier 2' }] }],
      },
      { name: 'Finance', toggleLabel: 'Show Finance', children: [{ name: 'Accounts' }, { name: 'Payroll' }] },
      { name: 'Sales' },
    ],
  },
};

export const containersScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Containers and lists',
  component: ContainersExample,
  scenarios: { all: containers },
});

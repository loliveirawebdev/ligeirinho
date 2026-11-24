import { defineScenarios } from '@ligeirinho/previewer';
import { NavigationExample, type NavigationExampleModel } from './navigation.example';

const navigation: NavigationExampleModel = {
  title: 'Navigation',
  sections: { tabs: 'Tabs', menu: 'Menu', contextMenu: 'Context menu', stepper: 'Stepper', toolbar: 'Toolbar', sideSheet: 'Side sheet' },
  notes: {
    tabs: { name: 'mat-tab-group', use: 'Views of the same thing, side by side (Profile, Access, Activity); never steps' },
    tabsIcons: { name: 'mat-tab-label', use: 'With an icon each, when the icons help tell them apart' },
    menu: {
      name: 'mat-menu',
      use: 'Actions on one thing that don’t fit as buttons; the destructive one last, after a divider',
    },
    contextMenu: {
      name: 'mat-menu on (contextmenu)',
      use: 'Power-user shortcuts on a file, a row or a canvas (right click, the menu key or Shift+F10); never the only way to an action',
    },
    stepper: { name: 'mat-stepper', use: 'A task in a few ordered steps (set up, import); each step a form' },
    stepperVertical: { name: 'mat-stepper orientation="vertical"', use: 'The same on phones or with long steps' },
    toolbar: {
      name: 'mat-toolbar',
      use: 'The header of a panel or a full-screen dialog; the app’s top bar is ui-app-shell',
    },
    sideSheet: {
      name: 'mat-drawer position="end" mode="over"',
      use: 'A record’s detail beside the list, keeping it in context; a full-screen dialog on phones',
    },
  },
  tabs: [
    { icon: 'person', label: 'Profile', content: 'Name, email, team and phone of the member.' },
    { icon: 'lock', label: 'Access', content: 'Role, two-step verification and the apps the member can open.' },
    { icon: 'history', label: 'Activity', content: 'What the member did, most recent first.' },
  ],
  menu: {
    open: 'Actions',
    items: [
      { icon: 'edit', label: 'Edit details' },
      { icon: 'content_copy', label: 'Duplicate' },
    ],
    moveTo: { icon: 'drive_file_move', label: 'Move to team' },
    destinations: ['Operations', 'Finance', 'Sales'],
    disabled: { icon: 'archive', label: 'Archive' },
    remove: { icon: 'delete', label: 'Remove member…' },
  },
  contextMenu: {
    target: 'Right-click here, or focus it and press Shift+F10',
    items: [
      { icon: 'open_in_new', label: 'Open' },
      { icon: 'drive_file_rename_outline', label: 'Rename' },
      { icon: 'download', label: 'Download' },
    ],
    remove: { icon: 'delete', label: 'Delete file…' },
  },
  steps: [
    { label: 'Company', content: 'The company’s name, country and tax number.' },
    { label: 'Members', content: 'Who joins the workspace and with which role.' },
    { label: 'Plan', content: 'The plan and how the company pays.' },
  ],
  stepActions: { next: 'Next', back: 'Back', done: 'Finish' },
  toolbar: {
    title: 'Ana Souza',
    actions: [
      { icon: 'edit', label: 'Edit' },
      { icon: 'more_vert', label: 'More actions' },
    ],
  },
  sideSheet: {
    page: 'The list stays here, behind the sheet.',
    open: 'Open Ana Souza',
    title: 'Ana Souza',
    close: 'Close',
    facts: [
      { label: 'Email', value: 'ana.souza@northwind.example' },
      { label: 'Team', value: 'Operations' },
      { label: 'Role', value: 'Administrator' },
    ],
  },
};

export const navigationScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Navigation',
  component: NavigationExample,
  scenarios: { all: navigation },
});

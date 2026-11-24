import { defineScenarios } from '@ligeirinho/previewer';
import { MEMBER_COLUMNS, SAMPLE_MEMBER_ROWS, SAMPLE_NAVIGATION } from './sample-members';
import { MemberDetailExample, type MemberDetailExampleModel } from './member-detail.example';
import { MemberListExample, type ExampleShell, type MemberListExampleModel } from './member-list.example';

const shell: ExampleShell = {
  productName: 'Northwind',
  navigation: SAMPLE_NAVIGATION,
  navigationLabel: 'Main',
  menuLabel: 'Open navigation',
  actions: [
    { id: 'help', icon: 'help', label: 'Help' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications, 3 unread', badge: 3 },
  ],
  user: {
    name: 'Marta Ruiz',
    detail: 'marta.ruiz@northwind.example',
    label: 'Account: Marta Ruiz',
    closeLabel: 'Close',
    menu: [
      { id: 'profile', icon: 'person', label: 'Profile' },
      { id: 'settings', icon: 'settings', label: 'Settings' },
      { id: 'sign-out', icon: 'logout', label: 'Sign out' },
    ],
  },
};

const more = {
  kind: 'more',
  hasMore: true,
  loading: false,
  text: { action: 'Show more', loading: 'Loading more members…' },
} as const;

const list: MemberListExampleModel = {
  shell,
  status: 'ready',
  text: {
    title: 'Members',
    summary: '24 members, 3 invited',
    inviteAction: 'Invite member',
    searchLabel: 'Search members',
    filtersLabel: 'Status',
    tableLabel: 'Members',
    loading: 'Loading members…',
    loadFailedTitle: 'The members could not be loaded',
    loadFailedMessage: 'Check the connection and try again.',
    retryAction: 'Try again',
    emptyTitle: 'No members match “zoe”',
    emptyMessage: 'Check the spelling or clear the search.',
    clearSearchAction: 'Clear search',
  },
  query: '',
  filters: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'invited', label: 'Invited' },
    { value: 'suspended', label: 'Suspended' },
  ],
  selectedFilter: 'all',
  columns: MEMBER_COLUMNS,
  rows: SAMPLE_MEMBER_ROWS,
  more,
};

export const memberListScenarios = defineScenarios({
  flow: 'Screen patterns',
  title: 'Back office list',
  component: MemberListExample,
  scenarios: {
    full: list,
    loading: { ...list, status: 'loading', rows: [] },
    failed: { ...list, status: 'failed', rows: [] },
    loadingMore: { ...list, more: { ...more, loading: true } },
    noResults: { ...list, query: 'zoe', rows: [], more: undefined },
  },
});

const detail: MemberDetailExampleModel = {
  shell,
  backLink: { label: 'Members', path: '/__preview' },
  name: 'Ana Souza',
  since: 'Member since March 2025',
  editAction: 'Edit details',
  removeAction: 'Remove member…',
  sections: [
    {
      title: 'Profile',
      items: [
        { label: 'Email', value: 'ana.souza@northwind.example' },
        { label: 'Team', value: 'Operations' },
        { label: 'Phone', value: '+34 612 345 678' },
      ],
    },
    {
      title: 'Access',
      items: [
        { label: 'Role', value: 'Administrator' },
        { label: 'Two-step verification', value: 'On' },
        { label: 'Last active', value: 'Today, 09:42' },
      ],
    },
  ],
};

export const memberDetailScenarios = defineScenarios({
  flow: 'Screen patterns',
  title: 'Back office detail',
  component: MemberDetailExample,
  scenarios: {
    active: detail,
    invited: {
      ...detail,
      name: 'Carla Méndez',
      since: 'Invited on March 3',
      notice: {
        title: 'Invitation pending',
        message: 'Carla Méndez has not accepted the invitation yet. It expires in 4 days.',
        action: 'Resend invitation',
      },
      sections: [
        {
          title: 'Profile',
          items: [
            { label: 'Email', value: 'carla.mendez@northwind.example' },
            { label: 'Team', value: 'Finance' },
            { label: 'Phone', value: '+34 622 118 409' },
          ],
        },
        {
          title: 'Access',
          items: [
            { label: 'Role', value: 'Viewer' },
            { label: 'Two-step verification', value: 'Off' },
            { label: 'Last active', value: 'Never' },
          ],
        },
      ],
    },
  },
});

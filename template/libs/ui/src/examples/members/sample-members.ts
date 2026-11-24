import type { DataTableColumn, DataTableRow } from '../../lib/data-table/data-table';
import type { ShellNavSection } from '../../lib/app-shell/app-shell';
import type { FilterOption } from '../../lib/filter-bar/filter-bar';
import type { ExampleShell } from './member-list.example';

/** Example data for the catalog's screens: a back office's members, with the long and the odd cases. */

/**
 * A back office's drawer: an untitled first section, then titled sections of one subject each.
 * *Members* points at the previewer itself, so it shows as the current page there.
 */
export const SAMPLE_NAVIGATION: readonly ShellNavSection[] = [
  { items: [{ label: 'Overview', icon: 'dashboard', path: '/overview' }] },
  {
    title: 'People',
    items: [
      { label: 'Members', icon: 'group', path: '/__preview' },
      { label: 'Teams', icon: 'groups', path: '/teams' },
      { label: 'Roles', icon: 'badge', path: '/roles' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Invoices', icon: 'receipt_long', path: '/invoices' },
      { label: 'Payment methods', icon: 'credit_card', path: '/payment-methods' },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Settings', icon: 'settings', path: '/settings' },
      { label: 'Security', icon: 'shield', path: '/security' },
      { label: 'Integrations', icon: 'extension', path: '/integrations' },
    ],
  },
];

/** The members' status filter, *All* first. */
export const SAMPLE_STATUS_FILTERS: readonly FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

/** The shell around the catalog's back-office screens: Northwind, signed in as Marta Ruiz. */
export const SAMPLE_SHELL: ExampleShell = {
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

export const MEMBER_COLUMNS: readonly DataTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'lastActive', label: 'Last active', align: 'end' },
];

function member(id: string, cells: Readonly<Record<string, string>>): DataTableRow {
  return { id, cells, openLabel: `Open ${cells['name'] ?? id}` };
}

export const SAMPLE_MEMBER_ROWS: readonly DataTableRow[] = [
  member('m-1', { name: 'Ana Souza', email: 'ana.souza@northwind.example', role: 'Administrator', status: 'Active', lastActive: 'Today' }),
  member('m-2', { name: 'Bruno Lima', email: 'bruno@northwind.example', role: 'Editor', status: 'Active', lastActive: 'Yesterday' }),
  member('m-3', { name: 'Carla Méndez', email: 'carla.mendez@northwind.example', role: 'Viewer', status: 'Invited', lastActive: '—' }),
  member('m-4', {
    name: 'Maximiliano Fernández de la Cruz',
    email: 'maximiliano.fernandez.delacruz@northwind.example',
    role: 'Editor',
    status: 'Suspended',
    lastActive: 'Feb 12',
  }),
  member('m-5', { name: 'Dana Kim', email: 'dana.kim@northwind.example', role: 'Viewer', status: 'Active', lastActive: 'Mar 1' }),
];

const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Fábio', 'Gabriela', 'Hugo', 'Inés', 'João', 'Kenji', 'Laura'];
const LAST_NAMES = ['Souza', 'Lima', 'Méndez', 'Rocha', 'García', 'Costa', 'Ortiz', 'Silva'];
const ROLES = ['Administrator', 'Editor', 'Viewer', 'Viewer'];
const STATUSES = ['Active', 'Active', 'Active', 'Invited', 'Suspended'];

/** 48 members, for paging and infinite scroll. */
export const MANY_MEMBER_ROWS: readonly DataTableRow[] = Array.from({ length: 48 }, (_, index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length] ?? '';
  const last = LAST_NAMES[(index * 5) % LAST_NAMES.length] ?? '';
  return member(`m-${String(index + 1)}`, {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${String(index + 1)}@northwind.example`.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    role: ROLES[index % ROLES.length] ?? '',
    status: STATUSES[index % STATUSES.length] ?? '',
    lastActive: `Mar ${String((index % 28) + 1)}`,
  });
});

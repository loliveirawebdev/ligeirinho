import { defineScenarios } from '@ligeirinho/previewer';
import { ProfileCardView } from './profile-card.view';

// No type argument: the view-model type comes from the component and the scenario names are kept.
export const profileCardScenarios = defineScenarios({
  flow: 'Account',
  title: 'Profile card',
  component: ProfileCardView,
  scenarios: {
    complete: {
      displayName: 'Ada Lovelace',
      email: 'ada.lovelace.with.a.very.long.address@example.com',
      bio: 'Writes the first program, then the tests for it.',
    },
    minimal: { displayName: 'Ada', email: 'ada@example.com', bio: null },
  },
});

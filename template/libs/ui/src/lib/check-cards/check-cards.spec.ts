import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { CheckCards } from './check-cards';
import { CheckCardsHarness } from './check-cards.harness';

const options = [
  { value: 'starter', title: 'Starter', description: 'Up to 5 people', note: 'Free' },
  { value: 'business', title: 'Business', description: 'Up to 50 people', note: 'R$ 49/mo' },
  { value: 'enterprise', title: 'Enterprise', description: 'Unlimited' },
];

describe('check cards', () => {
  it('picks one option at a time, from anywhere on its card', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(CheckCards, {
      inputs: { label: 'Plan', options, selected: ['starter'] },
      on: { selectedChange: (selected: readonly string[]) => changes.push(selected) },
    });
    const cards = await TestbedHarnessEnvironment.harnessForFixture(fixture, CheckCardsHarness);
    expect(await cards.getTitles()).toEqual(['Starter', 'Business', 'Enterprise']);
    expect(await cards.getSelectedTitles()).toEqual(['Starter']);
    await cards.choose('Business');
    expect(changes).toEqual([['business']]);
  });

  it('with multiple, adds and removes options, in the options order', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(CheckCards, {
      inputs: { label: 'Add-ons', options, selected: ['enterprise'], multiple: true },
      on: { selectedChange: (selected: readonly string[]) => changes.push(selected) },
    });
    const cards = await TestbedHarnessEnvironment.harnessForFixture(fixture, CheckCardsHarness);
    await cards.choose('Starter');
    await cards.choose('Enterprise');
    expect(changes).toEqual([['starter', 'enterprise'], []]);
  });
});

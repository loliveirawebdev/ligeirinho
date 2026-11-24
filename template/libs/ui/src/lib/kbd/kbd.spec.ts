import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Kbd } from './kbd';
import { KbdHarness } from './kbd.harness';

describe('kbd', () => {
  it('shows each key of the shortcut', async () => {
    const { fixture } = await render(Kbd, { inputs: { keys: ['⌘', 'K'] } });
    const kbd = await TestbedHarnessEnvironment.harnessForFixture(fixture, KbdHarness);
    expect(await kbd.getKeys()).toEqual(['⌘', 'K']);
  });
});

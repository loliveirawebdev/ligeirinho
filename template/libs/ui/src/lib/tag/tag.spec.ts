import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Tag } from './tag';
import { TagHarness } from './tag.harness';

describe('tag', () => {
  it('shows its label in its tone', async () => {
    const { fixture } = await render(Tag, { inputs: { label: 'Overdue', tone: 'warning', icon: 'schedule' } });
    const tag = await TestbedHarnessEnvironment.harnessForFixture(fixture, TagHarness);
    expect(await tag.getLabel()).toBe('Overdue');
    expect(await tag.getTone()).toBe('warning');
  });
});

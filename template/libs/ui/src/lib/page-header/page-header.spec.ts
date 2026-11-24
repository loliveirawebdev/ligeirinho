import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter } from '@angular/router';
import { render } from '@testing-library/angular';
import { PageHeader } from './page-header';
import { PageHeaderHarness } from './page-header.harness';

describe('page header', () => {
  it('shows the title, the line under it and the back link', async () => {
    const { fixture } = await render(PageHeader, {
      inputs: { title: 'Ana Souza', supportingText: 'Member since March 2025', backLink: { label: 'Members', path: '/' } },
      providers: [provideRouter([])],
    });
    const header = await TestbedHarnessEnvironment.harnessForFixture(fixture, PageHeaderHarness);
    expect(await header.getTitle()).toBe('Ana Souza');
    expect(await header.getSupportingText()).toBe('Member since March 2025');
    expect(await header.getBackLabel()).toBe('Members');
  });

  it('leaves out what it is not given', async () => {
    const { fixture } = await render(PageHeader, { inputs: { title: 'Members' }, providers: [provideRouter([])] });
    const header = await TestbedHarnessEnvironment.harnessForFixture(fixture, PageHeaderHarness);
    expect(await header.getSupportingText()).toBe('');
    expect(await header.getBackLabel()).toBe('');
  });
});

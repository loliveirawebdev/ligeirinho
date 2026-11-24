import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router, provideRouter } from '@angular/router';
import { render } from '@testing-library/angular';
import { Breadcrumb } from './breadcrumb';
import { BreadcrumbHarness } from './breadcrumb.harness';

describe('breadcrumb', () => {
  it('links every level but the page itself, which it marks as current', async () => {
    const { fixture } = await render(Breadcrumb, {
      inputs: {
        label: 'Breadcrumb',
        items: [{ label: 'Clients', link: '/clients' }, { label: 'Northwind', link: '/clients/northwind' }, { label: 'Contract 2026' }],
      },
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
    const breadcrumb = await TestbedHarnessEnvironment.harnessForFixture(fixture, BreadcrumbHarness);
    expect(await breadcrumb.getLabels()).toEqual(['Clients', 'Northwind', 'Contract 2026']);
    expect(await breadcrumb.getCurrent()).toBe('Contract 2026');
    await breadcrumb.follow('Clients');
    await fixture.whenStable();
    expect(fixture.debugElement.injector.get(Router).url).toBe('/clients');
  });
});

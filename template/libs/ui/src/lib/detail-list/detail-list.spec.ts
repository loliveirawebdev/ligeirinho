import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { DetailList } from './detail-list';
import { DetailListHarness } from './detail-list.harness';

describe('detail list', () => {
  it('pairs every label with its value', async () => {
    const items = [
      { label: 'Email', value: 'ana.souza@northwind.example' },
      { label: 'Role', value: 'Administrator' },
    ];
    const { fixture } = await render(DetailList, { inputs: { items } });
    const details = await TestbedHarnessEnvironment.harnessForFixture(fixture, DetailListHarness);
    expect(await details.getItems()).toEqual(items);
  });
});

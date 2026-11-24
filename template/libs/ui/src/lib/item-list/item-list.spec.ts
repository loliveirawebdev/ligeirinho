import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { ItemList } from './item-list';
import { ItemListHarness } from './item-list.harness';

describe('item list', () => {
  it('lists the items and emits the one opened', async () => {
    const opened: string[] = [];
    const { fixture } = await render(ItemList, {
      inputs: {
        label: 'Invoices',
        items: [
          { id: 'inv-1042', title: 'Invoice 1042', meta: 'Today' },
          { id: 'inv-1041', title: 'Invoice 1041', supportingText: 'Contoso' },
        ],
      },
      on: { itemOpened: (id: string) => opened.push(id) },
    });
    const list = await TestbedHarnessEnvironment.harnessForFixture(fixture, ItemListHarness);
    expect(await list.getTitles()).toEqual(['Invoice 1042', 'Invoice 1041']);
    expect(await list.getMetas()).toEqual(['Today']);
    await list.open('Invoice 1041');
    expect(opened).toEqual(['inv-1041']);
  });
});

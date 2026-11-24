import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { Transfer, type TransferItem, type TransferLabels } from './transfer';
import { TransferHarness } from './transfer.harness';

const people: readonly TransferItem[] = [
  { value: 'ana', label: 'Ana Souza', secondary: 'ana@acme.com' },
  { value: 'bruno', label: 'Bruno Lima' },
  { value: 'carla', label: 'Carla Dias' },
  { value: 'davi', label: 'Davi Rocha', disabled: true },
];

const labels: TransferLabels = {
  source: 'Available',
  target: 'Members',
  search: 'Search people',
  selectAll: 'Select all',
  count: '{checked} of {total}',
  moveRight: 'Add selected',
  moveLeft: 'Remove selected',
  empty: 'Nobody here',
};

describe('transfer', () => {
  it('moves the checked items right and back, keeping the items order', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(Transfer, {
      inputs: { items: people, labels, value: ['bruno'] },
      on: { value: (value: readonly string[]) => changes.push(value) },
    });
    const transfer = await TestbedHarnessEnvironment.harnessForFixture(fixture, TransferHarness);
    expect(await transfer.getItems('source')).toEqual(['Ana Souza', 'Carla Dias', 'Davi Rocha']);
    expect(await transfer.getItems('target')).toEqual(['Bruno Lima']);
    expect(await transfer.canMoveRight()).toBe(false);
    await transfer.check('source', 'Carla Dias', 'Ana Souza');
    expect(await transfer.getCount('source')).toBe('2 of 3');
    await transfer.moveRight();
    expect(changes.at(-1)).toEqual(['ana', 'bruno', 'carla']);
    await transfer.check('target', 'Bruno Lima');
    await transfer.moveLeft();
    expect(changes.at(-1)).toEqual(['ana', 'carla']);
    expect(await transfer.getItems('source')).toEqual(['Bruno Lima', 'Davi Rocha']);
  });

  it('searches a list and selects all it shows, never the disabled ones', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(Transfer, { inputs: { items: people, labels }, on: { value: (value: readonly string[]) => changes.push(value) } });
    const transfer = await TestbedHarnessEnvironment.harnessForFixture(fixture, TransferHarness);
    await transfer.search('source', 'a@acme');
    expect(await transfer.getItems('source')).toEqual(['Ana Souza']);
    await transfer.search('source', '');
    await transfer.toggleAll('source');
    await transfer.moveRight();
    expect(changes).toEqual([['ana', 'bruno', 'carla']]);
  });

  it('works as a reactive form control', async () => {
    @Component({
      imports: [Transfer, ReactiveFormsModule],
      template: `<ui-transfer [formControl]="members" [items]="items" [labels]="labels" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class MembersForm {
      readonly members = new FormControl<readonly string[]>(['carla'], { nonNullable: true });
      readonly items = people;
      readonly labels = labels;
    }
    const { fixture } = await render(MembersForm);
    const transfer = await TestbedHarnessEnvironment.harnessForFixture(fixture, TransferHarness);
    expect(await transfer.getItems('target')).toEqual(['Carla Dias']);
    await transfer.check('source', 'Bruno Lima');
    await transfer.moveRight();
    expect(fixture.componentInstance.members.value).toEqual(['bruno', 'carla']);
  });
});

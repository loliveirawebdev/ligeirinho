import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { Cascader, type CascaderOption } from './cascader';
import { CascaderHarness } from './cascader.harness';

const places: readonly CascaderOption[] = [
  {
    value: 'br',
    label: 'Brazil',
    children: [
      {
        value: 'sp',
        label: 'São Paulo',
        children: [
          { value: 'cps', label: 'Campinas' },
          { value: 'stos', label: 'Santos' },
        ],
      },
      { value: 'rj', label: 'Rio de Janeiro', children: [{ value: 'nit', label: 'Niterói' }] },
    ],
  },
  { value: 'pt', label: 'Portugal', children: [{ value: 'lis', label: 'Lisbon' }] },
];

const inputs = { label: 'City', backLabel: 'Back to {label}', options: places };

describe('cascader', () => {
  it('opens a column per level and sets the path when a leaf is chosen', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(Cascader, { inputs, on: { value: (value: readonly string[]) => changes.push(value) } });
    const cascader = await TestbedHarnessEnvironment.harnessForFixture(fixture, CascaderHarness);
    await cascader.open();
    expect(await cascader.getColumns()).toEqual([['Brazil', 'Portugal']]);
    await cascader.choose('Brazil');
    expect(await cascader.getColumns()).toEqual([['Brazil', 'Portugal'], ['São Paulo', 'Rio de Janeiro']]);
    await cascader.choose('São Paulo', 'Santos');
    expect(changes).toEqual([['br', 'sp', 'stos']]);
    expect(await cascader.isOpen()).toBe(false);
    expect(await cascader.getText()).toBe('Brazil / São Paulo / Santos');
  });

  it('is driven by the keyboard: arrows in a column, Right opens a branch, Left goes back, Enter picks', async () => {
    const changes: (readonly string[])[] = [];
    const { fixture } = await render(Cascader, { inputs, on: { value: (value: readonly string[]) => changes.push(value) } });
    const cascader = await TestbedHarnessEnvironment.harnessForFixture(fixture, CascaderHarness);
    await cascader.press(TestKey.DOWN_ARROW);
    await cascader.press(TestKey.RIGHT_ARROW, TestKey.DOWN_ARROW, TestKey.LEFT_ARROW, TestKey.DOWN_ARROW, TestKey.ENTER, TestKey.ENTER);
    expect(changes).toEqual([['pt', 'lis']]);
    await cascader.press(TestKey.DOWN_ARROW, TestKey.ESCAPE);
    expect(await cascader.isOpen()).toBe(false);
  });

  it('works as a reactive form control', async () => {
    @Component({
      imports: [Cascader, ReactiveFormsModule],
      template: `<ui-cascader [formControl]="city" [label]="label" [backLabel]="backLabel" [options]="options" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class CityForm {
      readonly city = new FormControl<readonly string[]>(['br', 'rj', 'nit'], { nonNullable: true });
      readonly label = inputs.label;
      readonly backLabel = inputs.backLabel;
      readonly options = places;
    }
    const { fixture } = await render(CityForm);
    const cascader = await TestbedHarnessEnvironment.harnessForFixture(fixture, CascaderHarness);
    expect(await cascader.getText()).toBe('Brazil / Rio de Janeiro / Niterói');
    await cascader.choose('Brazil', 'São Paulo', 'Campinas');
    expect(fixture.componentInstance.city.value).toEqual(['br', 'sp', 'cps']);
    expect(fixture.componentInstance.city.touched).toBe(true);
  });
});

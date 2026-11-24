import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Splitter } from './splitter';
import { SplitterHarness } from './splitter.harness';

describe('splitter', () => {
  it('moves its divider with the arrow keys, within its limits, and reports where it was left', async () => {
    const sizes: number[] = [];
    const { fixture } = await render(Splitter, {
      inputs: { handleLabel: 'Resize the list', size: 40, min: 25, max: 70 },
      on: { sizeChange: (size: number) => sizes.push(size) },
    });
    const splitter = await TestbedHarnessEnvironment.harnessForFixture(fixture, SplitterHarness);
    expect(await splitter.getHandleLabel()).toBe('Resize the list');
    expect(await splitter.getSize()).toBe(40);
    await splitter.move('end');
    expect(await splitter.getSize()).toBe(45);
    await splitter.moveToLimit('min');
    await splitter.move('start');
    expect(await splitter.getSize()).toBe(25);
    expect(sizes).toEqual([45, 25, 25]);
  });
});

import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { InputGroup } from './input-group';
import { InputGroupHarness } from './input-group.harness';

const inputs = { label: 'Email', actionLabel: 'Invite', busyActionLabel: 'Inviting…' };

describe('input group', () => {
  it('emits the trimmed text and clears the field', async () => {
    const submitted: string[] = [];
    const { fixture } = await render(InputGroup, { inputs, on: { submitted: (text: string) => submitted.push(text) } });
    const group = await TestbedHarnessEnvironment.harnessForFixture(fixture, InputGroupHarness);
    await group.submit('  ana@northwind.example  ');
    expect(submitted).toEqual(['ana@northwind.example']);
    expect(await group.getValue()).toBe('');
  });

  it('never emits an empty text', async () => {
    const submitted: string[] = [];
    const { fixture } = await render(InputGroup, { inputs, on: { submitted: (text: string) => submitted.push(text) } });
    const group = await TestbedHarnessEnvironment.harnessForFixture(fixture, InputGroupHarness);
    await group.submit('   ');
    expect(submitted).toEqual([]);
  });

  it('shows the busy label and disables the action while busy', async () => {
    const { fixture } = await render(InputGroup, { inputs: { ...inputs, busy: true } });
    const group = await TestbedHarnessEnvironment.harnessForFixture(fixture, InputGroupHarness);
    expect(await group.isBusy()).toBe(true);
    expect(await group.getActionLabel()).toBe('Inviting…');
  });
});

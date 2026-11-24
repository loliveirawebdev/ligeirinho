import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { applyMask, Mask, MASKS, unmask } from './mask';
import { MaskHarness } from './mask.harness';

@Component({
  imports: [Mask, ReactiveFormsModule],
  template: `
    <input [attr.aria-label]="labels.cpf" [uiMask]="masks.cpf" [formControl]="cpf" />
    <input [attr.aria-label]="labels.phone" [uiMask]="masks.phone" [formControl]="phone" />
    <input [attr.aria-label]="labels.plate" [uiMask]="masks.plate" uiMaskValue="masked" [formControl]="plate" />
  `,
})
class MaskedForm {
  readonly masks = MASKS;
  readonly labels = { cpf: 'CPF', phone: 'Phone', plate: 'Plate' };
  readonly cpf = new FormControl('12345678900');
  readonly phone = new FormControl('');
  readonly plate = new FormControl('');
}

describe('mask', () => {
  it('shows the form value in its mask, and gives the form what was typed', async () => {
    const { fixture } = await render(MaskedForm);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const cpf = await loader.getHarness(MaskHarness.with({ label: 'CPF' }));
    expect(await cpf.getValue()).toBe('123.456.789-00');
    expect(await cpf.getInputMode()).toBe('numeric');

    await cpf.type('98765432100');
    expect(await cpf.getValue()).toBe('987.654.321-00');
    expect(fixture.componentInstance.cpf.value).toBe('98765432100');
  });

  it('picks the alternative that holds what was typed', async () => {
    const { fixture } = await render(MaskedForm);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const phone = await loader.getHarness(MaskHarness.with({ label: 'Phone' }));
    await phone.type('1133334444');
    expect(await phone.getValue()).toBe('(11) 3333-4444');
    await phone.type('11999998888');
    expect(await phone.getValue()).toBe('(11) 99999-8888');
    expect(fixture.componentInstance.phone.value).toBe('11999998888');
  });

  it('keeps the text as shown when asked, letters in capitals, and drops what the mask refuses', async () => {
    const { fixture } = await render(MaskedForm);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const plate = await loader.getHarness(MaskHarness.with({ label: 'Plate' }));
    await plate.type('abc1d23');
    expect(await plate.getValue()).toBe('ABC-1D23');
    expect(fixture.componentInstance.plate.value).toBe('ABC-1D23');
    expect(await plate.getInputMode()).toBeNull();
  });

  it('formats and strips without a field', () => {
    expect(applyMask('0131', MASKS.cep)).toBe('0131');
    expect(applyMask('01310100', MASKS.cep)).toBe('01310-100');
    expect(unmask('01310-100', MASKS.cep)).toBe('01310100');
    expect(applyMask('12345678000199', MASKS.cpfOrCnpj)).toBe('12.345.678/0001-99');
    expect(applyMask(unmask('12a3', MASKS.date), MASKS.date)).toBe('12/3');
  });
});

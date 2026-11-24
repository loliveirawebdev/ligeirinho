import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { Rating } from './rating';
import { RatingHarness } from './rating.harness';

const starLabel = (stars: number): string => (stars === 1 ? '1 star' : `${String(stars)} stars`);

@Component({
  imports: [Rating, ReactiveFormsModule],
  template: `<ui-rating [label]="label()" [starLabel]="starLabel" [formControl]="score" />`,
})
class FormHost {
  readonly label = signal('Rating');
  readonly starLabel = starLabel;
  readonly score = new FormControl(2, { nonNullable: true });
}

describe('rating', () => {
  it('names each star and scores with a click', async () => {
    const { fixture } = await render(Rating, { inputs: { label: 'Rating', starLabel } });
    const rating = await TestbedHarnessEnvironment.harnessForFixture(fixture, RatingHarness);
    expect(await rating.getStarLabels()).toEqual(['1 star', '2 stars', '3 stars', '4 stars', '5 stars']);
    expect(await rating.getValue()).toBe(0);
    await rating.rate(4);
    expect(await rating.getValue()).toBe(4);
    expect(fixture.componentInstance.value()).toBe(4);
  });

  it('read-only shows the score without radio buttons', async () => {
    const { fixture } = await render(Rating, { inputs: { label: 'Customer rating', starLabel, value: 3, readonly: true } });
    const rating = await TestbedHarnessEnvironment.harnessForFixture(fixture, RatingHarness);
    expect(await rating.isReadonly()).toBe(true);
    expect(await rating.getValue()).toBe(3);
    expect(screen.getByRole('img', { name: 'Customer rating 3 stars' })).toBeTruthy();
  });

  it('works with a form control, written, chosen and disabled', async () => {
    const { fixture } = await render(FormHost);
    const rating = await TestbedHarnessEnvironment.harnessForFixture(fixture, RatingHarness);
    expect(await rating.getValue()).toBe(2);
    await rating.rate(5);
    expect(fixture.componentInstance.score.value).toBe(5);
    fixture.componentInstance.score.disable();
    expect(await rating.isDisabled()).toBe(true);
  });
});

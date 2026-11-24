import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render } from '@testing-library/angular';
import { Anchor, type AnchorItem } from './anchor';
import { AnchorHarness } from './anchor.harness';

const items: readonly AnchorItem[] = [
  { id: 'scope', label: 'Scope' },
  { id: 'terms', label: 'Terms', children: [{ id: 'renewal', label: 'Renewal' }] },
];

@Component({
  imports: [Anchor],
  template: `
    <ui-anchor [items]="items" [label]="label" />
    @for (item of sections; track item) {
      <section [id]="item"></section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LongPage {
  protected readonly items = items;
  protected readonly label = 'On this page';
  protected readonly sections = ['scope', 'terms', 'renewal'];
}

/** Stands in for the browser's observer: the test says which sections entered the reading band. */
class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | undefined;
  readonly observed: Element[] = [];

  constructor(private readonly callback: (entries: { target: Element; isIntersecting: boolean }[]) => void) {
    FakeIntersectionObserver.latest = this;
  }

  observe(target: Element): void {
    this.observed.push(target);
  }

  disconnect(): void {
    this.observed.length = 0;
  }

  enter(id: string): void {
    this.callback(this.observed.filter((target) => target.id === id).map((target) => ({ target, isIntersecting: true })));
  }
}

describe('anchor', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('links every section, subsections included, and marks the first one to start', async () => {
    const { fixture } = await render(LongPage);
    const anchor = await TestbedHarnessEnvironment.harnessForFixture(fixture, AnchorHarness);
    expect(await anchor.getLabel()).toBe('On this page');
    expect(await anchor.getLinkLabels()).toEqual(['Scope', 'Terms', 'Renewal']);
    expect(await anchor.getCurrentLabel()).toBe('Scope');
  });

  it('marks the section that scrolls into the reading band', async () => {
    const { fixture } = await render(LongPage);
    const anchor = await TestbedHarnessEnvironment.harnessForFixture(fixture, AnchorHarness);
    expect(FakeIntersectionObserver.latest?.observed.map((section) => section.id)).toEqual(['scope', 'terms', 'renewal']);
    FakeIntersectionObserver.latest?.enter('renewal');
    expect(await anchor.getCurrentLabel()).toBe('Renewal');
  });

  it('scrolls to the section clicked and marks it', async () => {
    const { fixture } = await render(LongPage);
    const anchor = await TestbedHarnessEnvironment.harnessForFixture(fixture, AnchorHarness);
    await anchor.follow('Terms');
    expect(await anchor.getCurrentLabel()).toBe('Terms');
    expect(scrollIntoView.mock.contexts.at(-1)).toHaveProperty('id', 'terms');
  });
});

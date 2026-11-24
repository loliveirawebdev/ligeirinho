import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { MentionInput, type MentionPerson } from './mention-input';
import { MentionInputHarness } from './mention-input.harness';

const people: readonly MentionPerson[] = [
  { id: 'ana', name: 'Ana Souza', secondary: 'Design' },
  { id: 'bruno', name: 'Bruno Lima', secondary: 'Finance' },
  { id: 'joana', name: 'Joana Prado' },
];

const inputs = { label: 'Comment', suggestionsLabel: 'People', people };

describe('mention input', () => {
  it('suggests people after an @, filtered by what follows, and writes the one chosen', async () => {
    const mentions: (readonly string[])[] = [];
    const { fixture } = await render(MentionInput, { inputs, on: { mentionsChange: (ids: readonly string[]) => mentions.push(ids) } });
    const field = await TestbedHarnessEnvironment.harnessForFixture(fixture, MentionInputHarness);
    await field.type('Thanks a');
    expect(await field.isOpen()).toBe(false);
    await field.type(' @an');
    expect(await field.getSuggestions()).toEqual(['Ana Souza', 'Joana Prado']);
    await field.choose('Joana Prado');
    expect(await field.getValue()).toBe('Thanks a @Joana Prado ');
    expect(await field.isOpen()).toBe(false);
    expect(mentions).toEqual([['joana']]);
  });

  it('is driven by the keyboard: arrows move through the suggestions, Enter chooses, Esc closes', async () => {
    const mentions: (readonly string[])[] = [];
    const { fixture } = await render(MentionInput, { inputs, on: { mentionsChange: (ids: readonly string[]) => mentions.push(ids) } });
    const field = await TestbedHarnessEnvironment.harnessForFixture(fixture, MentionInputHarness);
    await field.type('@');
    expect(await field.getActiveSuggestion()).toBe('Ana Souza');
    await field.press(TestKey.DOWN_ARROW);
    expect(await field.getActiveSuggestion()).toBe('Bruno Lima');
    await field.press(TestKey.ENTER);
    await field.type('and @');
    await field.press(TestKey.ESCAPE);
    expect(await field.isOpen()).toBe(false);
    expect(await field.getValue()).toBe('@Bruno Lima and @');
    expect(mentions).toEqual([['bruno']]);
  });

  it('works as a reactive form control', async () => {
    @Component({
      imports: [MentionInput, ReactiveFormsModule],
      template: `<ui-mention-input [formControl]="comment" [label]="label" [suggestionsLabel]="suggestionsLabel" [people]="people" />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class CommentForm {
      readonly comment = new FormControl('Ping ', { nonNullable: true });
      readonly label = inputs.label;
      readonly suggestionsLabel = inputs.suggestionsLabel;
      readonly people = people;
    }
    const { fixture } = await render(CommentForm);
    const field = await TestbedHarnessEnvironment.harnessForFixture(fixture, MentionInputHarness);
    expect(await field.getValue()).toBe('Ping ');
    await field.type('@bru');
    await field.choose('Bruno Lima');
    expect(fixture.componentInstance.comment.value).toBe('Ping @Bruno Lima ');
  });
});

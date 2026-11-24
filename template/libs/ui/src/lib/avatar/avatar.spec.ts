import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Avatar, AvatarGroup, initialsOf } from './avatar';
import { AvatarGroupHarness, AvatarHarness } from './avatar.harness';

describe('avatar', () => {
  it('takes the initials of the first and last names', () => {
    expect(initialsOf('Ana Souza')).toBe('AS');
    expect(initialsOf('  maximiliano fernández de la cruz ')).toBe('MC');
    expect(initialsOf('Ana')).toBe('A');
  });

  it('shows the initials and is read by the name, unless it is decorative', async () => {
    const { fixture, rerender } = await render(Avatar, { inputs: { name: 'Ana Souza' } });
    const avatar = await TestbedHarnessEnvironment.harnessForFixture(fixture, AvatarHarness);
    expect(await avatar.getInitials()).toBe('AS');
    expect(await avatar.getName()).toBe('Ana Souza');
    await rerender({ partialUpdate: true, inputs: { decorative: true } });
    expect(await avatar.getName()).toBeNull();
  });

  it('in a group, shows the first ones and how many more, read by its label', async () => {
    const people = ['Ana Souza', 'Bruno Lima', 'Carla Méndez', 'Diego Silva', 'Elena García'].map((name) => ({ name }));
    const { fixture } = await render(AvatarGroup, { inputs: { people, label: 'Ana, Bruno and 3 more', max: 3 } });
    const group = await TestbedHarnessEnvironment.harnessForFixture(fixture, AvatarGroupHarness);
    expect(await group.getLabel()).toBe('Ana, Bruno and 3 more');
    expect(await group.getShownInitials()).toEqual(['AS', 'BL']);
    expect(await group.getMoreText()).toBe('+3');
  });
});

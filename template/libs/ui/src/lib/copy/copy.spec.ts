import { defineCopy, formatText, pluralText, selectCopy } from './copy';

const greetingCopy = defineCopy({
  en: { title: 'Tasks', open: { one: '{count} open task', other: '{count} open tasks' } },
  'pt-BR': { title: 'Tarefas', open: { one: '{count} tarefa aberta', other: '{count} tarefas abertas' } },
});

describe('copy', () => {
  it('picks the exact locale, then the language, then the source', () => {
    expect(selectCopy(greetingCopy, 'pt-BR').text.title).toBe('Tarefas');
    expect(selectCopy(greetingCopy, 'pt-PT').locale).toBe('pt-BR');
    expect(selectCopy(greetingCopy, 'en-US').locale).toBe('en');
    expect(selectCopy(greetingCopy, 'de').locale).toBe('en');
  });

  it('fills placeholders and leaves unknown ones', () => {
    expect(formatText('Complete “{title}”', { title: 'Ship it' })).toBe('Complete “Ship it”');
    expect(formatText('{missing}', {})).toBe('{missing}');
  });

  it('uses the plural form of the locale', () => {
    const { open } = greetingCopy.en;
    expect(pluralText(open, 1, 'en')).toBe('1 open task');
    expect(pluralText(open, 1200, 'en')).toBe('1,200 open tasks');
    expect(pluralText(greetingCopy['pt-BR'].open, 2, 'pt-BR')).toBe('2 tarefas abertas');
  });
});

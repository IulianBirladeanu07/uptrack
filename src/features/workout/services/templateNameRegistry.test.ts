import {
  assertTemplateNameAvailable,
  getTemplateNameKey,
  getTemplateNameRegistry,
  TemplateNameAlreadyExistsError,
} from './templateNameRegistry';

describe('template name registry', () => {
  it('normalizes names consistently and encodes path characters', () => {
    expect(getTemplateNameKey('  Push/ Pull  ')).toBe('push%2F%20pull');
    expect(getTemplateNameKey('PUSH/ PULL')).toBe(getTemplateNameKey('push/ pull'));
  });

  it('rejects duplicates by trimmed, case-insensitive name', () => {
    const templates = [{ id: 'template-1', data: () => ({ templateName: 'Push Day' }) }];

    expect(() => assertTemplateNameAvailable(templates, '  push day ')).toThrow(TemplateNameAlreadyExistsError);
    expect(() => assertTemplateNameAvailable(templates, 'Push Day', 'template-1')).not.toThrow();
    expect(() => assertTemplateNameAvailable(templates, 'Pull Day')).not.toThrow();
  });

  it('returns only string reservations from a valid registry object', () => {
    expect(getTemplateNameRegistry({
      workoutTemplateNames: {
        'push%20day': 'template-1',
        invalidNumber: 2,
        invalidNull: null,
      },
    })).toEqual({ 'push%20day': 'template-1' });
  });

  it.each([undefined, {}, { workoutTemplateNames: null }, { workoutTemplateNames: [] }])(
    'returns an empty registry for malformed input',
    userData => {
      expect(getTemplateNameRegistry(userData as Record<string, unknown> | undefined)).toEqual({});
    },
  );
});

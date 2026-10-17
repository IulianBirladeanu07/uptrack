import { getWorkoutTemplateKey } from './workoutTemplateKey';

describe('workout template keys', () => {
    it('prefers the top-level template id, then the nested id', () => {
        expect(getWorkoutTemplateKey({ id: 'top-level', data: { id: 'nested' } }, 4)).toBe('top-level');
        expect(getWorkoutTemplateKey({ data: { id: 'nested' } }, 4)).toBe('nested');
    });

    it('uses a stable positional key for id-less templates', () => {
        const template = { templateName: 'Unpersisted workout' };

        expect(getWorkoutTemplateKey(template, 2)).toBe('template-2');
        expect(getWorkoutTemplateKey(template, 2)).toBe('template-2');
        expect(getWorkoutTemplateKey(template, 3)).toBe('template-3');
    });
});

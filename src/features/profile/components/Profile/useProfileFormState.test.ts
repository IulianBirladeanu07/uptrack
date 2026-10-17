import { act, renderHook } from '@testing-library/react-native';
import type { UserData } from '../../../../shared/types';
import { useProfileFormState } from './useProfileFormState';

const firstUser: UserData = {
    username: 'first',
    email: 'first@example.com',
    age: 30,
    height: 180,
    gender: 'female',
    currentWeight: 70,
    targetWeight: 65,
    activityLevel: 'sedentary',
    experienceLevel: 'beginner',
    stressLevel: 'high',
    autoAdjustEnabled: false,
    profilePicture: 'https://example.com/first.jpg',
};

const secondUser: UserData = {
    ...firstUser,
    username: 'second',
    email: 'second@example.com',
    age: 42,
    currentWeight: 90,
    profilePicture: 'https://example.com/second.jpg',
};

describe('useProfileFormState', () => {
    it('seeds profile values and starts without pending changes', () => {
        const { result } = renderHook(() => useProfileFormState(firstUser, 'auth@example.com'));

        expect(result.current.form).toMatchObject({
            age: 30,
            height: 180,
            gender: 'female',
            currentWeight: 70,
            targetWeight: 65,
            autoAdjustEnabled: false,
        });
        expect(result.current.original).toEqual(result.current.form);
        expect(result.current.identity).toEqual({
            username: 'first',
            email: 'first@example.com',
        });
        expect(result.current.savedIdentity).toEqual(result.current.identity);
        expect(result.current.picture).toBe('https://example.com/first.jpg');
        expect(result.current.pendingUri).toBeNull();
        expect(result.current).toMatchObject({
            planCount: 0,
            identityCount: 0,
            changedCount: 0,
            hasChanges: false,
        });
    });

    it('syncs refreshed profile data while there are no unsaved edits', () => {
        const { result, rerender } = renderHook(
            ({ userData, authEmail }: { userData: UserData; authEmail: string }) =>
                useProfileFormState(userData, authEmail),
            { initialProps: { userData: firstUser, authEmail: 'auth@example.com' } },
        );

        rerender({ userData: secondUser, authEmail: 'new-auth@example.com' });

        expect(result.current.form.age).toBe(42);
        expect(result.current.original).toEqual(result.current.form);
        expect(result.current.identity).toEqual({
            username: 'second',
            email: 'second@example.com',
        });
        expect(result.current.savedIdentity).toEqual(result.current.identity);
        expect(result.current.picture).toBe('https://example.com/second.jpg');
        expect(result.current.pendingUri).toBeNull();
    });

    it('preserves an edited draft when refreshed user data changes', () => {
        const { result, rerender } = renderHook(
            ({ userData }: { userData: UserData }) => useProfileFormState(userData),
            { initialProps: { userData: firstUser } },
        );
        act(() => {
            result.current.update('age', 31);
            result.current.updateIdentity('username', 'edited');
            result.current.setPendingUri('file://new-picture.jpg');
        });

        rerender({ userData: secondUser });

        expect(result.current.form.age).toBe(31);
        expect(result.current.original.age).toBe(30);
        expect(result.current.identity.username).toBe('edited');
        expect(result.current.savedIdentity.username).toBe('first');
        expect(result.current.picture).toBe('https://example.com/first.jpg');
        expect(result.current.pendingUri).toBe('file://new-picture.jpg');
        expect(result.current.hasChanges).toBe(true);
    });

    it('counts plan, identity, and pending-picture changes separately', () => {
        const { result } = renderHook(() => useProfileFormState(firstUser));

        act(() => {
            result.current.update('age', 31);
            result.current.updateIdentity('username', 'edited');
            result.current.updateIdentity('email', 'edited@example.com');
            result.current.setPendingUri('file://new-picture.jpg');
        });

        expect(result.current.planCount).toBe(1);
        expect(result.current.identityCount).toBe(3);
        expect(result.current.changedCount).toBe(4);
        expect(result.current.hasChanges).toBe(true);
    });

    it('clears only the edited identity field error', () => {
        const { result } = renderHook(() => useProfileFormState(firstUser));

        act(() => {
            result.current.setErrors({ username: 'Required', email: 'Valid email required' });
            result.current.updateIdentity('username', 'new-name');
        });

        expect(result.current.errors).toEqual({
            username: undefined,
            email: 'Valid email required',
        });
    });

    it('clamps steppers and preserves decimal precision', () => {
        const { result } = renderHook(() => useProfileFormState(firstUser));

        act(() => {
            result.current.stepValue('age', -1, 16, 80);
            result.current.stepValue('currentWeight', 0.1, 30, 300, 1);
        });

        expect(result.current.form.age).toBe(29);
        expect(result.current.form.currentWeight).toBe(70.1);

        act(() => {
            result.current.stepValue('age', -100, 16, 80);
            result.current.stepValue('currentWeight', 1000, 30, 300, 1);
        });

        expect(result.current.form.age).toBe(16);
        expect(result.current.form.currentWeight).toBe(300);
    });
});

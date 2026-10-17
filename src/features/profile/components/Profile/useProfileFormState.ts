import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UserData } from '../../../../shared/types';
import { changedFields } from '../../utils/planUpdate';
import {
    seedProfileForm,
    seedProfileIdentity,
    seedProfilePicture,
} from '../../utils/profileSeed';
import type { ProfileFormSeed, ProfileIdentitySeed } from '../../utils/profileSeed';

export type ProfileIdentityErrors = {
    [K in keyof ProfileIdentitySeed]?: string | undefined;
};

type StepKey = 'age' | 'height' | 'currentWeight' | 'targetWeight';

type ProfileFormState = {
    form: ProfileFormSeed;
    original: ProfileFormSeed;
    setOriginal: Dispatch<SetStateAction<ProfileFormSeed>>;
    identity: ProfileIdentitySeed;
    setIdentity: Dispatch<SetStateAction<ProfileIdentitySeed>>;
    savedIdentity: ProfileIdentitySeed;
    setSavedIdentity: Dispatch<SetStateAction<ProfileIdentitySeed>>;
    picture: string | null;
    setPicture: Dispatch<SetStateAction<string | null>>;
    pendingUri: string | null;
    setPendingUri: Dispatch<SetStateAction<string | null>>;
    errors: ProfileIdentityErrors;
    setErrors: Dispatch<SetStateAction<ProfileIdentityErrors>>;
    planCount: number;
    identityCount: number;
    changedCount: number;
    hasChanges: boolean;
    update: (key: keyof ProfileFormSeed, value: string | number | boolean) => void;
    updateIdentity: (key: keyof ProfileIdentitySeed, value: string) => void;
    stepValue: (key: StepKey, delta: number, min: number, max: number, decimals?: number) => void;
};

export const useProfileFormState = (
    userData: UserData | null | undefined,
    authEmail?: string | null,
): ProfileFormState => {
    const [form, setForm] = useState(() => seedProfileForm(userData));
    const [original, setOriginal] = useState(() => seedProfileForm(userData));
    const [identity, setIdentity] = useState(() => seedProfileIdentity(userData, authEmail));
    const [savedIdentity, setSavedIdentity] = useState(() => seedProfileIdentity(userData, authEmail));
    const [picture, setPicture] = useState(() => seedProfilePicture(userData));
    const [pendingUri, setPendingUri] = useState<string | null>(null);
    const [errors, setErrors] = useState<ProfileIdentityErrors>({});

    const planCount = Object.keys(changedFields(form, original)).length;
    const identityCount = (['username', 'email'] as const)
        .filter(key => identity[key] !== savedIdentity[key]).length + (pendingUri ? 1 : 0);
    const changedCount = planCount + identityCount;
    const hasChanges = changedCount > 0;

    useEffect(() => {
        if (hasChanges) return;
        const nextForm = seedProfileForm(userData);
        const nextIdentity = seedProfileIdentity(userData, authEmail);
        setForm(nextForm);
        setOriginal(nextForm);
        setIdentity(nextIdentity);
        setSavedIdentity(nextIdentity);
        setPicture(seedProfilePicture(userData));
        setPendingUri(null);
    }, [userData, hasChanges, authEmail]);

    const update = useCallback((key: keyof ProfileFormSeed, value: string | number | boolean) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateIdentity = useCallback((key: keyof ProfileIdentitySeed, value: string) => {
        setIdentity(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }, []);

    const stepValue = useCallback((key: StepKey, delta: number, min: number, max: number, decimals = 0) => {
        setForm(prev => {
            const next = parseFloat((prev[key] + delta).toFixed(decimals));
            return { ...prev, [key]: Math.min(max, Math.max(min, next)) };
        });
    }, []);

    return {
        form,
        original,
        setOriginal,
        identity,
        setIdentity,
        savedIdentity,
        setSavedIdentity,
        picture,
        setPicture,
        pendingUri,
        setPendingUri,
        errors,
        setErrors,
        planCount,
        identityCount,
        changedCount,
        hasChanges,
        update,
        updateIdentity,
        stepValue,
    };
};

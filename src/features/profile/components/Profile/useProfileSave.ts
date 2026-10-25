import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Alert } from 'react-native';
import type { Auth } from 'firebase/auth';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import type { UserData } from '../../../../shared/types';
import { useSaveUserProfile } from '../../../auth/services/useSaveUserProfile';
import { buildPlanUpdate } from '../../utils/planUpdate';
import type { ProfileFormSeed, ProfileIdentitySeed } from '../../utils/profileSeed';

type ProfileSaveParams = {
    auth: Auth;
    isPasswordAccount: boolean;
    userData: UserData | null | undefined;
    form: ProfileFormSeed;
    original: ProfileFormSeed;
    identity: ProfileIdentitySeed;
    savedIdentity: ProfileIdentitySeed;
    pendingUri: string | null;
    planChanged: boolean;
    refreshUserData: () => Promise<UserData | undefined>;
    setOriginal: Dispatch<SetStateAction<ProfileFormSeed>>;
    setIdentity: Dispatch<SetStateAction<ProfileIdentitySeed>>;
    setSavedIdentity: Dispatch<SetStateAction<ProfileIdentitySeed>>;
    setPicture: Dispatch<SetStateAction<string | null>>;
    setPendingUri: Dispatch<SetStateAction<string | null>>;
};

export const useProfileSave = ({
    auth,
    isPasswordAccount,
    userData,
    form,
    original,
    identity,
    savedIdentity,
    pendingUri,
    planChanged,
    refreshUserData,
    setOriginal,
    setIdentity,
    setSavedIdentity,
    setPicture,
    setPendingUri,
}: ProfileSaveParams) => {
    const [saving, setSaving] = useState(false);
    const saveUserProfile = useSaveUserProfile();

    const persist = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }
        setSaving(true);
        try {
            const username = identity.username.trim();
            const email = identity.email.trim();
            const payload: Record<string, unknown> = planChanged
                ? buildPlanUpdate({ userData, form, original, now: new Date().toISOString() })
                : {};

            let emailChangePending = false;
            if (isPasswordAccount && email.toLowerCase() !== (user.email || '').toLowerCase()) {
                try {
                    await verifyBeforeUpdateEmail(user, email);
                    emailChangePending = true;
                } catch (error) {
                    if ((error as { code?: string }).code === 'auth/requires-recent-login') {
                        Alert.alert('Re-authentication required', 'Log out and back in, then change your email again.');
                        return;
                    }
                    throw error;
                }
            }

            if (username !== savedIdentity.username) payload['username'] = username;
            if (pendingUri) {
                const blob = await (await fetch(pendingUri)).blob();
                const pictureRef = ref(getStorage(), `profilePictures/${user.uid}.jpg`);
                await uploadBytes(pictureRef, blob, { contentType: blob.type || 'image/jpeg' });
                const url = await getDownloadURL(pictureRef);
                payload['profilePicture'] = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
            }

            await saveUserProfile.mutateAsync({ uid: user.uid, data: payload });
            const refreshedUserData = await refreshUserData();

            setOriginal({ ...form });
            const shownEmail = emailChangePending ? savedIdentity.email : email;
            setIdentity({ username, email: shownEmail });
            setSavedIdentity({ username, email: shownEmail });
            const savedPicture = payload['profilePicture'];
            if (typeof savedPicture === 'string') setPicture(savedPicture);
            setPendingUri(null);
            if (!refreshedUserData) {
                Alert.alert(
                    'Saved, but not refreshed',
                    emailChangePending
                        ? `Your changes were saved, but the app could not reload your profile yet. Open the link we sent to ${email} to change your email.`
                        : 'Your changes were saved, but the app could not reload your profile yet. They will show after the next refresh.'
                );
                return;
            }
            if (emailChangePending) {
                Alert.alert(
                    'Confirm Your New Email',
                    `Open the link we sent to ${email} to change your email. You will need to log in again afterwards.`
                );
            } else {
                Alert.alert('Done', planChanged ? 'Your plan has been updated.' : 'Profile updated.');
            }
        } catch (error) {
            console.error('Profile save error:', error);
            Alert.alert('Error', 'Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    }, [
        auth,
        form,
        identity,
        isPasswordAccount,
        original,
        pendingUri,
        planChanged,
        refreshUserData,
        savedIdentity,
        saveUserProfile,
        setIdentity,
        setOriginal,
        setPendingUri,
        setPicture,
        setSavedIdentity,
        userData,
    ]);

    return { saving, persist };
};

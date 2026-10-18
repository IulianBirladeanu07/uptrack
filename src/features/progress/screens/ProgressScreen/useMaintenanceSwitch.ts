import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import type { UserData } from '../../../../shared/types';
import { switchToMaintenance } from '../../../nutrition/helpers/phaseService';
import { fmt1, kfmt, maintenanceEstimateSummary, recapEntry } from '../../utils/progressEngine';
import type { PhaseRecap } from '../../utils/progressEngine';

type UseMaintenanceSwitchParams = {
    recap: PhaseRecap | null;
    userData: UserData | null | undefined;
    refreshUserData: () => Promise<unknown>;
};

export const useMaintenanceSwitch = ({
    recap,
    userData,
    refreshUserData,
}: UseMaintenanceSwitchParams) => {
    const [switching, setSwitching] = useState(false);

    const onSwitch = useCallback(() => {
        const maintenance = recap?.maintenance;
        if (!recap || maintenance == null || switching) return;
        const estimate = recap.maintenanceSource === 'recent' ? maintenanceEstimateSummary(recap) : null;
        if (recap.maintenanceSource === 'recent' && estimate == null) {
            Alert.alert('Estimate details unavailable', 'Cannot verify the recent estimate uncertainty and date window. Please try again later.');
            return;
        }
        const message = estimate != null
            ? `Your target becomes ${estimate}, and a new phase starts at ${fmt1(recap.endWeight)} kg.`
            : `Your target becomes about ${kfmt(maintenance)} kcal based on recent trends, and a new phase starts at ${fmt1(recap.endWeight)} kg.`;
        Alert.alert(
            'Switch to maintenance',
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch',
                    onPress: async () => {
                        setSwitching(true);
                        try {
                            const uid = userData?.uid || getAuth().currentUser?.uid;
                            await switchToMaintenance(uid!, userData!, {
                                weight: recap.endWeight,
                                kcal: maintenance,
                                entry: recapEntry(recap),
                            });
                            await refreshUserData();
                        } catch (error) {
                            console.error('Progress switch error:', (error as Error).message);
                            Alert.alert('Error', 'Failed to switch. Try again.');
                        } finally {
                            setSwitching(false);
                        }
                    },
                },
            ],
        );
    }, [recap, switching, userData, refreshUserData]);

    return { switching, onSwitch };
};

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import type { UserData } from '../../../../shared/types';
import { switchToMaintenance } from '../../../nutrition/helpers/phaseService';
import { fmt1, kfmt, recapEntry } from '../../utils/progressEngine';
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
        if (!recap || recap.maintenance == null || switching) return;
        Alert.alert(
            'Switch to maintenance',
            `Your target becomes ${kfmt(recap.maintenance)} kcal and a new phase starts at ${fmt1(recap.endWeight)} kg.`,
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
                                kcal: recap.maintenance as number,
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

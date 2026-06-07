import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

class WorkoutNotificationService {
    notificationId = null;
    _updateTimeout = null;

    async init() {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return false;
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('workout', {
                name: 'Workout',
                importance: Notifications.AndroidImportance.LOW,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                sound: false,
                vibrationPattern: [0],
            });
        }
        return true;
    }

    async start(exerciseCount) {
        const granted = await this.init();
        if (!granted) return;
        this.notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Workout in Progress',
                body: `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`,
                sticky: true,
                priority: 'low',
            },
            trigger: null,
        });
    }

    update(exerciseName, currentSet, totalSets, elapsedTime) {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(async () => {
            if (!this.notificationId) return;

            const prevId = this.notificationId;
            this.notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Workout in Progress',
                    body: `${exerciseName} • Set ${currentSet}/${totalSets} • ${elapsedTime}`,
                    sticky: true,
                    priority: 'low',
                },
                trigger: null,
            });
            await Notifications.dismissNotificationAsync(prevId);
        }, 5000);
    }

    async clear() {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
            this._updateTimeout = null;
        }
        if (this.notificationId) {
            await Notifications.dismissNotificationAsync(this.notificationId);
            this.notificationId = null;
        }
    }
}

export const workoutNotifications = new WorkoutNotificationService();
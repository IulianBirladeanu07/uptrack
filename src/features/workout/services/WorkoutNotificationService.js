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

  async init() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('workout', {
        name: 'Workout',
        importance: Notifications.AndroidImportance.HIGH,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: false,
        vibrationPattern: [0],
      });
    }
    return true;
  }

  async start(exerciseCount) {
    await this.init();
    
    this.notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Workout in Progress',
        body: `${exerciseCount} exercises`,
        sticky: true,
        priority: 'high',
      },
      trigger: null,
    });
  }

  async update(exerciseName, currentSet, totalSets, elapsedTime) {
    if (!this.notificationId) return;
    
    await Notifications.dismissNotificationAsync(this.notificationId);
    this.notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Workout in Progress',
        body: `${exerciseName} • Set ${currentSet}/${totalSets} • ${elapsedTime}`,
        sticky: true,
        priority: 'high',
      },
      trigger: null,
    });
  }

  async clear() {
    if (this.notificationId) {
      await Notifications.dismissNotificationAsync(this.notificationId);
      this.notificationId = null;
    }
  }
}

export const workoutNotifications = new WorkoutNotificationService();
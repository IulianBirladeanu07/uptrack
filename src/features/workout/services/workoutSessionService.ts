import { getAuth } from 'firebase/auth';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { db } from '../../auth/services/firebaseConfigService';
import type { AuthenticatedStackParamList } from '../../../shared/navigation';
import type { WorkoutExercise } from '../types';
import { isValidWorkoutSetInput } from '../utils/workoutSetValidation';
import { buildWorkoutCompletionData } from './buildWorkoutCompletionData';
import { queryClient } from '../../../shared/query/queryClient';
import { workoutHistoryQueryKeys } from './workoutQueryKeys';
import { workoutService } from './WorkoutService';

type AppNav = NativeStackNavigationProp<AuthenticatedStackParamList>;
type MessageFn = (message: string) => void;
type FormatTimeFn = (seconds: number) => string;

export const sendWorkoutDataToFirestore = async (
  exerciseData: WorkoutExercise[],
  inputText: string,
  isValidationPressed: boolean,
  navigation: Pick<AppNav, 'navigate'>,
  openAnimatedMessage: MessageFn,
  formatTime: FormatTimeFn,
  elapsedTime: number,
  expectedUid: string,
  templateName = '',
): Promise<boolean> => {
  try {
    const hasEmptyOrInvalidInputs = exerciseData.some(exercise =>
      exercise.sets.some(set => !isValidWorkoutSetInput(set.weight, set.reps))
    );

    if (hasEmptyOrInvalidInputs) {
      openAnimatedMessage('Note: Some sets have empty or invalid weight/reps.');
      return false;
    }

    if (!isValidationPressed) {
      return new Promise(resolve => {
        Alert.alert(
          'Unvalidated Sets',
          'Some sets are not validated. Do you wish to proceed anyway?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Proceed',
              onPress: async () => {
                const saved = await finishWorkout(
                  exerciseData,
                  inputText,
                  navigation,
                  openAnimatedMessage,
                  formatTime,
                  elapsedTime,
                  expectedUid,
                  templateName,
                );
                resolve(saved);
              },
            },
          ],
        );
      });
    }

    return await finishWorkout(
      exerciseData,
      inputText,
      navigation,
      openAnimatedMessage,
      formatTime,
      elapsedTime,
      expectedUid,
      templateName,
    );
  } catch (error) {
    console.error('Error adding workout data:', (error as Error).message);
    openAnimatedMessage(`Error: ${(error as Error).message}`);
    return false;
  }
};

async function finishWorkout(
  exerciseData: WorkoutExercise[],
  inputText: string,
  navigation: Pick<AppNav, 'navigate'>,
  openAnimatedMessage: MessageFn,
  formatTime: FormatTimeFn,
  elapsedTime: number,
  expectedUid: string,
  templateName = '',
): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || user.uid !== expectedUid) {
      throw new Error('The signed-in user changed before the workout could be saved.');
    }

    const uid = user.uid;
    const timestamp = new Date();
    const { exercisesWithPR, workoutDataToSend } = buildWorkoutCompletionData({
      exerciseData,
      uid,
      timestamp: serverTimestamp(),
      note: inputText,
      duration: formatTime(elapsedTime),
      workoutName: templateName || null,
    });

    const workoutDocRef = doc(collection(db, 'workoutHistory'));
    await setDoc(workoutDocRef, workoutDataToSend);
    await queryClient.invalidateQueries({
      queryKey: workoutHistoryQueryKeys.forUser(uid),
    });
    workoutService.clearLastSetCache();

    if (getAuth().currentUser?.uid !== expectedUid) {
      console.error('Workout saved, but the signed-in user changed before workout details could open.');
      return true;
    }

    try {
      navigation.navigate('WorkoutDetails', {
        duration: formatTime(elapsedTime),
        notes: inputText,
        exercises: exercisesWithPR,
        timestamp: `${timestamp.toDateString()} ${timestamp.toLocaleTimeString()}`,
        workoutName: templateName || null,
      });
    } catch (error) {
      console.error('Workout saved but failed to open workout details:', (error as Error).message);
      openAnimatedMessage('Workout saved, but workout details could not be opened.');
    }
    return true;
  } catch (error) {
    console.error('Error finishing workout:', (error as Error).message);
    openAnimatedMessage(`Error: ${(error as Error).message}`);
    return false;
  }
}

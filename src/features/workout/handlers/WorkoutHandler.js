import { getAuth } from 'firebase/auth';
import { 
  collection, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  getFirestore,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService'
import { Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const sendWorkoutDataToFirestore = async (
    exerciseData,
    inputText,
    isValidationPressed,
    navigation,
    openAnimatedMessage,
    formatTime,
    elapsedTime,
    templateName = '',
) => {
    try {
        const hasEmptyOrInvalidInputs = exerciseData.some(exercise =>
            exercise.sets.some(set => {
                const weightIsValid = set.weight !== undefined && set.weight !== null &&
                    (typeof set.weight === 'string' || typeof set.weight === 'number');
                const repsIsValid = set.reps !== undefined && set.reps !== null &&
                    (typeof set.reps === 'string' || typeof set.reps === 'number');
                const weightString = typeof set.weight === 'number' ? String(set.weight) : set.weight;
                const repsString = typeof set.reps === 'number' ? String(set.reps) : set.reps;

                return (
                    !weightIsValid || !repsIsValid ||
                    weightString.trim() === '' ||
                    repsString.trim() === '' ||
                    !/^\d*\.?\d{0,2}$/.test(weightString) ||
                    !/^\d*\.?\d{0,2}$/.test(repsString)
                );
            })
        );

        if (hasEmptyOrInvalidInputs) {
            openAnimatedMessage('Note: Some sets have empty or invalid weight/reps.');
            return false;
        }

        if (!isValidationPressed) {
            return new Promise((resolve) => {
                Alert.alert(
                    'Unvalidated Sets',
                    'Some sets are not validated. Do you wish to proceed anyway?',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        {
                            text: 'Proceed',
                            onPress: async () => {
                                await finishWorkout(exerciseData, inputText, navigation, openAnimatedMessage, formatTime, elapsedTime, templateName);
                                resolve(true);
                            },
                        },
                    ]
                );
            });
        } else {
            await finishWorkout(exerciseData, inputText, navigation, openAnimatedMessage, formatTime, elapsedTime, templateName);
            return true;
        }
    } catch (error) {
        console.error('Error adding workout data:', error.message);
        openAnimatedMessage(`Error: ${error.message}`);
        return false;
    }
};

async function finishWorkout(exerciseData, inputText, navigation, openAnimatedMessage, formatTime, elapsedTime, templateName = '') {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated.');

        const uid = user.uid;
        const timestamp = new Date();
        const formattedTimestamp = `${timestamp.getFullYear()}_${timestamp.getMonth() + 1}_${timestamp.getDate()}_${timestamp.getHours()}_${timestamp.getMinutes()}_${uid}`;

        const exercisesWithPR = exerciseData.map(exercise => {
            const validSets = exercise.sets.filter(s => s.weight && s.reps);
            if (!validSets.length) return { ...exercise };

            const best = findBestSet(validSets);
            const lastBest = exercise.lastWorkoutSets?.length
                ? findBestSet(exercise.lastWorkoutSets.map(s => ({
                    ...s,
                    weight: parseFloat(s.weight) || 0,
                    reps: parseInt(s.reps) || 0,
                })))
                : { estimated1RM: 0 };

            const isExercisePR = best.estimated1RM > lastBest.estimated1RM;

            return {
                ...exercise,
                sets: exercise.sets.map(set => {
                    const set1RM = calculate1RM(parseFloat(set.weight || 0), parseInt(set.reps || 0));
                    return {
                        ...set,
                        isPR: isExercisePR && Math.abs(set1RM - best.estimated1RM) < 0.01,
                    };
                }),
            };
        });

        const workoutDataToSend = {
            uid,
            timestamp: serverTimestamp(),
            note: inputText,
            duration: formatTime(elapsedTime),
            workoutName: templateName || 'Workout',
            exercises: exercisesWithPR.map(exercise => ({
                ...exercise,
                sets: exercise.sets.map(set => ({
                    weight: parseFloat(set.weight || 0),
                    reps: parseInt(set.reps || 0, 10),
                    isValidated: set.isValidated,
                    isPR: set.isPR || false,
                    estimated1RM: set.reps > 0 ? calculate1RM(parseFloat(set.weight), parseInt(set.reps, 10)).toFixed(2) : 'N/A',
                })),
            })),
        };

        const workoutDocRef = doc(collection(db, 'workoutHistory'), formattedTimestamp);
        await setDoc(workoutDocRef, workoutDataToSend);

        navigation.navigate('WorkoutDetails', {
            duration: formatTime(elapsedTime),
            notes: inputText,
            exercises: exercisesWithPR,
            timestamp: timestamp.toDateString() + ' ' + timestamp.toLocaleTimeString(),
            workoutName: templateName || 'Workout',
        });
    } catch (error) {
        console.error('Error finishing workout:', error.message);
        openAnimatedMessage(`Error: ${error.message}`);
    }
}

export const calculate1RM = (weight, reps) => {
  return weight / (1.0278 - 0.0278 * reps);
};

export const countTotalPRs = (lastWorkoutData) => {
  let total = 0;
  lastWorkoutData.exercises.forEach(exercise => {
    const bestSet = findBestSet(exercise.sets);
    if (bestSet) {
      total++;
    }
  });
  setTotalPRs(total);
};

export const findBestSet = (sets) => {
  return sets.reduce((best, set) => {
    const current1RM = calculate1RM(parseFloat(set.weight), parseInt(set.reps, 10));
    return current1RM > best.estimated1RM ? { ...set, estimated1RM: current1RM } : best;
  }, { estimated1RM: 0 });
};

export const handleAddExercises = (navigation) => {
  navigation.navigate('ExerciseSelection', { previousScreen: 'StartWorkout' });
};

export const handleValidation = (exerciseIndex, setIndex, exerciseData) => {
  const updatedData = [...exerciseData];
  const currentSet = updatedData[exerciseIndex].sets[setIndex];
  currentSet.isValidated = !currentSet.isValidated;
  return updatedData;
};

export const handleInputChange = (text, setInputText) => {
  setInputText(text);
};

export const handleAddSet = (exerciseIndex, exerciseData, setExerciseData) => {
  const updatedData = [...exerciseData];
  const newSet = { weight: '', reps: '', isValidated: false };
  updatedData[exerciseIndex].sets.push(newSet);
  setExerciseData(updatedData);
};

export const handleWeightChange = (text, exerciseIndex, setIndex, exerciseData) => {
  if (text === '' || /^\d*\.?\d*$/.test(text)) {
    const updatedData = [...exerciseData];
    updatedData[exerciseIndex].sets[setIndex].weight = text;
    return updatedData;
  } else {
    return exerciseData;
  }
};

export const handleRepsChange = (text, exerciseIndex, setIndex, exerciseData) => {
  if (text === '' || /^\d+$/.test(text)) {
    const updatedData = [...exerciseData];
    updatedData[exerciseIndex].sets[setIndex].reps = text;
    return updatedData;
  } else {
    return exerciseData;
  }
};

export const getSetsFromLastWorkout = async (exerciseName) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }
    const uid = user.uid;

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutQuery = query(
      workoutsRef,
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(workoutQuery);

    for (const doc of querySnapshot.docs) {
      const workoutData = doc.data();
      const exercises = workoutData.exercises || [];
      const exercise = exercises.find(ex => ex.exerciseName === exerciseName);
      
      if (exercise && exercise.sets && exercise.sets.length > 0) {
        return exercise.sets.map(set => ({
          weight: set.weight !== undefined ? String(set.weight) : '',
          reps: set.reps !== undefined ? String(set.reps) : ''
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error retrieving sets from last workout:', error.message);
    return [];
  }
};

export const countWorkoutsThisWeek = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const uid = user.uid;

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutsQuery = query(workoutsRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(workoutsQuery);

    let workoutCount = 0;
    querySnapshot.forEach(doc => {
      const [, , , , , docUid] = doc.id.split('_');
      if (docUid === uid) {
        workoutCount++;
      }
    });

    return workoutCount;
  } catch (error) {
    console.error('Error counting workouts for this week:', error.message);
    throw error;
  }
};

export const getLastWorkout = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const uid = user.uid;

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutsQuery = query(workoutsRef, where('uid', '==', uid), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(workoutsQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching last workout:', error.message);
    throw error;
  }
};

export const addTemplateToFirestore = async (templateData, templateName) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const formattedTemplateName = `${templateName}_${user.uid}`;

    const fullTemplateData = {
      ...templateData,
      uid: user.uid
    };

    const templateDocRef = doc(db, 'workoutTemplates', formattedTemplateName);
    await setDoc(templateDocRef, fullTemplateData);

  } catch (error) {
    console.error('Error adding template data to Firestore:', error.message);
    throw error;
  }
};

export const fetchTemplatesFromFirestore = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const templatesCollectionRef = collection(db, 'workoutTemplates');
    const templatesQuery = query(templatesCollectionRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(templatesQuery);

    if (querySnapshot.empty) {
      console.log('No templates found for user:', user.uid);
      return [];
    }

    const templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    return templates;
  } catch (error) {
    console.error('Error retrieving user templates from Firestore:', error.message);
    throw error;
  }
};

export const deleteTemplateFromFirestore = async (templateId) => {
  try {
    if (!templateId) throw new Error('No template ID provided');
    
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    const db = getFirestore();
    const templateRef = doc(db, 'workoutTemplates', templateId);
    
    await deleteDoc(templateRef);
    return true;
  } catch (error) {
    console.error('Error deleting template from Firestore:', error.message);
    throw error;
  }
};

export const sendMeasurementsToFirestore = async (measurements) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const uid = user.uid;
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}_
                                ${timestamp.getMonth() + 1}_
                                ${timestamp.getDate()}_
                                ${timestamp.getHours()}_
                                ${timestamp.getMinutes()}_${uid}`;

    const measurementsDataToSend = {...measurements, uid, timestamp};

    const userMeasurementsRef = collection(db, 'measurements');
    const measurementDocRef = doc(userMeasurementsRef, formattedTimestamp);

    await setDoc(measurementDocRef, measurementsDataToSend);
  } catch (error) {
    console.error('Error saving measurements:', error.message);
    throw error;
  }
};

const CACHE_KEY = 'exercises_cache_v2';
const CACHE_DURATION = 12 * 60 * 60 * 1000;
const IMAGE_CACHE_KEY = 'exercise_images_cache';

let memoryCache = {
  data: null,
  timestamp: 0,
  isLoading: false,
  loadPromise: null
};

const imagePrefetchStatus = new Map();

export const fetchExercises = async (forceRefresh = false) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    if (
      !forceRefresh &&
      memoryCache.data &&
      memoryCache.data.length > 0 &&
      (Date.now() - memoryCache.timestamp < CACHE_DURATION)
    ) {
      setTimeout(() => prefetchExerciseImages(memoryCache.data), 0);
      return memoryCache.data;
    }

    if (memoryCache.isLoading && memoryCache.loadPromise && !forceRefresh) {
      return await memoryCache.loadPromise;
    }

    if (!forceRefresh) {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp, version = 1 } = JSON.parse(cachedData);
          if (
            version === 2 &&
            Date.now() - timestamp < CACHE_DURATION && 
            data && 
            data.length > 0
          ) {
            memoryCache.data = data;
            memoryCache.timestamp = timestamp;
            
            setTimeout(() => prefetchExerciseImages(data), 0);
            return data;
          }
        }
      } catch (cacheError) {
        console.warn('Cache read error, continuing with fresh fetch:', cacheError);
      }
    }

    memoryCache.isLoading = true;
    memoryCache.loadPromise = fetchExercisesFromFirestore();

    try {
      const exercisesArray = await memoryCache.loadPromise;

      if (exercisesArray && exercisesArray.length > 0) {
        const timestamp = Date.now();
        memoryCache.data = exercisesArray;
        memoryCache.timestamp = timestamp;

        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data: exercisesArray,
            timestamp,
            version: 2
          }));
        } catch (storageError) {
          console.warn('Failed to save cache to storage:', storageError);
        }

        setTimeout(() => prefetchExerciseImages(exercisesArray), 0);

        return exercisesArray;
      }

      throw new Error('No exercises data received');

    } finally {
      memoryCache.isLoading = false;
      memoryCache.loadPromise = null;
    }

  } catch (error) {
    console.error('Error retrieving exercises:', error.message);
    memoryCache.isLoading = false;
    memoryCache.loadPromise = null;
    throw error;
  }
};

const fetchExercisesFromFirestore = async () => {
  const db = getFirestore();
  const exercisesCollectionRef = collection(db, 'exercises');
  
  try {
    const querySnapshot = await getDocs(exercisesCollectionRef);
    const exercisesArray = [];

    if (!querySnapshot.empty) {
      querySnapshot.forEach(doc => {
        const muscleGroup = doc.id;
        const exercises = doc.data().exercises || [];

        if (exercises.length > 0) {
          const validExercises = exercises
            .filter(exercise => exercise && exercise.name)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(exercise => ({
              name: exercise.name,
              muscleGroup: exercise.muscleGroup || muscleGroup,
              category: exercise.category || 'General',
              imageURL: exercise.imageURL || '',
              equipment: exercise.equipment || 'Bodyweight',
              difficulty: exercise.difficulty || 'Intermediate'
            }));

          if (validExercises.length > 0) {
            exercisesArray.push({
              muscleGroup,
              exercises: validExercises
            });
          }
        }
      });
    }

    exercisesArray.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
    return exercisesArray;

  } catch (firestoreError) {
    console.error('Firestore fetch error:', firestoreError);
    throw new Error(`Failed to fetch exercises: ${firestoreError.message}`);
  }
};

const prefetchExerciseImages = async (exercisesArray) => {
  if (!exercisesArray || !Array.isArray(exercisesArray)) return;

  const imageUrls = [];
  
  exercisesArray.forEach(group => {
    if (group.exercises && Array.isArray(group.exercises)) {
      group.exercises.forEach(exercise => {
        if (exercise.imageURL && 
            exercise.imageURL.startsWith('http') &&
            !imagePrefetchStatus.has(exercise.imageURL)) {
          imageUrls.push(exercise.imageURL);
        }
      });
    }
  });

  const batchSize = 3;
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    
    setTimeout(() => {
      batch.forEach(async (url) => {
        try {
          imagePrefetchStatus.set(url, 'loading');
          await Image.prefetch(url);
          imagePrefetchStatus.set(url, 'loaded');
        } catch (error) {
          imagePrefetchStatus.set(url, 'error');
          console.warn('Failed to prefetch image:', url);
        }
      });
    }, i * 100);
  }
};

export const clearExercisesCache = async (clearImages = false) => {
  memoryCache.data = null;
  memoryCache.timestamp = 0;
  memoryCache.isLoading = false;
  memoryCache.loadPromise = null;
  
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    
    if (clearImages) {
      imagePrefetchStatus.clear();
      await AsyncStorage.removeItem(IMAGE_CACHE_KEY);
    }
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

export const prefetchExercises = async (priority = 'low') => {
  try {
    if (memoryCache.data && 
        (Date.now() - memoryCache.timestamp < CACHE_DURATION)) {
      return memoryCache.data;
    }

    if (priority === 'high') {
      return await fetchExercises(false);
    } else {
      const delay = priority === 'medium' ? 500 : 2000;
      setTimeout(async () => {
        try {
          await fetchExercises(false);
        } catch (error) {
          console.warn('Background exercise prefetch failed:', error);
        }
      }, delay);
    }
  } catch (error) {
    console.warn('Exercise prefetch failed:', error);
  }
};

export const getCacheStatus = () => {
  return {
    hasMemoryCache: !!memoryCache.data,
    cacheAge: memoryCache.timestamp ? Date.now() - memoryCache.timestamp : 0,
    isLoading: memoryCache.isLoading,
    exerciseCount: memoryCache.data ? memoryCache.data.reduce((count, group) => count + group.exercises.length, 0) : 0,
    imagesPrefetched: Array.from(imagePrefetchStatus.values()).filter(status => status === 'loaded').length
  };
};

export const createCustomExercise = async (exerciseData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const { muscleGroup, name, category, equipment, imageURL, difficulty } = exerciseData;

    if (!muscleGroup || !name) {
      throw new Error('Muscle group and exercise name are required.');
    }

    const muscleGroupDocRef = doc(db, 'exercises', muscleGroup);

    const muscleGroupQuery = query(
      collection(db, 'exercises'), 
      where('__name__', '==', muscleGroup)
    );
    const muscleGroupSnapshot = await getDocs(muscleGroupQuery);
    
    let currentExercises = [];
    if (!muscleGroupSnapshot.empty) {
      currentExercises = muscleGroupSnapshot.docs[0].data().exercises || [];
    }

    const exerciseExists = currentExercises.some(exercise => 
      exercise.name.toLowerCase() === name.toLowerCase()
    );

    if (exerciseExists) {
      throw new Error('An exercise with this name already exists in this muscle group.');
    }

    const newExercise = {
      name: name.trim(),
      muscleGroup,
      category: category || 'General',
      equipment: equipment || 'Bodyweight',
      imageURL: imageURL || '',
      difficulty: difficulty || 'Intermediate',
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    const updatedExercises = [...currentExercises, newExercise].sort((a, b) => a.name.localeCompare(b.name));

    await setDoc(muscleGroupDocRef, { exercises: updatedExercises });

    await clearExercisesCache();

    return { success: true, exercise: newExercise };

  } catch (error) {
    console.error('Error creating custom exercise:', error.message);
    throw error;
  }
};

export const fetchLastMeasurements = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const uid = user.uid;

    const measurementsRef = collection(db, 'measurements');
    const measurementsQuery = query(measurementsRef, where('uid', '==', uid), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(measurementsQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching last measurements:', error.message);
    throw error;
  }
};

export const updateTemplateInFirestore = async (templateId, templateData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!templateId) {
      throw new Error('Template ID is required for update');
    }

    const db = getFirestore();
    const templateRef = doc(db, 'workoutTemplates', templateId);
    
    const updateData = {
      templateName: templateData.templateName,
      exercises: templateData.exercises,
      note: templateData.note || '',
      duration: templateData.duration || 60,
      preferredDays: templateData.preferredDays || [],
      workoutType: templateData.workoutType || 'Strength',
      updatedAt: serverTimestamp(),
    };

    await updateDoc(templateRef, updateData);
    return templateId;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const updateSplitInFirestore = async (splitId, splitData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!splitId) {
      throw new Error('Split ID is required for update');
    }

    const db = getFirestore();
    const splitRef = doc(db, 'workoutSplits', splitId);
    
    const updateData = {
      name: splitData.name,
      description: splitData.description || '',
      type: splitData.type,
      schedule: splitData.schedule,
      durationWeeks: splitData.durationWeeks || 8,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(splitRef, updateData);
    return splitId;
  } catch (error) {
    console.error('Error updating split:', error);
    throw error;
  }
};

export const fetchSplitsFromFirestore = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const uid = user.uid;

    const splitsCollectionRef = collection(db, 'workoutSplits');
    const splitsQuery = query(splitsCollectionRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(splitsQuery);

    if (querySnapshot.empty) {
      console.log('No splits found for user:', uid);
      return [];
    }

    const splits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    return splits;
  } catch (error) {
    console.error('Error fetching user splits from Firestore:', error.message);
    throw error;
  }
};

export const addSplitToFirestore = async (splitData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const uid = user.uid;
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}_${timestamp.getMonth() + 1}_${timestamp.getDate()}_${timestamp.getHours()}_${timestamp.getMinutes()}_${uid}`;

    const sanitizedSchedule = {};
    Object.keys(splitData.schedule || {}).forEach(day => {
      const dayData = splitData.schedule[day];
      sanitizedSchedule[day] = {
        templateId: dayData.templateId || 'rest-day',
        templateName: dayData.templateName || 'Rest Day',
        exercises: dayData.exercises || [],
        duration: dayData.duration || '0'
      };
    });

    const splitDataToSave = {
      ...splitData,
      schedule: sanitizedSchedule,
      uid,
      createdAt: serverTimestamp(),
    };

    const splitsCollectionRef = collection(db, 'workoutSplits');
    const splitDocRef = doc(splitsCollectionRef, formattedTimestamp);

    await setDoc(splitDocRef, splitDataToSave);
    return formattedTimestamp;
  } catch (error) {
    console.error('Error saving split to Firestore:', error.message);
    throw error;
  }
};

export const updateSplitDay = async (splitId, day, workoutData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const splitDocRef = doc(db, 'workoutSplits', splitId);
    
    const sanitizedWorkoutData = {
      templateId: workoutData.templateId || 'rest-day',
      templateName: workoutData.templateName || 'Rest Day',
      exercises: workoutData.exercises || [],
      duration: workoutData.duration || '0'
    };
    
    await updateDoc(splitDocRef, {
      [`schedule.${day}`]: sanitizedWorkoutData,
      lastModified: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating split day:', error.message);
    throw error;
  }
};

export const deleteSplitFromFirestore = async (splitId) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const splitDocRef = doc(db, 'workoutSplits', splitId);
    
    await deleteDoc(splitDocRef);
    return true;
  } catch (error) {
    console.error('Error deleting split from Firestore:', error.message);
    throw error;
  }
};

export const updateSplitProgress = async (splitId, currentWeek) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const db = getFirestore();
    const splitDocRef = doc(db, 'workoutSplits', splitId);
    
    await updateDoc(splitDocRef, {
      currentWeek: currentWeek,
      lastUpdated: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating split progress:', error.message);
    throw error;
  }
};

export const getExerciseHistory = async (exerciseName) => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated.');

        const workoutsRef = collection(db, 'workoutHistory');
        const workoutQuery = query(
            workoutsRef,
            where('uid', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
        const querySnapshot = await getDocs(workoutQuery);

        const sessions = [];

        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const exercises = data.exercises || [];
            const exercise = exercises.find(ex => ex.exerciseName === exerciseName);
            if (!exercise || !exercise.sets?.length) continue;

            const validSets = exercise.sets.filter(s =>
                (parseFloat(s.weight) > 0 || parseInt(s.reps) > 0)
            );
            if (!validSets.length) continue;

            const best = validSets.reduce((b, s) => {
                const e1rm = calculate1RM(parseFloat(s.weight) || 0, parseInt(s.reps) || 0);
                return e1rm > b.e1rm ? { ...s, e1rm } : b;
            }, { e1rm: 0 });

            sessions.push({
                id: doc.id,
                timestamp: data.timestamp,
                workoutName: data.workoutName || 'Workout',
                sets: validSets,
                best,
                totalVolume: validSets.reduce((sum, s) =>
                    sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0),
            });
        }

        return sessions;
    } catch (error) {
        console.error('Error fetching exercise history:', error.message);
        return [];
    }
};
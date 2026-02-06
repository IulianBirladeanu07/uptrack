import firebase from 'firebase/compat/app';
import { db, collection, setDoc, doc, getDocs, query, where, orderBy, limit } from '../../auth/services/firebaseConfigService'

export const saveMeasurementsToFirestore = async (measurements) => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const uid = user.uid;
    const timestamp = new Date();
    const formattedTimestamp = `${timestamp.getFullYear()}_${(timestamp.getMonth() + 1)}_${timestamp.getDate()}_${timestamp.getHours()}_${timestamp.getMinutes()}_${uid}`;

    const measurementsDataToSend = {
      ...measurements,
      uid: uid,
      timestamp: timestamp,
    };

    const userMeasurementsRef = collection(db, 'measurements');
    const measurementDocRef = doc(userMeasurementsRef, formattedTimestamp);

    await setDoc(measurementDocRef, measurementsDataToSend);
  } catch (error) {
    console.error('Error saving measurements:', error.message);
    throw new Error('Failed to save measurements');
  }
};

export const fetchLastMeasurements = async () => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const uid = user.uid;
    const measurementsRef = collection(db, 'measurements');
    const q = query(measurementsRef, where('uid', '==', uid), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching last measurements:', error.message);
    throw new Error('Failed to fetch last measurements');
  }
};

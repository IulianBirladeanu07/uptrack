import { getAuth } from 'firebase/auth';

export const isCurrentWorkoutUser = (uid: string | undefined): uid is string =>
    !!uid && getAuth().currentUser?.uid === uid;

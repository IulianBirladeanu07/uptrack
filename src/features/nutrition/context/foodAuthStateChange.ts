import type { User } from 'firebase/auth';

type FoodAuthStateChangeOperations = {
  isMounted: () => boolean;
  getCurrentUser: () => User | null;
  resetAccountState: (user: User | null) => void;
  setCurrentUserRef: (user: User | null) => void;
  setCurrentUser: (user: User | null) => void;
  initializeAppData: (user: User) => void;
  clearPersistedMealCache: (uid: string) => void;
  setLoading: (loading: boolean) => void;
};

export const handleFoodAuthStateChange = (
  user: User | null,
  operations: FoodAuthStateChangeOperations,
): void => {
  if (!operations.isMounted()) return;

  const previousUser = operations.getCurrentUser();
  if (previousUser?.uid !== user?.uid) operations.resetAccountState(user);

  operations.setCurrentUserRef(user);
  operations.setCurrentUser(user);

  if (user) {
    operations.initializeAppData(user);
  } else {
    if (previousUser) operations.clearPersistedMealCache(previousUser.uid);
    operations.setLoading(false);
  }
};

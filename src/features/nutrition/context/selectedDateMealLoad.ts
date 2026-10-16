export const loadSelectedDateMeals = async (
  load: () => Promise<void>,
  isCurrent: () => boolean,
  onLoaded: () => void,
  onError: (error: unknown) => void,
): Promise<void> => {
  try {
    await load();
    if (isCurrent()) onLoaded();
  } catch (error) {
    if (isCurrent()) onError(error);
  }
};

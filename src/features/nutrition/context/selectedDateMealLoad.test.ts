import { loadSelectedDateMeals } from './selectedDateMealLoad';

describe('loadSelectedDateMeals', () => {
  test('updates the view only after loading the still-selected date succeeds', async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const isCurrent = jest.fn().mockReturnValue(true);
    const onLoaded = jest.fn();
    const onError = jest.fn();

    await loadSelectedDateMeals(load, isCurrent, onLoaded, onError);

    expect(load).toHaveBeenCalledTimes(1);
    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  test('surfaces a load failure only while its date and user are still current', async () => {
    const error = new Error('offline');
    const load = jest.fn().mockRejectedValue(error);
    const onLoaded = jest.fn();
    const onError = jest.fn();

    await loadSelectedDateMeals(load, () => true, onLoaded, onError);

    expect(onLoaded).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error);
  });

  test('ignores both stale successful loads and stale failures', async () => {
    const onLoaded = jest.fn();
    const onError = jest.fn();

    await loadSelectedDateMeals(jest.fn().mockResolvedValue(undefined), () => false, onLoaded, onError);
    await loadSelectedDateMeals(jest.fn().mockRejectedValue(new Error('offline')), () => false, onLoaded, onError);

    expect(onLoaded).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});

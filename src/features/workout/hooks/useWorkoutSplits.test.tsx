import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { loadSplitsFromFirestore } from '../services/workoutSplitService';
import { useWorkoutSplits } from './useWorkoutSplits';

jest.mock('../services/workoutSplitService', () => ({
  loadSplitsFromFirestore: jest.fn(),
}));

const loadSplits = jest.mocked(loadSplitsFromFirestore);

const createWrapper = (client: QueryClient) => ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

const createClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity } },
});

describe('useWorkoutSplits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps cached split data isolated by uid', async () => {
    const client = createClient();
    loadSplits
      .mockResolvedValueOnce([{ id: 'private-1' }])
      .mockResolvedValueOnce([{ id: 'private-2' }]);
    const wrapper = createWrapper(client);
    const { result, rerender } = renderHook(
      ({ uid }: { uid: string }) => useWorkoutSplits(uid),
      { initialProps: { uid: 'user-1' }, wrapper },
    );

    await waitFor(() => expect(result.current.data?.[0]?.id).toBe('private-1'));
    rerender({ uid: 'user-2' });
    await waitFor(() => expect(result.current.data?.[0]?.id).toBe('private-2'));
    rerender({ uid: 'user-1' });

    expect(result.current.data?.[0]?.id).toBe('private-1');
    expect(loadSplits).toHaveBeenCalledTimes(2);
    client.clear();
  });

  it('does not query without an authenticated uid', () => {
    const client = createClient();
    const { result } = renderHook(() => useWorkoutSplits(null), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(loadSplits).not.toHaveBeenCalled();
    client.clear();
  });
});

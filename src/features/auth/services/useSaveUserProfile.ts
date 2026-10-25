import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mergeUserProfile, userProfileQueryKey } from './userProfileQuery';

type SaveUserProfileVariables = {
  uid: string;
  data: Record<string, unknown>;
};

export const useSaveUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, data }: SaveUserProfileVariables) => mergeUserProfile(uid, data),
    onSuccess: (_result, { uid }) =>
      queryClient.invalidateQueries({
        queryKey: userProfileQueryKey(uid),
        exact: true,
        refetchType: 'none',
      }),
  });
};

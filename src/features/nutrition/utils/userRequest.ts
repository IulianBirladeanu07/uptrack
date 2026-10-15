export type UserRequestToken = {
  uid: string;
  generation: number;
};

export const isCurrentUserRequest = (
  request: UserRequestToken,
  currentUid: string | null | undefined,
  currentGeneration: number,
): boolean => request.uid === currentUid && request.generation === currentGeneration;

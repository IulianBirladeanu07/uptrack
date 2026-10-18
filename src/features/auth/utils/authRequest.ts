export type AuthRequest = {
  uid: string | null;
  generation: number;
};

export const isSameAuthIdentity = (
  previousUid: string | null | undefined,
  nextUid: string | null,
): boolean => previousUid !== undefined && previousUid === nextUid;

export const isCurrentAuthRequest = (
  request: AuthRequest,
  currentUid: string | null,
  currentGeneration: number,
): boolean => request.uid === currentUid && request.generation === currentGeneration;

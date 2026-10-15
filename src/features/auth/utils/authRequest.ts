export type AuthRequest = {
  uid: string | null;
  generation: number;
};

export const isCurrentAuthRequest = (
  request: AuthRequest,
  currentUid: string | null,
  currentGeneration: number,
): boolean => request.uid === currentUid && request.generation === currentGeneration;

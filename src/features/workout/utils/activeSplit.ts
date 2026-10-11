type SplitRef = { id?: string | null };

export const afterSplitDelete = (
  deletedId: string,
  remaining: ReadonlyArray<SplitRef>,
  localActiveId: string | null,
  persistedActiveId: string | null | undefined,
): { localActiveId: string | null; clearPersisted: boolean } => ({
  localActiveId: localActiveId === deletedId ? remaining[0]?.id ?? null : localActiveId,
  clearPersisted: persistedActiveId === deletedId,
});

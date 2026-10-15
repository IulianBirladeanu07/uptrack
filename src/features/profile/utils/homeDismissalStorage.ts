export const parseDismissedAdjustmentTimestamps = (raw: string | null): string[] | null => {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};

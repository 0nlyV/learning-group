export const parseCompletedStageIds = (
  raw: string | undefined,
  activeStageIds?: ReadonlySet<string>
): string[] => {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = [
      ...new Set(
        parsed.filter((value): value is string => typeof value === 'string')
      ),
    ];
    return activeStageIds
      ? unique.filter((stageId) => activeStageIds.has(stageId))
      : unique;
  } catch {
    return [];
  }
};

export const nextCompletedStageIds = (
  completedStageIds: readonly string[],
  stageId: string,
  complete: boolean
) =>
  complete
    ? [...new Set([...completedStageIds, stageId])]
    : completedStageIds.filter((id) => id !== stageId);

export const adjustedCompletionCount = (
  rawCount: string | undefined,
  adjustment: number
) => Math.max(0, (Number.parseInt(rawCount ?? '', 10) || 0) + adjustment);

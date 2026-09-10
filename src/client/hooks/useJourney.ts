import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  InitResponse,
  ProgressRequest,
  ProgressResponse,
} from '../../shared/api';
import type { Journey } from '../../shared/journey';

type JourneyState = {
  loading: boolean;
  savingStageId: string | null;
  error: string | null;
  username: string;
  subredditName: string;
  journey: Journey | null;
  postUrl: string;
  completedStageIds: string[];
  participantCount: number;
  completionCounts: Record<string, number>;
};

const initialState: JourneyState = {
  loading: true,
  savingStageId: null,
  error: null,
  username: '',
  subredditName: '',
  journey: null,
  postUrl: '',
  completedStageIds: [],
  participantCount: 0,
  completionCounts: {},
};

export const useJourney = () => {
  const [state, setState] = useState<JourneyState>(initialState);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/init');
        if (!response.ok) throw new Error('Unable to open this journey.');
        const data: InitResponse = await response.json();
        setState({
          loading: false,
          savingStageId: null,
          error: null,
          username: data.username,
          subredditName: data.subredditName,
          journey: data.journey,
          postUrl: data.postUrl,
          completedStageIds: data.completedStageIds,
          participantCount: data.participantCount,
          completionCounts: data.completionCounts,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Something went wrong.',
        }));
      }
    };

    void load();
  }, []);

  const toggleStage = useCallback(
    async (stageId: string) => {
      const complete = !state.completedStageIds.includes(stageId);
      const body: ProgressRequest = { stageId, complete };
      setState((current) => ({
        ...current,
        savingStageId: stageId,
        error: null,
      }));

      try {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Your progress could not be saved.');
        const data: ProgressResponse = await response.json();
        setState((current) => ({
          ...current,
          savingStageId: null,
          completedStageIds: data.completedStageIds,
          participantCount: data.participantCount,
          completionCounts: data.completionCounts,
        }));
      } catch (error) {
        setState((current) => ({
          ...current,
          savingStageId: null,
          error:
            error instanceof Error ? error.message : 'Something went wrong.',
        }));
      }
    },
    [state.completedStageIds]
  );

  const percentage = useMemo(() => {
    if (!state.journey) return 0;
    return Math.round(
      (state.completedStageIds.length / state.journey.stages.length) * 100
    );
  }, [state.completedStageIds.length, state.journey]);

  return { ...state, percentage, toggleStage };
};

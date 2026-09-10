import type { Journey } from './journey';

export type InitResponse = {
  type: 'init';
  username: string;
  subredditName: string;
  journey: Journey;
  postUrl: string;
  completedStageIds: string[];
  participantCount: number;
  completionCounts: Record<string, number>;
};

export type JourneyEditorOperation = 'create' | 'edit';

export type JourneyEditorStartResponse = {
  status: 'ok';
  operation: JourneyEditorOperation;
  sourcePostId?: string;
  detailsForm: import('@devvit/web/shared').Form;
};

export type JourneyEditorDetailsResponse = {
  status: 'ok';
  detailsForm: import('@devvit/web/shared').Form;
  sessionsForm: import('@devvit/web/shared').Form;
};

export type JourneyEditorSaveResponse = {
  status: 'ok';
  journey: Journey;
  postUrl: string;
};

export type JourneyEditorErrorResponse = {
  status: 'error';
  step: 'details' | 'sessions';
  message: string;
  form?: import('@devvit/web/shared').Form;
};

export type HubJourneySummary = {
  postId: string;
  postTitle: string;
  postUrl: string;
  createdAt: string;
  concludedAt: string | null;
  archivedAt: string | null;
  label: string;
  title: string;
  subtitle: string;
  sessionCount: number;
  participantCount: number;
};

export type HubInitResponse = {
  type: 'hub';
  subredditName: string;
  isModerator: boolean;
  journeys: HubJourneySummary[];
};

export type JourneyStatusRequest = {
  postId: string;
  concluded: boolean;
};

export type JourneyStatusResponse = {
  status: 'ok';
  postId: string;
  concludedAt: string | null;
};

export type JourneyArchiveRequest = {
  postId: string;
};

export type JourneyArchiveResponse = {
  status: 'ok';
  postId: string;
  archivedAt: string;
};

export type ProgressRequest = {
  stageId: string;
  complete: boolean;
};

export type ProgressResponse = {
  type: 'progress';
  completedStageIds: string[];
  participantCount: number;
  completionCounts: Record<string, number>;
};

export type ProgressResetResponse = {
  type: 'progress-reset';
  completedStageIds: [];
  participantCount: number;
  completionCounts: Record<string, number>;
};

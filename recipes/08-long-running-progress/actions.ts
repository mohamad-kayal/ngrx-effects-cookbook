import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface JobProgressEvent {
  jobId: string;
  progress: number;
  message: string;
}

export interface JobResult {
  reportUrl: string;
}

export const LongRunningProgressActions = createActionGroup({
  source: 'Long Running Progress',
  events: {
    'Start Job': props<{ jobId: string; failAtStep?: number }>(),
    'Job Progress': props<{ event: JobProgressEvent }>(),
    'Job Succeeded': props<{ jobId: string; result: JobResult }>(),
    'Job Failed': props<{ jobId: string; error: string }>(),
    'Cancel Job': props<{ jobId: string }>(),
    Logout: emptyProps(),
    'Job Finalized': props<{ jobId: string }>(),
    'Reset Demo': emptyProps()
  }
});
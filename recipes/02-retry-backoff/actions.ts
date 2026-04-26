import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface ReportSummary {
  id: string;
  title: string;
  generatedAt: string;
}

export interface HttpLikeError {
  status?: number;
  message: string;
}

export const RetryBackoffActions = createActionGroup({
  source: 'Retry Backoff',
  events: {
    'Load Report': emptyProps(),
    'Load Report Retrying': props<{ attempt: number; delayMs: number }>(),
    'Load Report Success': props<{ report: ReportSummary }>(),
    'Load Report Failure': props<{ error: string; status: number | null }>(),
    'Reset Demo': emptyProps()
  }
});
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface UserResult {
  id: string;
  name: string;
}

export interface DraftReceipt {
  version: number;
  content: string;
}

export interface UploadReceipt {
  fileName: string;
  uploadedAt: string;
}

export const RaceConditionsActions = createActionGroup({
  source: 'Race Conditions',
  events: {
    'Search Users': props<{ query: string }>(),
    'Search Users Success': props<{ query: string; results: UserResult[] }>(),
    'Search Users Failure': props<{ query: string; error: string }>(),
    'Save Draft': props<{ content: string }>(),
    'Save Draft Success': props<{ receipt: DraftReceipt }>(),
    'Save Draft Failure': props<{ content: string; error: string }>(),
    'Submit Payment': props<{ amount: number }>(),
    'Submit Payment Success': props<{ confirmation: string }>(),
    'Submit Payment Failure': props<{ error: string }>(),
    'Upload Avatar': props<{ fileName: string }>(),
    'Upload Avatar Success': props<{ receipt: UploadReceipt }>(),
    'Upload Avatar Failure': props<{ fileName: string; error: string }>(),
    'Reset Demo': emptyProps()
  }
});
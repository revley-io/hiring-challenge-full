export interface MockSchedule {
  id: string;
  /** Recurrence interval in days (e.g. 30 for monthly billing) */
  frequencyDays: number;
  /** Opaque payload — the caller decides what fields to include */
  detail: Record<string, unknown>;
  status: 'active' | 'deleted';
  created: number; // Unix seconds
}

export interface CreateScheduleParams {
  frequencyDays: number;
  /** Arbitrary payload that will be fired back verbatim in the EventBridge webhook detail */
  detail: Record<string, unknown>;
}

export interface UpdateScheduleParams {
  frequencyDays?: number;
  /** Shallow-merged into existing detail */
  detail?: Record<string, unknown>;
}

export interface ScheduleResult {
  id: string;
  frequencyDays: number;
  detail: Record<string, unknown>;
  status: MockSchedule['status'];
  created: number;
}

export interface DeleteScheduleResult {
  id: string;
  status: 'deleted';
}

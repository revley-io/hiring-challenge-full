import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  CreateScheduleParams,
  DeleteScheduleResult,
  MockSchedule,
  ScheduleResult,
  UpdateScheduleParams,
} from './eventbridge.types';

@Injectable()
export class EventBridgeService {
  private readonly logger = new Logger(EventBridgeService.name);
  private readonly schedules = new Map<string, MockSchedule>();

  constructor(private readonly config: ConfigService) {}

  /**
   * Create a subscription schedule.
   * Stores the schedule in memory and fires a webhook to simulate EventBridge
   * Scheduler delivering the first invocation.
   *
   * The simulated delay is proportional to the schedule frequency so that tests
   * and local development can observe relative timing differences between
   * schedules: 1 day = 1 second (e.g. a 30-day subscription fires after 30s,
   * a 7-day subscription fires after 7s).
   */
  createSchedule(params: CreateScheduleParams): ScheduleResult {
    const id = `sch_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const schedule: MockSchedule = {
      id,
      frequencyDays: params.frequencyDays,
      detail: params.detail,
      status: 'active',
      created: Math.floor(Date.now() / 1000),
    };
    this.schedules.set(id, schedule);

    const delayMs = params.frequencyDays * 1000;
    setTimeout(() => {
      void this.deliverScheduleWebhook(schedule);
    }, delayMs);

    return this.toResult(schedule);
  }

  /**
   * Delete a subscription schedule by id.
   * A deleted schedule will not fire its pending webhook even if the timer is still pending.
   */
  deleteSchedule(scheduleId: string): DeleteScheduleResult {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);

    schedule.status = 'deleted';
    return { id: scheduleId, status: 'deleted' };
  }

  /**
   * Update an existing active schedule.
   * Partially merges frequencyDays and/or detail.
   */
  updateSchedule(
    scheduleId: string,
    params: UpdateScheduleParams,
  ): ScheduleResult {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);
    if (schedule.status === 'deleted')
      throw new Error(`Schedule is deleted: ${scheduleId}`);

    if (params.frequencyDays !== undefined) {
      schedule.frequencyDays = params.frequencyDays;
    }
    if (params.detail !== undefined) {
      schedule.detail = { ...schedule.detail, ...params.detail };
    }

    return this.toResult(schedule);
  }

  /**
   * List all active (non-deleted) schedules.
   */
  listSchedules(): ScheduleResult[] {
    return Array.from(this.schedules.values())
      .filter((s) => s.status === 'active')
      .map((s) => this.toResult(s));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async deliverScheduleWebhook(schedule: MockSchedule): Promise<void> {
    // Guard: schedule may have been deleted before the timer fired
    if (schedule.status === 'deleted') return;

    await this.postWebhook({
      source: 'aws.scheduler',
      'detail-type': 'Scheduled Event',
      detail: schedule.detail,
    });
  }

  private async postWebhook(payload: Record<string, unknown>): Promise<void> {
    const apiUrl =
      this.config.get<string>('API_URL') ?? 'http://localhost:3000';
    const url = `${apiUrl}/webhooks/eventbridge`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.logger.debug('EventBridge webhook delivered');
    } catch (err) {
      this.logger.error(
        `Failed to deliver EventBridge webhook to ${url}: ${String(err)}`,
      );
    }
  }

  private toResult(schedule: MockSchedule): ScheduleResult {
    return {
      id: schedule.id,
      frequencyDays: schedule.frequencyDays,
      detail: schedule.detail,
      status: schedule.status,
      created: schedule.created,
    };
  }
}

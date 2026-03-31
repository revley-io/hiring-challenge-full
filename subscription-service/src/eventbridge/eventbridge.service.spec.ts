import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventBridgeService } from './eventbridge.service';

const API_URL = 'http://localhost:3000';

function makeConfigService(): ConfigService {
  return { get: (_key: string) => API_URL } as unknown as ConfigService;
}

async function buildService(): Promise<EventBridgeService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EventBridgeService,
      { provide: ConfigService, useValue: makeConfigService() },
    ],
  }).compile();
  return module.get(EventBridgeService);
}

const baseParams = {
  frequencyDays: 30,
  detail: { subscriptionId: 'sub_1', customerId: 'cust_1' },
};

describe('EventBridgeService', () => {
  let service: EventBridgeService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.useFakeTimers();
    service = await buildService();
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createSchedule
  // ---------------------------------------------------------------------------
  describe('createSchedule', () => {
    it('returns a sch_mock_ prefixed id', () => {
      const result = service.createSchedule(baseParams);
      expect(result.id).toMatch(/^sch_mock_/);
    });

    it('returns correct frequencyDays, detail, and status', () => {
      const result = service.createSchedule(baseParams);
      expect(result.frequencyDays).toBe(30);
      expect(result.detail).toEqual(baseParams.detail);
      expect(result.status).toBe('active');
    });

    it('returns a numeric unix timestamp for created', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = service.createSchedule(baseParams);
      const after = Math.floor(Date.now() / 1000);
      expect(result.created).toBeGreaterThanOrEqual(before);
      expect(result.created).toBeLessThanOrEqual(after);
    });

    it('generates unique ids for successive calls', () => {
      const a = service.createSchedule(baseParams);
      const b = service.createSchedule(baseParams);
      expect(a.id).not.toBe(b.id);
    });

    it('does not call fetch synchronously', () => {
      service.createSchedule(baseParams);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createSchedule — webhook delivery
  // ---------------------------------------------------------------------------
  describe('createSchedule webhooks', () => {
    it('fires one webhook to /webhooks/eventbridge after the timer', async () => {
      service.createSchedule(baseParams);
      await jest.runAllTimersAsync();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect((fetchSpy.mock.calls[0] as [string, RequestInit])[0]).toBe(
        `${API_URL}/webhooks/eventbridge`,
      );
    });

    it('payload has source aws.scheduler and detail-type Scheduled Event', async () => {
      service.createSchedule(baseParams);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body.source).toBe('aws.scheduler');
      expect(body['detail-type']).toBe('Scheduled Event');
    });

    it('payload detail is the caller-supplied detail verbatim', async () => {
      const detail = {
        subscriptionId: 'sub_abc',
        customerId: 'cust_xyz',
        extra: 42,
      };
      service.createSchedule({ frequencyDays: 7, detail });
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as Record<string, unknown>;
      expect(body.detail).toEqual(detail);
    });

    it('delay is frequencyDays * 1000ms — webhook not yet fired before that point', async () => {
      service.createSchedule({ frequencyDays: 7, detail: {} });

      // Advance to just before the expected delay (7000ms)
      await jest.advanceTimersByTimeAsync(6999);
      expect(fetchSpy).not.toHaveBeenCalled();

      // Advance past the threshold
      await jest.advanceTimersByTimeAsync(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('longer frequencyDays fires later than shorter frequencyDays', async () => {
      service.createSchedule({ frequencyDays: 7, detail: { ref: 'short' } });
      service.createSchedule({ frequencyDays: 30, detail: { ref: 'long' } });

      // After 7s the 7-day schedule fires but not the 30-day one
      await jest.advanceTimersByTimeAsync(7000);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // After another 23s the 30-day schedule fires too
      await jest.advanceTimersByTimeAsync(23000);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('does not fire webhook if schedule was deleted before the timer fires', async () => {
      const { id } = service.createSchedule(baseParams);
      service.deleteSchedule(id);
      await jest.runAllTimersAsync();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteSchedule
  // ---------------------------------------------------------------------------
  describe('deleteSchedule', () => {
    it('returns { id, status: deleted }', () => {
      const { id } = service.createSchedule(baseParams);
      const result = service.deleteSchedule(id);
      expect(result).toEqual({ id, status: 'deleted' });
    });

    it('throws for an unknown schedule id', () => {
      expect(() => service.deleteSchedule('sch_mock_unknown')).toThrow();
    });

    it('schedule is excluded from listSchedules after deletion', () => {
      const { id } = service.createSchedule(baseParams);
      service.deleteSchedule(id);
      const list = service.listSchedules();
      expect(list.find((s) => s.id === id)).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // updateSchedule
  // ---------------------------------------------------------------------------
  describe('updateSchedule', () => {
    it('updates frequencyDays', () => {
      const { id } = service.createSchedule(baseParams);
      const result = service.updateSchedule(id, { frequencyDays: 14 });
      expect(result.frequencyDays).toBe(14);
    });

    it('shallow-merges new detail fields into existing detail', () => {
      const { id } = service.createSchedule({
        frequencyDays: 30,
        detail: { subscriptionId: 'sub_1', customerId: 'cust_1' },
      });
      const result = service.updateSchedule(id, { detail: { discount: 0.1 } });
      expect(result.detail).toEqual({
        subscriptionId: 'sub_1',
        customerId: 'cust_1',
        discount: 0.1,
      });
    });

    it('returns updated result with unchanged fields preserved', () => {
      const { id } = service.createSchedule(baseParams);
      const result = service.updateSchedule(id, { frequencyDays: 7 });
      expect(result.id).toBe(id);
      expect(result.status).toBe('active');
      expect(result.detail).toEqual(baseParams.detail);
    });

    it('throws for an unknown schedule id', () => {
      expect(() =>
        service.updateSchedule('sch_mock_unknown', { frequencyDays: 7 }),
      ).toThrow();
    });

    it('throws if schedule is deleted', () => {
      const { id } = service.createSchedule(baseParams);
      service.deleteSchedule(id);
      expect(() => service.updateSchedule(id, { frequencyDays: 7 })).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // listSchedules
  // ---------------------------------------------------------------------------
  describe('listSchedules', () => {
    it('returns empty array when no schedules exist', () => {
      expect(service.listSchedules()).toEqual([]);
    });

    it('returns all active schedules', () => {
      service.createSchedule(baseParams);
      service.createSchedule({ frequencyDays: 7, detail: { ref: 'b' } });
      expect(service.listSchedules()).toHaveLength(2);
    });

    it('excludes deleted schedules', () => {
      service.createSchedule(baseParams);
      const { id } = service.createSchedule({
        frequencyDays: 7,
        detail: { ref: 'b' },
      });
      service.deleteSchedule(id);
      expect(service.listSchedules()).toHaveLength(1);
    });

    it('each result has the correct shape', () => {
      const { id } = service.createSchedule(baseParams);
      const [entry] = service.listSchedules();
      expect(entry.id).toBe(id);
      expect(entry.frequencyDays).toBe(30);
      expect(entry.status).toBe('active');
      expect(entry.detail).toEqual(baseParams.detail);
    });
  });

  // ---------------------------------------------------------------------------
  // webhook delivery resilience
  // ---------------------------------------------------------------------------
  describe('webhook delivery resilience', () => {
    it('does not throw when fetch rejects (logs error instead)', async () => {
      fetchSpy.mockRejectedValue(new Error('network error'));
      service.createSchedule(baseParams);
      await expect(jest.runAllTimersAsync()).resolves.not.toThrow();
    });
  });
});

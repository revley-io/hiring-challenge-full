import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';

const API_URL = 'http://localhost:3000';

function makeConfigService(): ConfigService {
  return { get: (_key: string) => API_URL } as unknown as ConfigService;
}

async function buildService(): Promise<StripeService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      StripeService,
      { provide: ConfigService, useValue: makeConfigService() },
    ],
  }).compile();
  return module.get(StripeService);
}

describe('StripeService', () => {
  let service: StripeService;
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
  // createPaymentIntent
  // ---------------------------------------------------------------------------
  describe('createPaymentIntent', () => {
    const base = {
      amount: 2999,
      currency: 'usd',
      cardNumber: '4242424242424242',
      expiry: '12/26',
      cvv: '123',
    };

    it('returns a pi_mock_ prefixed id', () => {
      const result = service.createPaymentIntent(base);
      expect(result.id).toMatch(/^pi_mock_/);
    });

    it('returns correct amount, currency and status', () => {
      const result = service.createPaymentIntent(base);
      expect(result.amount).toBe(2999);
      expect(result.currency).toBe('usd');
      expect(result.status).toBe('requires_confirmation');
    });

    it('returns a numeric unix timestamp for created', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = service.createPaymentIntent(base);
      const after = Math.floor(Date.now() / 1000);
      expect(result.created).toBeGreaterThanOrEqual(before);
      expect(result.created).toBeLessThanOrEqual(after);
    });

    it('generates unique ids for successive calls', () => {
      const a = service.createPaymentIntent(base);
      const b = service.createPaymentIntent(base);
      expect(a.id).not.toBe(b.id);
    });

    it('forwards optional metadata without affecting the returned shape', () => {
      const result = service.createPaymentIntent({
        ...base,
        metadata: { orderId: 'ord_1' },
      });
      expect(result.id).toMatch(/^pi_mock_/);
    });
  });

  // ---------------------------------------------------------------------------
  // verifyToken
  // ---------------------------------------------------------------------------
  describe('verifyToken', () => {
    it('returns valid:true with correct card summary for success card', () => {
      const { id } = service.createPaymentIntent({
        amount: 100,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      const result = service.verifyToken(id);
      expect(result.valid).toBe(true);
      expect(result.card?.last4).toBe('4242');
      expect(result.card?.brand).toBe('Visa');
      expect(result.card?.expMonth).toBe(12);
      expect(result.card?.expYear).toBe(2026);
    });

    it('returns valid:true for decline card (card is tokenizable, just fails charge)', () => {
      const { id } = service.createPaymentIntent({
        amount: 100,
        currency: 'usd',
        cardNumber: '4000000000000002',
        expiry: '09/25',
        cvv: '999',
      });
      const result = service.verifyToken(id);
      expect(result.valid).toBe(true);
      expect(result.card?.last4).toBe('0002');
    });

    it('returns valid:false for an unrecognized card number', () => {
      const { id } = service.createPaymentIntent({
        amount: 100,
        currency: 'usd',
        cardNumber: '1111111111111111',
        expiry: '01/30',
        cvv: '000',
      });
      const result = service.verifyToken(id);
      expect(result.valid).toBe(false);
      expect(result.card).toBeUndefined();
    });

    it('returns valid:false for an unknown payment intent id', () => {
      const result = service.verifyToken('pi_mock_doesnotexist');
      expect(result.valid).toBe(false);
      expect(result.card).toBeUndefined();
    });

    it('parses single-digit expiry month correctly', () => {
      const { id } = service.createPaymentIntent({
        amount: 100,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '1/27',
        cvv: '123',
      });
      const result = service.verifyToken(id);
      expect(result.card?.expMonth).toBe(1);
      expect(result.card?.expYear).toBe(2027);
    });
  });

  // ---------------------------------------------------------------------------
  // chargePaymentIntent — synchronous return value
  // ---------------------------------------------------------------------------
  describe('chargePaymentIntent (sync)', () => {
    it('returns { id, status: processing } immediately', () => {
      const { id } = service.createPaymentIntent({
        amount: 500,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      const result = service.chargePaymentIntent(id, true);
      expect(result).toEqual({ id, status: 'processing' });
    });

    it('throws for an unknown payment intent id', () => {
      expect(() =>
        service.chargePaymentIntent('pi_mock_unknown', true),
      ).toThrow();
    });

    it('does not call fetch synchronously', () => {
      const { id } = service.createPaymentIntent({
        amount: 500,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // chargePaymentIntent — async webhooks (autoCapture: true, success card)
  // ---------------------------------------------------------------------------
  describe('chargePaymentIntent webhooks — success card, autoCapture=true', () => {
    it('fires charge.succeeded then payment_intent.succeeded to /webhooks/stripe', async () => {
      const { id } = service.createPaymentIntent({
        amount: 2999,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);

      await jest.runAllTimersAsync();

      const calls = fetchSpy.mock.calls.map((c: [string, RequestInit]) => ({
        url: c[0],
        body: JSON.parse(c[1].body as string) as Record<string, unknown>,
      }));

      expect(calls).toHaveLength(2);
      expect(calls[0].url).toBe(`${API_URL}/webhooks/stripe`);
      expect(calls[0].body.type).toBe('charge.succeeded');
      expect(calls[1].body.type).toBe('payment_intent.succeeded');
    });

    it('includes correct amount and payment_intent ref in charge.succeeded payload', async () => {
      const { id } = service.createPaymentIntent({
        amount: 2999,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      const obj = (body.data as Record<string, unknown>).object as Record<
        string,
        unknown
      >;
      expect(obj.payment_intent).toBe(id);
      expect(obj.amount).toBe(2999);
      expect(obj.status).toBe('succeeded');
    });

    it('webhook event ids are evt_mock_ prefixed', async () => {
      const { id } = service.createPaymentIntent({
        amount: 100,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);
      await jest.runAllTimersAsync();

      for (const call of fetchSpy.mock.calls) {
        const body = JSON.parse(
          (call as [string, RequestInit])[1].body as string,
        ) as Record<string, unknown>;
        expect(body.id as string).toMatch(/^evt_mock_/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // chargePaymentIntent — async webhooks (autoCapture: false, success card)
  // ---------------------------------------------------------------------------
  describe('chargePaymentIntent webhooks — success card, autoCapture=false', () => {
    it('fires only payment_intent.amount_capturable_updated', async () => {
      const { id } = service.createPaymentIntent({
        amount: 1000,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, false);
      await jest.runAllTimersAsync();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect(body.type).toBe('payment_intent.amount_capturable_updated');
    });

    it('payload status is requires_capture', async () => {
      const { id } = service.createPaymentIntent({
        amount: 1000,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, false);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      const obj = (body.data as Record<string, unknown>).object as Record<
        string,
        unknown
      >;
      expect(obj.status).toBe('requires_capture');
    });
  });

  // ---------------------------------------------------------------------------
  // chargePaymentIntent — async webhooks (decline card)
  // ---------------------------------------------------------------------------
  describe('chargePaymentIntent webhooks — decline card', () => {
    it('fires only charge.failed', async () => {
      const { id } = service.createPaymentIntent({
        amount: 500,
        currency: 'usd',
        cardNumber: '4000000000000002',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);
      await jest.runAllTimersAsync();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect(body.type).toBe('charge.failed');
    });

    it('does not fire charge.failed on a success card', async () => {
      const { id } = service.createPaymentIntent({
        amount: 500,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);
      await jest.runAllTimersAsync();

      const types = fetchSpy.mock.calls.map(
        (c: [string, RequestInit]) =>
          (JSON.parse(c[1].body as string) as Record<string, unknown>).type,
      );
      expect(types).not.toContain('charge.failed');
    });
  });

  // ---------------------------------------------------------------------------
  // capturePaymentIntent — synchronous return value
  // ---------------------------------------------------------------------------
  describe('capturePaymentIntent (sync)', () => {
    it('returns { id, status: processing } immediately', () => {
      const { id } = service.createPaymentIntent({
        amount: 800,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      const result = service.capturePaymentIntent(id);
      expect(result).toEqual({ id, status: 'processing' });
    });

    it('throws for an unknown payment intent id', () => {
      expect(() => service.capturePaymentIntent('pi_mock_unknown')).toThrow();
    });

    it('does not call fetch synchronously', () => {
      const { id } = service.createPaymentIntent({
        amount: 800,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.capturePaymentIntent(id);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // capturePaymentIntent — async webhooks
  // ---------------------------------------------------------------------------
  describe('capturePaymentIntent webhooks', () => {
    it('fires charge.succeeded then payment_intent.succeeded', async () => {
      const { id } = service.createPaymentIntent({
        amount: 800,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.capturePaymentIntent(id);
      await jest.runAllTimersAsync();

      const types = fetchSpy.mock.calls.map(
        (c: [string, RequestInit]) =>
          (JSON.parse(c[1].body as string) as Record<string, unknown>).type,
      );
      expect(types).toEqual(['charge.succeeded', 'payment_intent.succeeded']);
    });

    it('posts to the correct webhook URL', async () => {
      const { id } = service.createPaymentIntent({
        amount: 800,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.capturePaymentIntent(id);
      await jest.runAllTimersAsync();

      for (const call of fetchSpy.mock.calls) {
        expect((call as [string, RequestInit])[0]).toBe(
          `${API_URL}/webhooks/stripe`,
        );
      }
    });

    it('includes correct payment_intent id in capture charge.succeeded payload', async () => {
      const { id } = service.createPaymentIntent({
        amount: 800,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.capturePaymentIntent(id);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      const obj = (body.data as Record<string, unknown>).object as Record<
        string,
        unknown
      >;
      expect(obj.payment_intent).toBe(id);
      expect(obj.status).toBe('succeeded');
    });
  });

  // ---------------------------------------------------------------------------
  // fetch failure resilience
  // ---------------------------------------------------------------------------
  describe('webhook delivery resilience', () => {
    it('does not throw when fetch rejects (logs error instead)', async () => {
      fetchSpy.mockRejectedValue(new Error('network error'));
      const { id } = service.createPaymentIntent({
        amount: 100,
        currency: 'usd',
        cardNumber: '4242424242424242',
        expiry: '12/26',
        cvv: '123',
      });
      service.chargePaymentIntent(id, true);
      await expect(jest.runAllTimersAsync()).resolves.not.toThrow();
    });
  });
});

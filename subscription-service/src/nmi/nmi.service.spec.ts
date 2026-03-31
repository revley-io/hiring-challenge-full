import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NmiService } from './nmi.service';

const API_URL = 'http://localhost:3000';

function makeConfigService(): ConfigService {
  return { get: (_key: string) => API_URL } as unknown as ConfigService;
}

async function buildService(): Promise<NmiService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      NmiService,
      { provide: ConfigService, useValue: makeConfigService() },
    ],
  }).compile();
  return module.get(NmiService);
}

describe('NmiService', () => {
  let service: NmiService;
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
  // createCustomerVault
  // ---------------------------------------------------------------------------
  describe('createCustomerVault', () => {
    const base = {
      cardNumber: '4111111111111111',
      expiry: '12/26',
      cvv: '123',
    };

    it('returns a vault_mock_ prefixed id', () => {
      const result = service.createCustomerVault(base);
      expect(result.id).toMatch(/^vault_mock_/);
    });

    it('returns correct last4 and status', () => {
      const result = service.createCustomerVault(base);
      expect(result.last4).toBe('1111');
      expect(result.status).toBe('active');
    });

    it('returns a numeric unix timestamp for created', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = service.createCustomerVault(base);
      const after = Math.floor(Date.now() / 1000);
      expect(result.created).toBeGreaterThanOrEqual(before);
      expect(result.created).toBeLessThanOrEqual(after);
    });

    it('generates unique ids for successive calls', () => {
      const a = service.createCustomerVault(base);
      const b = service.createCustomerVault(base);
      expect(a.id).not.toBe(b.id);
    });

    it('does not expose the raw card number in the result', () => {
      const result = service.createCustomerVault(base);
      expect(JSON.stringify(result)).not.toContain('4111111111111111');
    });

    it('forwards optional metadata without affecting the returned shape', () => {
      const result = service.createCustomerVault({
        ...base,
        metadata: { orderId: 'ord_1' },
      });
      expect(result.id).toMatch(/^vault_mock_/);
    });
  });

  // ---------------------------------------------------------------------------
  // customerVaultAction — synchronous return value
  // ---------------------------------------------------------------------------
  describe('customerVaultAction (sync)', () => {
    it('returns a txn_mock_ prefixed transactionid and pending status immediately', () => {
      const { id } = service.createCustomerVault({
        cardNumber: '4111111111111111',
        expiry: '12/26',
        cvv: '123',
      });
      const result = service.customerVaultAction(id, 'sale', 2000);
      expect(result.transactionid).toMatch(/^txn_mock_/);
      expect(result.status).toBe('pending');
    });

    it('throws for an unknown vault id', () => {
      expect(() =>
        service.customerVaultAction('vault_mock_unknown', 'sale'),
      ).toThrow();
    });

    it('does not call fetch synchronously', () => {
      const { id } = service.createCustomerVault({
        cardNumber: '4111111111111111',
        expiry: '12/26',
        cvv: '123',
      });
      service.customerVaultAction(id, 'sale', 500);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('generates unique transactionids for successive calls', () => {
      const { id } = service.createCustomerVault({
        cardNumber: '4111111111111111',
        expiry: '12/26',
        cvv: '123',
      });
      const a = service.customerVaultAction(id, 'sale', 100);
      const b = service.customerVaultAction(id, 'sale', 100);
      expect(a.transactionid).not.toBe(b.transactionid);
    });
  });

  // ---------------------------------------------------------------------------
  // customerVaultAction — async webhooks, success card
  // ---------------------------------------------------------------------------
  describe('customerVaultAction webhooks — success card', () => {
    const successCard = {
      cardNumber: '4111111111111111',
      expiry: '12/26',
      cvv: '123',
    };

    it.each(['validate', 'sale', 'auth', 'capture'] as const)(
      'fires a single webhook with response-code 100 for action: %s',
      async (action) => {
        const { id } = service.createCustomerVault(successCard);
        service.customerVaultAction(id, action, 1000);
        await jest.runAllTimersAsync();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const body = JSON.parse(
          fetchSpy.mock.calls[0][1].body as string,
        ) as Record<string, unknown>;
        expect(body['transaction-type']).toBe(action);
        expect(body['response-code']).toBe('100');
      },
    );

    it('posts to the correct webhook URL', async () => {
      const { id } = service.createCustomerVault(successCard);
      service.customerVaultAction(id, 'sale', 2000);
      await jest.runAllTimersAsync();

      expect(fetchSpy.mock.calls[0][0]).toBe(`${API_URL}/webhooks/nmi`);
    });

    it('includes correct transactionid and customer-vault-id in webhook payload', async () => {
      const { id } = service.createCustomerVault(successCard);
      const { transactionid } = service.customerVaultAction(id, 'sale', 2000);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect(body.transactionid).toBe(transactionid);
      expect(body['customer-vault-id']).toBe(id);
    });

    it('includes amount in payload when provided', async () => {
      const { id } = service.createCustomerVault(successCard);
      service.customerVaultAction(id, 'sale', 3500);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect((body.payload as Record<string, unknown>).amount).toBe(3500);
    });
  });

  // ---------------------------------------------------------------------------
  // customerVaultAction — async webhooks, decline card
  // ---------------------------------------------------------------------------
  describe('customerVaultAction webhooks — decline card', () => {
    const declineCard = {
      cardNumber: '4000000000000002',
      expiry: '12/26',
      cvv: '123',
    };

    it.each(['validate', 'sale', 'auth', 'capture'] as const)(
      'fires a single webhook with response-code 300 for action: %s',
      async (action) => {
        const { id } = service.createCustomerVault(declineCard);
        service.customerVaultAction(id, action, 500);
        await jest.runAllTimersAsync();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const body = JSON.parse(
          fetchSpy.mock.calls[0][1].body as string,
        ) as Record<string, unknown>;
        expect(body['transaction-type']).toBe(action);
        expect(body['response-code']).toBe('300');
      },
    );

    it('does not fire response-code 300 for a success card', async () => {
      const { id } = service.createCustomerVault({
        cardNumber: '4111111111111111',
        expiry: '12/26',
        cvv: '123',
      });
      service.customerVaultAction(id, 'sale', 500);
      await jest.runAllTimersAsync();

      const body = JSON.parse(
        fetchSpy.mock.calls[0][1].body as string,
      ) as Record<string, unknown>;
      expect(body['response-code']).not.toBe('300');
    });
  });

  // ---------------------------------------------------------------------------
  // fetch failure resilience
  // ---------------------------------------------------------------------------
  describe('webhook delivery resilience', () => {
    it('does not throw when fetch rejects (logs error instead)', async () => {
      fetchSpy.mockRejectedValue(new Error('network error'));
      const { id } = service.createCustomerVault({
        cardNumber: '4111111111111111',
        expiry: '12/26',
        cvv: '123',
      });
      service.customerVaultAction(id, 'sale', 100);
      await expect(jest.runAllTimersAsync()).resolves.not.toThrow();
    });
  });
});

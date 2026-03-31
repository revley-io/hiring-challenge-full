import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  CreateCustomerVaultParams,
  CustomerVaultResult,
  MockCustomerVault,
  TEST_CARDS,
  VaultAction,
  VaultActionResult,
} from './nmi.types';

@Injectable()
export class NmiService {
  private readonly logger = new Logger(NmiService.name);
  private readonly vaults = new Map<string, MockCustomerVault>();

  constructor(private readonly config: ConfigService) {}

  /**
   * Create a customer vault from card details.
   * Stores the vault in memory; the card number determines action outcome later.
   */
  createCustomerVault(params: CreateCustomerVaultParams): CustomerVaultResult {
    const id = `vault_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const vault: MockCustomerVault = {
      id,
      cardNumber: params.cardNumber,
      expiry: params.expiry,
      cvv: params.cvv,
      status: 'active',
      created: Math.floor(Date.now() / 1000),
      metadata: params.metadata,
    };
    this.vaults.set(id, vault);
    return {
      id,
      last4: vault.cardNumber.slice(-4),
      status: vault.status,
      created: vault.created,
    };
  }

  /**
   * Perform an action against a customer vault.
   * Returns immediately with a pending transaction ID; fires webhook after ~1500ms.
   *
   * validate → confirms card is usable
   * sale     → authorize + auto-capture
   * auth     → authorize only (capture separately)
   * capture  → capture a previously authorized transaction
   */
  customerVaultAction(
    vaultId: string,
    action: VaultAction,
    amount?: number,
  ): VaultActionResult {
    const vault = this.vaults.get(vaultId);
    if (!vault) throw new Error(`Customer vault not found: ${vaultId}`);

    const transactionid = this.txnId();

    setTimeout(() => {
      void this.deliverActionWebhook(vault, action, transactionid, amount);
    }, 1500);

    return { transactionid, status: 'pending' };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async deliverActionWebhook(
    vault: MockCustomerVault,
    action: VaultAction,
    transactionid: string,
    amount?: number,
  ): Promise<void> {
    const card = TEST_CARDS[vault.cardNumber];
    const isDecline = card?.outcome === 'decline';

    const payload: Record<string, unknown> = {
      'transaction-type': action,
      'response-code': isDecline ? '300' : '100',
      transactionid,
      'customer-vault-id': vault.id,
      payload: amount !== undefined ? { amount } : undefined,
    };

    await this.postWebhook(payload);
  }

  private async postWebhook(payload: Record<string, unknown>): Promise<void> {
    const apiUrl =
      this.config.get<string>('API_URL') ?? 'http://localhost:3000';
    const url = `${apiUrl}/webhooks/nmi`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.logger.debug(
        `NMI webhook delivered: ${payload['transaction-type'] as string}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to deliver NMI webhook to ${url}: ${String(err)}`,
      );
    }
  }

  private txnId(): string {
    return `txn_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
}

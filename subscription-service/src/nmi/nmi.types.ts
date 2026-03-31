export interface MockCustomerVault {
  id: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  status: 'active' | 'invalid';
  created: number;
  metadata?: Record<string, unknown>;
}

export interface CreateCustomerVaultParams {
  cardNumber: string;
  expiry: string;
  cvv: string;
  metadata?: Record<string, unknown>;
}

export interface CustomerVaultResult {
  id: string;
  last4: string;
  status: MockCustomerVault['status'];
  created: number;
}

export interface VaultActionResult {
  transactionid: string;
  status: 'pending';
}

export type VaultAction = 'validate' | 'sale' | 'auth' | 'capture';

/** Card numbers recognized by the mock and their behavior */
export const TEST_CARDS: Record<
  string,
  { brand: string; outcome: 'success' | 'decline' }
> = {
  '4111111111111111': { brand: 'Visa', outcome: 'success' },
  '4000000000000002': { brand: 'Visa', outcome: 'decline' },
};

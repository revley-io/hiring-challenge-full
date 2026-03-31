export interface MockPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  status:
    | 'requires_confirmation'
    | 'processing'
    | 'succeeded'
    | 'failed'
    | 'requires_capture';
  created: number;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResult {
  id: string;
  amount: number;
  currency: string;
  status: MockPaymentIntent['status'];
  created: number;
}

export interface VerifyTokenResult {
  valid: boolean;
  card?: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
}

export interface ChargeResult {
  id: string;
  status: 'processing';
}

/** Card numbers recognized by the mock and their behavior */
export const TEST_CARDS: Record<
  string,
  { brand: string; outcome: 'success' | 'decline' }
> = {
  '4242424242424242': { brand: 'Visa', outcome: 'success' },
  '4000000000000002': { brand: 'Visa', outcome: 'decline' },
};

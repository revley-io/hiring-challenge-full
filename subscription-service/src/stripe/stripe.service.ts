import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  ChargeResult,
  CreatePaymentIntentParams,
  MockPaymentIntent,
  PaymentIntentResult,
  TEST_CARDS,
  VerifyTokenResult,
} from './stripe.types';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly intents = new Map<string, MockPaymentIntent>();

  constructor(private readonly config: ConfigService) {}

  /**
   * Create a payment intent from card details.
   * Stores the intent in memory; the card number determines charge outcome later.
   */
  createPaymentIntent(params: CreatePaymentIntentParams): PaymentIntentResult {
    const id = `pi_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const intent: MockPaymentIntent = {
      id,
      amount: params.amount,
      currency: params.currency,
      cardNumber: params.cardNumber,
      expiry: params.expiry,
      cvv: params.cvv,
      status: 'requires_confirmation',
      created: Math.floor(Date.now() / 1000),
      metadata: params.metadata,
    };
    this.intents.set(id, intent);
    return {
      id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      created: intent.created,
    };
  }

  /**
   * Verify the card attached to a payment intent.
   * Returns card summary if the card number is recognized, valid: false otherwise.
   */
  verifyToken(paymentIntentId: string): VerifyTokenResult {
    const intent = this.intents.get(paymentIntentId);
    if (!intent) return { valid: false };

    const card = TEST_CARDS[intent.cardNumber];
    if (!card) return { valid: false };

    const [expMonthStr, expYearStr] = intent.expiry.split('/');
    return {
      valid: true,
      card: {
        last4: intent.cardNumber.slice(-4),
        brand: card.brand,
        expMonth: parseInt(expMonthStr, 10),
        expYear: 2000 + parseInt(expYearStr, 10),
      },
    };
  }

  /**
   * Initiate charging a payment intent.
   * Returns immediately; fires webhook(s) after ~1500ms.
   *
   * autoCapture=true  → charge.succeeded + payment_intent.succeeded
   * autoCapture=false → payment_intent.amount_capturable_updated (manual capture needed)
   * Decline card      → charge.failed
   */
  chargePaymentIntent(
    paymentIntentId: string,
    autoCapture: boolean,
  ): ChargeResult {
    const intent = this.intents.get(paymentIntentId);
    if (!intent)
      throw new Error(`Payment intent not found: ${paymentIntentId}`);

    intent.status = 'processing';

    setTimeout(() => {
      void this.deliverChargeWebhooks(intent, autoCapture);
    }, 1500);

    return { id: paymentIntentId, status: 'processing' };
  }

  /**
   * Manually capture a previously authorized payment intent.
   * Returns immediately; fires charge.succeeded + payment_intent.succeeded after ~1500ms.
   */
  capturePaymentIntent(paymentIntentId: string): ChargeResult {
    const intent = this.intents.get(paymentIntentId);
    if (!intent)
      throw new Error(`Payment intent not found: ${paymentIntentId}`);

    intent.status = 'processing';

    setTimeout(() => {
      void this.deliverCaptureWebhooks(intent);
    }, 1500);

    return { id: paymentIntentId, status: 'processing' };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async deliverChargeWebhooks(
    intent: MockPaymentIntent,
    autoCapture: boolean,
  ): Promise<void> {
    const card = TEST_CARDS[intent.cardNumber];
    const isDecline = card?.outcome === 'decline';

    if (isDecline) {
      intent.status = 'failed';
      await this.postWebhook({
        id: this.evtId(),
        type: 'charge.failed',
        data: {
          object: {
            id: this.chId(),
            payment_intent: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            status: 'failed',
          },
        },
      });
      return;
    }

    if (autoCapture) {
      intent.status = 'succeeded';
      await this.postWebhook({
        id: this.evtId(),
        type: 'charge.succeeded',
        data: {
          object: {
            id: this.chId(),
            payment_intent: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            status: 'succeeded',
          },
        },
      });
      await this.postWebhook({
        id: this.evtId(),
        type: 'payment_intent.succeeded',
        data: {
          object: { id: intent.id, amount: intent.amount, status: 'succeeded' },
        },
      });
    } else {
      intent.status = 'requires_capture';
      await this.postWebhook({
        id: this.evtId(),
        type: 'payment_intent.amount_capturable_updated',
        data: {
          object: {
            id: intent.id,
            amount: intent.amount,
            status: 'requires_capture',
          },
        },
      });
    }
  }

  private async deliverCaptureWebhooks(
    intent: MockPaymentIntent,
  ): Promise<void> {
    intent.status = 'succeeded';
    await this.postWebhook({
      id: this.evtId(),
      type: 'charge.succeeded',
      data: {
        object: {
          id: this.chId(),
          payment_intent: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          status: 'succeeded',
        },
      },
    });
    await this.postWebhook({
      id: this.evtId(),
      type: 'payment_intent.succeeded',
      data: {
        object: { id: intent.id, amount: intent.amount, status: 'succeeded' },
      },
    });
  }

  private async postWebhook(payload: Record<string, unknown>): Promise<void> {
    const apiUrl =
      this.config.get<string>('API_URL') ?? 'http://localhost:3000';
    const url = `${apiUrl}/webhooks/stripe`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.logger.debug(
        `Stripe webhook delivered: ${payload['type'] as string}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to deliver Stripe webhook to ${url}: ${String(err)}`,
      );
    }
  }

  private evtId(): string {
    return `evt_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }

  private chId(): string {
    return `ch_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
}

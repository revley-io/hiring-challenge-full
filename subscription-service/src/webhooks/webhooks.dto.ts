import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StripeWebhookDto {
  @ApiProperty({
    example: 'charge.succeeded',
    description:
      'Stripe event type. Relevant values: charge.succeeded, charge.failed, ' +
      'payment_intent.amount_capturable_updated (manual capture ready), ' +
      'payment_intent.succeeded (auto-capture complete).',
  })
  type: string;

  @ApiProperty({ description: 'Stripe event data object' })
  data: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'evt_abc123' })
  id?: string;
}

export class NmiWebhookDto {
  @ApiProperty({
    example: 'sale',
    description: 'NMI transaction type: validate | sale | auth | capture',
  })
  'transaction-type': string;

  @ApiProperty({
    example: '100',
    description: 'NMI response code (100 = approved)',
  })
  'response-code': string;

  @ApiPropertyOptional({ example: '1234567890' })
  transactionid?: string;

  @ApiPropertyOptional({ example: 'vault_abc123' })
  'customer-vault-id'?: string;

  @ApiPropertyOptional({ description: 'Additional NMI fields passed through' })
  payload?: unknown;
}

export class EventBridgeWebhookDto {
  @ApiProperty({ example: 'aws.scheduler', description: 'Event source' })
  source: string;

  @ApiProperty({
    example: 'Scheduled Event',
    description:
      'Human-readable event category, e.g. "Scheduled Event" for subscription billing triggers',
  })
  'detail-type': string;

  @ApiProperty({
    description: 'Event detail payload (e.g. { subscriptionId, customerId })',
  })
  detail: Record<string, unknown>;
}

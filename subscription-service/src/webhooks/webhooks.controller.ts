import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  EventBridgeWebhookDto,
  NmiWebhookDto,
  StripeWebhookDto,
} from './webhooks.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  /**
   * Stripe sends async charge / capture results here.
   */
  @Post('stripe')
  @ApiOperation({
    summary: 'Stripe webhook receiver',
    description:
      'Receives async Stripe events (charge.succeeded, charge.failed, ' +
      'payment_intent.succeeded, etc.) and updates transaction state.',
  })
  @ApiResponse({ status: 200, description: 'Acknowledged' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  stripeWebhook(@Body() _dto: StripeWebhookDto): void {
    throw new NotImplementedException('webhooks/stripe');
  }

  /**
   * NMI sends async vault action results here.
   */
  @Post('nmi')
  @ApiOperation({
    summary: 'NMI webhook receiver',
    description:
      'Receives async NMI customer vault action results (sale, auth, capture, validate) ' +
      'and updates transaction / payment method state.',
  })
  @ApiResponse({ status: 200, description: 'Acknowledged' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  nmiWebhook(@Body() _dto: NmiWebhookDto): void {
    throw new NotImplementedException('webhooks/nmi');
  }

  /**
   * EventBridge fires scheduled subscription billing events here.
   */
  @Post('eventbridge')
  @ApiOperation({
    summary: 'EventBridge scheduled event receiver',
    description:
      'Receives EventBridge scheduled events for subscription billing. ' +
      'Looks up the subscription, re-charges the customer, and records the transaction.',
  })
  @ApiResponse({ status: 200, description: 'Acknowledged' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  eventBridgeWebhook(@Body() _dto: EventBridgeWebhookDto): void {
    throw new NotImplementedException('webhooks/eventbridge');
  }
}

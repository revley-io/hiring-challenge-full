import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckoutDto, CheckoutResponseDto } from './checkout.dto';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  /**
   * Process a checkout. Determines which payment processor to use based on the
   * merchant's active integration config, creates a transaction record, and
   * optionally creates a subscription schedule via EventBridge if isSubscription
   * is true.
   */
  @Post()
  @ApiOperation({
    summary: 'Process checkout',
    description:
      'Charges the customer via the merchant-configured payment processor. ' +
      'If isSubscription is true, also creates a subscription and schedules ' +
      'recurring billing via EventBridge.',
  })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  checkout(@Body() _dto: CheckoutDto): CheckoutResponseDto {
    throw new NotImplementedException('checkout');
  }
}

import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types';
import {
  CheckoutProcessorDto,
  IntegrationDto,
  StoreSettingsDto,
  SubscriptionDto,
  TransactionDto,
  UpdateCheckoutProcessorDto,
  UpdateIntegrationDto,
} from './merchant.dto';
import { MerchantService } from './merchant.service';

@ApiTags('Merchant')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard)
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}
  /**
   * Return all integrations for the authenticated merchant's store.
   */
  @Get('integrations')
  @ApiOperation({ summary: 'List integrations' })
  @ApiResponse({ status: 200, type: [IntegrationDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getIntegrations(@Request() req: RequestWithUser): Promise<IntegrationDto[]> {
    return this.merchantService.getIntegrations(req.user!.storeId);
  }

  /**
   * Update an integration's status and/or credentials.
   */
  @Patch('integrations/:id')
  @ApiOperation({ summary: 'Update integration' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  updateIntegration(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
  ): Promise<IntegrationDto> {
    return this.merchantService.updateIntegration(req.user!.storeId, id, dto);
  }

  /**
   * Return the checkout processor setting for the merchant's store.
   */
  @Get('checkout-processor')
  @ApiOperation({ summary: 'Get checkout processor' })
  @ApiResponse({ status: 200, type: CheckoutProcessorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCheckoutProcessor(
    @Request() req: RequestWithUser,
  ): Promise<CheckoutProcessorDto> {
    return this.merchantService.getCheckoutProcessor(req.user!.storeId);
  }

  /**
   * Update the checkout processor setting for the merchant's store.
   */
  @Patch('checkout-processor')
  @ApiOperation({ summary: 'Set checkout processor' })
  @ApiResponse({ status: 200, type: CheckoutProcessorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateCheckoutProcessor(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateCheckoutProcessorDto,
  ): Promise<CheckoutProcessorDto> {
    return this.merchantService.updateCheckoutProcessor(req.user!.storeId, dto);
  }

  /**
   * Return all transactions for the authenticated merchant's store.
   */
  @Get('transactions')
  @ApiOperation({
    summary: 'List transactions',
    description:
      "Returns all transactions for the merchant's store, " +
      'joined with customer data. Requires authentication.',
  })
  @ApiResponse({ status: 200, type: [TransactionDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  getTransactions(@Request() _req: RequestWithUser): TransactionDto[] {
    throw new NotImplementedException('merchant/transactions');
  }

  /**
   * Return all subscriptions for the authenticated merchant's store.
   */
  @Get('subscriptions')
  @ApiOperation({
    summary: 'List subscriptions',
    description:
      "Returns all active and inactive subscriptions for the merchant's store. " +
      'Requires authentication.',
  })
  @ApiResponse({ status: 200, type: [SubscriptionDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  getSubscriptions(@Request() _req: RequestWithUser): SubscriptionDto[] {
    throw new NotImplementedException('merchant/subscriptions');
  }

  /**
   * Return the merchant's store configuration.
   */
  @Get('store-settings')
  @ApiOperation({
    summary: 'Get store settings',
    description:
      "Returns the merchant's store configuration including active payment processor, " +
      'processor split percentages, subscription settings, and integration credentials.',
  })
  @ApiResponse({ status: 200, type: StoreSettingsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  getStoreSettings(@Request() _req: RequestWithUser): StoreSettingsDto {
    throw new NotImplementedException('merchant/store-settings');
  }
}

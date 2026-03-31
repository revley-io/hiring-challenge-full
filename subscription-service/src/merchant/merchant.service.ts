import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseAdminService } from '../auth/services/supabase-admin.service';
import {
  CheckoutProcessorDto,
  IntegrationDto,
  UpdateCheckoutProcessorDto,
  UpdateIntegrationDto,
} from './merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private readonly supabase: SupabaseAdminService) {}

  async getIntegrations(storeId: string): Promise<IntegrationDto[]> {
    const { data, error } = await this.supabase.client
      .from('integrations')
      .select('id, type, status, creds')
      .eq('store_id', storeId);

    if (error) throw error;
    return data as IntegrationDto[];
  }

  async updateIntegration(
    storeId: string,
    integrationId: string,
    dto: UpdateIntegrationDto,
  ): Promise<IntegrationDto> {
    const updates: Record<string, unknown> = {};
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.creds !== undefined) updates.creds = dto.creds;

    const { data, error } = await this.supabase.client
      .from('integrations')
      .update(updates)
      .eq('id', integrationId)
      .eq('store_id', storeId)
      .select('id, type, status, creds')
      .single();

    if (error || !data) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }

    return data as IntegrationDto;
  }

  async getCheckoutProcessor(storeId: string): Promise<CheckoutProcessorDto> {
    const { data, error } = await this.supabase.client
      .from('store')
      .select('checkout_processor')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    return {
      checkoutProcessor:
        data.checkout_processor as CheckoutProcessorDto['checkoutProcessor'],
    };
  }

  async updateCheckoutProcessor(
    storeId: string,
    dto: UpdateCheckoutProcessorDto,
  ): Promise<CheckoutProcessorDto> {
    const { data, error } = await this.supabase.client
      .from('store')
      .update({ checkout_processor: dto.checkoutProcessor })
      .eq('id', storeId)
      .select('checkout_processor')
      .single();

    if (error || !data) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    return {
      checkoutProcessor:
        data.checkout_processor as CheckoutProcessorDto['checkoutProcessor'],
    };
  }
}

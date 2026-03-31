import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SupabaseAdminService } from './services/supabase-admin.service';

@Global()
@Module({
  providers: [JwtAuthGuard, SupabaseAdminService],
  exports: [JwtAuthGuard, SupabaseAdminService],
})
export class AuthModule {}

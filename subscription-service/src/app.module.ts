import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CheckoutModule } from './checkout/checkout.module';
import { EventBridgeModule } from './eventbridge/eventbridge.module';
import { MerchantModule } from './merchant/merchant.module';
import { NmiModule } from './nmi/nmi.module';
import { StripeModule } from './stripe/stripe.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    CheckoutModule,
    WebhooksModule,
    MerchantModule,
    StripeModule,
    NmiModule,
    EventBridgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

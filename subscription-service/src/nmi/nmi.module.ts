import { Module } from '@nestjs/common';
import { NmiService } from './nmi.service';

@Module({
  providers: [NmiService],
  exports: [NmiService],
})
export class NmiModule {}

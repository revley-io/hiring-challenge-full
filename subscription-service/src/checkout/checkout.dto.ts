import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+15125550000' })
  phone?: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: '123 Main St' })
  address: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  apartment?: string;

  @ApiProperty({ example: 'Austin' })
  city: string;

  @ApiProperty({ example: 'TX' })
  state: string;

  @ApiProperty({ example: '78701' })
  zip: string;

  @ApiProperty({ example: '4242424242424242' })
  cardNumber: string;

  @ApiProperty({ example: '12/27' })
  expiry: string;

  @ApiProperty({ example: '123' })
  cvv: string;

  @ApiProperty({
    example: false,
    description: 'Enroll in recurring subscription',
  })
  isSubscription: boolean;
}

export class CheckoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'txn_abc123' })
  transactionId: string;

  @ApiPropertyOptional({
    example: 'sub_abc123',
    description: 'Only present when isSubscription is true',
  })
  subscriptionId?: string;
}
